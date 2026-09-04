# partygameonline-platform

Web frontend client for Party Game Online (BoardVerse), a real-time multiplayer tabletop and party card game platform. It delivers interactive gameplay for games including Night of Bloodlines and Where's The Bone, communicating with the backend via REST APIs and WebSockets.

## Tech Stack

- UI Framework: React 19, TypeScript, Vite
- State Management: Zustand, TanStack Query (React Query) v5
- Routing: React Router v7
- Styling & Icons: CSS Modules, Design Tokens, Lucide React

## Project Structure

- apps/web/src/app: Router configuration, providers, and main application layout
- apps/web/src/features: Core platform features (authentication, room lobby, chat)
- apps/web/src/games: Game-specific UI and game logic (e.g. Night of Bloodlines, Where's The Bone)
- apps/web/src/shared: Reusable components, custom hooks, and shared stores
- scripts: Automated bot testing and utility scripts

## Prerequisites

- Node.js 20 or higher
- npm 10 or higher

## Getting Started

### 1. Install Dependencies

Navigate to the web app directory and install dependencies:

```bash
cd apps/web
npm install
```

### 2. Development Server

```bash
npm run dev
```

The web client will start at `http://localhost:5173/`.
Vite is pre-configured to proxy `/api` and `/ws` requests to the backend server at `http://127.0.0.1:8080/`.

Alternatively, run from the repository root:

```bash
npm run dev
```

## Build and Testing

### 1. Type Check

```bash
# From apps/web directory
npm run typecheck

# Or from repository root
npm run typecheck
```

### 2. Automated Unit Tests

```bash
# Run all unit tests
npm run test

# Run tests in watch mode (from apps/web)
cd apps/web && npm run test:watch
```

### 3. Production Build

```bash
# From apps/web directory
npm run build

# Or from repository root
npm run build
```

Production output will be generated in `apps/web/dist`.

### 3. Preview Production Build

```bash
cd apps/web
npm run preview
```

### 4. Bot Player Testing

To simulate multiple players joining and testing a room without manually opening multiple browser windows:

```bash
# Usage: node scripts/bot-players.mjs <ROOM_CODE> <PLAYER_COUNT>
node scripts/bot-players.mjs ABCD 6
```

## License

All rights reserved.
