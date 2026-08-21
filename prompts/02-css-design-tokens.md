# Prompt 02 — Semantic Design Tokens & Light/Dark Theme CSS

## Mục tiêu

Implement platform themes:
- Daybreak Table
- Midnight Table

Only shared platform UI is governed by these tokens.

## File

Create:

```text
apps/web/src/shared/theme/theme.css
```

### Midnight Table

```css
:root,
[data-theme="dark"] {
  --bg: #0B0D10;
  --surface: #14181D;
  --surface-secondary: #181E25;
  --surface-elevated: #1C222A;

  --border: #303844;
  --border-soft: #242B34;

  --brand: #C9A45C;
  --brand-hover: #E2C47A;
  --brand-soft: rgba(201, 164, 92, 0.14);

  --accent: #5CA0C9;
  --accent-hover: #7AB4E2;
  --accent-soft: rgba(92, 160, 201, 0.14);

  --text-primary: #F2EEE5;
  --text-secondary: #AEB6C2;
  --text-muted: #747E8B;

  --success: #4FAE83;
  --warning: #D9A441;
  --danger: #D75C5C;
  --info: #6AA9D8;

  --overlay: rgba(0, 0, 0, 0.66);

  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.25);
  --shadow-md: 0 8px 28px rgba(0, 0, 0, 0.34);
}
```

### Daybreak Table

```css
[data-theme="light"] {
  --bg: #F5F7F3;
  --surface: #FFFFFF;
  --surface-secondary: #EFF4F0;
  --surface-elevated: #FFFFFF;

  --border: #D9E1DC;
  --border-soft: #E9EEEB;

  --brand: #B88A3D;
  --brand-hover: #9D702D;
  --brand-soft: rgba(184, 138, 61, 0.12);

  --accent: #3D9C8C;
  --accent-hover: #317F73;
  --accent-soft: #E0F2EE;

  --text-primary: #202824;
  --text-secondary: #647069;
  --text-muted: #8D9891;

  --success: #398968;
  --warning: #C78925;
  --danger: #C95151;
  --info: #4788B8;

  --overlay: rgba(32, 40, 36, 0.38);

  --shadow-sm: 0 2px 8px rgba(36, 56, 46, 0.07);
  --shadow-md: 0 10px 30px rgba(36, 56, 46, 0.11);
}
```

## Global layout tokens

Add:
- spacing scale;
- border radii;
- max content width;
- header heights;
- mobile bottom-nav height;
- safe-area variables;
- z-index layers.

Safe areas:

```css
--sat: env(safe-area-inset-top, 0px);
--sab: env(safe-area-inset-bottom, 0px);
--sal: env(safe-area-inset-left, 0px);
--sar: env(safe-area-inset-right, 0px);
```

## Base CSS

`apps/web/src/index.css`:
- import theme.css;
- `box-sizing: border-box`;
- body margin 0;
- min-height 100%;
- body bg/text from semantic tokens;
- system font stack;
- accessible `:focus-visible`.

Do not use:

```css
* { transition: all ... }
```

Only apply scoped transitions to surfaces that visibly change theme.

Respect:

```css
@media (prefers-reduced-motion: reduce)
```

Disable non-essential theme animations there.

## Hardcode rule

Shared platform components must consume semantic tokens.

Game-specific renderer/theme files may define their own artistic palette and are exempt from the shared-platform no-hardcode rule.

## Acceptance

- light/dark tokens work by changing `<html data-theme>`.
- no pure black platform background.
- safe-area variables exist.
- focus ring works.
- reduced-motion is respected.
- build/typecheck pass.
