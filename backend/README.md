# Polylingo Backend Documentation

This backend powers Polylingo, an AI language tutor application. It is a Node.js and Express API that connects the frontend to MongoDB, OpenAI, and email services. For your presentation, the backend can be explained as one HTTP server process with a few important responsibilities:

- authenticate users with JWT access and refresh tokens
- store users, sessions, and chat conversations in MongoDB
- send tutor prompts to OpenAI and return the generated reply
- support password reset, email verification, and conversation history
- protect routes with middleware, CORS, and rate limiting

## Runtime overview

The backend starts from [index.js](index.js), which does three main things:

1. loads environment variables
2. connects to MongoDB
3. starts the Express server on the configured port

When the server boots, it also syncs indexes for the `User`, `Session`, and `Conversation` models. That means MongoDB gets the indexes the app expects, including the TTL cleanup for expired sessions.

There is no separate worker process, queue, cron job, or socket server in this project. The backend is a single request/response API process, and extra work happens only when a route is called.

## Request flow

The Express app is created in [app.js](app.js). It configures:

- CORS so the Vercel frontend can talk to the API
- JSON body parsing for incoming requests
- a global rate limit to reduce abuse
- route mounting for auth, AI chat, conversations, users, and debug tools
- fallback handlers for 404 and server errors

The typical request flow is:

1. the frontend sends a request to the Render backend
2. the backend middleware checks headers, JSON, and rate limits
3. protected routes verify the JWT access token
4. the route handler performs the database or external API work
5. the backend returns JSON to the frontend

## Main backend modules

### Authentication

The auth routes in [routes/auth.js](routes/auth.js) handle:

- register
- login
- refresh token rotation
- logout
- get current user profile
- email verification
- forgot password and reset password
- security-question recovery

The auth system uses:

- bcrypt for password hashing
- JWT for access and refresh tokens
- MongoDB sessions for refresh-token tracking
- Nodemailer for verification and recovery emails when SMTP is configured

### AI chat

The AI route in [routes/ai.js](routes/ai.js) is the core tutor feature. It:

- validates the message, language, and optional conversation ID
- builds a tutoring prompt for OpenAI
- optionally loads recent conversation context
- sends the prompt to OpenAI
- stores both the user message and assistant response in MongoDB
- returns the generated reply to the frontend

This route is what makes the app feel interactive. It is also where the app’s AI behavior is controlled through environment variables such as `OPENAI_API_KEY`, `OPENAI_MODEL`, and `AI_CORRECTION_MODE`.

### Conversations

The conversation routes in [routes/conversations.js](routes/conversations.js) let the frontend:

- list saved conversations
- open one conversation and page through messages
- delete one conversation
- delete all conversations for the signed-in user

This is the history layer of the app. It allows a user to come back later and continue learning from previous sessions.

### Users and debug

[routes/userRoutes.js](routes/userRoutes.js) exposes a basic user listing route used mostly for testing.

[routes/debug.js](routes/debug.js) provides a test email endpoint for SMTP verification. This is useful when checking deployment settings or email credentials.

## Data stored in MongoDB

The backend writes to three collections:

- `users` - registered accounts and password recovery data
- `sessions` - hashed refresh tokens plus metadata like user agent and IP address
- `conversations` - chat sessions and message history

Important behavior:

- refresh sessions expire automatically through a TTL index
- every AI exchange is appended to the conversation document
- conversation documents are indexed by user and update time for faster history lookup

## Environment variables

For local development, create a `backend/.env` file with:

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

For deployment:

- set `FRONTEND_URL` to the exact Vercel origin
- set `NEXT_PUBLIC_API_URL` in the Vercel project settings to the Render backend URL
- set the backend secrets in Render environment variables

Example:

```env
FRONTEND_URL=https://poly-front-two.vercel.app
NEXT_PUBLIC_API_URL=https://polylingo-2557.onrender.com
```

## API summary

Base URL for local development:

```text
http://localhost:5000
```

### Auth endpoints

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

### Data endpoints

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

## Deployment explanation for presentation

If you are describing the hosting setup, say this:

- Vercel runs the frontend.
- Render runs the backend API.
- The frontend sends API requests to the Render URL.
- The backend sends verification and reset links back to the Vercel site.
- MongoDB stores authentication data and conversation history.
- OpenAI handles the language tutor generation.

That means the backend is the control center between the UI, the database, and the AI service.

## Security and reliability notes

- Access tokens are short-lived.
- Refresh tokens are stored as hashed sessions in MongoDB.
- Rate limiting helps protect the API from abuse.
- Protected routes verify the JWT before returning user data.
- Errors are returned as JSON so the frontend can display them consistently.

## Testing

Run backend tests from the `backend` folder:

```cmd
cd backend
npm test
```

## Short presentation summary

If you need a one-paragraph explanation, use this:

Polylingo’s backend is a Node.js and Express API deployed on Render. It connects the frontend to MongoDB, OpenAI, and email services. It handles login, registration, token refresh, password reset, email verification, AI chat generation, and conversation history storage. The frontend on Vercel calls this backend through `NEXT_PUBLIC_API_URL`, while the backend uses `FRONTEND_URL` to generate links back to the Vercel app.
