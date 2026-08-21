# Project memory

Đọc thư mục này **trước** khi làm tiếp, đặc biệt khi phiên mới / context gần đầy (~500k).

Không nhồi toàn bộ prompt pack vào đây. Chỉ giữ quyết định đã chốt, trạng thái code, và việc còn dở.

| File | Dùng khi |
| --- | --- |
| `DECISIONS.md` | Luật đã chốt, đừng hỏi lại |
| `SESSION.md` | Snapshot phiên gần nhất |
| `NEXT.md` | Việc tiếp theo |

Cách cập nhật:

1. Cuối phiên (hoặc khi context đầy): ghi lại quyết định mới + việc còn dở vào 3 file này.
2. Đầu phiên mới: đọc 3 file, rồi mới mở prompt/source.
3. Giữ ngắn. Nếu một file > ~200 dòng, tách thêm file theo chủ đề, đừng viết tiểu thuyết.
