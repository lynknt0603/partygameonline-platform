# Hướng Dẫn: Thiết Kế Giao Diện Bàn Chơi UI/UX & Theme Tokens

Tài liệu chi tiết thuộc kỹ năng [create-boardgame](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/.agents/skills/create-boardgame/SKILL.md).

---

## 1. Hệ Thống CSS Tokens Của Nền Tảng

Tất cả các thành phần giao diện game phải sử dụng các biến CSS tùy biến (CSS Custom Properties) do hệ thống cung cấp trong `apps/web/src/shared/theme/theme.css`:

| Token | Ý Nghĩa Trong Giao Diện Game |
| :--- | :--- |
| `var(--bg)` | Nền canvas hoặc toàn bộ màn hình bàn chơi |
| `var(--surface)` | Bề mặt thẻ bài, khay điều khiển HUD, panel người chơi |
| `var(--surface-hover)` | Trạng thái hover của các thẻ hoặc ô chọn |
| `var(--border-subtle)` | Viền thẻ, đường phân cách giữa các ghế |
| `var(--brand)` | Màu nhấn thương hiệu, highlight người đang có lượt, nút hành động chính |
| `var(--on-brand)` | Màu chữ hiển thị TRÊN nền `--brand` (đảm bảo độ tương phản AA) |
| `var(--text)` | Màu chữ chính (tiêu đề, tên người chơi) |
| `var(--text-muted)` | Màu chữ phụ (trạng thái, chú thích nhỏ, thời gian) |

---

## 2. Tiêu Chuẩn Hiển Thị 2 Theme (Daybreak vs Midnight)

Nền tảng hỗ trợ 2 theme:
- **🌞 Daybreak Table (Light Theme):** Bàn chơi ban ngày sáng sủa, ấm áp (`--bg: #F5F7F3`). Chữ chính là xanh than đậm `#202824`.
- **🌙 Midnight Table (Dark Theme):** Bàn chơi đêm sang trọng, huyền bí (`--bg: #0B0D10`). Chữ chính là trắng ngà `#F2EEE5`.

> [!WARNING]
> Không bao giờ dùng màu teal/gold làm màu chữ nhỏ trên nền trắng vì không đạt chuẩn tương phản AA. Khi tạo button có nền `--brand`, luôn đặt chữ là `var(--on-brand, #202824)`.

---

## 3. Quy Chuẩn Bố Cục Mobile-First (Đáp Ứng Từ 360px)

1. **Chiều rộng tối thiểu 360px:** Sử dụng `clamp()`, `minmax()` hoặc CSS Grid linh hoạt để bàn chơi không bị tràn ngang hoặc che khuất nút trên iPhone SE / Android nhỏ.
2. **Kích thước vùng chạm (Touch Targets):** Tất cả các nút bấm, lá bài click chọn phải có kích thước tối thiểu **44px x 44px**.
3. **Chế độ Fullscreen Game View:** Route `/play/:roomId` tự động bỏ thanh điều hướng dưới đáy (`BottomNav`), giúp game có tối đa không gian hiển thị bàn chơi.
