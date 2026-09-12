# Hướng Dẫn: Viết Automated Unit Tests Với Vitest Cho Board Game

Tài liệu chi tiết thuộc kỹ năng [create-boardgame](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/.agents/skills/create-boardgame/SKILL.md).

---

## 1. Mục Đích & Tầm Quan Trọng Của Testing Gate

Board game có các quy tắc tương tác chéo phức tạp:
- Ai được hành động vào lúc nào?
- Khi nào được can thiệp (reaction/interrupt)?
- Các lá bài đặc biệt thay đổi luật chơi ra sao?
- Điều kiện thắng phức tạp (bắt đúng mục tiêu vs bắt nhầm đồng minh).

Nếu không có unit test trước khi dựng UI, việc debug qua giao diện sẽ cực kỳ tốn thời gian và dễ bỏ sót lỗi nghiêm trọng. Do đó, **100% logic phải có test tự động và pass sạch trước khi viết UI**.

---

## 2. Các Nhóm Test Cases Tiêu Chuẩn Phải Có

File test: `apps/web/src/games/<gameId>/model/<gameId>Rules.test.ts`.

### Nhóm 1: Test Khởi Tạo (Initialization)
- Kiểm tra số lượng người chơi (tối thiểu, tối đa).
- Kiểm tra phân phối vai trò hoặc bài bí mật đảm bảo công bằng.
- Kiểm tra quyền ưu tiên lượt đầu tiên (ai giữ kiếm/người chơi số 1).

### Nhóm 2: Test Action Validation (Biên & Từ chối)
- Người chơi hành động khi chưa tới lượt ➔ `valid === false`.
- Tấn công chính mình hoặc người đã bị loại ➔ `valid === false`.
- Gửi lệnh sai phase (ví dụ bỏ phiếu khi đang ở phase thảo luận) ➔ `valid === false`.

### Nhóm 3: Test State Transitions & Role Abilities
- Hành động hợp lệ ➔ State cập nhật chính xác (vết thương tăng, thẻ bài lộ diện, lá bài chuyển tay).
- Năng lực đặc biệt:
  - Khiên đỡ đòn (Guardian Shield) ➔ Sát thương bị hấp thụ.
  - Phản đòn (Assassin Revenge) ➔ Gây sát thương ngược lại.
  - Can thiệp (Intervention Window) ➔ Thay đổi mục tiêu bị tấn công.

### Nhóm 4: Test Điều Kiện Thắng / Thua (End Game)
- Điều kiện thắng thông thường (Đội A tiêu diệt Thủ lĩnh Đội B).
- Điều kiện phạt / thua ngược (Bắt nhầm nhân vật mồi bẫy hoặc bắt nhầm đồng minh).
- Đảm bảo khi game kết thúc: `finished === true`, `winnerPlayerIds` chứa đúng danh sách người chiến thắng.

---

## 3. Lệnh Chạy Kiểm Thử

```bash
# Chạy toàn bộ test suites trong workspace
npm run test

# Chạy riêng lẻ test của game mới
npm run test -- apps/web/src/games/<gameId>

# Chạy test ở chế độ watch khi đang code
cd apps/web && npm run test:watch
```
