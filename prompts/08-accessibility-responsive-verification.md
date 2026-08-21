# Prompt 08 — Accessibility, Responsive Verification & Frontend Foundation Gate

## Mục tiêu

Harden Phase A.

## StatusBadge

Create accessible variants:
- ready
- waiting
- in_game
- disconnected

Each state must use:
- text;
- icon;
- color as reinforcement only.

Do not duplicate a glyph in both icon and visible text unless the visual design intentionally needs both.

## Contrast rules

Verify with a WCAG contrast calculator implementation or trusted browser tooling.

Known palette facts to respect:

Midnight:
- `#F2EEE5` on `#0B0D10` ≈ 16.8:1
- `#C9A45C` on `#14181D` ≈ 7.6:1

Daybreak:
- `#202824` on `#F5F7F3` ≈ 14.0:1
- `#3D9C8C` on white ≈ 3.32:1
- `#B88A3D` on white ≈ 3.12:1

Therefore:
- teal/gold may be used for non-text UI accents where 3:1 is sufficient;
- do NOT use teal/gold as ordinary small text on white and claim AA;
- filled teal/gold buttons should use a dark foreground such as `#202824` when appropriate:
  - `#202824` on teal ≈ 4.55:1
  - `#202824` on champagne gold ≈ 4.85:1

Do not change the palette unnecessarily; change foreground usage first.

## Keyboard

Verify:
- NavLinks;
- theme radio cards;
- modal close;
- buttons;
- card preview alternative React control where Canvas action would otherwise be inaccessible.

Pixi canvas itself is not a substitute for semantic HTML accessibility.
For important gameplay actions, design an accessible React/HUD alternative where practical.

## Reduced motion

Respect `prefers-reduced-motion`.

Disable or simplify:
- card bobbing;
- excessive glow;
- non-essential theme transitions.

## Mobile checks

At minimum manually inspect representative sizes:
- narrow Android-like 360px;
- modern iPhone portrait;
- tablet;
- desktop.

Check:
- safe area;
- bottom nav;
- game HUD;
- portrait card table;
- landscape transition;
- no horizontal overflow.

## Build gate

Run:

```bash
cd apps/web
npm run typecheck
npm run build
```

Zero TypeScript build errors.

Do not claim browser/device checks were performed if the current agent environment cannot actually perform them. Clearly distinguish:
- automated checks run;
- manual checks still required.

## Acceptance

Produce `docs/FRONTEND-FOUNDATION-CHECKLIST.md` with:
- pass/fail;
- automated/manual;
- evidence;
- TODO.

Phase A ends only after build/typecheck pass.
