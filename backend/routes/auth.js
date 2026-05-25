const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const { hashToken, isValidEmail, isNonEmptyString } = require('../utils/token');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function getExpiryDate(days = 7) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function createAuthTokens(user) {
  const accessToken = jwt.sign({ user: { id: user._id }, type: 'access' }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign({ user: { id: user._id }, type: 'refresh' }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  return { accessToken, refreshToken };
}

async function persistSession({ userId, refreshToken, req }) {
  await Session.create({
    user: userId,
    tokenHash: hashToken(refreshToken),
    userAgent: req.get('user-agent') || '',
    ipAddress: req.ip || '',
    expiresAt: getExpiryDate(7),
  });
}

function buildAuthResponse(user, tokens) {
  return {
    token: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      targetLanguage: user.targetLanguage || 'Polish',
      isEmailVerified: !!user.isEmailVerified,
    },
  };
}

function validateRegisterFields({ username, email, password }) {
  return isNonEmptyString(username, 2, 50) && isValidEmail(email) && isNonEmptyString(password, 6, 128);
}

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!validateRegisterFields({ username, email, password })) return res.status(400).json({ message: 'Invalid input' });

    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ username, email, password: hashedPassword, isEmailVerified: false });
    // create verification token
    const vToken = crypto.randomBytes(20).toString('hex');
    user.emailVerificationToken = crypto.createHash('sha256').update(vToken).digest('hex');
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h
    await user.save();

    // send verification email or return preview
    const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const verifyUrl = `${frontend}/auth/verify?token=${vToken}`;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to: user.email,
        subject: 'Verify your email',
        text: `Verify your email: ${verifyUrl}`,
        html: `<p>Verify your email by visiting <a href="${verifyUrl}">${verifyUrl}</a></p>`,
      });
    }

    const tokens = createAuthTokens(user);
    await persistSession({ userId: user._id, refreshToken: tokens.refreshToken, req });

    const response = buildAuthResponse(user, tokens);
    if (!(process.env.SMTP_HOST && process.env.SMTP_USER)) {
      // dev preview
      response.previewVerification = { token: vToken, verifyUrl };
    }

    res.status(201).json({ message: 'User created', ...response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!isValidEmail(email) || !isNonEmptyString(password, 6, 128)) return res.status(400).json({ message: 'Invalid input' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

    const tokens = createAuthTokens(user);
    await persistSession({ userId: user._id, refreshToken: tokens.refreshToken, req });

    res.json({ message: 'Login successful', ...buildAuthResponse(user, tokens) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REFRESH
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!isNonEmptyString(refreshToken, 10, 2000)) return res.status(400).json({ message: 'Invalid input' });

  return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (error, decoded) => {
    if (error || decoded?.type !== 'refresh') return res.status(401).json({ message: 'Token is not valid' });

    try {
      const session = await Session.findOne({ tokenHash: hashToken(refreshToken), revokedAt: null });
      if (!session) return res.status(401).json({ message: 'Session expired or revoked' });

      const user = await User.findById(decoded.user.id);
      if (!user) return res.status(401).json({ message: 'User not found' });

      const tokens = createAuthTokens(user);
      session.tokenHash = hashToken(tokens.refreshToken);
      session.expiresAt = getExpiryDate(7);
      await session.save();

      return res.json({ message: 'Session refreshed', ...buildAuthResponse(user, tokens) });
    } catch (dbError) {
      return res.status(500).json({ message: dbError.message || 'Internal server error' });
    }
  });
});

// LOGOUT
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!isNonEmptyString(refreshToken, 10, 2000)) return res.status(400).json({ message: 'Invalid input' });

    const session = await Session.findOne({ tokenHash: hashToken(refreshToken), revokedAt: null });
    if (!session) return res.status(200).json({ message: 'Logged out' });

    session.revokedAt = new Date();
    await session.save();

    return res.json({ message: 'Logged out' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// GET /me
router.get('/me', require('../middleware/auth'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('username email targetLanguage isEmailVerified createdAt updatedAt');
    if (!user) return res.status(404).json({ message: 'User not found' });
    return res.json({ user });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// VERIFY EMAIL
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'Missing token' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ emailVerificationToken: tokenHash, emailVerificationExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.json({ message: 'Email verified' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to verify email' });
  }
});

// FORGOT PASSWORD (allow reset requests regardless of email verification)
const forgotLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset attempts, please try again later.' },
});

router.post('/forgot', forgotLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email' });

    const user = await User.findOne({ email });
    if (!user) return res.status(200).json({ message: 'If an account exists, a reset link will be sent' });

    const token = crypto.randomBytes(20).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordToken = tokenHash;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const frontend = (process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
    const resetUrl = `${frontend}/auth/reset?token=${token}`;

    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || 'no-reply@example.com',
        to: user.email,
        subject: 'Password reset',
        text: `Reset your password: ${resetUrl}`,
        html: `<p>Reset your password by visiting <a href="${resetUrl}">${resetUrl}</a></p>`,
      });

      return res.json({ message: 'If an account exists, a reset link will be sent' });
    }

    return res.json({ message: 'Reset token (dev preview)', previewToken: token, resetUrl });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to create reset token' });
  }
});

// RESET PASSWORD
router.post('/reset', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !isNonEmptyString(password, 6, 128)) return res.status(400).json({ message: 'Invalid input' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ resetPasswordToken: tokenHash, resetPasswordExpires: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const tokens = createAuthTokens(user);
    await persistSession({ userId: user._id, refreshToken: tokens.refreshToken, req });

    return res.json({ message: 'Password reset successful', ...buildAuthResponse(user, tokens) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to reset password' });
  }
});

// SET SECURITY QUESTIONS (verify current password)
router.post('/set-security', async (req, res) => {
  try {
    const { email, password, questions } = req.body;
    if (!isValidEmail(email) || !isNonEmptyString(password, 6, 128)) return res.status(400).json({ message: 'Invalid input' });
    if (!Array.isArray(questions) || questions.length === 0) return res.status(400).json({ message: 'Provide at least one question and answer' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    // hash answers and store
    const hashedAnswers = [];
    for (const q of questions.slice(0, 5)) {
      if (!q || !q.question || !q.answer) continue;
      const aHash = await bcrypt.hash(String(q.answer), 10);
      hashedAnswers.push({ question: String(q.question), answerHash: aHash });
    }

    user.securityQuestions = hashedAnswers;
    await user.save();

    return res.json({ message: 'Security questions saved' });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to set security questions' });
  }
});

const securityLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 8,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts, try again later.' },
});

// FORGOT via SECURITY QUESTIONS — returns questions (no account enumeration)
router.post('/forgot-security', securityLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!isValidEmail(email)) return res.status(400).json({ message: 'Invalid email' });

    const user = await User.findOne({ email });
    if (!user || !user.securityQuestions || user.securityQuestions.length === 0) {
      return res.status(200).json({ message: 'If an account exists with security questions, you will be prompted to answer them.' });
    }

    const questions = user.securityQuestions.map((q, i) => ({ index: i, question: q.question }));
    return res.json({ message: 'Answer the security questions', questions });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to retrieve security questions' });
  }
});

// VERIFY security answers and reset password
router.post('/verify-security', securityLimiter, async (req, res) => {
  try {
    const { email, answers, newPassword } = req.body;
    if (!isValidEmail(email) || !Array.isArray(answers) || !isNonEmptyString(newPassword, 6, 128)) return res.status(400).json({ message: 'Invalid input' });

    const user = await User.findOne({ email });
    if (!user || !user.securityQuestions || user.securityQuestions.length === 0) return res.status(400).json({ message: 'Invalid or expired challenge' });

    // answers: [{ index, answer }]
    if (answers.length === 0) return res.status(400).json({ message: 'No answers provided' });

    // validate each provided answer against stored hash
    for (const a of answers) {
      const idx = Number(a.index);
      if (Number.isNaN(idx) || !user.securityQuestions[idx]) return res.status(400).json({ message: 'Invalid answer set' });
      const ok = await bcrypt.compare(String(a.answer), user.securityQuestions[idx].answerHash);
      if (!ok) return res.status(400).json({ message: 'Incorrect answers' });
    }

    // all good — set new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const tokens = createAuthTokens(user);
    await persistSession({ userId: user._id, refreshToken: tokens.refreshToken, req });

    return res.json({ message: 'Password reset successful', ...buildAuthResponse(user, tokens) });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to verify security answers' });
  }
});

module.exports = router;
