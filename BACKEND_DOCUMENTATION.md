# Polylingo Backend Documentation

This document explains the backend for project handoff and presentation purposes. The backend is the control layer for authentication, AI chat, conversation storage, and external service integration.

## What the backend does

- Runs a Node.js and Express API.
- Connects the frontend to MongoDB.
- Sends tutor prompts to OpenAI.
- Manages login, registration, refresh tokens, and logout.
- Stores chat conversations and user session data.
- Sends verification and password reset emails when SMTP is configured.

## Runtime flow

The backend starts from [backend/index.js](backend/index.js).

1. Environment variables are loaded.
2. MongoDB connection is opened.
3. Model indexes are synced for users, sessions, and conversations.
4. The Express server starts listening on the configured port.

There is no separate worker, queue, or cron process. The backend is a single request/response API process.

## Main request pipeline

The Express app in [backend/app.js](backend/app.js) handles:

- CORS for the deployed frontend origin.
- JSON request parsing.
- Global rate limiting.
- Route registration.
- 404 and error handling.

Typical request flow:

1. The frontend sends a request to the backend URL on Render.
2. Middleware validates the request.
3. Protected routes verify the JWT access token.
4. The route handler reads or writes MongoDB, or calls OpenAI.
5. The backend returns JSON to the frontend.

## Core backend modules

### Authentication

The auth routes in [backend/routes/auth.js](backend/routes/auth.js) handle:

- Register
- Login
- Refresh token rotation
- Logout
- Current user lookup
- Email verification
- Forgot password
- Reset password
- Security-question recovery

Auth uses:

- bcryptjs for password hashing
- jsonwebtoken for access and refresh tokens
- Session records in MongoDB for refresh-token tracking
- Nodemailer for email delivery when SMTP credentials are available

### AI chat

The AI route in [backend/routes/ai.js](backend/routes/ai.js) is the tutor engine. It:

- Validates the message and language.
- Builds a tutoring prompt.
- Optionally includes previous conversation context.
- Calls OpenAI.
- Saves the user message and assistant reply to MongoDB.
- Returns the reply to the frontend.

This route is controlled by environment values such as `OPENAI_API_KEY`, `OPENAI_MODEL`, and `AI_CORRECTION_MODE`.

### Conversations

The conversation routes in [backend/routes/conversations.js](backend/routes/conversations.js) let the frontend:

- List saved conversations.
- Open one conversation.
- Page through messages.
- Delete one conversation.
- Delete all conversations for the current user.

### Users and debug

- [backend/routes/userRoutes.js](backend/routes/userRoutes.js) exposes a basic user list route used mainly for testing.
- [backend/routes/debug.js](backend/routes/debug.js) provides a test email endpoint for SMTP checks.

## Data stored by the backend

The backend writes to three collections:

- `users` for accounts and password recovery data.
- `sessions` for hashed refresh tokens and session metadata.
- `conversations` for saved AI chat history.

Important behavior:

- Session documents expire automatically through a TTL index.
- Every chat exchange appends both the user message and assistant reply.
- Conversations are indexed for efficient lookup by user and update time.

## Environment variables

Local development:

```env
MONGO_URI=
OPENAI_API_KEY=
PORT=5000
JWT_SECRET=
REFRESH_TOKEN_SECRET=
FRONTEND_URL=http://localhost:3000
```

Optional email and AI settings:

```env
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=false
SMTP_USER=
SMTP_PASS=
SMTP_FROM=no-reply@example.com
SMTP_TEST_TO=
OPENAI_MODEL=gpt-4o-mini
AI_CORRECTION_MODE=explicit
```

Deployment notes:

- Set `FRONTEND_URL` to the exact Vercel origin.
- Set backend secrets in Render environment variables.
- Set `NEXT_PUBLIC_API_URL` in Vercel to the Render backend URL.

Example:

```env
FRONTEND_URL=https://poly-front-two.vercel.app
NEXT_PUBLIC_API_URL=https://polylingo-2557.onrender.com
```

## API endpoints

Auth:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/verify`
- `POST /api/auth/forgot`
- `POST /api/auth/reset`
- `POST /api/auth/set-security`
- `POST /api/auth/forgot-security`
- `POST /api/auth/verify-security`

Data:

- `GET /api/users`
- `POST /api/ai/chat`
- `GET /api/conversations`
- `GET /api/conversations/:id`
- `DELETE /api/conversations/:id`
- `DELETE /api/conversations?all=true`
- `POST /api/debug/send-test-email`

Protected routes require:

```http
Authorization: Bearer <accessToken>
```

## Presentation summary

Polylingo’s backend is a Render-hosted Node.js and Express API that connects the frontend to MongoDB, OpenAI, and email services. It handles authentication, AI chat generation, conversation storage, and recovery flows while the frontend on Vercel calls it through `NEXT_PUBLIC_API_URL`.
