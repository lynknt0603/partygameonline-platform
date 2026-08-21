# Changes made in v2

Compared with the uploaded prompt set, v2:

1. Keeps the improved separation of Zustand state and ThemeProvider DOM synchronization.
2. Moves anti-FOUC initialization to a pre-React inline bootstrap in `index.html`; module-level React code is not treated as a guaranteed pre-paint solution.
3. Moves `GameThemeManifest` out of platform theme types and into the game-core domain.
4. Makes ThemeQuickToggle behavior deterministic.
5. Keeps real URL routing; no state-based page routing.
6. Replaces the PixiJS 8x8 tactical-board demo with a reusable card-table foundation.
7. Adds touch-first mobile layout rules, ResizeObserver layout, and capped device-pixel-ratio guidance.
8. Corrects Daybreak contrast rules: teal/gold on white are not valid normal-text AA combinations.
9. Changes repository shape to `apps/web` + `apps/server` from the beginning.
10. Adds frontend feature/domain architecture.
11. Adds Spring Boot modular-monolith prompts.
12. Adds REST contracts, TanStack Query, room/lobby, WebSocket, GameEngine, demo multiplayer, reconnect, persistence, testing, and the first real game-module skeleton.
13. Adds `GEMINI.md` so coding agents preserve boundaries across sessions.
14. Adds a build/test gate to every implementation phase.
