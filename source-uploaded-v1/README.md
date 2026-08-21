# 📜 Bộ Prompt Triển khai Theme System (Daybreak Table & Midnight Table)

Chào bạn! Thư mục này chứa toàn bộ các file prompt được phân rã khoa học, rõ ràng và chi tiết theo từng bước để bạn giao cho model **Gemini** (hoặc bất kỳ AI nào) thực hiện lập trình từng phần mà không lo bị quá tải ngữ cảnh hay thiếu sót tính năng.

---

## 🧭 Hướng dẫn sử dụng với Gemini

Khi bắt đầu phiên làm việc mới với Gemini, hãy thực hiện theo quy trình 8 bước dưới đây:

| Bước | File Prompt | Mục đích chính | Lời khuyên khi gửi cho Gemini |
| :---: | :--- | :--- | :--- |
| **0** | [`00-overview-and-architecture.md`](./00-overview-and-architecture.md) | Nắm kiến trúc tổng quan & quy chuẩn | Gửi ở đầu phiên để AI hiểu toàn bộ bức tranh kiến trúc |
| **1** | [`01-project-scaffolding.md`](./01-project-scaffolding.md) | Khởi tạo cấu trúc Vite + React + TS + PixiJS | Yêu cầu AI tạo các file config (`package.json`, `vite.config.ts`, `index.html`) |
| **2** | [`02-css-design-tokens.md`](./02-css-design-tokens.md) | Định nghĩa toàn bộ CSS Variables 2 Theme | Đảm bảo AI tạo đúng toàn bộ mã màu `--brand`, `--surface`, `--bg` |
| **3** | [`03-types-and-storage.md`](./03-types-and-storage.md) | Viết TypeScript types & LocalStorage helper | Tạo nền tảng type an toàn cho store |
| **4** | [`04-zustand-theme-store.md`](./04-zustand-theme-store.md) | Tạo Zustand Theme Store & ThemeProvider | Xử lý logic đồng bộ DOM `[data-theme]` và OS event |
| **5** | [`05-theme-toggle-components.md`](./05-theme-toggle-components.md) | Tạo nút chuyển nhanh & bảng cài đặt | Xây dựng `ThemeQuickToggle` và `AppearanceSettings` |
| **6** | [`06-app-shell-and-navigation.md`](./06-app-shell-and-navigation.md) | Xây dựng Layout AppShell, Header, Mobile Nav | Ghép nối các trang mẫu (Lobby, Settings, GameRoom) |
| **7** | [`07-pixijs-canvas-bridge.md`](./07-pixijs-canvas-bridge.md) | Tích hợp PixiJS v8 Canvas & Theme Bridge | Đảm bảo tính độc lập giữa đồ họa game và platform theme |
| **8** | [`08-accessibility-and-verification.md`](./08-accessibility-and-verification.md) | Tối ưu A11y, Badge trạng thái & Checklist | Chạy kiểm thử xác nhận 100% tiêu chí đề ra |

---

## 💡 Mẹo khi làm việc với Gemini
1. **Làm tuần tự từng file**: Không nên dán gộp nhiều file prompt cùng lúc. Hãy để Gemini hoàn thành và xác nhận từng bước trước khi sang bước tiếp theo.
2. **Kiểm tra output**: Sau mỗi bước, kiểm tra xem Gemini có tạo đúng file vào đúng đường dẫn trong cấu trúc thư mục đã quy định hay không.
3. **Khi cần sửa lỗi**: Nếu có lỗi phát sinh, hãy tham khảo lại các tiêu chuẩn nghiệm thu (Acceptance Criteria) ở cuối mỗi file prompt để yêu cầu Gemini tinh chỉnh.
