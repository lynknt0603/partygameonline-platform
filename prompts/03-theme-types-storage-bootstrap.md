# Prompt 03 — Theme Types, Storage & Pre-React Anti-FOUC Bootstrap

## Mục tiêu

Create a safe theme persistence layer and guarantee the correct theme is applied before React paints.

## Important correction

Do not try to solve first-paint FOUC with:
- `useEffect`;
- Zustand module-level side effects;
- React mount code.

Use a tiny inline bootstrap script in `index.html` before the application bundle.

## Theme types

Create:

```text
apps/web/src/shared/theme/theme.types.ts
```

```ts
export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

export interface ThemeState {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  syncSystemTheme: () => void;
}
```

Do not put `GameThemeManifest` here.
It belongs to the game-core domain and will be introduced in Prompt 07.

## Storage

Create:

```text
theme.storage.ts
```

Key:

```text
boardverse_theme_preference
```

Functions:
- `isThemeMode(value): value is ThemeMode`
- `getStoredTheme(): ThemeMode | null`
- `setStoredTheme(mode): void`
- `getSystemTheme(): ResolvedTheme`
- `resolveTheme(mode): ResolvedTheme`

Requirements:
- browser-safe guards;
- try/catch around storage;
- invalid stored value returns null;
- no DOM mutation.

## DOM helper

Create:

```text
theme.dom.ts
```

Functions:
- `applyThemeToDOM(resolvedTheme)`
- set `document.documentElement.dataset.theme`
- update `<meta name="theme-color">`

Colors:
- dark: `#0B0D10`
- light: `#F5F7F3`

## Anti-FOUC bootstrap

Add a minimal inline script inside `<head>` in `apps/web/index.html`, before the app bundle is executed.

The script:
1. reads the same storage key;
2. accepts only `system|light|dark`;
3. resolves OS preference;
4. sets `<html data-theme>`;
5. updates/creates theme-color meta;
6. catches all failures and uses a deterministic fallback.

Keep this script small and dependency-free.

Document why this small logic is intentionally duplicated from TS:
it must execute before the bundled React application.

## Acceptance

- reload on manually selected Light does not flash Dark first;
- reload on Dark does not flash Light first;
- System follows initial OS preference;
- invalid localStorage value is ignored;
- storage code contains no DOM access;
- typecheck/build pass.
