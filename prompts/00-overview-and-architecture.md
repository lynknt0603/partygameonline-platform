# Prompt 00 — Master Architecture & Execution Rules

## Mục tiêu

Đây là tài liệu gốc. Đọc trước mọi prompt implementation.

Xây dựng một nền tảng web chứa nhiều tabletop / board / card game, ưu tiên:
- card game;
- multiplayer online;
- desktop + mobile browser;
- mở rộng game bằng module;
- vibe coding dễ kiểm soát context.

Working brand: **BoardVerse**.

## Core stack

Frontend:
- React 19.2
- TypeScript strict
- Vite 8.x
- PixiJS 8.x
- Zustand
- TanStack Query
- React Router v7.x
- CSS Modules + CSS Custom Properties
- Lucide React

Backend:
- Java 21
- Spring Boot 4.1.x
- Maven
- Spring Web
- Spring WebSocket
- PostgreSQL

## Repository

```text
boardverse-platform/
├── apps/
│   ├── web/
│   └── server/
├── contracts/
├── docs/
├── prompts/
├── GEMINI.md
└── README.md
```

Do not create separate repositories.

## Architectural principles

### 1. Modular monolith

Do not start with:
- microservices;
- Kafka;
- Redis Cluster;
- Kubernetes;
- service mesh.

Introduce infrastructure only after a measured requirement exists.

### 2. Server authority

Client sends intent:

```json
{
  "type": "PLAY_CARD",
  "cardId": "hunter-06",
  "targetPlayerId": "P4"
}
```

Server owns:
- turn;
- phase;
- ownership validation;
- target validation;
- random results;
- card effects;
- win conditions;
- authoritative state.

Frontend renders accepted results.

### 3. Platform theme != game theme

Platform:
- Daybreak Table (light)
- Midnight Table (dark)

Game:
- may keep an independent canvas theme.

A Gothic game must not become a white canvas merely because the platform is in light mode.

### 4. State boundaries

TanStack Query:
- REST/server resources.

Zustand:
- UI-only/client state.

WebSocket game state:
- accepted authoritative snapshot/events.

Pixi local state:
- drag;
- hover;
- animation;
- particles;
- visual transforms.

### 5. React != Pixi

React owns normal application UI.

Pixi owns game scene rendering.

React mounts a Pixi host.
Do not mirror every Pixi object into React components.
Do not put authoritative rules into Pixi classes.

### 6. Mobile-first + touch-first

Platform pages:
- design from ~360px width upward.

Game:
- adaptive layout;
- mobile layout may differ structurally from desktop layout.

No critical interaction may require hover.

### 7. Game modules

Generic core must not know Bloodlines-specific rules.

Target backend shape:

```text
game/
  core/
  games/
    demo/
    bloodlines/
    gameN/
```

Target frontend shape:

```text
game/
  core/
  renderer/
  games/
    demo-card-game/
    night-of-bloodlines/
```

### 8. Vibe-code friendliness

Prefer local changes.

A coding agent modifying one Bloodlines card should not need to load:
- authentication;
- another game;
- database repositories;
- Pixi renderer internals.

Prefer files below ~250 lines.

## Execution protocol for every implementation prompt

Before coding:
1. Read `GEMINI.md`.
2. Read this file.
3. Inspect current repository.
4. Identify existing files that should be reused.
5. State a short implementation plan.

During coding:
- implement only the requested prompt;
- preserve public contracts unless the prompt explicitly changes them;
- do not implement future prompts.

After coding:
- run required verification;
- fix phase-introduced failures;
- report files changed;
- report deliberate TODOs.
