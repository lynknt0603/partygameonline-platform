import { useT } from "@/shared/i18n/useT";
import styles from "./LobbyChrome.module.css";

const LINES = [
  { who: "Elena", text: "ready chưa" },
  { who: "Linh", text: "ok 1 phút" },
  { who: "DragonSlayer", text: "chờ tí" },
];

interface LobbyChatProps {
  onClose: () => void;
}

export function LobbyChat({ onClose }: LobbyChatProps) {
  const t = useT();
  return (
    <div className={styles.layer}>
      <button type="button" className={styles.backdrop} onClick={onClose} aria-label={t("chat")} />
      <aside className={`${styles.panel} theme-panel`} role="dialog" aria-labelledby="lobby-chat-title">
        <h2 id="lobby-chat-title">{t("chat")}</h2>
        {LINES.map((line) => (
          <p key={`${line.who}-${line.text}`} className={styles.bubble}>
            <strong>{line.who}</strong> — {line.text}
          </p>
        ))}
      </aside>
    </div>
  );
}

export const CHAT_COUNT = LINES.length;
