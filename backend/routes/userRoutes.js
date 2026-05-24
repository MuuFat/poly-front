const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Route to get all users (for testing)
router.get('/', async (req, res) => {
    try {
        const users = await User.find().select('username email targetLanguage createdAt updatedAt');
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;