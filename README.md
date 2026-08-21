# partygameonline-platform

Web frontend for Party Game Online, a real-time multiplayer tabletop and party game platform.

Built with React 19, TypeScript, PixiJS 8, and Vite. Connects to `partygameonline-server` over REST and WebSockets.

## Architecture & Tech Stack

- **UI Shell & State:** React 19, TypeScript, Zustand, TanStack Query v5, React Router v7.
- **Game Table Rendering:** PixiJS 8 canvas renderer with responsive card dock, animations, and touch-first layout.
- **Styling:** CSS Modules, Design Tokens (Daybreak & Midnight themes).
- **Networking:** WebSocket client for real-time game actions and projected state events; REST client for sessions and rooms.

## Project Structure

```text
apps/web/
├── public/assets/games/   # Static card textures, badges, token assets
└── src/
    ├── app/               # Providers, shell layout, routing
    ├── features/          # Platform features (auth, rooms, chat)
    ├── game/              # PixiJS canvas bridge and table renderer
    ├── games/nob/         # Night of Bloodlines components, models, assets
    ├── pages/             # Route pages (Home, Rooms, Lobby, GamePage)
    └── shared/            # UI components, hooks, i18n, state stores
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Development

```bash
cd apps/web
npm install
npm run dev
```

The application will start at `http://localhost:5173/`. Vite is pre-configured to proxy `/api` and `/ws` requests to `http://127.0.0.1:8080/`.

### Build & Verification

```bash
# Typecheck
npm run typecheck

# Production build
npm run build
```

## License

All rights reserved.
