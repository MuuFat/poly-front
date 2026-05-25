const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }, 
    targetLanguage: { type: String, default: 'Polish' },
        isEmailVerified: { type: Boolean, default: false },
        emailVerificationToken: { type: String },
        emailVerificationExpires: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
        // securityQuestions: array of { question, answerHash }
        securityQuestions: [
            {
                question: { type: String },
                answerHash: { type: String },
            },
        ],
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);