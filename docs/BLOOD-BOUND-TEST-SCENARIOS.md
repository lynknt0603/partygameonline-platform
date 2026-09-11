# Blood Bound (Huyết Thệ) — Kịch Bản Kiểm Thử & Ma Trận Test Case

Tài liệu này chuẩn hóa toàn bộ kịch bản kiểm thử (Test Scenarios), ma trận ca kiểm thử tự động (Automated Test Cases) và quy trình nghiệm thu thực chiến qua Chrome MCP cho trò chơi **Huyết Thệ (Blood Bound)** trên nền tảng **BoardVerse**.

---

## 1. Tổng Quan Ma Trận Kiểm Thử (8 Bug Review Items)

| Mã Kịch Bản | Mức Độ | Nội Dung Lỗi & Mục Tiêu Kiểm Thử | Tầng Kiểm Thử | File Test Thực Thi | Trạng Thái |
| :--- | :---: | :--- | :--- | :--- | :---: |
| **TC-BB-01** | **P1** | Timeout 15s tự động kích hoạt chuyển pha khi hết hạn | Backend (Scheduler + Engine) | `BloodBoundTimeoutSchedulerTests.java` | **PASS** (100%) |
| **TC-BB-02** | **P1** | Chặn ELO tự sinh điểm / delta âm khi loser = 0 | Backend (Elo Policy) | `BloodBoundGameEloPolicyTests.java` | **PASS** (100%) |
| **TC-BB-03** | **P1** | Validate người gửi `PASS_INTERVENTION` (chặn attacker/target/dead) | Backend (Rules Engine) | `BloodBoundGameEngineTests.java` | **PASS** (100%) |
| **TC-BB-04** | **P1** | Token Manh mối `QUESTION` (?) không làm sai lệch đếm distinct | Backend (Rules Engine) | `BloodBoundGameEngineTests.java` | **PASS** (100%) |
| **TC-BB-05** | **P2** | Reset sạch state giữa các phòng khác nhau | Frontend (Hook Model) | `useBloodBoundGame.test.ts` | **PASS** (100%) |
| **TC-BB-06** | **P2** | Suy luận phù hiệu Inquisitor không bị gán nhầm phe Quạt | Frontend (Component/Rules) | `bloodBoundRules.test.ts` | **PASS** (100%) |
| **TC-BB-07** | **P2** | Nhà Giả Kim (Rank 4) & Hộ Vệ (Rank 6) có thể tự chọn bản thân | Frontend (Rules Engine) | `bloodBoundRules.test.ts` | **PASS** (100%) |
| **TC-BB-08** | **P2** | Regex kiểm tra demo room không match nhầm phòng multiplayer thật | Frontend (Page Routing) | `bloodBoundRules.test.ts` | **PASS** (100%) |
| **TC-BB-09** | **P1** | Hộp thoại cảnh báo khi chủ động bấm Thoát phòng ("Bạn sẽ bị loại...") | Frontend (Play Page/Modal) | `bloodBoundRules.test.ts` | **PASS** (100%) |
| **TC-BB-10** | **P1** | Khôi phục phiên khi máy tắt đột ngột & Cửa sổ báo Rejoin ngoài trang chủ | Frontend (Storage/Guard) | `activeGameStorage.test.ts` | **PASS** (100%) |
| **TC-BB-11** | **P1** | Chặn xung đột khi tạo/join phòng khác & 2 lớp xác nhận để out phòng cũ | Frontend (Conflict Guard) | `activeGameStorage.test.ts` | **PASS** (100%) |

---

## 2. Chi Tiết Từng Kịch Bản Kiểm Thử (Detailed Test Specifications)

### TC-BB-01: Bộ Đếm Thời Gian 15 Giây Tự Động (Phase Timeout Scheduler)
* **Vấn đề gốc**: Server sinh `phaseDeadline = now + 15s` khi tấn công nhưng không có background job nào gọi `checkPhaseTimeout()`. Nếu người chơi không bấm Bỏ qua hoặc offline, ván đấu kẹt vĩnh viễn.
* **Kịch bản kiểm thử**:
  1. *Điều kiện tiên quyết*: Ván đấu đang ở pha `INTERVENTION_WINDOW`, `phaseDeadline` là thời điểm quá khứ (`now - 1s`).
  2. *Hành động*: `BloodBoundTimeoutScheduler.tick()` quét các phiên đang hoạt động mỗi giây.
  3. *Kỳ vọng*:
     * Scheduler tự động gửi command `bloodbound-timeout-<roomId>` với payload `{ type: "TIMEOUT" }`.
     * `BloodBoundGameEngine` nhận action, chuyển trạng thái phòng sang `WOUND_ASSIGNMENT`, xóa `phaseDeadline`.
     * Nếu `phaseDeadline` còn hiệu lực (`now + 10s`), scheduler bỏ qua, không dispatch.
* **Mã kiểm thử tự động**:
  * [BloodBoundTimeoutSchedulerTests.java#L40](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/server/src/test/java/com/partygameonline/game/bloodbound/application/BloodBoundTimeoutSchedulerTests.java#L40): `tickDispatchesTimeoutWhenDue()`
  * [BloodBoundTimeoutSchedulerTests.java#L71](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/server/src/test/java/com/partygameonline/game/bloodbound/application/BloodBoundTimeoutSchedulerTests.java#L71): `tickIgnoresWhenDeadlineNotDueOrFinished()`
  * [BloodBoundGameEngineTests.java#L158](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/server/src/test/java/com/partygameonline/game/bloodbound/BloodBoundGameEngineTests.java#L158): `timeoutActionTransitionsInterventionWindowToWoundAssignment()`

---

### TC-BB-02: Bảo Toàn Tổng ELO Bằng 0 Khi Người Thua Ở Mốc 0 ELO (Zero-Sum Clamp)
* **Vấn đề gốc**: Code cũ biến `capacity 0` thành `1`, dẫn đến khi loser có 0 ELO, winner nhận +1 ELO trong khi loser ghi nhận delta -1 nhưng ELO thực tế vẫn là 0, làm lạm phát điểm hệ thống.
* **Kịch bản kiểm thử**:
  1. *Biên 1*: Winner 5000 ELO đấu với Loser 0 ELO.
     * *Kỳ vọng*: `loser.eloDelta = 0`, `loser.newElo = 0`, `winner.eloDelta = 0`, `winner.newElo = 5000`. Tổng delta bằng đúng 0.
  2. *Biên 2*: Đội thua gồm 1 người 0 ELO và 1 người 100 ELO.
     * *Kỳ vọng*: Người 0 ELO delta = 0; người 100 ELO nhận delta âm tương ứng; winner chỉ nhận đúng bằng số điểm bị trừ của người 100 ELO. Tổng delta = 0.
  3. *Biên 3*: Kiểm tra ELO không bao giờ âm khi người thua có 10 ELO và delta lý thuyết > 10.
* **Mã kiểm thử tự động**:
  * [BloodBoundGameEloPolicyTests.java#L219](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/server/src/test/java/com/partygameonline/ranking/application/BloodBoundGameEloPolicyTests.java#L219): `zeroEloLoserDoesNotGenerateFreeEloForWinner()`
  * [BloodBoundGameEloPolicyTests.java#L245](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/server/src/test/java/com/partygameonline/ranking/application/BloodBoundGameEloPolicyTests.java#L245): `mixedZeroAndPositiveEloLosersPreserveZeroSum()`
  * [BloodBoundGameEloPolicyTests.java#L202](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/server/src/test/java/com/partygameonline/ranking/application/BloodBoundGameEloPolicyTests.java#L202): `ratingsNeverDropBelowZero()`

---

### TC-BB-03: Kiểm Thư Tính Hợp Lệ Của Người Bấm Bỏ Qua Can Thiệp (`PASS_INTERVENTION`)
* **Vấn đề gốc**: Bất kỳ người chơi nào (kể cả Kẻ tấn công hoặc Nạn nhân bị nhắm đến) cũng có thể gửi `PASS_INTERVENTION` làm sai lệch logic can thiệp của đồng minh.
* **Kịch bản kiểm thử**:
  1. *Kẻ tấn công (Attacker)* gửi `PASS_INTERVENTION` -> Server từ chối (`CANNOT_INTERVENE`, `valid = false`).
  2. *Nạn nhân (Target)* gửi `PASS_INTERVENTION` -> Server từ chối (`CANNOT_INTERVENE`, `valid = false`).
  3. *Người chơi đã lật Rank (không còn quyền can thiệp)* gửi -> Server từ chối (`CANNOT_INTERVENE`, `valid = false`).
  4. *Người chơi hợp lệ khác* gửi -> Server chấp nhận. Cửa sổ can thiệp chỉ đóng khi tất cả người chơi hợp lệ đều đã pass.
* **Mã kiểm thử tự động**:
  * [BloodBoundGameEngineTests.java#L118](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/server/src/test/java/com/partygameonline/game/bloodbound/BloodBoundGameEngineTests.java#L118): `interventionWindowRequiresAllEligiblePlayersToPass()`

---

### TC-BB-04: Ngăn Ngừa Bỏ Qua Trùng Lặp Khi Có Token Hỏi Chấm (`QUESTION`)
* **Vấn đề gốc**: Vai hề (Harlequin) trao Token `?`. Đếm số lượng token bằng `revealedTokens.size()` thay vì kiểm tra theo từng loại token phân biệt khiến người chơi không chọn được token hợp lệ hoặc bị lừa chọn lại token đã lật.
* **Kịch bản kiểm thử**:
  1. Người chơi sở hữu 1 token `QUESTION`, 1 token `COLOR` (Đỏ) và 1 token `CREST` (Rose).
  2. Người chơi chịu thêm vết thương và cố gắng chọn lại `COLOR` -> Bị từ chối (`TOKEN_ALREADY_REVEALED`).
  3. Người chơi cố gắng chọn lại `CREST` -> Bị từ chối (`TOKEN_ALREADY_REVEALED`).
  4. Người chơi chọn `RANK` (chưa từng lật) -> Hợp lệ và chấp thuận (`valid = true`).
* **Mã kiểm thử tự động**:
  * [BloodBoundGameEngineTests.java#L176](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/server/src/test/java/com/partygameonline/game/bloodbound/BloodBoundGameEngineTests.java#L176): `questionTokenDoesNotBypassClueDuplicatePrevention()`

---

### TC-BB-05: Cô Lập Trạng Thái Game Giữa Các Phòng Khác Nhau (`useBloodBoundGame`)
* **Vấn đề gốc**: Hook client giữ lại cache view/action từ phòng cũ khi chuyển sang `roomId` mới.
* **Kịch bản kiểm thử**:
  1. Khởi tạo hook với `roomId = "room-alpha"`. Đặt trạng thái đang chơi (Round 3, 2 wounds).
  2. Thay đổi prop sang `roomId = "room-beta"`.
  3. *Kỳ vọng*: Toàn bộ state cục bộ (selectedTarget, isIntervening, pendingAbility, activeModal) được reset về default; data snapshot của room mới được fetch độc lập.
* **Mã kiểm thử tự động**:
  * [useBloodBoundGame.test.ts#L45](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/games/bloodBound/model/useBloodBoundGame.test.ts#L45): `resets state when roomId changes`
  * [useBloodBoundGame.test.ts#L70](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/games/bloodBound/model/useBloodBoundGame.test.ts#L70): `does not bleed actions from previous room`

---

### TC-BB-06: Suy Luận Phù Hiệu Inquisitor (`INQUISITOR-CREST`)
* **Vấn đề gốc**: Logic suy luận phân loại phe gán nhầm huy hiệu Phán Xét vào Gia tộc Quạt vì thiếu nhánh xử lý riêng.
* **Kịch bản kiểm thử**:
  1. Người chơi có token `INQUISITOR-CREST`.
  2. Bảng suy luận hiển thị icon biểu trưng Cán Cân Công Lý (`⚖️`), tông màu Vàng Hoàng Kim (`#fbbf24`).
  3. Không hiển thị viền ngọc bích của phe Quạt hoặc hoa hồng của phe Đỏ.
* **Mã kiểm thử tự động**:
  * [bloodBoundRules.test.ts#L330](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/games/bloodBound/model/bloodBoundRules.test.ts#L330): `correctly classifies INQUISITOR crest token`

---

### TC-BB-07: Tự Chọn Bản Thân Cho Kỹ Năng Hồi Máu & Ban Khiên
* **Vấn đề gốc**: Bộ lọc mục tiêu kỹ năng mặc định loại bỏ chính người chơi (`p.playerId !== myId`), khiến Nhà Giả Kim (Rank 4) không thể tự chữa thương cho mình và Hộ Vệ (Rank 6) không thể tự che chắn.
* **Kịch bản kiểm thử**:
  1. `canAbilityTargetSelf(4)` (Alchemist) trả về `true`.
  2. `canAbilityTargetSelf(6)` (Guardian) trả về `true`.
  3. `canAbilityTargetSelf(2)` (Assassin) và `canAbilityTargetSelf(7)` (Berserker) trả về `false`.
  4. `getEligibleAbilityTargets`: Đối với Alchemist, danh sách mục tiêu bao gồm chính mình nếu đang có vết thương > 0, và không chứa người chơi đã bị bắt giữ.
  5. Khi Alchemist áp dụng kỹ năng lên chính mình: vết thương giảm từ 2 xuống 1, ghi log công khai chính xác.
* **Mã kiểm thử tự động**:
  * [bloodBoundRules.test.ts#L589](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/games/bloodBound/model/bloodBoundRules.test.ts#L589): `Alchemist (Rank 4) can target self and is included in eligible targets`
  * [bloodBoundRules.test.ts#L598](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/games/bloodBound/model/bloodBoundRules.test.ts#L598): `Alchemist actually heals own wound when applying ability to self`
  * [bloodBoundRules.test.ts#L614](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/games/bloodBound/model/bloodBoundRules.test.ts#L614): `Guardian (Rank 6) can target self to grant shield`

---

### TC-BB-08: Phân Định Demo Room Bằng Biểu Thức Chính Quy Chặt Chẽ
* **Vấn đề gốc**: Code sử dụng `roomId.includes("blood-bound")` dẫn tới các phòng nhiều người thật (ví dụ `blood-bound-tournament-1`) bị ép chuyển sang chế độ Demo Bot Client thay vì kết nối server.
* **Kịch bản kiểm thử**:
  1. Các định danh demo hợp lệ: `"demo"`, `"demo-blood-bound"`, `"demo-huyet-the"`, `"demo_crimson_vow_session"` -> Trả về `true`.
  2. Các phòng multiplayer thật: `"blood-bound-1"`, `"bloodbound-room-42"`, `"room-blood-bound"`, `"LCHU5PTV"` -> Trả về `false`.
  3. Phòng của game khác: `"demo-nob-1"`, `"demo-not-in-my-pot"` -> Trả về `false`.
* **Mã kiểm thử tự động**:
  * [bloodBoundRules.test.ts#L635](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/games/bloodBound/model/bloodBoundRules.test.ts#L635): `matches exact demo room identifiers`
  * [bloodBoundRules.test.ts#L645](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/games/bloodBound/model/bloodBoundRules.test.ts#L645): `matches demo- or demo_ prefix with Blood Bound keywords`
  * [bloodBoundRules.test.ts#L652](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/games/bloodBound/model/bloodBoundRules.test.ts#L652): `does NOT match real multiplayer rooms that merely contain the game name`

---

### TC-BB-09: Hộp Thoại Cảnh Báo Khi Chủ Động Thoát Phòng (Leave Room Confirm Guard)
* **Vấn đề gốc**: Người chơi bấm nhầm nút Thoát khi ván đấu đang diễn ra làm mất dữ liệu trận đấu hoặc vô tình bỏ cuộc.
* **Kịch bản kiểm thử**:
  1. Khi đang trong trận multiplayer (không phải Demo và chưa `GAME_OVER`), bấm nút [🚪 Thoát].
  2. *Kỳ vọng*:
     * Hệ thống KHÔNG lập tức chuyển trang mà mở `ConfirmDialog` với thông báo:
       `"Bạn sẽ bị loại khỏi game nếu tiếp tục. Bạn có chắc chắn muốn thoát phòng?"`
     * Nếu bấm **[Ở lại]**: Hộp thoại đóng, người chơi tiếp tục ván đấu bình thường.
     * Nếu bấm **[Xác nhận thoát]**: Gọi API `leaveRoom()`, xóa active game cache `clearActiveGame()`, điều hướng về `/rooms`.
     * Trong phòng demo hoặc khi ván đấu đã kết thúc (`phase === "GAME_OVER"`), cho phép thoát trực tiếp không cần xác nhận loại.
* **Mã kiểm thử tự động**:
  * [bloodBoundRules.test.ts#L672](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/games/bloodBound/model/bloodBoundRules.test.ts#L672): `Blood Bound Room Leave / Guard Rules - determines whether exit confirmation is required`

---

### TC-BB-10: Khôi Phục Phiên Khi Máy Tắt Đột Ngột & Cửa Sổ Báo Rejoin Ngoài Trang Chủ
* **Vấn đề gốc**: Máy tính người chơi bị mất điện / tắt đột ngột hoặc tắt nhầm tab trình duyệt. Người chơi không bấm "Thoát" nhưng không biết cách vào lại hoặc bị hệ thống xóa khỏi phòng ngay lập tức.
* **Kịch bản kiểm thử**:
  1. Khi trận đấu đang diễn ra tại phòng `ROOM_CODE`, lưu cache phiên `saveActiveGame({ roomId, gameId, gameTitle })`.
  2. Người chơi bị tắt máy/đóng tab đột ngột (không gọi `clearActiveGame`).
  3. *Trường hợp A (Vào lại bằng link cũ `/play/:roomId`)*:
     * Token phiên trong `localStorage` được giữ nguyên.
     * WebSocket kết nối lại, nhận snapshot bàn cờ, đúng ghế và thẻ bài của người chơi.
     * Trong lúc vắng mặt, người chơi không bị xóa khỏi phòng; nếu hết thời gian thao tác (15s timeout), hệ thống tự chuyển pha để ván đấu tiếp diễn mà không kẹt.
  4. *Trường hợp B (Mở lại trang chủ hoặc trang ngoài `/rooms`)*:
     * Hệ thống tự động bật **cửa sổ modal popup ("Trận đấu đang diễn ra!")** thông báo có ván dở tại `ROOM_CODE`.
     * Cung cấp nút **[Vào lại chơi tiếp]** (chuyển thẳng tới `/play/:roomId`) và nút **[Thoát ván đấu]** (mở cảnh báo bị loại trước khi xóa ván).
     * Nút **[Để sau]** cho phép tạm đóng modal để xem trang chủ, nhưng thanh banner cảnh báo vẫn ghim trên đỉnh trang.
* **Mã kiểm thử tự động**:
  * [activeGameStorage.test.ts#L79](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/shared/state/activeGameStorage.test.ts#L79): `crash recovery & abandon lifecycle - preserves active game session on simulated browser crash/restart`

---

### TC-BB-11: Chặn Xung Đột Khi Tạo / Tham Gia Phòng Khác (Active Match Conflict Protection)
* **Vấn đề gốc**: Đang có ván đấu dở dang nhưng người chơi cố tạo phòng mới hoặc join vào một phòng khác làm hỏng state hai phòng cùng lúc.
* **Kịch bản kiểm thử**:
  1. Người chơi đang trong phòng `ROOM_A`.
  2. Tại trang Rooms, người chơi cố:
     * Bấm [Tạo phòng mới]
     * Hoặc nhập mã phòng `ROOM_B` bấm [Vào phòng]
     * Hoặc bấm nút [Tham gia] trên danh sách phòng `ROOM_B`
     * Hoặc truy cập trực tiếp URL `/rooms/ROOM_B`.
  3. *Kỳ vọng*:
     * Hệ thống chặn hành động và mở `ActiveGameConflictDialog`:
       `"Bạn đang có một ván đấu chưa kết thúc tại phòng ROOM_A. Bạn phải vào lại chơi tiếp hoặc thoát hẳn phòng cũ trước khi..."`
     * Bấm **[Vào lại phòng cũ (ROOM_A)]**: Điều hướng vào lại `/play/ROOM_A`.
     * Bấm **[Thoát hẳn phòng cũ & Tiếp tục]**: Mở tiếp `ConfirmDialog` xác nhận *"Bạn sẽ bị loại khỏi game nếu tiếp tục..."*. Chỉ khi người chơi chọn "Xác nhận thoát" thì hệ thống mới out phòng cũ và tạo/join phòng mới.
* **Mã kiểm thử tự động**:
  * [activeGameStorage.test.ts#L46](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/shared/state/activeGameStorage.test.ts#L46): `checkActiveGameConflict - returns true when player tries to create a new room or join a different room`

---

## 3. Kịch Bản Kiểm Thử Trực Tiếp Trên Trình Duyệt Qua Chrome MCP

Kịch bản end-to-end (E2E) thực chiến với 6 người chơi trên Web UI:

```
[BƯỚC 1] Khởi Động 6 Isolated Contexts
 ├── Tab 1 (Host / Player_1): Context Mặc định -> http://localhost:5173/play/LCHU5PTV?token=<token_1>
 ├── Tab 2 (Player_2): Context "player_2"      -> http://localhost:5173/play/LCHU5PTV?token=<token_2>
 ├── Tab 3 (Player_3): Context "player_3"      -> http://localhost:5173/play/LCHU5PTV?token=<token_3>
 ├── Tab 4 (Player_4): Context "player_4"      -> http://localhost:5173/play/LCHU5PTV?token=<token_4>
 ├── Tab 5 (Player_5): Context "player_5"      -> http://localhost:5173/play/LCHU5PTV?token=<token_5>
 └── Tab 6 (Player_6): Context "player_6"      -> http://localhost:5173/play/LCHU5PTV?token=<token_6>

[BƯỚC 2] Pha Tấn Công & Nhắm Mục Tiêu
 ├── Player 1 (Cầm Đoản Kiếm) bấm nút [⚔️ Tấn Công] Player 3 trên giao diện bàn cờ.
 └── Chuyển pha: INTERVENTION_WINDOW (Server đếm ngược 15 giây).

[BƯỚC 3] Kiểm Thử Can Thiệp & Timeout Tự Động
 ├── UI các người chơi khác hiển thị thông báo chiến sự + nút [Nhảy Vào Đỡ Đòn!] và [Bỏ Qua].
 └── Không bấm gì -> Hết 15 giây, timeout scheduler tự kích hoạt, đòn đánh trúng đích.

[BƯỚC 4] Lựa Chọn Token Bị Thương (Wound Modal)
 ├── Player 3 mở modal chịu vết thương thứ 1: chọn lộ [Màu Đỏ 🌹].
 ├── Bàn cờ lập tức cập nhật token 🔴 Đỏ trên ghế Player 3; Đoản Kiếm chuyển sang Player 3.

[BƯỚC 5] Phản Công & Điều Tra Thủ Lĩnh
 ├── Player 3 tấn công Player 6 (Thủ Lĩnh Quạt).
 ├── Player 6 chịu vết thương: chọn lộ [🛡️ FAN-CREST] ở vòng 4 và [🟢 Xanh] ở vòng 6.
 └── Thông tin hiển thị rõ ràng: Player 6 có 2/4 vết thương, lộ 2 manh mối.
```

---

## 4. Lệnh Chạy Toàn Bộ Bộ Test (Verification Commands)

```bash
# 1. Chạy toàn bộ Unit Test Backend (bao gồm TimeoutScheduler, EloPolicy, GameEngine)
./mvnw test -Dtest=*BloodBound* --file apps/server/pom.xml

# 2. Chạy toàn bộ Unit Test Frontend (bao gồm Rules, Hook, Bot, Cheatsheet, Audio)
npm test --prefix apps/web

# 3. Kiểm tra kiểu dữ liệu TypeScript nghiêm ngặt
npm run typecheck --prefix apps/web

# 4. Kiểm tra đóng gói Production Bundle
npm run build --prefix apps/web
```

---
*Tài liệu được cập nhật tự động và đồng bộ với phiên bản mã nguồn mới nhất của BoardVerse Platform.*
