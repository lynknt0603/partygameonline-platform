# Hướng Dẫn: Thiết Kế Logic & State Machine Cho Board Game

Tài liệu chi tiết thuộc kỹ năng [create-boardgame](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/.agents/skills/create-boardgame/SKILL.md).

---

## 1. Nguyên Tắc Thiết Kế Trạng Thái (State Model)

Một trò chơi nhiều người chơi thời gian thực luôn cần phân biệt rõ hai loại dữ liệu:
1. **Server Master State (Toàn vẹn & Bí mật):** Chứa tất cả thông tin thực tế của toàn bộ người chơi (ví dụ: bài bí mật của từng người, vai trò thực sự, lá bài trong chồng rút).
2. **Player Game View (Góc nhìn riêng tư của từng người):** Chỉ chứa các thông tin công khai + thông tin bí mật mà người chơi đó có quyền được biết.

Trong cấu trúc `apps/web/src/games/<gameId>/`:
- File `model/<gameId>Types.ts` định nghĩa `<Game>View` đại diện cho góc nhìn nhận được từ Server hoặc Client Simulator.
- Luôn có thuộc tính `you: string` (playerId của người đang xem màn hình).
- Luôn có thuộc tính `version: number` (tăng tuần tự sau mỗi hành động thành công để chống race condition).

---

## 2. Chu Trình Vòng Lặp State Machine (Deterministic Transitions)

```
[Current State] + [Action Command] ──(validate)──> [Valid?]
                                                        │
                                                        ├── NO  ──> Throw Error / Return { valid: false }
                                                        └── YES ──> (process) ──> [Next State (New Version)]
```

### Mã Mẫu State Transition Chuẩn

```typescript
export function processPlayerTurn(
  view: MyGameView,
  playerId: string,
  command: MyGameCommand,
): MyGameView {
  // 1. Kiểm tra tính hợp lệ
  const check = validatePlayerTurn(view, playerId, command);
  if (!check.valid) {
    throw new Error(check.reason);
  }

  // 2. Clone state bất biến (Shallow clone + deep clone mảng/đối tượng thay đổi)
  const nextPlayers = view.players.map((p) => {
    if (p.playerId === command.targetPlayerId) {
      return { ...p, wounds: p.wounds + 1 };
    }
    return p;
  });

  // 3. Kiểm tra điều kiện chuyển phase hoặc kết thúc ván
  const victory = checkVictoryCondition({ ...view, players: nextPlayers });
  const nextPhase = victory.finished ? "GAME_OVER" : getNextPhase(view.phase);

  // 4. Trả về state mới với version tăng 1
  return {
    ...view,
    version: view.version + 1,
    phase: nextPhase,
    players: nextPlayers,
    winnerPlayerIds: victory.winnerPlayerIds,
    publicLogs: [
      `Người chơi ${playerId} đã tấn công ${command.targetPlayerId}`,
      ...view.publicLogs.slice(0, 49),
    ],
  };
}
```

---

## 3. Quản Lý Thời Gian & Đếm Ngược (Timing Invariants)

- **Không bao giờ nhúng `setInterval` hay `setTimeout` vào trong Rule Engine.**
- State chỉ lưu `timeRemainingSeconds` hoặc timestamp hết hạn `phaseEndTimeIso`.
- Giao diện (React Component) hoặc Server Scheduler sẽ là nơi chạy timer và gửi command `TIMEOUT` hoặc cập nhật tick countdown lên UI.
