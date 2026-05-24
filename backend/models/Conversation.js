const mongoose = require('mongoose');

const ConversationMessageSchema = new mongoose.Schema({
    role: { type: String, required: true, enum: ['user', 'assistant'] },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
}, { _id: false });

const ConversationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    language: { type: String, required: true },
    title: { type: String, default: null },
    messages: { type: [ConversationMessageSchema], default: [] },
}, { timestamps: true });

ConversationSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', ConversationSchema);
