# Prompt 01 — Repository & Frontend Scaffolding

## Mục tiêu

Khởi tạo repository foundation và frontend ở `apps/web`.

Do not create backend yet.

## Preflight

Verify:
- Node >= 22.12
- npm available

If environment is incompatible, report the exact mismatch before changing application code.

## Repository structure

Create:

```text
boardverse-platform/
├── apps/
│   └── web/
├── contracts/
├── docs/
└── prompts/
```

Do not move prompts if they already exist.

## Frontend

Create Vite React TypeScript app under:

```text
apps/web
```

Target major lines:
- React 19.2
- Vite 8.x
- TypeScript current stable compatible with Vite 8
- PixiJS 8.x
- Zustand current stable
- Lucide React current stable
- React Router v7.x
- TanStack Query current stable

Avoid beta/RC/canary packages.

## Required scripts

`apps/web/package.json`:

```text
dev
build
preview
typecheck
```

`typecheck` must run TypeScript without emitting output.

## TypeScript

Require:
- `strict: true`
- no implicit `any`
- path alias `@/* -> src/*`
- bundler module resolution appropriate for Vite
- React JSX transform

## Vite

Configure alias `@`.

Do not add unnecessary plugins.

## index.html

Required:
- viewport width/device width
- `viewport-fit=cover`
- `<meta name="theme-color">`
- root div
- title `BoardVerse`

Do not load Google Fonts from the network at this phase.
Use a high-quality system font stack first; custom font loading can be optimized later.

## Frontend folders

```text
apps/web/src/
├── app/
├── features/
├── game/
│   ├── core/
│   ├── renderer/
│   └── games/
├── pages/
├── shared/
│   ├── api/
│   ├── components/
│   ├── hooks/
│   ├── state/
│   ├── theme/
│   ├── types/
│   └── utils/
├── App.tsx
├── main.tsx
└── index.css
```

Do not add fake domain abstractions yet.

## Acceptance

- `npm install` succeeds.
- `npm run typecheck` succeeds.
- `npm run build` succeeds.
- App renders a minimal placeholder.
- No `any`.
- No Tailwind.
- No CSS-in-JS runtime.
