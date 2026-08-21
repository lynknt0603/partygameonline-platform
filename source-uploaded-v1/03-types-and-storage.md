# Prompt 03: Theme Types Definition & Safe LocalStorage Helper

## Mục tiêu
Tạo định nghĩa TypeScript Types và module xử lý `localStorage` an toàn để lưu trữ và truy xuất sở thích giao diện của người dùng (`system`, `light`, `dark`).

---

## Yêu cầu chi tiết cần thực hiện

1. **Tạo file `src/shared/theme/theme.types.ts`**:
   - Khai báo các types theo chuẩn thiết kế:
   ```typescript
   export type ThemeMode = "system" | "light" | "dark";

   export type ResolvedTheme = "light" | "dark";

   export interface ThemeState {
     mode: ThemeMode;
     resolvedTheme: ResolvedTheme;
     setTheme: (mode: ThemeMode) => void;
     toggleTheme: () => void; // Tiện ích chuyển đổi nhanh qua lại giữa light/dark
   }

   /**
    * Game Theme Manifest Contract
    * Cho phép từng tựa game độc lập định nghĩa phong cách đồ họa canvas
    * mà không bị Platform Theme chi phối ép buộc.
    */
   export interface GameThemeManifest {
     id: string;
     name: string;
     prefersDarkCanvas?: boolean; // Nếu true, Canvas luôn duy trì tông tối (VD: Gothic, Space)
     hudVariant?: "platform" | "game"; // HUD kế thừa Platform Theme hay theo Game Theme
     className?: string; // Tùy chọn class CSS bổ trợ
   }
   ```

2. **Tạo file `src/shared/theme/theme.storage.ts`**:
   - Định nghĩa key lưu trữ `THEME_STORAGE_KEY = "boardverse_theme_preference"`
   - Viết các hàm tiện ích có try-catch bọc quanh `localStorage` (tránh crash khi người dùng bật chế độ ẩn danh hoặc chặn cookie):
     - `getStoredTheme(): ThemeMode | null`: Đọc dữ liệu từ `localStorage`. Nếu không có hoặc giá trị không hợp lệ (không thuộc `system | light | dark`), trả về `null`.
     - `setStoredTheme(mode: ThemeMode): void`: Lưu giá trị hợp lệ vào `localStorage`.
     - `getSystemTheme(): ResolvedTheme`: Kiểm tra `window.matchMedia('(prefers-color-scheme: dark)').matches` để trả về `"dark"` hoặc `"light"`. Có kiểm tra môi trường an toàn (nếu chạy không có `window`).
     - `resolveTheme(mode: ThemeMode): ResolvedTheme`: Nếu `mode === "system"`, gọi `getSystemTheme()`, ngược lại trả về chính xác `mode`.

---

## Tiêu chuẩn nghiệm thu (Acceptance Criteria)
- [ ] Type definitions chặt chẽ, không dùng `any`.
- [ ] Module `theme.storage.ts` xử lý an toàn mọi lỗi phát sinh từ `localStorage` hoặc SSR.
- [ ] Hàm `resolveTheme` tính toán chính xác giữa `system` (theo OS) và giá trị chỉ định thủ công (`light`/`dark`).
