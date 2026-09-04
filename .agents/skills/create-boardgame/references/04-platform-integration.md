# Hướng Dẫn: Tích Hợp Game Vào Hệ Thống Nền Tảng (Platform Integration)

Tài liệu chi tiết thuộc kỹ năng [create-boardgame](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/.agents/skills/create-boardgame/SKILL.md).

---

## 1. Đăng Ký Catalog Game (`apps/web/src/shared/api/catalog.ts`)

Mở file [`catalog.ts`](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/shared/api/catalog.ts) và thêm bản ghi cấu hình trong đối tượng `PRESENTATION`:

```typescript
const PRESENTATION: Record<string, Presentation> = {
  // ... các game hiện tại
  "<kebab-game-id>": {
    displayName: "Game Name",
    displayNameVi: "Tên Tiếng Việt Của Game",
    genre: "Deduction • Bluffing",
    genreVi: "Suy luận • Ẩn vai",
    summary: "English short summary describing the gameplay.",
    summaryVi: "Tóm tắt ngắn gọn lối chơi bằng tiếng Việt.",
    durationMin: 15,
    durationMax: 30,
    theme: {
      id: "<kebab-game-id>-theme",
      name: "Theme Name",
      prefersDarkCanvas: true, // Đặt true nếu game có phong cách bàn đêm, gothic
      hudVariant: "platform",
    },
  },
};
```

---

## 2. Gắn Routing Điều Hướng (`apps/web/src/pages/GamePage.tsx`)

Mở file [`GamePage.tsx`](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/pages/GamePage.tsx):

```typescript
// 1. Import ID và PlayPage từ module game mới
import { <GAME_ID>, <Game>PlayPage } from "@/games/<gameId>";

// 2. Thêm điều kiện render trong nhánh room.status === "in_game"
if (room.gameId === <GAME_ID>) {
  return (
    <>
      <ConnectionStatusBadge />
      <<Game>PlayPage roomId={roomId} room={room} />
    </>
  );
}
```

---

## 3. Thêm Tùy Chọn Cài Đặt Phòng (Tùy chọn tại `RoomSettingsPanel.tsx`)

Nếu game có các cài đặt thời gian đặc thù (như thời gian thảo luận, thời gian rút bài), bổ sung preset và state tương ứng trong [`RoomSettingsPanel.tsx`](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/pages/RoomSettingsPanel.tsx).

---

## 4. Kiểm Thử Toàn Diện Bộ 3 Lệnh (The Triple Check)

Sau khi tích hợp xong, luôn chạy 3 lệnh sau để đảm bảo không phá vỡ bất kỳ thành phần nào của dự án:

```bash
# 1. Toàn bộ tests pass
npm run test --prefix apps/web

# 2. Không có lỗi kiểu dữ liệu TypeScript
npm run typecheck --prefix apps/web

# 3. Build production bundle thành công
npm run build --prefix apps/web
```
