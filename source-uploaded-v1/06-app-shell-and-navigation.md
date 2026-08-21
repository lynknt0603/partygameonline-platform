# Prompt 06: App Shell, Navigation & Routing với React Router v6

## Mục tiêu
Xây dựng khung ứng dụng hoàn chỉnh (**App Shell**) cho nền tảng **BoardVerse** sử dụng **React Router v6** (routing thật dựa trên URL, không phải state router), bao gồm Desktop Header, Mobile Bottom Navigation hỗ trợ Safe Area, và 4 trang mẫu.

> [!IMPORTANT]
> **Không sử dụng state-based tab routing** kiểu `const [activeTab, setActiveTab] = useState('lobby')`.
> Phải dùng `react-router-dom` với URL thật (`/`, `/rooms`, `/friends`, `/settings`, `/game/:gameId`).
> Lý do: URL thật cho phép back/forward trình duyệt, deep link, chia sẻ link phòng game, và chuẩn bị cho lazy loading.

---

## Yêu cầu chi tiết cần thực hiện

### 1. Cài đặt dependency

```bash
npm install react-router-dom
```

TypeScript types đã được bundle sẵn trong `react-router-dom` v6.

---

### 2. Cấu hình Router trong `src/main.tsx`

```typescript
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
```

---

### 3. Định nghĩa Routes trong `src/App.tsx`

```typescript
import { Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './shared/theme/ThemeProvider';
import { AppShell } from './components/Layout/AppShell';
import { LobbyPage } from './pages/LobbyPage';
import { RoomsPage } from './pages/RoomsPage';
import { FriendsPage } from './pages/FriendsPage';
import { SettingsPage } from './pages/SettingsPage';
import { GameRoomPage } from './pages/GameRoomPage';

export const App: React.FC = () => (
  <ThemeProvider>
    <Routes>
      {/* Game room — không dùng AppShell, toàn màn hình */}
      <Route path="/game/:gameId" element={<GameRoomPage />} />

      {/* Platform shell với Header + BottomNav */}
      <Route element={<AppShell />}>
        <Route index element={<LobbyPage />} />
        <Route path="rooms" element={<RoomsPage />} />
        <Route path="friends" element={<FriendsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  </ThemeProvider>
);
```

---

### 4. Sửa `AppShell` dùng React Router `<Outlet>`

```typescript
// AppShell không nhận children prop — dùng <Outlet /> của React Router
import { Outlet } from 'react-router-dom';

export const AppShell: React.FC = () => (
  <div className={`${styles.appShell} app-shell`}>
    <Header />
    <main className={styles.mainContent}>
      <Outlet />  {/* Render route con tại đây */}
    </main>
    <BottomNav />
  </div>
);
```

---

### 5. Sửa `Header` và `BottomNav` dùng `NavLink`

Dùng `NavLink` thay vì `button onClick → setState`:

```typescript
import { NavLink } from 'react-router-dom';

// NavLink tự thêm class 'active' khi URL khớp
<NavLink
  to="/"
  end
  className={({ isActive }) =>
    `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
  }
>
  Games
</NavLink>

<NavLink to="/rooms" className={...}>Rooms</NavLink>
<NavLink to="/friends" className={...}>Friends</NavLink>
<NavLink to="/settings" className={...}>Settings</NavLink>
```

---

### 6. Xây dựng các trang

#### `src/pages/LobbyPage.tsx`
- Lời chào: `Welcome back, Master Strategist`
- Game Cards Grid (2–3 cột): *Bloodlines: Vampire Lords*, *Daybreak Tactics*, *Tavern Dice & Cards*
- Mỗi card: `background: var(--surface)`, `border: 1px solid var(--border)`, `box-shadow: var(--shadow-md)`
- Nút `PLAY NOW` dùng `useNavigate()` để chuyển tới `/game/bloodlines`

#### `src/pages/RoomsPage.tsx`
- Danh sách phòng đang mở với `StatusBadge` (waiting / in_game)
- Nút "Join Room" → `navigate('/game/:roomId')`

#### `src/pages/FriendsPage.tsx`
- Danh sách bạn bè với `StatusBadge` đa trạng thái
- Avatar, tên, ghi chú trạng thái

#### `src/pages/SettingsPage.tsx`
- Section **Appearance**: nhúng `AppearanceSettings` component
- Section **Sound & Haptics**: mockup toggle switches
- Section **Account**: avatar + display name placeholder

#### `src/pages/GameRoomPage.tsx`
- Đọc `gameId` từ `useParams()`
- Render `<BoardCanvas manifest={...} />`
- Nút Leave → `navigate('/')`

---

## Tiêu chuẩn nghiệm thu (Acceptance Criteria)
- [ ] Mỗi tab có URL riêng: `/`, `/rooms`, `/friends`, `/settings`.
- [ ] Nút back/forward của trình duyệt hoạt động đúng.
- [ ] `NavLink` active class hiển thị đúng trên cả Header (desktop) và BottomNav (mobile).
- [ ] `/game/bloodlines` render GameRoomPage toàn màn hình (không có Header/BottomNav).
- [ ] Reload trang bất kỳ route → không 404 (Vite dev server đã xử lý).
- [ ] Theme toggle và tất cả trang đổi màu mượt mà.
