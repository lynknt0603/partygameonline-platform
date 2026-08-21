# Prompt 05: Theme Switcher & Appearance Settings Components

## Mục tiêu
Xây dựng 2 component chuyển đổi giao diện trực quan, đẹp mắt và tiện dụng:
1. **Desktop / Mobile Quick Toggle** (`ThemeQuickToggle`): Nút chuyển nhanh tại Header / Topbar với icon và tooltip trạng thái rõ ràng.
2. **Appearance Settings Panel** (`AppearanceSettings`): Bảng điều khiển chọn 3 chế độ (**System**, **Light**, **Dark**) dạng Radio Cards với màu preview trực quan cho trang Cài đặt (Settings).

---

## Yêu cầu chi tiết cần thực hiện

1. **Tạo component `ThemeQuickToggle`**:
   - Vị trí: `src/shared/components/ThemeQuickToggle/ThemeQuickToggle.tsx`
   - Style: `src/shared/components/ThemeQuickToggle/ThemeQuickToggle.module.css`
   - Hành vi:
     - Hiển thị icon tương ứng với theme hiện tại (`Sun` cho Light / Daybreak, `Moon` cho Dark / Midnight, hoặc `Laptop/Monitor` khi đang ở chế độ System).
     - Tuyệt đối không để icon mù mờ: Có tooltip hoặc nhãn hiển thị rõ tên theme đang kích hoạt (VD: `Theme: Daybreak Table (Light)` hoặc `Theme: Midnight Table (Dark)`).
     - Khi click: Có thể chuyển đổi nhanh vòng lặp hoặc chuyển giữa Light / Dark, hoặc mở menu nhỏ chọn 3 mode.
     - Hỗ trợ phím tắt hoặc focus outline rõ ràng (`aria-label="Switch visual theme"`).

2. **Tạo component `AppearanceSettings`**:
   - Vị trí: `src/shared/components/AppearanceSettings/AppearanceSettings.tsx`
   - Style: `src/shared/components/AppearanceSettings/AppearanceSettings.module.css`
   - Thiết kế dạng **3 Option Cards / Radio Group**:
     - **Option 1: System (Theo hệ thống)**
       - Icon: `Monitor`
       - Tiêu đề: `System Default`
       - Mô tả: Tự động điều chỉnh theo cài đặt giao diện của thiết bị (`prefers-color-scheme`).
     - **Option 2: Light (Daybreak Table)**
       - Icon: `Sun`
       - Tiêu đề: `Daybreak Table (Light)`
       - Mô tả: Giao diện sáng ấm ngà, thanh lịch, thẻ card trắng sạch với điểm nhấn xanh mòng két & vàng champagne.
       - Visual Swatch: Thẻ preview nhỏ hiển thị màu `#F5F7F3`, `#FFFFFF`, `#3D9C8C`, `#B88A3D`.
     - **Option 3: Dark (Midnight Table)**
       - Icon: `Moon`
       - Tiêu đề: `Midnight Table (Dark)`
       - Mô tả: Giao diện tối cao cấp, điện ảnh, nền than chì tĩnh lặng với điểm nhấn vàng cổ điển.
       - Visual Swatch: Thẻ preview nhỏ hiển thị màu `#0B0D10`, `#14181D`, `#C9A45C`, `#F2EEE5`.
   - Card được chọn phải có đường viền nổi bật bằng màu `--brand`, icon tích chọn (`CheckCircle2`), và nền `--brand-soft`.

---

## Tiêu chuẩn nghiệm thu (Acceptance Criteria)
- [ ] `ThemeQuickToggle` hiển thị chuẩn icon và nhãn aria trên thanh điều hướng.
- [ ] `AppearanceSettings` hiển thị đầy đủ 3 lựa chọn trực quan, click chuyển mode tức thì và lưu vào store.
- [ ] CSS hoàn toàn sử dụng semantic tokens (`var(--surface)`, `var(--brand)`, `var(--text-primary)`,...).
- [ ] Giao diện responsive tốt trên cả mobile lẫn màn hình desktop lớn.
