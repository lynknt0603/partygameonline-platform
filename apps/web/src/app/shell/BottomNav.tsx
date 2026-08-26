import { DoorOpen, LayoutGrid, Settings, Trophy, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import { useT } from "@/shared/i18n/useT";
import styles from "./BottomNav.module.css";

export function BottomNav() {
  const t = useT();
  const items = [
    { to: "/games", label: t("navGames"), Icon: LayoutGrid },
    { to: "/ranking", label: t("navRanking"), Icon: Trophy },
    { to: "/rooms", label: t("navRooms"), Icon: DoorOpen },
    { to: "/players", label: t("navPlayers"), Icon: Users },
    { to: "/settings", label: t("navSettings"), Icon: Settings },
  ];

  return (
    <nav className={`${styles.nav} theme-nav`} aria-label={t("navMain")}>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) => `${styles.item} ${isActive ? styles.active : ""}`}
        >
          <item.Icon size={20} aria-hidden="true" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
