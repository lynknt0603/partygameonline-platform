# Prompt 06 — Responsive App Shell & Real URL Routing

## Mục tiêu

Build a real SPA navigation system.

Do NOT use state-based page routing.

## Router

Use React Router **v7.x declarative APIs** compatible with this project.

Do not upgrade router major during this prompt.

Routes:

```text
/
 /games
 /rooms
 /rooms/:roomId
 /friends
 /settings
 /profile
 /play/:roomId
```

Recommended semantics:

- `/` → HomePage
- `/games` → GamesPage (catalogue)
- `/rooms` → RoomsPage
- `/rooms/:roomId` → LobbyPage (waiting/ready room)
- `/play/:roomId` → GamePage fullscreen
- `/friends`
- `/settings`
- `/profile`

Do not confuse:
- game catalogue;
- lobby;
- active game.

## AppShell

Platform routes use:
- desktop Header;
- responsive content area;
- mobile BottomNav;
- `<Outlet />`.

Game route `/play/:roomId` should use a dedicated game layout and not render the normal bottom nav over the board.

## Header

Desktop:
- logo;
- Games;
- Rooms;
- Friends;
- ThemeQuickToggle;
- Settings/Profile.

## BottomNav

Mobile:
- Games;
- Rooms;
- Friends;
- Settings.

Respect bottom safe area.

Use `NavLink` active state.

## Pages

Use mock data only:
- HomePage
- GamesPage
- RoomsPage
- LobbyPage
- FriendsPage
- SettingsPage
- ProfilePage
- GamePage

Do not create networking yet.

## Deep links

The frontend must support direct refresh of SPA routes in dev.
Add deployment documentation noting production servers must rewrite unknown SPA routes to `index.html`.

## Responsive rules

- Mobile-first from ~360px.
- No horizontal page overflow.
- Bottom nav must not hide main content.
- Header/bottom navigation safe-area aware.
- Avoid fixed desktop widths.

## Acceptance

- browser back/forward works;
- direct URL navigation works in Vite dev;
- each logical page has a URL;
- game route is fullscreen;
- active nav state works desktop/mobile;
- theme works everywhere;
- typecheck/build pass.
