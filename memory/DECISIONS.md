# Decisions (locked)

## Product

- Working brand: **BoardVerse**
- Một repo, modular monolith. Không microservice / Kafka / Redis Cluster / K8s ở MVP.
- Server-authoritative gameplay. Client gửi intent, server tính kết quả.
- Platform theme ≠ game canvas theme.
- Mobile-first platform UI, touch-first game UI. Không dựa vào hover.

## Docs to follow

- Source of truth: prompt pack **v2** (`README.md`, `CHANGELOG-v2.md`).
- Bỏ qua bản Gemini v1 trùng số: `03-types-and-storage`, `04-zustand-theme-store`, `06-app-shell-and-navigation`, `07-pixijs-canvas-bridge`, `08-accessibility-and-verification`.
- `source-uploaded-v1/` chỉ là archive.

## Frontend Phase A (đã làm)

- Code nằm ở `apps/web`, không còn `src/` ở root.
- Stack: React 19.2, Vite 8, PixiJS 8, Zustand, TanStack Query, React Router v7, CSS Modules, Lucide.
- Font premium **self-host**: `@fontsource-variable/plus-jakarta-sans` + `@fontsource-variable/fraunces`. Không Google Fonts runtime.
- UI song ngữ: tiêu đề/nhãn EN, mô tả VI. Nút ngắn EN, `aria-label` có VI.
- Theme: Daybreak Table / Midnight Table. Persistence key `boardverse_theme_preference`. Anti-FOUC = inline script trong `apps/web/index.html`, không dùng `useEffect`.
- Zustand store không được đụng `document.*`. `ThemeProvider` + `theme.dom.ts` mới mutate DOM.
- Routing URL thật. Không tab `useState`.
- Routes: `/` Home, `/games`, `/rooms`, `/rooms/:roomId` lobby, `/play/:roomId` fullscreen, `/friends`, `/settings`, `/profile`.
- Pixi: bàn **bài** generic, không bàn cờ 8x8.
- `GameThemeManifest` thuộc `src/game/core`, không thuộc platform theme.
- Contrast: nút brand/accent dùng chữ `#202824` (`--on-brand`). Teal/gold không dùng làm chữ nhỏ trên nền trắng.
- Prompt 09+ (feature split, backend) **chưa** làm.

## Dev

- Chạy web: `cd apps/web ; npm run dev` → http://localhost:5173/
- Gate: `npm run typecheck` và `npm run build` trong `apps/web`.
- Production host phải rewrite SPA về `index.html` — xem `docs/SPA-HOSTING.md`.
