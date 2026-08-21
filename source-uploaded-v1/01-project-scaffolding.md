# Prompt 01: Project Scaffolding & Configuration Setup

## Mục tiêu
Thiết lập bộ khung dự án (Scaffolding) cho nền tảng **Party Game Online Platform** với **React 18+**, **TypeScript**, **Vite**, **Zustand**, **PixiJS v8**, và **Lucide React**.

---

## Yêu cầu chi tiết cần thực hiện

1. **Khởi tạo file `package.json`**:
   - `name`: `partygameonline-platform`
   - `private`: `true`
   - `type`: `module`
   - Dependencies:
     - `react`: `^18.3.1`
     - `react-dom`: `^18.3.1`
     - `zustand`: `^4.5.2`
     - `pixi.js`: `^8.1.0`
     - `lucide-react`: `^0.395.0`
   - DevDependencies:
     - `@types/react`: `^18.3.3`
     - `@types/react-dom`: `^18.3.0`
     - `@types/node`: `^20.14.2`
     - `@vitejs/plugin-react`: `^4.3.0`
     - `typescript`: `^5.4.5`
     - `vite`: `^5.2.11`
   - Scripts: `dev`, `build`, `preview`, `typecheck`

2. **Cấu hình TypeScript (`tsconfig.json`, `tsconfig.node.json`)**:
   - Bật `strict: true`
   - Hỗ trợ Path Alias: `@/*` trỏ tới `./src/*`
   - Bật `moduleResolution: "bundler"` và `jsx: "react-jsx"`
   - Hỗ trợ CSS Modules types

3. **Cấu hình Vite (`vite.config.ts`)**:
   - Tích hợp `@vitejs/plugin-react`
   - Cấu hình path alias `@` -> `path.resolve(__dirname, './src')`
   - Cấu hình CSS Modules với camelCase naming (nếu cần) hoặc standard scoped classes
   - Server port mặc định `3000` hoặc `5173`

4. **Khởi tạo file `index.html`**:
   - Thiết lập viewport meta tag hỗ trợ mobile và safe areas: `viewport-fit=cover`
   - Thêm `<meta name="theme-color" content="#0B0D10" id="theme-color-meta" />`
   - Title: `BoardVerse — Premium Board Game Platform`
   - Link CSS Google Fonts (Inter / Cinzel / Playfair hoặc system font stack chất lượng cao)
   - Root container `<div id="root"></div>`

5. **Tạo cấu trúc thư mục rỗng trong `src/`**:
   - `src/shared/theme/`
   - `src/shared/components/`
   - `src/components/Layout/`
   - `src/components/GameCanvas/`
   - `src/pages/`

---

## Tiêu chuẩn nghiệm thu (Acceptance Criteria)
- [ ] Lệnh `npm install` hoặc kiểm tra `package.json` hợp lệ không có conflict.
- [ ] `vite.config.ts` nhận diện đúng alias `@/`.
- [ ] `index.html` có thẻ `meta name="theme-color"` và `viewport-fit=cover`.
- [ ] Cấu trúc thư mục sạch sẽ, sẵn sàng cho các bước tiếp theo.
