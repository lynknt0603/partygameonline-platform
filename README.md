# partygameonline-platform

Web frontend client for Party Game Online (BoardVerse), a real-time multiplayer tabletop and party card game platform. It delivers interactive gameplay for games including Liar's Number, Night of Bloodlines, Not In My Pot!, and Where's The Bone, communicating with the backend via REST APIs and WebSockets.

## Available Games

| Game | Players | Short description |
|---|---:|---|
| **Liar's Number** (`liars-number`) | 2–6 | Pass a face-down number card, bluff about its value, and decide whether to challenge or inspect and pass it. |
| **Night of Bloodlines** (`night-of-bloodlines`) | 4–11 | Hidden-faction deduction featuring Vampires, Werewolves, Halfbloods, and secret role cards. |
| **Not In My Pot!** (`not-in-my-pot`) | 3–8 | A team bluffing game about completing or secretly sabotaging a shared pot. |
| **Where's the Bone** (`wheres-the-bone`) | 4–8 | Social deduction in which the group must identify the secret Bone Thief. |

## Liar's Number

Liar's Number (Vietnamese: **Ăn Gian Nói Dối**) is a single-loser bluffing game for 2–6 players. A sender chooses a card, passes it face down, and declares any number from 1 to 8. The receiver chooses **Truth** or **Lie**; in games with at least three players, they may instead inspect the hidden card and pass it to somebody who has not seen it while making a fresh claim.

- The 64-card deck has eight number types. Each type contains seven Normal cards and one Roman card.
- Normal penalties count as 1 point and Roman penalties count as 2 points. Scores from different number types are never combined.
- The first player to reach 4 penalty points of one type loses. With two players, 10 unseen cards are removed, inspect-and-pass is unavailable, and the threshold is 5.
- The penalty receiver opens the next round and also loses if they have no card with which to start it.
- The game stops with one loser and all remaining players as winners.
- Winners receive **+10 ELO** each. The loser is shown **-(starting player count × 10) ELO**, with the saved rating floored at zero. Rankings show current ELO and win count.

## Tech Stack

- UI Framework: React 19, TypeScript, Vite
- State Management: Zustand, TanStack Query (React Query) v5
- Routing: React Router v7
- Styling & Icons: CSS Modules, Design Tokens, Lucide React

## Project Structure

- apps/web/src/app: Router configuration, providers, and main application layout
- apps/web/src/features: Core platform features (authentication, room lobby, chat)
- apps/web/src/games: Game-specific UI and game logic (e.g. Liar's Number, Night of Bloodlines, Where's The Bone)
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

### 2. Production Build

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
