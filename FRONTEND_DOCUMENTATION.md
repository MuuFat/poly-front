# Polylingo Frontend Documentation

This document explains the frontend architecture and how it connects to the backend. The frontend is a Next.js application hosted on Vercel.

## What the frontend does

- Presents the landing page and marketing content.
- Handles authentication screens.
- Displays the chat interface.
- Shows conversation history.
- Calls the backend API for all server-side data.
- Stores auth state locally so the user stays signed in.

## Frontend stack

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Zustand

## Main application structure

Key frontend files:

- [frontend/app/page.tsx](frontend/app/page.tsx) for the home page.
- [frontend/app/layout.tsx](frontend/app/layout.tsx) for the root layout and global metadata.
- [frontend/lib/api.ts](frontend/lib/api.ts) for the API client.
- [frontend/store/authStore.ts](frontend/store/authStore.ts) for auth persistence.
- [frontend/services/chatService.ts](frontend/services/chatService.ts) for chat and conversation API calls.

## User flow

1. The user opens the landing page.
2. If authenticated, the app redirects to the chat page.
3. If not authenticated, the user can log in or register.
4. The app stores the token and refresh token in Zustand persistence.
5. The chat screen sends messages to the backend.
6. Conversation history is loaded from MongoDB through the backend API.

## Authentication behavior

The auth store in [frontend/store/authStore.ts](frontend/store/authStore.ts) keeps:

- the current user
- the access token
- the refresh token
- the authenticated state

The API client in [frontend/lib/api.ts](frontend/lib/api.ts) does three important things:

- Adds `Authorization: Bearer <token>` to requests.
- Automatically calls `/api/auth/refresh` if a request gets a 401 response.
- Updates the store with new tokens after refresh.

This means the frontend can stay logged in without forcing the user to sign in again every time the access token expires.

## Chat and conversation features

The chat service in [frontend/services/chatService.ts](frontend/services/chatService.ts) wraps these backend calls:

- Send a chat message.
- Load conversation summaries.
- Load a single conversation.
- Delete one conversation.
- Delete all conversations.

The chat interface depends on the backend AI route to generate replies and the conversations route to store history.

## UI behavior

The home page in [frontend/app/page.tsx](frontend/app/page.tsx) shows:

- A hero section.
- Feature cards.
- A stats section.
- Login and register calls to action.

The root layout in [frontend/app/layout.tsx](frontend/app/layout.tsx) defines global HTML structure and metadata.

## Deployment and environment variables

The frontend is deployed on Vercel and must know the backend URL at build time.

Required environment variable:

```env
NEXT_PUBLIC_API_URL=https://your-render-backend-url
```

Example for this project:

```env
NEXT_PUBLIC_API_URL=https://polylingo-2557.onrender.com
```

Important notes:

- `NEXT_PUBLIC_API_URL` is read during build and runtime on the client.
- The frontend should never hardcode a local backend URL for production.
- The backend should set `FRONTEND_URL` to the exact Vercel origin.

## Presentation summary

Polylingo’s frontend is a Next.js app hosted on Vercel. It handles the user experience, authentication screens, chat UI, and conversation history, while the actual data and AI processing happen through the Render backend API.
