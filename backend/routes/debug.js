const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// POST /api/debug/send-test-email
// body: { to?: string }
router.post('/send-test-email', async (req, res) => {
  try {
    const to = req.body?.to || process.env.SMTP_TEST_TO;

    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      return res.status(400).json({
        message: 'SMTP not configured. Set SMTP_HOST and SMTP_USER in backend/.env (Mailtrap recommended).',
      });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    });

    const recipients = to || process.env.SMTP_TEST_TO || 'test@example.com';

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || 'no-reply@example.com',
      to: recipients,
      subject: 'PolyLingo — Test email',
      text: 'This is a test email from your PolyLingo backend. If you see this, SMTP is configured correctly.',
      html: '<p>This is a <strong>test email</strong> from your PolyLingo backend. If you see this, SMTP is configured correctly.</p>',
    });

    return res.json({ message: 'Test email sent', info });
  } catch (err) {
    return res.status(500).json({ message: err.message || 'Failed to send test email' });
  }
});

module.exports = router;
