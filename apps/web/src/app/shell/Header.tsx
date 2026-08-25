import { NavLink, useNavigate } from "react-router-dom";
import { ThemeQuickToggle } from "@/shared/components/ThemeQuickToggle/ThemeQuickToggle";
import { PlayerAvatar } from "@/shared/components/PlayerAvatar/PlayerAvatar";
import { useT } from "@/shared/i18n/useT";
import { useSessionStore } from "@/shared/state/sessionStore";
import styles from "./Header.module.css";

export function Header() {
  const t = useT();
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
  const logout = useSessionStore((state) => state.logout);
  const isMember = session?.kind === "MEMBER";

  const name = session?.displayName ?? "Player";

  const links = [
    { to: "/games", label: t("navGames") },
    { to: "/rooms", label: t("navRooms") },
    { to: "/friends", label: t("navFriends") },
    { to: "/settings", label: t("navSettings") },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className={`${styles.header} theme-header`}>
      <div className={styles.inner}>
        <NavLink to="/" className={styles.logo} end>
          <span className={styles.mark} aria-hidden="true" />
          <span className={styles.word}>PartyGameOnline</span>
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
          {isMember ? (
            <div className={styles.userProfile}>
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `${styles.avatar} ${isActive ? styles.avatarActive : ""}`
                }
                aria-label={t("navProfile")}
              >
                <PlayerAvatar
                  playerId={session?.playerId}
                  displayName={name}
                  avatarUrl={session?.avatarUrl}
                  size={36}
                  decorative
                />
              </NavLink>
              <div className={styles.userDetails}>
                <NavLink to="/profile" className={styles.userName} title={name}>
                  {name}
                </NavLink>
                <button
                  type="button"
                  className={styles.logoutBtn}
                  onClick={handleLogout}
                  aria-label={t("logout")}
                >
                  {t("logout")}
                </button>
              </div>
            </div>
          ) : (
            <NavLink to="/login" className={styles.loginBtn}>
              {t("loginOrRegister")}
            </NavLink>
          )}
        </div>
      </div>
    </header>
  );
}
