# Prompt 08: Accessibility Enhancements & Full Verification Checklist

## Mục tiêu
Hoàn thiện các yêu cầu về **Khả năng tiếp cận (Accessibility - A11y)**, kiểm soát độ tương phản màu sắc, hiển thị trạng thái không phụ thuộc hoàn toàn vào màu sắc (**Status Badges**), và thực hiện quy trình kiểm thử toàn diện (Verification Checklist) cho toàn bộ hệ thống Theme.

---

## Yêu cầu chi tiết cần thực hiện

1. **Xây dựng component `StatusBadge` (`src/shared/components/StatusBadge/StatusBadge.tsx` & `.module.css`)**:
   - Tuân thủ nguyên tắc A11y: **Không truyền tải trạng thái chỉ bằng màu sắc đơn thuần**.
   - Các biến thể trạng thái:
     - `ready`: Icon `CheckCircle2` + Chữ `✓ Ready` + Màu `--success`
     - `not_ready`: Icon `CircleDot` + Chữ `○ Waiting` + Màu `--text-muted`
     - `in_game`: Icon `Swords` + Chữ `⚔ In Game` + Màu `--brand`
     - `disconnected`: Icon `AlertCircle` + Chữ `⚠ Disconnected` + Màu `--danger`
   - Hiển thị thử nghiệm trong danh sách người chơi tại `LobbyPage` và `GameRoomPage`.

2. **Kiểm tra & Chuẩn hóa Độ tương phản (Color Contrast Ratios - WCAG AA)**:
   - **Midnight Table**:
     - `--text-primary` (`#F2EEE5`) trên `--bg` (`#0B0D10`) -> Tỉ lệ tương phản $\ge 14:1$ (Đạt chuẩn AAA).
     - `--brand` (`#C9A45C`) trên `--surface` (`#14181D`) -> Đạt chuẩn AA cho UI elements.
   - **Daybreak Table**:
     - `--text-primary` (`#202824`) trên `--bg` (`#F5F7F3`) -> Tỉ lệ tương phản $\ge 12:1$ (Đạt chuẩn AAA).
     - `--accent` (`#3D9C8C`) và `--brand` (`#B88A3D`) trên `--surface` (`#FFFFFF`) -> Đạt chuẩn AA cho văn bản và nút bấm.

3. **Cập nhật Script khởi động & Kiểm tra trong `package.json`**:
   - Đảm bảo `npm run build` và `npm run preview` chạy mượt mà không có bất kỳ cảnh báo hoặc lỗi TypeScript / CSS nào.

4. **Kịch bản kiểm thử toàn diện (E2E Verification Checklist)**:
   Hãy chạy ứng dụng và kiểm tra lần lượt 7 tiêu chí sau:

   - [ ] **1. Chuyển đổi thủ công (Manual Switch)**:
     - Chuyển sang `Light` -> Nền chuyển sang ngà ấm (`#F5F7F3`), thẻ trắng, điểm nhấn xanh teal và vàng champagne.
     - Chuyển sang `Dark` -> Nền chuyển sang xám than chì (`#0B0D10`), thẻ xám tối, điểm nhấn vàng cổ điển.
   - [ ] **2. Lưu trữ bền vững (Persistence)**:
     - Đang ở chế độ `Light` hoặc `Dark`, nhấn `F5` tải lại trang -> Theme được giữ nguyên lập tức, không bị giật nháy màn hình.
   - [ ] **3. Chế độ Hệ thống (System Preference)**:
     - Chọn `System` -> Đổi cài đặt Theme của Windows / macOS / Android / iOS -> Giao diện BoardVerse tự động thay đổi theo ngay lập tức mà không cần reload.
   - [ ] **4. Thẻ Meta Browser Theme Color**:
     - Mở DevTools kiểm tra thẻ `<meta name="theme-color">` -> Đổi giá trị tương ứng (`#0B0D10` cho Dark, `#F5F7F3` cho Light) để thanh địa chỉ trình duyệt mobile khớp màu hoàn hảo.
   - [ ] **5. Độc lập PixiJS Game Canvas**:
     - Mở trang `GameRoomPage`, đổi qua lại giữa Light và Dark -> Đồ họa bàn cờ Gothic vẫn giữ nền nghệ thuật riêng, trong khi thanh HUD (nút thoát, chat, avatar) đổi màu theo platform theme.
   - [ ] **6. Safe Area trên Mobile**:
     - Giả lập iPhone có tai thỏ / thanh điều hướng dưới đáy trong Chrome DevTools -> Bottom Nav và Header không bị che khuất nội dung.
   - [ ] **7. Khả năng tiếp cận & Focus Indicator**:
     - Dùng phím `Tab` để di chuyển qua các nút -> Viền outline màu vàng `--brand` (`2px solid`) xuất hiện rõ nét trên cả 2 theme.

---

## Tiêu chuẩn nghiệm thu cuối cùng (Final Acceptance)
- [ ] Toàn bộ 7 mục kiểm thử trong checklist đều đạt kết quả mong muốn.
- [ ] Ứng dụng sẵn sàng mở rộng cho các game khác trên nền tảng.
