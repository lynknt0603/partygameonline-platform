# Session snapshot — 2026-08-22

## Bloodline Faction Cards Updated & Standardized (PNG 1024x1536)

- Toàn bộ ảnh thân phận vẽ mới (`vampire-01..05`, `werewolf-01..05`, `halfblood`) đã được chuyển đổi sang chuẩn `.png` độ phân giải `1024x1536` (tỉ lệ 2:3).
- Đồng bộ hoàn toàn với code manifest (`nobAssetManifest.ts`), logic game và giao diện web.
- Đã test `typecheck` và `build` thành công 100%, push lên nhánh `dev`.

## Game Over UI & Lobby Enhancements

- Cải tiến giao diện kết thúc ván (`GameOver`): vinh danh người thắng (winner medal/crest), hiển thị danh sách người thắng, điểm số, nút chơi lại (`Play Again`) và rời phòng.
- Cập nhật tài nguyên UI NOB (`apps/web/public/assets/games/nob/ui/`): huy hiệu người thắng (`winner-medal`), huân chương kết thúc ván (`over-crest`), mặt sau thẻ Bloodline (`bloodline-card-back.png`).
- Tối ưu Lobby: Host mặc định ở trạng thái sẵn sàng, ẩn nút Ready thừa cho host, chỉ hiển thị nút Bắt đầu khi các người chơi khác đã sẵn sàng.
- Commit & push lên nhánh `dev`.

## Direct Card Frame Reconstruction (Night of Bloodlines)

- Phát hiện nguyên nhân gốc: Một số thẻ bài (`Blood Seer 3–6` và `Shapeshifter 4–6`) trong source gốc vốn được vẽ với khung vòm cao (tall arch) không có huy hiệu tròn ở đỉnh (top medallion) và khung viền khác biệt so với khung chuẩn (`Hunter`, `Shadow Stalker`, `Feral Killer`).
- Sửa trực tiếp từng file ảnh:
  - Ghép khung chuẩn (Master Role Card Template) hoàn chỉnh với huy hiệu tròn biểu tượng đỉnh (Eye cho Blood Seer, Masks cho Shapeshifter).
  - Vòm gothic chuẩn uốn cong dưới huy hiệu đỉnh (arch peak tại `y ≈ 215`).
  - Đặt tranh minh họa gốc vào đúng cửa sổ vòm chuẩn.
  - Tích hợp banner tên đá ("BLOOD SEER", "SHAPESHIFTER") và huy hiệu khiên vàng cấp độ 1–6 tương ứng.
- Đã kiểm tra qua contact sheet 33 lá và đối chiếu với ảnh chụp thực tế của user.
- Commit & push lên nhánh `dev`.

## README & GitHub repository init & push

- Added full project documentation and README to `README.md` (purpose, architecture, tech stack, setup instructions).
- Added `description` to `package.json` and `apps/web/package.json`.
- Initialized git repo, added remote `origin` -> `https://github.com/lynknt0603/partygameonline-platform.git`, and pushed branch `main`.

# Session snapshot — 2026-08-20

## Bug: Start game → màn đen

Nguyên nhân:
1. `GAME_STARTED` gửi `NobView` (`myHand`), GamePage ép `DemoView` rồi `view.hand.map` → crash React.
2. `NobPlayPage` CSS grid + `::before` chiếm hết cell, HUD bị đẩy ra ngoài 100dvh.

Fix: parse `NobView` riêng, CSS overlay `position:absolute`, render `myDraftHand`/`myHand` + bloodline từ server.

# Session snapshot — 2026-08-20 (NOB assets)

## NOB artwork module (M1–M3 shell)

Read `D:\night of bloodline\README.md` + `evd/promt.txt`. Source art is READ-ONLY.

- Copied cards/bloodlines/branding into `apps/web/public/assets/games/nob/` (PNG).
- Moon Mark sheet cropped to 2/3/4.
- Mapping: `docs/nob-asset-mapping.md`
- Module: `src/games/nob/` — manifest, helpers, NobCard, gothic NobPlayPage.
- `GamePage` routes `night-of-bloodlines` to NobPlayPage (no demo Pixi).
- Catalogue card uses visual identity board.
- Card back missing in source → CSS placeholder.
- NOB engine/WS view still TODO (backend enabled=false).

# Previous — 2026-08-19 (live backend)

## User request

Map `partygameonline-platform` với `partygameonline-server` — bỏ mock rooms/games/hand.

## What shipped

Frontend `apps/web` gọi backend thật qua Vite proxy `/api` + `/ws` → `127.0.0.1:8080`.

- CSRF + guest session bootstrap (`PGOSESSION`)
- Catalogue, phòng chờ, join/ready/start/leave
- WebSocket snapshot + `GAME_ACTION` (draw / play / end turn)
- Pixi table sync từ `payload.view` (không seed bài mock)
- Friends: empty (chưa có API)
- Session `currentRoomId` (backend) khi đã ngồi phòng

Presentation (theme/genre/i18n) vẫn local, merge với `GET /api/v1/games`. Không còn `shared/data/mock.ts`.

## How to run

1. Server: JDK 21, `mvnw.cmd spring-boot:run` (hoặc profile `dev`)
2. Web: `cd apps/web ; npm run dev` → http://localhost:5173

Cần 2 browser/profile khác nhau để test 2 người.

## Leftovers

- Chat lobby chưa có backend
- Room settings (đổi tên/visibility) chưa persist
- Night of Bloodlines `enabled=false`
- Friends API chưa có
