import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import styles from "./AppShell.module.css";

export function AppShell() {
  return (
    <div className={`${styles.shell} app-shell`}>
      <Header />
      <main id="main" className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
