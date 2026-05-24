const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Session = require('../models/Session');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { hashToken, isValidEmail, isNonEmptyString } = require('../utils/token');

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

function getExpiryDate(days = 7) {
    return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

function createAuthTokens(user) {
    const accessToken = jwt.sign(
        { user: { id: user._id }, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
        { user: { id: user._id }, type: 'refresh' },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

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
        user: { id: user._id, username: user.username, email: user.email },
    };
}

// Basic input validation helper
function validateRegisterFields({ username, email, password }) {
    return isNonEmptyString(username, 2, 50) && isValidEmail(email) && isNonEmptyString(password, 6, 128);
}

// 1. REGISTER ROUTE
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        if (!validateRegisterFields({ username, email, password })) return res.status(400).json({ message: 'Invalid input' });

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ username, email, password: hashedPassword });
        await user.save();

        const tokens = createAuthTokens(user);
        await persistSession({ userId: user._id, refreshToken: tokens.refreshToken, req });

        res.status(201).json({ message: 'User secured and created!', ...buildAuthResponse(user, tokens) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. LOGIN ROUTE (Must be ABOVE module.exports)
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!isValidEmail(email) || !isNonEmptyString(password, 6, 128)) {
            return res.status(400).json({ message: 'Invalid input' });
        }

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Invalid email or password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

        const tokens = createAuthTokens(user);
        await persistSession({ userId: user._id, refreshToken: tokens.refreshToken, req });

        res.json({ message: 'Login successful!', ...buildAuthResponse(user, tokens) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/refresh', async (req, res) => {
    const { refreshToken } = req.body;
    if (!isNonEmptyString(refreshToken, 10, 2000)) {
        return res.status(400).json({ message: 'Invalid input' });
    }

    return jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (error, decoded) => {
        if (error || decoded?.type !== 'refresh') {
            return res.status(401).json({ message: 'Token is not valid' });
        }

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

router.post('/logout', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!isNonEmptyString(refreshToken, 10, 2000)) {
            return res.status(400).json({ message: 'Invalid input' });
        }

        const session = await Session.findOne({ tokenHash: hashToken(refreshToken), revokedAt: null });
        if (!session) {
            return res.status(200).json({ message: 'Logged out' });
        }

        session.revokedAt = new Date();
        await session.save();

        return res.json({ message: 'Logged out' });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('username email targetLanguage createdAt updatedAt');
        if (!user) return res.status(404).json({ message: 'User not found' });
        return res.json({ user });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// 3. EXPORT AT THE VERY END
module.exports = router;