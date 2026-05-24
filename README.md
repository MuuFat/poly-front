# Polylingo

Polylingo is an AI-powered language learning app for practicing Polish. The project uses a Next.js frontend and a Node.js/Express backend with MongoDB, JWT authentication, OpenAI-powered chat, and persisted conversation history.

This README is the main project overview for the repository. It explains what the app does, how to run it locally, what environment variables are needed, what the backend API looks like, how data is stored, and what the frontend needs to know.

---

## Project status

- Frontend and backend are connected.
- Authentication uses access tokens and refresh tokens.
- Chat messages are saved to MongoDB conversation documents.
- Conversation history can be fetched from the backend.
- Tests exist for the backend.
- GitHub Actions CI is set up for backend tests.

---

## Features

- Register and log in users.
- Issue JWT access tokens and refresh tokens.
- Chat with an AI language tutor.
- Save every user/assistant message pair to MongoDB.
- Fetch conversation summaries and full conversation history.
- Rate limit and protect backend routes.
- Support CORS for the frontend origin.

---

## Tech stack

Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS
- Zustand
- Framer Motion

Backend:
- Node.js
- Express
- MongoDB
- Mongoose
- JWT
- bcryptjs
- OpenAI SDK

Testing and CI:
- Jest
- Supertest
- GitHub Actions

---

## Repository structure

- `backend/` - Express API, MongoDB models, auth, chat, tests
- `frontend/` - Next.js frontend
- `DATABASE_SCHEMA.md` - plain schema handoff for a teammate
- `assets/` - project assets

---

## Local setup

### Prerequisites

- Node.js 18 or newer
- npm
- MongoDB Atlas or a local MongoDB instance
- OpenAI API key

### Backend setup

```bash
cd backend
npm install
```

Create `backend/.env` with the following values:

```env
MONGO_URI=your_mongo_uri
OPENAI_API_KEY=your_openai_api_key
PORT=5000
JWT_SECRET=your_jwt_secret
REFRESH_TOKEN_SECRET=your_refresh_token_secret
FRONTEND_URL=http://localhost:3000
```

Run the backend:

```bash
npm start
```

For development:

```bash
npm run dev
```

### Frontend setup

```bash
cd frontend
npm install
```

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Run the frontend:

```bash
npm run dev
```

Open the app at `http://localhost:3000`.

---

## Environment variables

The backend uses these values:

- `MONGO_URI` - MongoDB connection string
- `OPENAI_API_KEY` - OpenAI API key used by the backend chat route
- `PORT` - backend port, usually `5000`
- `JWT_SECRET` - secret used to sign access tokens
- `REFRESH_TOKEN_SECRET` - secret used to sign refresh tokens
- `FRONTEND_URL` - allowed frontend origin for CORS

The frontend uses:

- `NEXT_PUBLIC_API_URL` - backend base URL

Notes:
- `backend/.env` is for local development only and should not be committed.
- In GitHub Actions and deployment, use repository secrets or platform environment variables.

---

## Backend API

Base URL for local development:

```text
http://localhost:5000
```

### Auth routes

- `POST /api/auth/register`
  - Body: `{ "username", "email", "password" }`
  - Returns access token, refresh token, and user data.

- `POST /api/auth/login`
  - Body: `{ "email", "password" }`
  - Returns access token, refresh token, and user data.

- `POST /api/auth/refresh`
  - Body: `{ "refreshToken" }`
  - Returns a new access token and rotated refresh token.

- `POST /api/auth/logout`
  - Body: `{ "refreshToken" }`
  - Revokes the session.

- `GET /api/auth/me`
  - Protected route.
  - Returns the current authenticated user.

### Data routes

- `GET /api/users`
  - Returns sanitized user data.

- `POST /api/ai/chat`
  - Protected route.
  - Body: `{ "message", "language" }`
  - Returns `{ reply }`.
  - Saves the user message and assistant reply to MongoDB.

- `GET /api/conversations`
  - Protected route.
  - Query params: `language`, `page`, `limit`
  - Returns conversation summaries.

- `GET /api/conversations/:id`
  - Protected route.
  - Query params: `page`, `limit`
  - Returns the selected conversation with paginated messages.

Protected routes require:

```http
Authorization: Bearer <accessToken>
```

---

## Database behavior

The backend writes to these MongoDB collections:

- `users`
- `sessions`
- `conversations`

### Users

Stores registered user accounts with username, email, hashed password, and target language.

### Sessions

Stores hashed refresh tokens and session metadata. A TTL index removes expired sessions automatically.

### Conversations

Stores each chat session per user and language. Every chat request appends both the user message and the assistant reply to the `messages` array.

If you need the full field-by-field schema, see `DATABASE_SCHEMA.md`.

---

## Security notes

- Refresh tokens are stored in the current project flow so the app is easy to use in development.
- For production, the better approach is to move refresh tokens into an `HttpOnly` cookie so JavaScript cannot read them.
- Keep `JWT_SECRET`, `REFRESH_TOKEN_SECRET`, and `OPENAI_API_KEY` out of source control.
- Use GitHub Secrets for CI and platform environment variables for deployment.
- Limit `FRONTEND_URL` to the exact frontend origin you trust.

---

## Testing

Run backend tests:

```bash
cd backend
npm test
```

The test suite uses Jest and Supertest. Some tests use local fallbacks for secrets in `backend/jest.setup.js`, but you should still set real values in development and CI.

---

## CI

There is a GitHub Actions workflow that runs backend tests on push and pull requests.

Workflow file:

- `.github/workflows/nodejs-backend-tests.yml`

The workflow expects repository secrets for:

- `MONGO_URI`
- `OPENAI_API_KEY`
- `JWT_SECRET`
- `REFRESH_TOKEN_SECRET`

---

## Frontend integration notes

The frontend should know:

- Login and register return an access token and refresh token.
- The access token must be sent in the `Authorization` header for protected routes.
- When the access token expires, call `/api/auth/refresh`.
- On logout, call `/api/auth/logout`.
- Chat responses come from `/api/ai/chat`.
- Conversation history comes from `/api/conversations` and `/api/conversations/:id`.

Example request flow:

1. User logs in.
2. Frontend stores the access token.
3. Frontend calls protected routes with `Authorization: Bearer <token>`.
4. Frontend refreshes the token when needed.
5. Frontend reads conversation history from the backend.

---

## Handoff summary

If you are sharing this repo with someone else, the key points are:

- Backend and frontend are already connected.
- Messages are saved automatically to MongoDB.
- The schema is documented in `DATABASE_SCHEMA.md`.
- The frontend only needs the documented endpoints and token flow.
- Local development still uses `backend/.env`.
