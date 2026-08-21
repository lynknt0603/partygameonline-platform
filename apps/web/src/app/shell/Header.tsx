import { NavLink } from "react-router-dom";
import { ThemeQuickToggle } from "@/shared/components/ThemeQuickToggle/ThemeQuickToggle";
import { useT } from "@/shared/i18n/useT";
import { useSessionStore } from "@/shared/state/sessionStore";
import styles from "./Header.module.css";

export function Header() {
  const t = useT();
  const name = useSessionStore((state) => state.session?.displayName ?? "P");
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const links = [
    { to: "/games", label: t("navGames") },
    { to: "/rooms", label: t("navRooms") },
    { to: "/friends", label: t("navFriends") },
    { to: "/settings", label: t("navSettings") },
  ];

  return (
    <header className={`${styles.header} theme-header`}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.logo} end>
          <span className={styles.mark} aria-hidden="true" />
          <span className={styles.word}>BoardVerse</span>
        </NavLink>

        <nav className={styles.nav} aria-label={t("navMain")}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ""}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className={styles.actions}>
          <ThemeQuickToggle />
          <NavLink
            to="/profile"
            className={({ isActive }) => `${styles.avatar} ${isActive ? styles.avatarActive : ""}`}
            aria-label={t("navProfile")}
          >
            {initials}
          </NavLink>
        </div>
      </div>
    </header>
  );
}
