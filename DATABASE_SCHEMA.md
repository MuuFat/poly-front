# Database Schema

This file is a plain handoff note for the MongoDB schema used by Polylingo.

## Collections

### users

Model: `backend/models/User.js`

Fields:
- `username` - string, required, unique
- `email` - string, required, unique
- `password` - string, required
- `targetLanguage` - string, default `English`
- `createdAt` / `updatedAt` - timestamps

Notes:
- Passwords are hashed before save.
- This collection stores the registered user account.

### sessions

Model: `backend/models/Session.js`

Fields:
- `user` - ObjectId reference to `users`, required
- `tokenHash` - string, required, unique
- `userAgent` - string, optional
- `ipAddress` - string, optional
- `revokedAt` - date, nullable
- `expiresAt` - date, required
- `createdAt` / `updatedAt` - timestamps

Indexes:
- TTL index on `expiresAt` with `expireAfterSeconds: 0`

Notes:
- Refresh tokens are hashed before storing.
- This collection is used for refresh token session tracking and logout.

### conversations

Model: `backend/models/Conversation.js`

Fields:
- `user` - ObjectId reference to `users`, required, indexed
- `language` - string, required
- `messages` - array of message objects
- `createdAt` / `updatedAt` - timestamps

Message object shape:
- `role` - `user` or `assistant`
- `content` - string
- `createdAt` - date

Indexes:
- Compound index on `{ user: 1, language: 1, updatedAt: -1 }`

Notes:
- Every chat exchange appends both the user message and the assistant reply to `messages`.
- The GET conversation routes read from this collection.

## Data flow

1. User registers or logs in.
2. A session document is created in `sessions`.
3. User sends a chat message to `/api/ai/chat`.
4. The AI reply is generated.
5. The message pair is saved in `conversations`.
6. The frontend can fetch summaries or full conversation history later.

## Important backend files

- `backend/models/User.js`
- `backend/models/Session.js`
- `backend/models/Conversation.js`
- `backend/routes/auth.js`
- `backend/routes/ai.js`
- `backend/routes/conversations.js`
