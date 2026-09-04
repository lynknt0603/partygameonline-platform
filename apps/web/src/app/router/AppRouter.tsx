import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { AppShell } from "@/app/shell/AppShell";
import { GamePage } from "@/pages/GamePage";
import { GamesPage } from "@/pages/GamesPage";
import { HomePage } from "@/pages/HomePage";
import { LobbyPage } from "@/pages/LobbyPage";
import { LoginPage } from "@/pages/LoginPage";
import { MatchHistoryPage } from "@/pages/MatchHistoryPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { PublicProfilePage } from "@/pages/PublicProfilePage";
import { PlayersPage } from "@/pages/PlayersPage";
import { RankingPage } from "@/pages/RankingPage";
import { RoomsPage } from "@/pages/RoomsPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { memberLoginPath } from "@/shared/auth/memberAccess";
import { useSessionStore } from "@/shared/state/sessionStore";

function MemberOnly({ children }: { children: ReactNode }) {
  const session = useSessionStore((state) => state.session);
  const location = useLocation();

  const isDemo = location.pathname.toLowerCase().includes("demo");
  if (session?.kind !== "MEMBER" && !isDemo) {
    return (
      <Navigate
        to={memberLoginPath(`${location.pathname}${location.search}${location.hash}`)}
        replace
      />
    );
  }
  return children;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/play/:roomId" element={<MemberOnly><GamePage /></MemberOnly>} />
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="games" element={<GamesPage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="rooms/:roomId" element={<MemberOnly><LobbyPage /></MemberOnly>} />
          <Route path="players" element={<PlayersPage />} />
          <Route path="friends" element={<Navigate to="/players" replace />} />
          <Route path="ranking" element={<RankingPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="profile/:username" element={<PublicProfilePage />} />
          <Route path="profile/history" element={<MatchHistoryPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<LoginPage defaultTab="register" />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
