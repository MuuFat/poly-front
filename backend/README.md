# Polylingo

Polylingo is an AI language learning app with a Node.js/Express backend, MongoDB, and a frontend connected to the backend API.

Current status:
- Frontend and backend are connected.
- Authentication uses JWT access tokens and refresh tokens.
- Chat messages are saved to MongoDB.
- Conversation history can be fetched from the API.
- Tests are present and the backend CI workflow runs in GitHub Actions.

---

## What is in the backend

- `User` model for registered accounts.
- `Session` model for refresh token session tracking.
- `Conversation` model for saved chat history.
- Auth routes for register, login, refresh, logout, and me.
- Chat route that sends prompts to OpenAI and stores messages.
- Conversation routes for listing and reading history.

---

## Environment variables

For local development, use `backend/.env` on your machine.

Required values:

```
MONGO_URI=
OPENAI_API_KEY=
PORT=5000
JWT_SECRET=
REFRESH_TOKEN_SECRET=
FRONTEND_URL=http://localhost:3000
```

For GitHub Actions or deployment, use GitHub Secrets or platform environment variables.

---

## API summary

Base URL for local development: `http://localhost:5000`

Auth:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

Data:
- `GET /api/users`
- `POST /api/ai/chat`
- `GET /api/conversations`
- `GET /api/conversations/:id`

Protected routes need `Authorization: Bearer <accessToken>`.

---

## Database notes

- Collections used: `users`, `sessions`, `conversations`
- Chat messages are appended to the `conversations` collection every time a user sends a message.
- `sessions` has a TTL index for refresh token expiry.
- `conversations` has an index for efficient lookup by user and language.

If MongoDB cannot create indexes automatically, create them manually:

```js
use <your_db>
db.sessions.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
db.conversations.createIndex({ user: 1, language: 1, updatedAt: -1 })
```

---

## Security note

Refresh tokens currently work for this project flow, but for a production-grade setup it is better to store refresh tokens in an `HttpOnly` cookie rather than in localStorage.

---

## Testing

Run backend tests from the `backend` folder:

```cmd
cd backend
npm test
```

---

## Handoff summary

If you are handing this project to another developer, tell them:
- The backend is connected to MongoDB.
- Messages are saved automatically.
- The frontend only needs the endpoints above and the access token flow.
- The schema details are documented in `DATABASE_SCHEMA.md`.
