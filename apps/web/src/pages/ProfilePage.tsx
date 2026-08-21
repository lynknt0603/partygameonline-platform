import { Link } from "react-router-dom";
import { PageHeading } from "@/shared/components/PageHeading/PageHeading";
import { useT } from "@/shared/i18n/useT";
import { useSessionStore } from "@/shared/state/sessionStore";
import styles from "./ProfilePage.module.css";

export function ProfilePage() {
  const t = useT();
  const session = useSessionStore((state) => state.session);
  const initials = (session?.displayName ?? "P")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={styles.page}>
      <PageHeading title={t("navProfile")} subtitle={t("account")} />
      <section className={`${styles.card} theme-card`}>
        <div className={styles.avatar}>{initials}</div>
        <div>
          <h2>{session?.displayName ?? "Player"}</h2>
          <p>{session?.kind ?? "GUEST"}</p>
        </div>
      </section>
      <Link className={styles.link} to="/profile/history">
        {t("matchHistory")}
      </Link>
      <Link className={styles.link} to="/settings">
        {t("settingsTitle")}
      </Link>
    </div>
  );
}
