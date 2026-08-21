# 📜 Bộ Prompt Triển khai Nền tảng BoardVerse (V2 Full Roadmap)

Chào bạn! Thư mục này chứa toàn bộ các file prompt (bản **v2 chuẩn kiến trúc**) được phân rã khoa học, rõ ràng và chi tiết theo từng bước từ Frontend Theme, Canvas Game Engine đến Backend Spring Boot & WebSocket, để bạn giao cho **Gemini** (hoặc bất kỳ AI nào) thực thi từng phần.

---

## 🧭 Lộ trình 20 Bước (Prompt 00 → 19)

### 🎨 Phase 1: Frontend Platform Foundation & Theme System (00 → 08)

| STT | File Prompt | Mục đích chính |
| :---: | :--- | :--- |
| **00** | [`00-overview-and-architecture.md`](./00-overview-and-architecture.md) | **Tổng quan kiến trúc**, quy chuẩn monorepo (`apps/web` & `apps/server`), phân định Platform Theme $\neq$ Game Theme |
| **01** | [`01-project-scaffolding.md`](./01-project-scaffolding.md) | Khởi tạo cấu trúc Vite + React 19 + TypeScript + PixiJS v8 + Zustand |
| **02** | [`02-css-design-tokens.md`](./02-css-design-tokens.md) | Định nghĩa toàn bộ CSS Variables cho **Daybreak Table** (Light) & **Midnight Table** (Dark), scoped transitions 180ms, safe-area |
| **03** | [`03-theme-types-storage-bootstrap.md`](./03-theme-types-storage-bootstrap.md) | TypeScript types, safe storage helper và script inline `<head>` **chống FOUC** |
| **04** | [`04-zustand-theme-provider.md`](./04-zustand-theme-provider.md) | **Zustand Theme Store (pure state)** & **ThemeProvider** chịu trách nhiệm duy nhất đồng bộ DOM + OS event |
| **05** | [`05-theme-toggle-components.md`](./05-theme-toggle-components.md) | `ThemeQuickToggle` (Header) và `AppearanceSettings` (Radio card 3 mode System/Light/Dark) |
| **06** | [`06-app-shell-routing.md`](./06-app-shell-routing.md) | **React Router (URL thật)**: AppShell, Header, Mobile BottomNav, phân tách trang chơi `/play/:roomId` toàn màn hình |
| **07** | [`07-pixijs-card-table-foundation.md`](./07-pixijs-card-table-foundation.md) | **PixiJS Card Table Foundation**: Thảm nỉ felt, bộ bài 5 lá fan layout, kéo thả bài vào drop zone, DPR cap $\le 2.0$ |
| **08** | [`08-accessibility-responsive-verification.md`](./08-accessibility-responsive-verification.md) | Chuẩn WCAG AA contrast, skip-link, `StatusBadge` đa trạng thái, checklist nghiệm thu |

---

### ⚙️ Phase 2: Domain Architecture, Backend & Realtime Protocol (09 → 19)

| STT | File Prompt | Mục đích chính |
| :---: | :--- | :--- |
| **09** | [`09-frontend-domain-architecture.md`](./09-frontend-domain-architecture.md) | Kiến trúc Domain Frontend, phân tách UI platform và Game Engine |
| **10** | [`10-springboot-scaffolding.md`](./10-springboot-scaffolding.md) | Khởi tạo **Backend Spring Boot 4.1.x** (Java 21, Maven, PostgreSQL) |
| **11** | [`11-contracts-rest-query.md`](./11-contracts-rest-query.md) | Hợp đồng API REST, TypeScript types và TanStack Query integration |
| **12** | [`12-room-lobby-backend.md`](./12-room-lobby-backend.md) | Backend quản lý Room, Lobby, Ready State & Matchmaking cơ bản |
| **13** | [`13-websocket-realtime-protocol.md`](./13-websocket-realtime-protocol.md) | Giao thức thời gian thực **WebSocket STOMP / SockJS** và authoritative event sync |
| **14** | [`14-game-engine-core.md`](./14-game-engine-core.md) | Core Game Engine (State machine, Turn/Phase transitions, Rule validation) |
| **15** | [`15-demo-card-game-backend.md`](./15-demo-card-game-backend.md) | Backend Rules & Logic cho tựa game bài demo |
| **16** | [`16-demo-card-game-frontend.md`](./16-demo-card-game-frontend.md) | Kết nối Frontend Card Table với WebSocket & Authoritative State |
| **17** | [`17-reconnect-persistence.md`](./17-reconnect-persistence.md) | Xử lý Reconnect, phục hồi phiên chơi và Session snapshot |
| **18** | [`18-testing-quality-gates.md`](./18-testing-quality-gates.md) | Unit tests, Integration tests & Quality Gates cho cả FE và BE |
| **19** | [`19-night-of-bloodlines-skeleton.md`](./19-night-of-bloodlines-skeleton.md) | Khung cấu trúc cho tựa game chính **Night of Bloodlines** (Gothic Strategy) |

---

## 💡 Mẹo khi làm việc với Gemini
1. **Làm tuần tự từng file**: Không dán gộp nhiều file prompt cùng lúc. Hãy để Gemini hoàn thành và xác nhận từng bước trước khi sang bước tiếp theo.
2. **Kiểm tra output**: Sau mỗi bước, kiểm tra xem Gemini có tạo đúng file vào đúng đường dẫn trong cấu trúc thư mục quy định hay không.
3. **Chỉ dùng file v2**: Tất cả các file trong thư mục này hiện tại là bản v2 chuẩn nhất, không còn file cũ.
