# Prompt 05 — Theme UX Components

## Mục tiêu

Implement:
- `ThemeQuickToggle`
- `AppearanceSettings`

Use CSS Modules and semantic tokens only.

## ThemeQuickToggle

Path:

```text
shared/components/ThemeQuickToggle/
```

Behavior is fixed:

- click does **not** cycle 3 modes;
- click calls `toggleTheme()`;
- if current mode is `system`, it exits System and selects the opposite of the currently resolved OS appearance;
- Settings page remains the place to explicitly choose System/Light/Dark.

Icon:
- resolved Light → Sun
- resolved Dark → Moon

If mode is System, show a small secondary Monitor indicator/badge or tooltip text, while the main icon may still reflect resolved appearance.

Accessible label examples:
- `Switch to Midnight Table`
- `Switch to Daybreak Table`

Tooltip must also expose:
- current mode;
- resolved appearance.

## AppearanceSettings

Path:

```text
shared/components/AppearanceSettings/
```

Use an accessible radio group with 3 cards:

1. System
2. Daybreak Table
3. Midnight Table

Each card:
- real keyboard-operable radio semantics;
- selected border;
- selected icon;
- preview swatches.

Daybreak swatches:
- `#F5F7F3`
- `#FFFFFF`
- `#3D9C8C`
- `#B88A3D`

Midnight:
- `#0B0D10`
- `#14181D`
- `#C9A45C`
- `#F2EEE5`

## Mobile

Minimum touch target:
- roughly 44px on primary interactive controls.

No hover-only information.

## Acceptance

- keyboard selection works;
- screen-reader semantics are reasonable;
- current theme is never represented by icon alone;
- mobile layout does not overflow at 360px;
- typecheck/build pass.
