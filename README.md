# 🎲 BoardVerse — Online Tabletop & Party Game Platform

> **Repository:** `partygameonline-platform`  
> **Working Brand:** BoardVerse  
> **Tagline:** Nền tảng web chơi board game & card game trực tuyến nhiều người chơi theo thời gian thực (Real-time Multiplayer Web Tabletop Platform).

---

## 📌 Project Description (Mô tả dự án)

### 🔹 Mô tả ngắn gọn (Short Description / Repository Description)
- **EN:** Modern real-time multiplayer tabletop & party card game web platform built with React 19, PixiJS 8, and Spring Boot.
- **VI:** Nền tảng web chơi board game & card game trực tuyến nhiều người chơi thời gian thực, xây dựng trên React 19, PixiJS 8 và Spring Boot.

### 🔹 Mô tả chi tiết (Elevator Pitch)
**BoardVerse (`partygameonline-platform`)** là nền tảng trò chơi bàn cờ và thẻ bài trực tuyến (multiplayer tabletop & card games) hoạt động trực tiếp trên trình duyệt web (cả máy tính, máy tính bảng và điện thoại) mà không cần cài đặt thêm ứng dụng nào.

Hệ thống kết hợp giữa:
- **Giao diện web ứng dụng hiện đại:** Xây dựng bằng React 19, hệ thống định tuyến URL chuẩn SPA, hỗ trợ đa giao diện (Daybreak & Midnight theme) và thiết kế Mobile-First.
- **Bàn chơi đồ họa 2D tương tác mượt mà:** Xây dựng trên nền tảng PixiJS 8, hỗ trợ thao tác chạm kéo thả (touch-first), hiển thị dock bài, token và hiệu ứng chuyển động chân thực.
- **Backend chuyên trách luật chơi (Server-Authoritative):** Sử dụng Java 21 / Spring Boot 4, đóng vai trò trọng tài tối cao kiểm soát toàn bộ phòng chơi, lượt đánh, tính toán kết quả và truyền tải dữ liệu thời gian thực qua giao thức WebSocket, ngăn chặn triệt để tình trạng gian lận.

---

## 🎯 Mục đích dự án (Project Purpose & Objectives)

1. **Trải nghiệm chơi game tức thì (Instant Play):** Người chơi chỉ cần chia sẻ đường link hoặc mã phòng 4 ký tự là có thể tham gia bàn chơi cùng bạn bè ngay trên trình duyệt web.
2. **Thiết kế Mobile-First & Touch-First:** Giao diện tối ưu cho màn hình cảm ứng di động và máy tính bảng; hỗ trợ đầy đủ thao tác vuốt chạm, dock bài co giãn thông minh, không phụ thuộc vào hover chuột.
3. **Kiến trúc Server-Authoritative:** Mọi luật chơi, rút bài, đánh bài, chuyển lượt, tính điểm và điều kiện thắng/thua được kiểm tra và xử lý độc quyền tại Backend. Frontend chỉ gửi `Intent` (ý định hành động) và hiển thị dữ liệu server đã xác thực.
4. **Hệ thống Game Engine module hóa:** Dễ dàng mở rộng, cắm thêm (plug-in) các tựa game bài và board game mới mà không làm xáo trộn kiến trúc cốt lõi của nền tảng.
5. **Thẩm mỹ cao & Đa dạng chủ đề:** Nền tảng hỗ trợ hai chế độ sáng/tối chuẩn mực (**Daybreak Table** / **Midnight Table**), đồng thời cho phép từng game sở hữu phong cách đồ họa nghệ thuật độc lập (ví dụ: giao diện Gothic ma mị cho *Night of Bloodlines*).

---

## 🎮 Các Trò chơi & Phân hệ (Games & Features)

### 1. Game Modules
- **Demo Card Game:** Game bài 2D mẫu tích hợp bàn chơi PixiJS, hỗ trợ rút bài, đánh bài, kết thúc lượt, đồng bộ trạng thái nhiều người chơi qua WebSocket.
- **Night of Bloodlines (NOB):** Game thẻ bài chiến thuật đề tài Ma cà rồng (Gothic theme), cơ chế chọn bài (Draft Hand), gia tộc (Bloodlines), Dấu ấn mặt trăng (Moon Marks) và bộ kỹ năng thẻ bài đặc trưng.
- **Extensible GameEngine:** Khung kiến trúc cho phép tiếp tục bổ sung các game party/board game mới trong tương lai.

### 2. Tính năng Nền tảng (Platform Features)
- 🏠 **Game Catalogue:** Thư viện danh sách trò chơi với thông tin thể loại, số lượng người chơi, thời lượng và giới thiệu chi tiết.
- 🚪 **Room & Matchmaking:** Tạo phòng chơi, danh sách phòng công khai, tham gia bằng mã PIN 4 ký tự, phân quyền chủ phòng (Host), cơ chế sẵn sàng (Ready check).
- ⚡ **Realtime Table & WebSocket:** Đồng bộ hóa trạng thái bàn chơi thời gian thực, xử lý mất kết nối và kết nối lại (Reconnection & Snapshots).
- 🎨 **Theme Engine & Typography:** Hệ thống theme Daybreak / Midnight chuyển đổi mượt mà, lưu cài đặt cục bộ, chống nhấp nháy sáng tối (Anti-FOUC), tích hợp font tự host *Plus Jakarta Sans* & *Fraunces*.
- 📱 **Responsive & Accessible HUD:** Giao diện điều khiển trận đấu, thông tin người chơi, dock bài thông minh tự co giãn theo kích thước màn hình.

---

## 🏗️ Kiến trúc & Công nghệ (Architecture & Tech Stack)

### 📐 Phân định trách nhiệm kiến trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    REACT 19 (Web UI)                        │
│  Shell • Pages • Lobby • Menus • Dialogs • HUD • Settings   │
├─────────────────────────────────────────────────────────────┤
│                 PIXIJS 8 (Game Canvas)                      │
│  2D Card Table • Drag & Drop • Animations • Visual Effects  │
├─────────────────────────────────────────────────────────────┤
│         STATE: Zustand (UI) | TanStack Query (REST API)     │
└──────────────────────────────┬──────────────────────────────┘
                               │ WebSocket (State / Actions)
                               │ REST API (Auth / Rooms)
┌──────────────────────────────▼──────────────────────────────┐
│             SPRING BOOT 4 / JAVA 21 (Backend)               │
│  Authoritative Game Rules • Validation • Turn Transition    │
│  Room Management • WebSocket Broker • PostgreSQL Storage    │
└─────────────────────────────────────────────────────────────┘
```

### 🛠️ Chi tiết Công nghệ

#### **Frontend (`apps/web`)**
- **Framework:** React 19.2 + TypeScript (Strict Mode)
- **Bundler & Tooling:** Vite 8.x
- **2D Game Engine:** PixiJS 8.x
- **State Management:** 
  - Zustand (Trạng thái UI, preferences, modal)
  - TanStack Query v5 (Quản lý dữ liệu server & cache REST API)
- **Routing:** React Router v7 (Declarative SPA routing)
- **Styling:** CSS Modules + CSS Custom Properties (Design Tokens)
- **Icons & Typography:** Lucide React, `@fontsource-variable/plus-jakarta-sans`, `@fontsource-variable/fraunces`

#### **Backend (`partygameonline-server`)**
- **Ngôn ngữ & Runtime:** Java 21
- **Framework:** Spring Boot 4.1.x
- **Giao tiếp thời gian thực:** Spring WebSocket (STOMP / Text WebSocket)
- **Bảo mật:** Spring Security (Guest session, CSRF protection)
- **Cơ sở dữ liệu:** PostgreSQL

---

## 📂 Cấu trúc Repository (Directory Structure)

```text
partygameonline-platform/
├── apps/
│   └── web/                           # Frontend React 19 + PixiJS 8 application
│       ├── public/assets/games/       # Game assets (NOB cards, textures, branding)
│       └── src/
│           ├── app/                   # Shell, providers, layout, router
│           ├── features/              # Feature-based platform components
│           ├── game/                  # Pixi canvas bridge, renderer, generic card table
│           ├── games/                 # Game-specific modules (e.g. nob - Night of Bloodlines)
│           ├── pages/                 # Route pages (Home, Rooms, Lobby, GamePage, Profile...)
│           └── shared/                # UI kit, styles, tokens, utilities
├── contracts/                         # Shared API/WebSocket contracts & DTOs
├── docs/                              # Chi tiết kiến trúc, asset mappings, SPA hosting
├── memory/                            # Lưu trữ context & quyết định kỹ thuật của dự án
├── prompts/                           # Bộ prompt hướng dẫn kiến trúc & triển khai (v2)
├── GEMINI.md                          # Quy chuẩn & luật kiểm thử cho Coding Agents
├── package.json                       # Root workspace scripts
└── README.md                          # Tài liệu tổng quan dự án
```

---

## 🚀 Hướng dẫn Cài đặt & Khởi chạy (Getting Started)

### 1. Yêu cầu môi trường
- **Node.js:** phiên bản `20.x` trở lên (kèm `npm`)
- **Java:** JDK `21` trở lên
- **Maven:** `3.9+` (hoặc wrapper `mvnw`)

### 2. Khởi chạy Frontend Web Client
```bash
# 1. Cài đặt dependencies tại thư mục apps/web
cd apps/web
npm install

# 2. Chạy môi trường phát triển (Development server)
npm run dev
```
Trang web sẽ mở tại: `http://localhost:5173/`

### 3. Khởi chạy Backend Server
```bash
# Di chuyển vào thư mục backend và khởi chạy Spring Boot
./mvnw spring-boot:run
```
Backend API & WebSocket server sẽ lắng nghe tại: `http://127.0.0.1:8080/`

> **Lưu ý:** Vite dev server đã cấu hình sẵn proxy cho `/api` và `/ws` trỏ về `127.0.0.1:8080`.

### 4. Kiểm tra Multiplayer nhiều người chơi
1. Mở một tab trình duyệt bình thường (Player 1) tại `http://localhost:5173/`.
2. Mở một tab ẩn danh (Incognito Window) hoặc trình duyệt khác (Player 2).
3. Player 1 tạo phòng và lấy **mã phòng (4 chữ cái)**.
4. Player 2 nhập mã phòng để vào cùng phòng, cả hai bấm **Ready** để bắt đầu trận đấu.

---

## 🧪 Kiểm tra & Đảm bảo chất lượng (Verification)

Trước khi commit mã nguồn hoặc kết thúc mỗi giai đoạn phát triển, chạy các lệnh kiểm tra:

```bash
# Kiểm tra TypeScript typecheck
npm run typecheck

# Kiểm tra đóng gói build Frontend
npm run build
```

---

## 🗺️ Kế hoạch phát triển (Roadmap)

- [x] **Phase A — Frontend Foundation:** Hoàn thành Shell, Routing, Dual Theme, PixiJS generic table, Responsive layout, Sound/Settings.
- [x] **Phase B1 — Live Backend Integration:** Kết nối live API & WebSocket với Spring Boot backend, quản lý phòng, sẵn sàng trận đấu, đồng bộ lượt đánh.
- [x] **Phase B2 — Night of Bloodlines Integration:** Tích hợp bộ thẻ bài NOB, giao diện Gothic, Draft hand & Moon marks.
- [ ] **Phase C — Game Rules & Engine Complete:** Hoàn thiện toàn bộ logic luật chơi NOB trên Server-authoritative engine.
- [ ] **Phase D — Social & Match History:** Chat trực tiếp trong phòng chờ, danh sách bạn bè (Friends API), lịch sử đấu và bảng xếp hạng.

---

## 📄 Bản quyền & Giấy phép (License)
Dự án được xây dựng phục vụ nghiên cứu và phát triển nền tảng trò chơi giải trí trực tuyến.
Mọi tài sản hình ảnh thuộc bản quyền của các tác giả tương ứng.
