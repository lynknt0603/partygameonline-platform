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
| **TC-BB-12** | **P0** | Hỗ trợ phòng tối đa 16 người chơi & Chốt chặn biên sức chứa (2-16P) | Full-stack (Backend + UI) | `verify-game-flow.mjs` (TC-07..10) | **PASS** (100%) |
| **TC-BB-13** | **P0** | Kích hoạt & Phân bổ 4 vai trò cấp cao (Ranks 5, 6, 7, 8) và SVG assets | Full-stack (Engine + Assets) | `verify-game-flow.mjs` (TC-25) | **PASS** (100%) |
| **TC-BB-14** | **P1** | Responsive Table Layout (bán kính elip 43x36, scale thẻ ghế 0.68 khi > 12P) | Frontend (Table & Cards) | `BloodBoundTable.tsx` | **PASS** (100%) |
| **TC-BB-15** | **P1** | Cấu hình thời gian lượt chơi linh hoạt (15s, 20s, 30s, 45s) | Full-stack (Settings + Timer) | `verify-game-flow.mjs` (TC-11..14) | **PASS** (100%) |
| **TC-BB-16** | **P2** | Trình sinh tên phòng ngẫu nhiên tiếng Việt & Nút xúc xắc Reroll | Frontend (Rooms Page) | `RoomsPage.tsx` | **PASS** (100%) |
| **TC-BB-17** | **P0** | Quản lý Bot trong Sảnh, Chốt chặn đầy phòng 16P (409) & Thiếu người (409) | Backend (Room + Bot Service) | `verify-game-flow.mjs` (TC-15..19) | **PASS** (100%) |
| **TC-BB-18** | **P1** | Cơ chế Phù Hiệu (Crest) & Sổ tay Cheatsheet giải thích Thật / Giả | Frontend (Cheatsheet / Docs) | `BloodBoundCheatsheet.tsx` | **PASS** (100%) |
| **TC-BB-19** | **P0** | Bộ kiểm thử tự động Headless E2E Token-Saver (`npm run test:flow`) | Platform CLI & Automation | `verify-game-flow.mjs` (29 TCs) | **PASS** (100%) |

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

### TC-BB-12: Hỗ Trợ Phòng Tối Đa 16 Người Chơi & Chốt Chặn Biên Sức Chứa
* **Vấn đề gốc**: Trước đây hệ thống giới hạn tối đa 12 người chơi. Cần mở rộng sức chứa lên 16 người cho game Huyết Thệ và thiết lập chốt chặn biên bảo vệ.
* **Kịch bản kiểm thử**:
  1. Tạo phòng với `maxPlayers = 16` -> Server chấp thuận, room có sức chứa 16 ghế.
  2. Tạo phòng với `maxPlayers = 2` (< min 4) -> Bị từ chối với HTTP 400 `INVALID_MAX_PLAYERS`.
  3. Tạo phòng với `maxPlayers = 20` (> max 16) -> Bị từ chối với HTTP 400 `VALIDATION_FAILED`.
  4. Người chơi đang là host không thể tạo thêm phòng thứ hai -> HTTP 409 `ALREADY_IN_ROOM`.
* **Mã kiểm thử tự động**:
  * [verify-game-flow.mjs](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/scripts/verify-game-flow.mjs): `TC-07`, `TC-08`, `TC-09`, `TC-10a`, `TC-10b`.

---

### TC-BB-13: Kích Hoạt & Phân Bổ 4 Vai Trò Cấp Cao (Ranks 5, 6, 7, 8)
* **Vấn đề gốc**: Khi chơi dưới 10 người, các nhân vật cấp cao như Thuật Sĩ (Mentalist - 5), Hộ Vệ (Guardian - 6), Cuồng Nộ (Berserker - 7), Kỹ Nữ (Courtesan - 8) không xuất hiện. Khi nâng lên 16 người, toàn bộ bộ bài 16 lá của cả hai phe Hoa Hồng và Quạt phải được kích hoạt đầy đủ kèm assets đồ họa chuẩn Dark Gothic.
* **Kịch bản kiểm thử**:
  1. Ván đấu 16 người: bộ bài gồm chính xác 8 thẻ Rose (Ranks 1..8) và 8 thẻ Fan (Ranks 1..8).
  2. Các nhân vật cấp cao được chia cho người chơi:
     * Rank 5: Thuật Sĩ (Mentalist) — soi 2 manh mối ẩn của đối thủ.
     * Rank 6: Hộ Vệ (Guardian) — ban khiên bảo vệ bất tử 1 đòn.
     * Rank 7: Cuồng Nộ (Berserker) — phản đòn ép kẻ tấn công chịu 1 vết thương.
     * Rank 8: Kỹ Nữ (Courtesan) — thao túng mục tiêu tấn công của lượt sau.
  3. Kiểm tra file SVG vector chất lượng cao: `apps/web/public/assets/games/blood-bound/roles/{rose,fan}/role-{5,7,8}.svg`.
* **Mã kiểm thử tự động**:
  * [verify-game-flow.mjs](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/scripts/verify-game-flow.mjs): `TC-23`, `TC-25`.

---

### TC-BB-14: Bố Cục Bàn Đấu Co Giãn Tự Động (Responsive Table Scaling)
* **Vấn đề gốc**: Khi có tới 16 người chơi trên bàn đấu, nếu dùng bán kính elip cũ, các thẻ ghế sẽ bị đè chồng lên nhau hoặc tràn ra khỏi màn hình. Ngược lại trên màn hình desktop lớn, giao diện dễ bị khoảng đen hoang vắng.
* **Kịch bản kiểm thử**:
  1. Khi `totalSeats <= 12`: Bán kính elip mặc định `radiusX = 40`, `radiusY = 32`, scale thẻ ghế `scale = 0.85` (hoặc 1.0).
  2. Khi `totalSeats > 12` (13 - 16 người):
     * Bán kính tự động mở rộng: `radiusX = 43`, `radiusY = 36`.
     * Tỷ lệ thẻ ghế tự động thu gọn: `scale = 0.68` để đảm bảo 16 ghế phân bổ đều đặn, không chạm nhau.
     * Container bàn chơi mở rộng `width: min(1120px, 94vw)` triệt tiêu khoảng đen thừa.
* **Mã kiểm thử**:
  * [BloodBoundTable.tsx](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/games/bloodBound/components/BloodBoundTable.tsx).

---

### TC-BB-15: Cấu Hình Thời Gian Lượt Chơi Linh Hoạt (15s, 20s, 30s, 45s)
* **Vấn đề gốc**: Ván đấu 16 người cần nhiều thời gian suy luận hơn (30s hoặc 45s), nhưng giao diện phòng trước đây bị khóa cứng 15s hoặc 20s.
* **Kịch bản kiểm thử**:
  1. Tại Sảnh chờ phòng, Host chọn chip thời gian `30s` hoặc `45s`.
  2. Host lưu cài đặt: `PUT /api/v1/rooms/{id}/settings` cập nhật `{ bloodBound: { turnSeconds: 45, interventionSeconds: 15 } }`.
  3. Kiểm tra query `GET /api/v1/rooms/{id}`: `turnSeconds` trả về đúng 45s và `interventionSeconds` duy trì 15s.
* **Mã kiểm thử tự động**:
  * [verify-game-flow.mjs](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/scripts/verify-game-flow.mjs): `TC-11`, `TC-12`, `TC-13`, `TC-14`.

---

### TC-BB-16: Trình Sinh Tên Phòng Ngẫu Nhiên Tiếng Việt & Reroll Xúc Xắc
* **Vấn đề gốc**: Người chơi phải tự nhập tên phòng thủ công, dễ gây nhàm chán hoặc trùng lặp, và khi đổi tựa game thì tên phòng không đổi theo.
* **Kịch bản kiểm thử**:
  1. Mở modal Tạo phòng mới: trường tên phòng tự động được điền sẵn một cái tên ma mị tiếng Việt (ví dụ: *"Lâu Đài Huyết Nguyệt"*, *"Thánh Địa Ám Ảnh"*, *"Mật Viện Quạt Xanh"*...).
  2. Bấm nút xúc xắc [🎲 Đổi tên]: tên phòng lập tức đổi sang một tên ngẫu nhiên khác.
  3. Chọn đổi sang game khác (ví dụ: *Thỏ Tìm Cà Rốt* hoặc *Vạc Phù Thủy*): tên phòng tự động thay đổi theo phong cách của tựa game mới.
* **Mã kiểm thử**:
  * [RoomsPage.tsx](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/pages/RoomsPage.tsx).

---

### TC-BB-17: Quản Lý Bot Trong Sảnh & Chốt Chặn Biên Phòng Đầy / Thiếu Người
* **Vấn đề gốc**: Cần kiểm soát chặt chẽ việc thêm bot, đuổi bot và kiểm tra các giới hạn số người trước khi bắt đầu trận.
* **Kịch bản kiểm thử**:
  1. Thêm bot qua `POST /api/v1/rooms/{id}/bot` với body `{ botType: "NORMAL" }` -> Thành công.
  2. Đuổi bot qua `POST /api/v1/rooms/{id}/kick/{botId}` -> Bot bị xóa khỏi danh sách, giải phóng ghế.
  3. Nạp 15 bots để đạt tối đa 16/16 ghế -> Thành công.
  4. Cố thêm người/bot thứ 17 khi phòng đã đầy 16 người -> Server từ chối với HTTP 409 `ROOM_FULL`.
  5. Cố bắt đầu ván khi phòng mới có 1 người -> Server từ chối với HTTP 409 `NOT_ENOUGH_PLAYERS`.
* **Mã kiểm thử tự động**:
  * [verify-game-flow.mjs](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/scripts/verify-game-flow.mjs): `TC-15`, `TC-16`, `TC-17`, `TC-18`, `TC-19`.

---

### TC-BB-18: Cơ Chế Phù Hiệu (Crest) & Sổ Tay Cheatsheet Giải Thích Thật / Giả
* **Vấn đề gốc**: Người chơi mới dễ nhầm lẫn giữa Token Màu (Color Token), Phù Hiệu (Crest Token) và Cấp số (Rank Token), không rõ loại nào có thể bị Tắc Kè Hoa (Harlequin) làm giả.
* **Kịch bản kiểm thử**:
  1. Mở Sổ tay Hướng dẫn / Cheatsheet tab bên phải bàn cờ.
  2. Hiển thị mục chuyên sâu `🛡️ Phù Hiệu (Crest) Là Gì & Cơ Chế Thật / Giả?`:
     * **Token Màu (Color)**: Có thể bị Tắc Kè Hoa (Rank 3) làm giả (lộ màu ngược với phe thật).
     * **Phù Hiệu Gia Tộc (Crest)**: **100% SỰ THẬT**, không thể làm giả. Cầm phù hiệu nào thì chắc chắn thuộc gia tộc đó.
     * **Cấp Số (Rank)**: 100% sự thật cấp bậc.
  3. Bảng so sánh trực quan với icon và màu sắc tương phản cao.
* **Mã kiểm thử**:
  * [BloodBoundCheatsheet.tsx](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/apps/web/src/games/bloodBound/components/BloodBoundCheatsheet.tsx).

---

### TC-BB-19: Bộ Kiểm Thử Tự Động Headless E2E Token-Saver (`npm run test:flow`)
* **Vấn đề gốc**: Mỗi lần kiểm tra hồi quy bằng Browser Subagent tiêu tốn 50.000 - 80.000 tokens và mất 2 - 3 phút.
* **Kịch bản kiểm thử**:
  1. Chạy `npm run test:flow`.
  2. Toàn bộ 29 Test Cases được thực thi tự động qua API trong 1.5 - 7 giây.
  3. Báo cáo ngắn gọn tiêu hao ~150 tokens cho AI.
  4. Hỗ trợ chạy riêng từng suite: `--suite=catalog`, `--suite=auth`, `--suite=rooms`, `--suite=timers`, `--suite=lobby`, `--suite=gameplay`, `--suite=cleanup`.
* **Mã kiểm thử tự động**:
  * [verify-game-flow.mjs](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/scripts/verify-game-flow.mjs) & [.agents/skills/verify-game-flow/SKILL.md](file:///c:/Users/HUNG/.kiro/crew/workspace/boardgames/.agents/skills/verify-game-flow/SKILL.md).

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
# 1. Chạy bộ kiểm thử tự động Headless E2E Flow (29 Test Cases - Tiết kiệm Token)
npm run test:flow

# Hoặc chạy riêng từng Suite chuyên biệt:
node scripts/verify-game-flow.mjs --suite=catalog
node scripts/verify-game-flow.mjs --suite=timers
node scripts/verify-game-flow.mjs --suite=lobby
node scripts/verify-game-flow.mjs --suite=gameplay

# 2. Chạy toàn bộ Unit Test Backend (bao gồm TimeoutScheduler, EloPolicy, GameEngine)
./mvnw test -Dtest=*BloodBound* --file apps/server/pom.xml

# 3. Chạy toàn bộ Unit Test Frontend (bao gồm Rules, Hook, Bot, Cheatsheet, Audio)
npm test --prefix apps/web

# 4. Kiểm tra kiểu dữ liệu TypeScript nghiêm ngặt
npm run typecheck --prefix apps/web

# 5. Kiểm tra đóng gói Production Bundle
npm run build --prefix apps/web
```

---
*Tài liệu được cập nhật tự động và đồng bộ với phiên bản mã nguồn mới nhất của BoardVerse Platform.*

