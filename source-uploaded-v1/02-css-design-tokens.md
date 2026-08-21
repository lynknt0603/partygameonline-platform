# Prompt 02: Semantic Design Tokens & CSS Theme System

## Mục tiêu
Tạo file CSS Design Tokens toàn cục (`src/shared/theme/theme.css` và `src/index.css`) chứa đầy đủ các biến CSS cho 2 giao diện:
1. **Daybreak Table (Light Theme)**: `[data-theme="light"]`
2. **Midnight Table (Dark Theme)**: `[data-theme="dark"]`
Đồng thời thiết lập các hiệu ứng chuyển đổi mượt mà (smooth scoped transition), hỗ trợ Safe Area di động và tiêu chuẩn Accessibility focus.

---

## Yêu cầu chi tiết cần thực hiện

1. **Tạo file `src/shared/theme/theme.css`**:
   - Định nghĩa chính xác các biến CSS theo đúng đặc tả:

   ### 🌙 Midnight Table (`[data-theme="dark"]` và default fallback):
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

     --theme-name: "Midnight Table";
   }
   ```

   ### 🌞 Daybreak Table (`[data-theme="light"]`):
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

     --theme-name: "Daybreak Table";
   }
   ```

2. **Scoped Theme Transitions (Quy tắc chuyển theme mượt mà)**:
   - Áp dụng transition có chọn lọc (scoped) để tránh giật lag hoặc repaint toàn bộ DOM:
   ```css
   body,
   .app-shell,
   .theme-surface,
   .theme-card,
   .theme-header,
   .theme-nav {
     transition:
       background-color 180ms ease,
       color 180ms ease,
       border-color 180ms ease,
       box-shadow 180ms ease;
   }
   ```
   - **LƯU Ý**: KHÔNG dùng `* { transition: all 180ms }`.

3. **Safe Area & Viewport Variables**:
   - Khai báo các biến CSS an toàn cho mobile:
   ```css
   :root {
     --sat: env(safe-area-inset-top, 0px);
     --sab: env(safe-area-inset-bottom, 0px);
     --sal: env(safe-area-inset-left, 0px);
     --sar: env(safe-area-inset-right, 0px);
   }
   ```

4. **Tạo file `src/index.css` (Base Styles & Accessibility Focus)**:
   - Import `./shared/theme/theme.css`
   - Reset box-sizing, font-family, line-height
   - Đặt nền mặc định: `background-color: var(--bg); color: var(--text-primary);`
   - Thiết lập focus indicator theo chuẩn Accessibility:
   ```css
   :focus-visible {
     outline: 2px solid var(--brand);
     outline-offset: 3px;
   }
   ```

---

## Tiêu chuẩn nghiệm thu (Acceptance Criteria)
- [ ] Khi gán `data-theme="light"` trên thẻ `<html>`, toàn bộ biến CSS chuyển sang giá trị của Daybreak Table.
- [ ] Khi gán `data-theme="dark"`, toàn bộ biến CSS chuyển sang giá trị của Midnight Table.
- [ ] Không có màu nào bị hardcode trực tiếp ngoài các biến CSS.
- [ ] Transition nhẹ nhàng 180ms trên các thành phần bề mặt, không giật lag.
