# Prompt 07 — PixiJS Generic Card Table Foundation

## Mục tiêu

Integrate PixiJS v8 with React using a reusable **card-table** foundation.

Do NOT build an 8x8 chess/tactics board.

The platform is card-game-heavy, so the validation scene must exercise card interactions.

## Game-core contracts

Create:

```text
apps/web/src/game/core/
├── GameManifest.ts
└── GameThemeManifest.ts
```

Example:

```ts
export interface GameThemeManifest {
  id: string;
  name: string;
  prefersDarkCanvas?: boolean;
  hudVariant?: "platform" | "game";
  className?: string;
}
```

Keep this out of platform theme types.

## Renderer structure

```text
game/renderer/
├── PixiGameHost.ts
├── usePixiApp.ts
├── layout/
│   ├── CardTableLayout.ts
│   ├── mobileCardTableLayout.ts
│   └── desktopCardTableLayout.ts
├── views/
│   ├── CardView.ts
│   ├── DeckView.ts
│   ├── HandView.ts
│   ├── PlayerAreaView.ts
│   └── PlayZoneView.ts
└── theme/
    └── platformThemeBridge.ts
```

## Pixi lifecycle

Use Pixi v8 async initialization.

Requirements:
- safe async cancellation;
- React StrictMode double-mount safe;
- destroy application on unmount;
- do not leak canvas/WebGL context;
- do not append duplicate canvases.

Use `ResizeObserver` or equivalent container-driven resize logic.

## Rendering resolution

Separate:
- CSS viewport size;
- logical game coordinates;
- renderer pixel resolution.

Cap device pixel ratio to a sensible maximum (for example 2) rather than blindly rendering at extreme DPR.

## Generic demo scene

Render:
- opponent area;
- opponent hand backs;
- deck;
- discard/play zone;
- local player's hand;
- turn label;
- placeholder cards.

Interaction:
- tap/select;
- pointer down/up;
- drag card;
- drop into play zone;
- card focus/preview;
- desktop hover as enhancement only.

Do not implement authoritative game rules.

## Adaptive layout

Mobile portrait:
- hand anchored near bottom;
- compact opponent area;
- central play zone;
- side panels hidden behind React drawers if needed.

Desktop:
- more whitespace;
- wider hand;
- optional side HUD.

Do NOT render desktop at 1920x1080 and CSS-scale it down.

## Theme bridge

Shared HUD follows Daybreak/Midnight.

Canvas behavior:
- game with `prefersDarkCanvas=true` may remain independently dark;
- generic demo may consume selected semantic platform colors.

Game-specific colors may be hardcoded inside that game's theme module.

## React/Pixi bridge

React:
- mounts host;
- owns HUD and route lifecycle.

Pixi:
- owns scene graph.

Do not create 100 React components for 100 Pixi cards.

## Acceptance

- scene works at 360x800-ish portrait;
- scene works desktop;
- pointer interaction works with mouse and touch semantics;
- resizing does not rebuild the entire app unnecessarily;
- unmount/re-enter does not duplicate canvas;
- platform theme can change shared HUD independently;
- typecheck/build pass.
