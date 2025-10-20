# RAG Chat Application

A demo application for a talk about RAG (Retrieval-Augmented Generation) with MongoDB. This project consists of a Next.js frontend and a NestJS backend.

## Project Structure

```
devpira-2025/
├── frontend/          # Next.js application with chat UI
└── backend/           # NestJS API with conversation management
```

## Features

### Frontend (Next.js)

- Modern chat interface using @chatscope/chat-ui-kit-react
- Real-time integration with backend API using React Query
- Sidebar with dynamic conversation list from API
- Main chat area with real message history
- Optimistic updates for smooth user experience
- Loading states and error handling
- Responsive design with Tailwind CSS
- TypeScript support with proper type definitions

### Backend (NestJS)

- REST API for conversation management
- MongoDB integration (placeholder mode)
- Change streams watcher for embedding processing
- CORS enabled for frontend communication
- Input validation with class-validator

## API Endpoints

- `GET /conversations` - List all conversations
- `POST /conversations` - Create new conversation
- `GET /conversations/:id` - Get conversation by ID
- `POST /conversations/:id/messages` - Add message to conversation

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm

### Running the Applications

1. **Start the Backend:**

   ```bash
   cd backend
   npm install
   npm run start:dev
   ```

   Backend will run on http://localhost:3001

2. **Start the Frontend:**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
   Frontend will run on http://localhost:3000

### Testing the API

```bash
# List conversations
curl http://localhost:3001/conversations

# Get specific conversation
curl http://localhost:3001/conversations/1

# Add message to conversation
curl -X POST http://localhost:3001/conversations/1/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "Hello!", "sender": "User"}'
```

## Current Status

This is a scaffold implementation with placeholder data. The following features are ready for future development:

- [ ] MongoDB connection and data persistence
- [ ] Real embedding generation and processing
- [ ] Vector database integration
- [ ] AI chat responses
- [ ] Product review data ingestion

## Integration Features

- **React Query:** Advanced data fetching with caching, background updates, and optimistic updates
- **TypeScript:** Full type safety between frontend and backend
- **Error Handling:** Comprehensive error boundaries and loading states
- **Real-time Updates:** Optimistic UI updates for immediate feedback
- **API Client:** Centralized axios-based API client with interceptors

## Technologies Used

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, @chatscope/chat-ui-kit-react, @tanstack/react-query, axios
- **Backend:** NestJS, TypeScript, class-validator, class-transformer
- **Database:** MongoDB (placeholder mode)
- **Development:** ESLint, Prettier
