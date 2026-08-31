# partygameonline-platform

Web frontend cho nền tảng chơi board game và party game trực tuyến nhiều người chơi theo thời gian thực (BoardVerse). Ứng dụng cung cấp giao diện tương tác trực quan cho các tựa game như Night of Bloodlines (Đêm Huyết Tộc), kết nối với backend qua REST API và WebSocket.

## Công nghệ sử dụng

- Giao diện: React 19, TypeScript, Vite
- Quản lý trạng thái: Zustand, TanStack Query (React Query) v5
- Định tuyến: React Router v7
- Styling và UI: CSS Modules, Design Tokens, Lucide React

## Cấu trúc thư mục

- apps/web/src/app: Cấu hình router, providers và layout chính
- apps/web/src/features: Các tính năng cốt lõi (xác thực, danh sách phòng, chat)
- apps/web/src/games: Logic giao diện và tài nguyên riêng cho từng game (ví dụ: Night of Bloodlines)
- apps/web/src/shared: Các component dùng chung, store, hook và tiện ích
- scripts: Các script hỗ trợ kiểm thử và tiện ích mở rộng

## Yêu cầu môi trường

- Node.js 20 trở lên
- npm 10 trở lên

## Hướng dẫn cài đặt và chạy ứng dụng

### 1. Cài đặt thư viện

Di chuyển vào thư mục ứng dụng web và cài đặt dependencies:

```bash
cd apps/web
npm install
```

### 2. Chạy môi trường phát triển (Development)

```bash
npm run dev
```

Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5173/`

Vite đã được cấu hình sẵn proxy để tự động chuyển tiếp các request `/api` và `/ws` tới backend tại `http://127.0.0.1:8080/`.

Hoặc có thể chạy nhanh từ thư mục gốc của repository:

```bash
npm run dev
```

## Hướng dẫn kiểm tra và build dự án

### 1. Kiểm tra lỗi kiểu dữ liệu (Typecheck)

```bash
# Chạy từ apps/web
npm run typecheck

# Hoặc chạy từ thư mục gốc
npm run typecheck
```

### 2. Build bản Production

```bash
# Chạy từ apps/web
npm run build

# Hoặc chạy từ thư mục gốc
npm run build
```

Kết quả build sẽ được tạo trong thư mục `apps/web/dist`.

### 3. Xem trước bản build (Preview)

```bash
cd apps/web
npm run preview
```

### 4. Chạy script mô phỏng người chơi (Bot testing)

Để kiểm thử luồng chơi nhiều người trong phòng chờ mà không cần mở nhiều trình duyệt thủ công, sử dụng script bot:

```bash
# Cú pháp: node scripts/bot-players.mjs <MÃ_PHÒNG> <SỐ_LƯỢNG_BOT>
node scripts/bot-players.mjs ABCD 6
```

## Giấy phép

All rights reserved.
