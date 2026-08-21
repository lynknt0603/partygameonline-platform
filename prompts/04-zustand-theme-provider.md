# Prompt 04 — Zustand Theme Store & ThemeProvider

## Mục tiêu

Implement clean runtime theme state.

## Responsibility split

### `useThemeStore`
Owns:
- `mode`
- `resolvedTheme`
- persistence action
- state updates

Must NOT:
- call `document.*`
- mutate meta tags
- register browser listeners

### `ThemeProvider`
Owns:
- applying resolved theme to DOM;
- OS media-query listener;
- browser side effects.

### `theme.dom.ts`
Owns:
- imperative DOM helper functions only.

## Store

Create:

```text
apps/web/src/shared/theme/useThemeStore.ts
```

Initial mode:
```ts
getStoredTheme() ?? "system"
```

Actions:

### setTheme(mode)
- resolve theme;
- persist preference;
- update Zustand state.

### toggleTheme()
Deterministic behavior:
- if current `resolvedTheme === "dark"` → manual `light`;
- otherwise → manual `dark`.

If current mode is `system`, Quick Toggle therefore exits System mode and selects the opposite resolved appearance.

### syncSystemTheme()
- only change `resolvedTheme` when current mode is `system`;
- do not change stored mode away from `system`.

## ThemeProvider

Create:

```text
ThemeProvider.tsx
```

Behavior:
- subscribe to `resolvedTheme`;
- `useEffect` → `applyThemeToDOM(resolvedTheme)`;
- register `matchMedia("(prefers-color-scheme: dark)")`;
- on change call `syncSystemTheme`;
- clean listener on unmount.

The first paint is already handled by Prompt 03 bootstrap; do not reintroduce module-level DOM mutations.

## Barrel export

Create:

```text
shared/theme/index.ts
```

Export:
- types;
- storage;
- DOM helper;
- Zustand hook;
- ThemeProvider.

## Acceptance

- store file contains no `document` access;
- `ThemeProvider` owns runtime DOM synchronization;
- System reacts to OS change;
- Quick Toggle exits System into the opposite manual theme;
- theme persistence works;
- typecheck/build pass.
