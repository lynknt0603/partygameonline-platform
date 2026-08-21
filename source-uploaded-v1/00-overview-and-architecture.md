# Theme System Architecture & Execution Overview

Tài liệu này cung cấp toàn cảnh kiến trúc, quy chuẩn thiết kế, và lộ trình từng bước để phát triển hệ thống Theme (**Daybreak Table** & **Midnight Table**) cho nền tảng **Board Game Online Platform**.

---

## 1. Công nghệ & Thư viện sử dụng
- **Core Framework**: React 18+ với TypeScript
- **Bundler & Dev Server**: Vite
- **State Management**: Zustand
- **Canvas / Game Rendering Engine**: PixiJS v8 (`pixi.js`)
- **Styling**: CSS Modules + CSS Custom Properties (Design Tokens)
- **Icons**: `lucide-react`

---

## 2. Cấu trúc thư mục dự án mục tiêu

```text
partygameonline-platform/
├── prompts/                         # Bộ file prompt phân rã theo bước
│   ├── 00-overview-and-architecture.md
│   ├── 01-project-scaffolding.md
│   ├── 02-css-design-tokens.md
│   ├── 03-types-and-storage.md
│   ├── 04-zustand-theme-store.md
│   ├── 05-theme-toggle-components.md
│   ├── 06-app-shell-and-navigation.md
│   ├── 07-pixijs-canvas-bridge.md
│   └── 08-accessibility-and-verification.md
│
├── src/
│   ├── shared/
│   │   ├── theme/                   # Theme Core System
│   │   │   ├── theme.types.ts       # Type definitions (ThemeMode, ResolvedTheme, GameThemeManifest)
│   │   │   ├── theme.storage.ts     # LocalStorage access & fallback safe logic
│   │   │   ├── theme.css            # Root CSS Tokens (Daybreak & Midnight tokens)
│   │   │   ├── useThemeStore.ts     # Zustand store quản lý theme & OS event listener
│   │   │   ├── ThemeProvider.tsx    # React component wrapper đồng bộ DOM & meta tag
│   │   │   └── themeBridge.ts       # Cầu nối CSS variables -> PixiJS Color / Engine
│   │   │
│   │   └── components/              # Shared UI components
│   │       ├── ThemeQuickToggle/    # Quick toggle icon (Desktop / Header)
│   │       │   ├── ThemeQuickToggle.tsx
│   │       │   └── ThemeQuickToggle.module.css
│   │       ├── AppearanceSettings/  # Settings Radio Options (System, Light, Dark)
│   │       │   ├── AppearanceSettings.tsx
│   │       │   └── AppearanceSettings.module.css
│   │       └── StatusBadge/         # Accessible Status Badges (Text + Icon)
│   │           ├── StatusBadge.tsx
│   │           └── StatusBadge.module.css
│   │
│   ├── components/
│   │   ├── Layout/
│   │   │   ├── AppShell.tsx         # Shell bao bọc Header, Content, Mobile Nav
│   │   │   ├── AppShell.module.css
│   │   │   ├── Header.tsx           # Desktop topbar (Logo, Nav Links, Theme Toggle, Profile)
│   │   │   ├── Header.module.css
│   │   │   ├── BottomNav.tsx        # Mobile bottom navigation bar (Safe area support)
│   │   │   └── BottomNav.module.css
│   │   │
│   │   └── GameCanvas/
│   │       ├── BoardCanvas.tsx      # PixiJS Canvas wrapper container
│   │       ├── BoardCanvas.module.css
│   │       └── usePixiApp.ts        # Custom hook khởi tạo Pixi v8 an toàn
│   │
│   ├── pages/
│   │   ├── LobbyPage.tsx            # Trang mẫu danh sách game & phòng chơi
│   │   ├── GameRoomPage.tsx         # Trang mẫu phòng chơi tích hợp Pixi Canvas + React HUD
│   │   └── SettingsPage.tsx         # Trang cài đặt giao diện (Appearance)
│   │
│   ├── App.tsx                      # Root App kết nối ThemeProvider và Navigation
│   ├── main.tsx                     # Vite entrypoint
│   └── index.css                    # Base resets & font setups
│
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 3. Bản sắc 2 Theme (Visual Identity)

### 🌞 DAYBREAK TABLE (Light Theme)
- **Cảm giác**: Tươi mới, hiện đại, thoáng đãng, ấm áp, đậm chất bàn cờ cao cấp ban ngày.
- **Màu nền**: Nền ngà ấm mềm mại (`#F5F7F3`), thẻ card trắng sạch (`#FFFFFF`), bề mặt phụ màu xám xô thơm dịu (`#EFF4F0`).
- **Điểm nhấn**: Xanh mòng két / teal (`#3D9C8C`) cho tương tác; Vàng champagne (`#B88A3D`) cho thương hiệu.
- **Màu chữ**: Xanh than đậm dịu mắt (`#202824`), tránh dùng màu đen nguyên chất `#000000`.

### 🌙 MIDNIGHT TABLE (Dark Theme)
- **Cảm giác**: Sang trọng, tĩnh lặng, điện ảnh, câu lạc bộ board game đêm, chi tiết vàng cổ điển.
- **Màu nền**: Xám than chì rất đậm (`#0B0D10` - KHÔNG dùng `#000000`), bề mặt card graphite `#14181D`, bề mặt phụ `#181E25`.
- **Điểm nhấn**: Vàng cổ điển (`#C9A45C`) dùng có chừng mực (chỉ cho thương hiệu, highlight quan trọng, rank, achievement, nút chính).
- **Màu chữ**: Trắng ngà ấm (`#F2EEE5`), chữ phụ xám bạc `#AEB6C2`.

---

## 4. Nguyên tắc Theme Platform vs Game Canvas (PixiJS)
1. **Platform Theme $\neq$ Game Theme**: Nền tảng có thể chuyển đổi giữa Light/Dark mode, nhưng bàn cờ và artwork trong game (ví dụ: Gothic Dark Fantasy) được phép giữ thẩm mỹ riêng thông qua `GameThemeManifest`.
2. **Shared HUD kế thừa Platform Theme**: Các thanh công cụ chung như nút đóng, cài đặt, khung chat, danh sách người chơi, hộp thoại thoát phòng sẽ tuân theo Platform Theme hiện tại.

---

## 5. Lộ trình thực hiện từng bước (Step-by-Step Prompts)
Khi bắt đầu code, hãy thực hiện tuần tự các file prompt:
- **Bước 1**: `01-project-scaffolding.md` (Khởi tạo project, package.json, vite.config.ts)
- **Bước 2**: `02-css-design-tokens.md` (File CSS tokens Daybreak & Midnight)
- **Bước 3**: `03-types-and-storage.md` (Typescript Interfaces & LocalStorage helper)
- **Bước 4**: `04-zustand-theme-store.md` (Zustand store & ThemeProvider DOM sync)
- **Bước 5**: `05-theme-toggle-components.md` (Component Quick Toggle & Settings Panel)
- **Bước 6**: `06-app-shell-and-navigation.md` (Layout AppShell, Header, Mobile Nav)
- **Bước 7**: `07-pixijs-canvas-bridge.md` (Tích hợp PixiJS Canvas & Theme Bridge)
- **Bước 8**: `08-accessibility-and-verification.md` (Accessibility, Safe-area, Verification)
