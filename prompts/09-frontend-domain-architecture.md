# Prompt 09 — Frontend Domain Architecture & State Boundaries

## Mục tiêu

Evolve the frontend from demo pages into a scalable multi-game structure before adding real networking.

## Target structure

```text
src/
├── app/
│   ├── providers/
│   └── router/
├── features/
│   ├── games/
│   ├── rooms/
│   ├── lobby/
│   ├── friends/
│   ├── profile/
│   └── settings/
├── game/
│   ├── core/
│   ├── renderer/
│   └── games/
├── pages/
└── shared/
    ├── api/
    ├── components/
    ├── hooks/
    ├── state/
    ├── theme/
    ├── types/
    └── utils/
```

## Rules

- Page components compose features.
- Feature code owns feature-specific UI/state.
- Shared code cannot import a feature.
- Game-specific code cannot leak into shared platform components.
- Renderer core cannot import Night of Bloodlines.
- Avoid index-barrel cycles.

## State map

Document in:

```text
docs/FRONTEND-STATE-BOUNDARIES.md
```

Specify:
- TanStack Query → REST state;
- Zustand → client UI state;
- WebSocket store → accepted realtime state;
- Pixi → transient visual state.

Do not add a WebSocket implementation yet.

## Game manifest

Define a generic frontend manifest sufficient for catalogue/renderer registration, without encoding game rules:

```ts
interface GameManifest {
  id: string;
  displayName: string;
  minPlayers: number;
  maxPlayers: number;
  theme: GameThemeManifest;
}
```

Add a `GameRegistry` for renderer/module lookup.
No giant switch by game id.

## Acceptance

- architecture docs created;
- imports follow dependency direction;
- no gameplay-specific logic in shared modules;
- typecheck/build pass.
