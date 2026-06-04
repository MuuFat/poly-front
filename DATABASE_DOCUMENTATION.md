# Polylingo Database Documentation

This document describes the MongoDB schema and how the application uses it. The database stores authentication data, chat history, and refresh-token sessions.

## Collections

### users

Model: [backend/models/User.js](backend/models/User.js)

Fields:

- `username` - required, unique
- `email` - required, unique
- `password` - required, hashed before storage
- `targetLanguage` - default language preference
- `isEmailVerified` - verification flag
- `emailVerificationToken` - hashed verification token
- `emailVerificationExpires` - verification token expiry
- `resetPasswordToken` - hashed reset token
- `resetPasswordExpires` - reset token expiry
- `securityQuestions` - optional recovery questions and hashed answers
- `createdAt` / `updatedAt` - timestamps

What it is used for:

- registration and login
- user profile lookup
- email verification
- password reset
- security-question recovery

### sessions

Model: [backend/models/Session.js](backend/models/Session.js)

Fields:

- `user` - ObjectId reference to `users`
- `tokenHash` - hashed refresh token
- `userAgent` - optional browser or device info
- `ipAddress` - optional client IP
- `revokedAt` - null unless logged out or revoked
- `expiresAt` - session expiry date
- `createdAt` / `updatedAt` - timestamps

Indexes:

- TTL index on `expiresAt` with `expireAfterSeconds: 0`

What it is used for:

- refresh-token tracking
- session rotation
- logout and revocation
- automatic cleanup of expired sessions

### conversations

Model: [backend/models/Conversation.js](backend/models/Conversation.js)

Fields:

- `user` - ObjectId reference to `users`
- `language` - target language for the conversation
- `title` - short conversation title
- `messages` - array of user and assistant messages
- `createdAt` / `updatedAt` - timestamps

Message shape:

- `role` - `user` or `assistant`
- `content` - text content
- `createdAt` - message timestamp

Indexes:

- index on `user`
- index on `{ user: 1, updatedAt: -1 }`

What it is used for:

- storing chat history
- listing recent conversations
- opening a conversation and paginating messages
- deleting history by user

## Data flow

1. A user registers or logs in.
2. A session document is created in `sessions`.
3. The user sends a chat message to `/api/ai/chat`.
4. OpenAI generates a tutor reply.
5. The user and assistant messages are stored in `conversations`.
6. The frontend later fetches summaries or full history from MongoDB through the API.

## Why the schema matters

The schema is designed to support three main product behaviors:

- Secure authentication with refresh sessions.
- Persistent chat history for language learning.
- Fast retrieval of a user's recent conversations.

## Deployment note

MongoDB Atlas or another managed MongoDB service should be used in production. The backend must have the correct `MONGO_URI` in Render so it can connect to the database and sync indexes on startup.

## Presentation summary

The database is the persistence layer of Polylingo. It stores users, sessions, and conversations so the app can authenticate users, remember refresh sessions, and preserve AI tutoring history across visits.
