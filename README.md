# partygameonline-platform (BoardVerse)

Web frontend client for **BoardVerse (`partygameonline-platform`)**, a modern real-time multiplayer tabletop and party card game web platform. It delivers interactive gameplay communicating with the backend via REST APIs and WebSockets, with built-in client simulation fallback and automated bot player testing.

## Supported Games

1. **Blood Bound (`blood-bound`)**: Hidden role & social deduction between rival clans (Rose vs Beast). Identify and capture the enemy Leader while avoiding wrongful capture. Includes solo AI bot simulation and real-time decision logging.
2. **Night of Bloodlines (`night-of-bloodlines`)**: Social deduction party card game with day/night phases.
3. **Not In My Pot! (`not-in-my-pot`)**: Hidden role & bluffing game around a shared boiling pot.
4. **Where's The Bone (`wheres-the-bone`)**: Fast-paced deduction game about finding the hidden bone.

## Tech Stack

- **UI Framework**: React 19, TypeScript (Strict), Vite 8
- **State Management**: Zustand (Client state & Theme Store), TanStack Query (React Query) v5
- **Routing**: React Router v7 (`react-router-dom`)
- **Styling & Icons**: CSS Modules, Design Tokens (Daybreak & Midnight themes), Lucide React
- **Unit Testing**: Vitest v5
- **Fonts**: Self-hosted `@fontsource-variable/*` (Plus Jakarta Sans & Fraunces)

## Project Structure

```text
partygameonline-platform/
├── apps/
│   └── web/                         # React 19 Single Page App
│       └── src/
│           ├── app/                 # Providers (Theme, Query, SessionBootstrap) & Router
│           ├── game/core/           # Game contracts & manifests (GameManifest.ts)
│           ├── games/               # Domain-driven modular games
│           │   ├── bloodBound/      # Blood Bound (Model, Bot, UI, Tests)
│           │   ├── nob/             # Night of Bloodlines
│           │   ├── notInMyPot/      # Not In My Pot!
│           │   └── wheresTheBone/   # Where's The Bone
│           ├── pages/               # Top-level Page Views (GamePage, Lobby, Catalog)
│           └── shared/              # Reusable API, components, hooks, state, i18n
├── contracts/                       # Shared API & message schemas
├── docs/                            # Architecture guides & SOPs
├── scripts/                         # Scaffolding and bot automation scripts
└── .agents/                         # Antigravity agent skills & development rules
```

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

### 4. Scaffolding a New Game

To automatically generate all 7 standard module files for a new board game (types, engine, tests, API, play page, CSS, index):

```bash
npm run scaffold:game <game-id> "<Game Display Name>"

# Example:
npm run scaffold:game spyfall "Spyfall (Gián Điệp)"
```

### 5. Offline Demo & Solo Simulation Mode

When developing locally or testing games without a running backend server, access client-side simulation directly:
- **Blood Bound Solo / AI Simulation**: `http://localhost:5173/play/demo-blood-bound`
- Includes full AI bot decision logic, turn progression, and God View debug panel.

### 6. Bot Player Testing (WebSocket Multi-client)

To simulate multiple players joining and testing a room without manually opening multiple browser windows:

```bash
# Usage: node scripts/bot-players.mjs <ROOM_CODE> <PLAYER_COUNT>
node scripts/bot-players.mjs ABCD 6
```

## Agent Operating Guidelines & Skills

This repository follows strict AI-assisted development standards:
- **Core Rules**: Documented in [`GEMINI.md`](GEMINI.md) and [`.agents/rules/boardgame-development.md`](.agents/rules/boardgame-development.md).
- **Step-by-step SOP**: Runbook in [`.agents/skills/create-boardgame/SKILL.md`](.agents/skills/create-boardgame/SKILL.md) and [`docs/NEW-GAME-CREATION-GUIDE.md`](docs/NEW-GAME-CREATION-GUIDE.md).
- **Golden Rule**: **Logic-First & Pure State Machine** with **100% Vitest Unit Tests** before building any UI.

## License

All rights reserved.

