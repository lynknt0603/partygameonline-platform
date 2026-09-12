# Hướng Dẫn & Quy Trình Chuẩn (SOP) Tạo Game Mới — BoardVerse

Tài liệu này tổng hợp toàn bộ quy chuẩn kiến trúc và quy trình 7 bước để phát triển và tích hợp một tựa game mới vào nền tảng **BoardVerse (`partygameonline-platform`)**.

---

## 1. Lệnh Tự Động Hóa Scaffolding

Để khởi tạo nhanh chóng toàn bộ khung sườn của một game mới chuẩn TypeScript & Vitest:

```bash
# Từ thư mục gốc dự án:
npm run scaffold:game <game-id> "<Tên Hiển Thị>"

# Ví dụ thực tế:
npm run scaffold:game spyfall "Spyfall (Gián Điệp)"
npm run scaffold:game werewolf "Ma Sói (Werewolf)"
```

Lệnh trên sẽ tự động sinh ra module độc lập tại `apps/web/src/games/<camelCaseId>/`:
- `model/<gameId>Types.ts`: Định nghĩa State, Player, Action Types.
- `model/<gameId>Rules.ts`: Pure Rule Engine & State Transitions (không dính React/DOM).
- `model/<gameId>Rules.test.ts`: Bộ Vitest test cases chuẩn mực (chạy pass ngay).
- `api/<gameId>Api.ts`: HTTP snapshot, action dispatch WebSocket.
- `pages/<GameName>PlayPage.tsx`: Giao diện bàn chơi tương tác kèm Bot mô phỏng client-side.
- `pages/<GameName>PlayPage.module.css`: CSS Modules đáp ứng chuẩn màu thương hiệu Daybreak/Midnight và mobile-first từ 360px.
- `index.ts`: Entrypoint xuất khẩu module.

---

## 2. Quy Trình 7 Bước Chi Tiết (SOP)

### Bước 1: Phân Tích Luật & Hoàn Thiện Data Model (`model/<gameId>Types.ts`)
- Định nghĩa các trạng thái (Phase), thông tin người chơi (`<Game>Player`), view bàn chơi (`<Game>View`), và danh sách các lệnh (`<Game>Command`).

### Bước 2: Xây Dựng Pure Rule Engine (`model/<gameId>Rules.ts`)
- Triển khai 4 hàm cốt lõi:
  1. `init<Game>Game(...)`: Khởi tạo state ban đầu.
  2. `validate<Game>Action(...)`: Kiểm tra quyền và tính hợp lệ của hành động.
  3. `process<Game>Action(...)`: Chuyển đổi trạng thái bất biến (Immutable) và tăng `version`.
  4. `checkVictoryCondition(...)`: Kiểm tra điều kiện kết thúc ván và xác định phe thắng.

### Bước 3: Viết Automated Unit Tests (Vitest) 🛑 GATE 1 (BẮT BUỘC TRƯỚC UI)
- Viết test trong `model/<gameId>Rules.test.ts`.
- Bao phủ: khởi tạo, từ chối hành động sai lượt/sai phase, chuyển phase, kỹ năng nhân vật, và điều kiện thắng/thua.
- Chạy: `npm run test --prefix apps/web` ➔ Phải **PASS 100%**.

### Bước 4: Tích Hợp API Layer & Client Simulation (`api/<gameId>Api.ts`)
- Thiết lập hàm gửi action WebSocket (`send<Game>Command`) và fallback HTTP snapshot (`fetch<Game>Snapshot`).
- Xây dựng fallback danh sách bot mô phỏng để playtest trực tiếp trên frontend.

### Bước 5: Thiết Kế Giao Diện Bàn Chơi UI/UX (`pages/<Game>PlayPage.tsx`)
- Tận dụng CSS Tokens: `var(--bg)`, `var(--surface)`, `var(--brand)`, `var(--on-brand)`, `var(--text)`.
- Touch target tối thiểu **44px x 44px**. Không bị vỡ ở màn hình nhỏ từ **360px**.

### Bước 6: Đăng Ký Vào Platform
1. **Catalog ([`apps/web/src/shared/api/catalog.ts`](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/shared/api/catalog.ts)):** Đăng ký tên, mô tả song ngữ Anh/Việt, số người chơi, và theme bàn chơi.
2. **Routing ([`apps/web/src/pages/GamePage.tsx`](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/pages/GamePage.tsx)):** Gắn route render PlayPage khi `room.gameId === <GAME>_ID`.

### Bước 7: Cổng Kiểm Tra Nghiệm Thu 🛑 GATE 2
```bash
npm run test --prefix apps/web       # Unit tests pass 100%
npm run typecheck --prefix apps/web  # TypeScript 0 errors
npm run build --prefix apps/web      # Production build thành công
```

---

## 3. Vị Trí Cấu Hình Cho AI Agent

Hệ thống Agent Skill đã được cấu hình tự động tại:
- Skill Runbook: [`.agents/skills/create-boardgame/SKILL.md`](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/.agents/skills/create-boardgame/SKILL.md)
- Nguyên tắc dự án: [`GEMINI.md`](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/GEMINI.md) & [`.agents/rules/boardgame-development.md`](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/.agents/rules/boardgame-development.md)
- Tài liệu tham khảo theo từng bước: [`.agents/skills/create-boardgame/references/`](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/.agents/skills/create-boardgame/references/)
