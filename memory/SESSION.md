# Session snapshot — 2026-08-22

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
