# BoardVerse Platform — Agent Operating Guidelines (GEMINI.md)

This file defines the architectural rules, coding standards, and invariant boundaries for all coding agents operating in the **BoardVerse (`partygameonline-platform`)** repository.

---

## 1. Technology Baseline & Constraints

- **Web Core**: React 19.2 + Vite 8.x + TypeScript (Strict Mode)
- **Routing**: React Router v7 (`react-router-dom`) — Real URL routing (`/play/:roomId`, `/rooms/:roomId`). **Do NOT upgrade to v8** during feature work.
- **State Management**: Zustand (Client state & Theme Store).
  - *Invariant*: Zustand stores must NEVER touch `document` or `window` directly.
  - *Invariant*: `ThemeProvider.tsx` owns DOM synchronization (`[data-theme]`) and OS `prefers-color-scheme` listeners.
- **Data Fetching & Caching**: TanStack Query (`@tanstack/react-query`) with zero gcTime for active room snapshots.
- **Styling**: CSS Modules + CSS Custom Properties (Design Tokens). **Do NOT use TailwindCSS**.
- **Icons**: `lucide-react`.
- **Testing**: Vitest (`vitest run` via `npm test` or `npm test --prefix apps/web`).
- **Icons & Fonts**: Self-hosted `@fontsource-variable/*`. No external network font requests.

---

## 2. Platform Boundaries & Monorepo Shape

```text
partygameonline-platform/
├── apps/
│   └── web/                         # React 19 SPA
│       └── src/
│           ├── app/                 # Providers (ThemeProvider, QueryProvider, SessionBootstrap)
│           ├── game/core/           # Platform-wide game contracts & manifests (GameManifest.ts)
│           ├── games/               # Modular Game Domains (Domain-Driven Architecture)
│           │   ├── nob/             # Night of Bloodlines
│           │   ├── wheresTheBone/   # Where's the Bone
│           │   ├── notInMyPot/      # Not In My Pot!
│           │   └── bloodBound/      # Blood Bound (Rose vs Beast)
│           ├── pages/               # Top-level Page Views (GamePage, LobbyPage, RoomsPage, etc.)
│           └── shared/              # Reusable API, components, hooks, state, theme, i18n
├── contracts/                       # Shared API & message contracts
├── docs/                            # Architecture blueprints & checklists
└── scripts/                         # Automation & bots (scaffold-game.mjs, bot-players.mjs)
```

---

## 3. The 6 Golden Rules of New Game Development (Learned from Production)

When adding or modifying a board game, agents **MUST** strictly follow these sequential principles:

### Rule 1: Logic-First & Pure State Machine
- Game logic resides in `apps/web/src/games/<gameId>/model/<gameId>Rules.ts`.
- It must be **100% pure TypeScript**: deterministic functions with NO React hooks, NO DOM access, NO direct timers.
- State transitions must return a new immutable view state with incremented `version`.

### Rule 2: Automated Unit Testing Gate (MANDATORY Before UI)
- Never create or connect UI before testing the rules engine.
- Every game MUST have `model/<gameId>Rules.test.ts` powered by Vitest.
- Must cover:
  1. Initialization & Player seating/role distribution.
  2. Action validation (valid vs invalid commands).
  3. Phase transitions.
  4. Role special abilities / edge cases.
  5. Victory & defeat conditions (including wrongful capture / penalty rules).
- **All tests must pass (`npm test`) with 0 failures before proceeding to UI.**

### Rule 3: Client-Side Simulation, Solo AI & Production Safety
- Because backend server deployments may be in progress or cold-starting, every game PlayPage (`pages/<Game>PlayPage.tsx`) MUST feature a self-contained client simulation fallback with bot players so that it can be previewed, played, and tested immediately on the frontend.
- When player count is insufficient or playing solo, auto-fill bots via `ensureFullPlayerList` and provide heuristic bot decision logic (`model/<gameId>Bot.ts`).
- *Production Invariant*: Debug utilities (God View, AI logs, auto-play takeover) and client bot loops must ONLY run when `canDebug = isDemo || import.meta.env.DEV`. They must be strictly disabled in live production multiplayer.


### Rule 4: Theme Tokens & Contrast Compliance
- Support both **Daybreak Table** (Light) and **Midnight Table** (Dark) themes via CSS custom properties:
  - `--bg`, `--surface`, `--surface-hover`, `--border-subtle`, `--brand`, `--on-brand`, `--text`, `--text-muted`.
  - Normal text on light background must have AA contrast: use `--on-brand` (`#202824`) for buttons; do not use raw teal or gold for small text on white.
  - Gothic/Night games can specify `prefersDarkCanvas: true` in their manifest to preserve dark table atmosphere in Daybreak mode.

### Rule 5: Touch-First & Fullscreen Play Experience
- Route `/play/:roomId` is rendered **outside** `AppShell` (no bottom mobile navigation bar).
- UI must remain functional and readable down to **360px** viewport width.
- Interactive touch targets (buttons, cards, tokens) must have `min-height: 44px` and `min-width: 44px`.

### Rule 6: Platform Integration & Verification Gate
- Register game in `apps/web/src/shared/api/catalog.ts`.
- Connect route in `apps/web/src/pages/GamePage.tsx`.
- Pass the triple verification gate before finishing:
  1. `npm run test` (Vitest passes)
  2. `npm run typecheck` (tsc --noEmit passes)
  3. `npm run build` (Vite production build succeeds)

---

## 4. Scaffolding a New Game

To quickly scaffold a new game following all architectural standards, run:
```bash
npm run scaffold:game <game-id> "<Game Display Name>"
```
Or review the dedicated skill: [create-boardgame](file:///.agents/skills/create-boardgame/SKILL.md).
