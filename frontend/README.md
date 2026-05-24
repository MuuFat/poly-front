# PolyLingo Frontend

This is the frontend for Polylingo, connected to the Node.js/Express backend in this repository.

## 🚀 Features

- **Interactive AI Chat:** Practice natural conversations in your target language.
- **Instant Grammar Feedback:** The AI tutor corrects mistakes and explains them in English.
- **Conversation History:** Save and review past sessions from the backend.
- **Secure Authentication:** JWT-based access and refresh token flow.

## 💻 Tech Stack

- **Frontend:** React 19, Next.js 15, Tailwind CSS v4, Framer Motion, Zustand
- **Backend:** Node.js, Express, MongoDB, Mongoose
- **AI Integration:** OpenAI API through the backend

## 🛠️ Getting Started Locally

### Prerequisites

- Node.js (v18+)
- MongoDB running locally or a MongoDB Atlas URI
- OpenAI API Key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/polylingo.git
   cd polylingo
   ```

2. **Setup the Backend**
   ```bash
   cd backend
   npm install

   # Create a .env file based on .env.example

   npm run dev
   ```

3. **Setup the Frontend**
   ```bash
   cd frontend
   npm install

   # Create a .env.local file with NEXT_PUBLIC_API_URL=http://localhost:5000

   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Backend API it expects

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/ai/chat`
- `GET /api/conversations`
- `GET /api/conversations/:id`

Protected routes need `Authorization: Bearer <accessToken>`.

## Notes

- The frontend should use the backend URL from `NEXT_PUBLIC_API_URL`.
- Refresh tokens are currently handled by the backend flow in this project.
- Conversation history is read from MongoDB through the backend API.
