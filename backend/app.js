const express = require('express');
const cors = require('cors');

// Middleware
const rateLimit = require('express-rate-limit');

const app = express();
app.disable('x-powered-by');

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use(limiter);

// Routes
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/conversations', require('./routes/conversations'));

app.get('/', (req, res) => {
    res.json({ message: 'Backend is running perfectly!' });
});

app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use((err, req, res, next) => {
    console.error(err);
    const status = err.status || 500;
    res.status(status).json({ message: err.message || 'Internal server error' });
});

module.exports = app;
