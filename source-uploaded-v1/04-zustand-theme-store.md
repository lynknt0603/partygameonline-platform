# Prompt 04: Zustand Theme Store & ThemeProvider DOM Synchronization

## Mục tiêu
Xây dựng **Zustand Theme Store** (`src/shared/theme/useThemeStore.ts`) giữ **state thuần túy** (không có DOM side-effect), và **ThemeProvider** (`src/shared/theme/ThemeProvider.tsx`) là nơi duy nhất chịu trách nhiệm đồng bộ DOM, meta tag, và lắng nghe OS theme changes.

> [!IMPORTANT]
> **Nguyên tắc phân tách trách nhiệm bắt buộc:**
> - `useThemeStore` → chỉ quản lý state (`mode`, `resolvedTheme`) và gọi `setStoredTheme()`. Không được gọi bất kỳ `document.*` nào.
> - `ThemeProvider` → là nơi duy nhất đọc store, tính toán `resolvedTheme`, rồi gọi `applyThemeToDOM()` thông qua `useEffect`.
> - `applyThemeToDOM()` → tiện ích thuần túy trong `theme.storage.ts`, không phụ thuộc React.

---

## Yêu cầu chi tiết cần thực hiện

### 1. Sửa `src/shared/theme/useThemeStore.ts` — State-only store

Store chỉ được làm 3 việc: đọc state khởi tạo, lưu localStorage, cập nhật state:

```typescript
import { create } from 'zustand';
import { ThemeMode, ResolvedTheme, ThemeState } from './theme.types';
import { getStoredTheme, setStoredTheme, resolveTheme } from './theme.storage';

const initialMode: ThemeMode = getStoredTheme() ?? 'system';

export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: initialMode,
  resolvedTheme: resolveTheme(initialMode),

  setTheme: (newMode: ThemeMode) => {
    const newResolved: ResolvedTheme = resolveTheme(newMode);
    setStoredTheme(newMode);
    // Không gọi document.* ở đây — ThemeProvider sẽ xử lý qua useEffect
    set({ mode: newMode, resolvedTheme: newResolved });
  },

  toggleTheme: () => {
    const { resolvedTheme, setTheme } = get();
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  },
}));
```

### 2. Tạo/Sửa `src/shared/theme/ThemeProvider.tsx` — DOM Synchronization Layer

ThemeProvider là **single source of truth** cho tất cả DOM mutations:

```typescript
import React, { useEffect } from 'react';
import { useThemeStore } from './useThemeStore';
import { applyThemeToDOM, resolveTheme } from './theme.storage';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);

  // [1] Đồng bộ DOM & meta tag mỗi khi resolvedTheme thay đổi
  useEffect(() => {
    applyThemeToDOM(resolvedTheme);
  }, [resolvedTheme]);

  // [2] Lắng nghe OS prefers-color-scheme chỉ khi mode === 'system'
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const handleOSChange = () => {
      const { mode, setTheme } = useThemeStore.getState();
      if (mode === 'system') {
        // setTheme('system') tự tính lại resolvedTheme → trigger useEffect [1]
        setTheme('system');
      }
    };

    mq.addEventListener('change', handleOSChange);
    return () => mq.removeEventListener('change', handleOSChange);
  }, []);

  // [3] Áp dụng ngay lần đầu để chặn FOUC (trước khi useEffect chạy)
  // Thực hiện trong theme.storage.ts ở module level (bên ngoài React)
  // Xem hướng dẫn Anti-FOUC bên dưới

  return <>{children}</>;
};
```

### 3. Chống Flash of Unstyled Content (FOUC)

Thêm vào cuối file `src/shared/theme/useThemeStore.ts` (module level, ngoài `create`):

```typescript
// Chạy ngay khi module được load — trước khi React render lần đầu
// Không đặt trong useEffect hay trong store action
if (typeof document !== 'undefined') {
  const { resolvedTheme } = useThemeStore.getState();
  applyThemeToDOM(resolvedTheme);
}
```

### 4. Export từ `src/shared/theme/index.ts`

```typescript
export type { ThemeMode, ResolvedTheme, ThemeState, GameThemeManifest } from './theme.types';
export { getStoredTheme, setStoredTheme, resolveTheme, applyThemeToDOM } from './theme.storage';
export { useThemeStore } from './useThemeStore';
export { ThemeProvider } from './ThemeProvider';
```

---

## Tóm tắt luồng dữ liệu

```
User action
    ↓
setTheme(mode)                ← store (state only)
    ↓ (set state)
resolvedTheme changes         ← Zustand subscription
    ↓ (useEffect in ThemeProvider)
applyThemeToDOM(resolved)     ← DOM mutation (data-theme + meta)
    ↓
CSS Custom Properties update  ← browser re-cascade
    ↓
All components re-render      ← React reads new CSS vars
```

---

## Tiêu chuẩn nghiệm thu (Acceptance Criteria)
- [ ] `useThemeStore.ts` không chứa bất kỳ lời gọi `document.*` nào.
- [ ] `ThemeProvider.tsx` là nơi duy nhất gọi `applyThemeToDOM()`.
- [ ] F5 reload → không có hiện tượng nhấp nháy màu (FOUC).
- [ ] Đổi OS dark/light (khi đang ở mode `system`) → giao diện tự động cập nhật trong vòng 100ms.
- [ ] Thẻ `<meta name="theme-color">` cập nhật đúng: `#0B0D10` (Dark) / `#F5F7F3` (Light).
