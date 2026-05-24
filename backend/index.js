const mongoose = require('mongoose');
require('dotenv').config();

const app = require('./app');

// Connect to MongoDB and ensure indexes for models
const User = require('./models/User');
const Session = require('./models/Session');
const Conversation = require('./models/Conversation');

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("✅ Successfully connected to MongoDB!");
        try {
            await Promise.all([
                User.syncIndexes(),
                Session.syncIndexes(),
                Conversation.syncIndexes(),
            ]);
            console.log('🔧 Model indexes synced');
        } catch (syncErr) {
            console.warn('⚠️ Failed to sync indexes:', syncErr.message || syncErr);
        }
    })
    .catch((err) => console.log("❌ MongoDB connection error:", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});