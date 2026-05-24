const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');

// GET /api/conversations?language=&page=&limit=
router.get('/', auth, async (req, res) => {
    try {
        const { language, page = 1, limit = 20 } = req.query;
        const q = { user: req.user.id };
        if (language) q.language = language;

        const p = Math.max(1, parseInt(page, 10) || 1);
        const l = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
        const skip = (p - 1) * l;

        const convs = await Conversation.find(q)
            .sort({ updatedAt: -1 })
            .skip(skip)
            .limit(l)
            .select('language messages updatedAt createdAt')
            .lean();

        const summaries = convs.map((c) => ({
            id: c._id,
            language: c.language,
            updatedAt: c.updatedAt,
            createdAt: c.createdAt,
            lastMessage: c.messages && c.messages.length ? c.messages[c.messages.length - 1] : null,
            messageCount: c.messages ? c.messages.length : 0,
        }));

        res.json({ conversations: summaries });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/conversations/:id?page=&limit=
router.get('/:id', auth, async (req, res) => {
    try {
        const { page = 1, limit = 100 } = req.query;
        const conv = await Conversation.findOne({ _id: req.params.id, user: req.user.id });
        if (!conv) return res.status(404).json({ message: 'Conversation not found' });

        const p = Math.max(1, parseInt(page, 10) || 1);
        const l = Math.min(500, Math.max(1, parseInt(limit, 10) || 100));

        // return the most recent messages paginated (page=1 returns latest l messages)
        const total = conv.messages.length;
        const start = Math.max(0, total - p * l);
        const end = Math.max(0, total - (p - 1) * l);
        const messages = conv.messages.slice(start, end);

        res.json({ conversation: { id: conv._id, language: conv.language, messages, total } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
