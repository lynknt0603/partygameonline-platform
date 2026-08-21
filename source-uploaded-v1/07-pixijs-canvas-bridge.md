# Prompt 07: PixiJS Canvas Integration & Theme Bridge

## Mục tiêu
Tích hợp engine đồ họa **PixiJS v8** vào React để render bàn cờ game, đồng thời triển khai **Theme Bridge** và **Game Theme Contract** (`GameThemeManifest`). Đảm bảo nguyên tắc cốt lõi: **Giao diện Platform (HUD, Chat, Menu) kế thừa theme nền tảng, nhưng đồ họa Game Canvas giữ vững bản sắc nghệ thuật độc lập**.

---

## Yêu cầu chi tiết cần thực hiện

1. **Tạo module `themeBridge.ts` (`src/shared/theme/themeBridge.ts`)**:
   - Sử dụng `Color` từ `pixi.js` (hoặc parser hex-to-number) để trích xuất các biến CSS của Platform thành số màu PixiJS (`0xRRGGBB`):
   ```typescript
   import { Color } from 'pixi.js';

   export interface PixiThemeColors {
     bg: number;
     surface: number;
     brand: number;
     border: number;
     accent: number;
     textPrimary: number;
   }

   export function extractPixiThemeColors(element: HTMLElement = document.documentElement): PixiThemeColors {
     const styles = getComputedStyle(element);
     const get = (varName: string, fallback: string) => {
       const val = styles.getPropertyValue(varName).trim() || fallback;
       try {
         return new Color(val).toNumber();
       } catch {
         return new Color(fallback).toNumber();
       }
     };

     return {
       bg: get('--bg', '#0B0D10'),
       surface: get('--surface', '#14181D'),
       brand: get('--brand', '#C9A45C'),
       border: get('--border', '#303844'),
       accent: get('--accent', '#3D9C8C'),
       textPrimary: get('--text-primary', '#F2EEE5'),
     };
   }
   ```

2. **Tạo hook `usePixiApp` (`src/components/GameCanvas/usePixiApp.ts`)**:
   - Khởi tạo `Application` bất đồng bộ (`await app.init(...)` theo chuẩn Pixi v8).
   - Xử lý cơ chế dọn dẹp (Teardown) an toàn để không bị rò rỉ WebGL context khi React 18 mount/unmount kép trong dev mode (`StrictMode`).
   - Tự động gắn kết kích thước với DOM container (`resizeTo: containerRef.current`).

3. **Tạo component `BoardCanvas` (`src/components/GameCanvas/BoardCanvas.tsx`)**:
   - Nhận prop `manifest: GameThemeManifest`.
   - Nếu `manifest.prefersDarkCanvas === true`:
     - Canvas nền tối cố định (`0x0E1015`), render hiệu ứng bảng cờ Gothic Dark (bảo toàn nghệ thuật của game).
   - Nếu `manifest.prefersDarkCanvas === false`:
     - Canvas sử dụng `backgroundAlpha: 0` (trong suốt) hoặc lấy màu từ `themeBridge` để hòa hợp hoàn hảo với Daybreak Table / Midnight Table.
   - Vẽ một bàn cờ tương tác mẫu (Lưới ô cờ 8x8 hoặc bản đồ chiến thuật, một vài token quân cờ có thể click và có animation nhấp nháy/hover).
   - Lắng nghe sự thay đổi của Platform Theme để tự động vẽ lại các đường viền/token highlight nếu game sử dụng màu của platform.

4. **Tích hợp HUD Overlay (React Layer)**:
   - Đặt trên cùng của Canvas với `pointer-events: none` ở container và `pointer-events: auto` ở các nút tương tác:
     - Nút `Leave Game` (sử dụng `--danger`)
     - Thanh trạng thái lượt chơi `Turn: Player 1`
     - Nút `Game Settings / Theme Quick Toggle`
     - Khung Chat mini

---

## Tiêu chuẩn nghiệm thu (Acceptance Criteria)
- [ ] PixiJS v8 khởi tạo mượt mà, render canvas đúng kích thước container và tự resize khi cửa sổ thay đổi.
- [ ] Khi chuyển đổi Platform Theme sang Daybreak Table (Light):
  - Game có `prefersDarkCanvas: true` (ví dụ Gothic Bloodlines) vẫn duy trì đồ họa huyền bí tối màu trên Canvas, nhưng thanh HUD (nút thoát, chat, menu) tự động thích ứng với theme sáng.
  - Game có `prefersDarkCanvas: false` tự động đổi màu bàn cờ ăn khớp với Daybreak Table.
- [ ] Không có lỗi rò rỉ WebGL Context hoặc crash khi unmount component.
