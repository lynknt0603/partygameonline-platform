import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { useT } from "@/shared/i18n/useT";
import type { LobbyChatLine } from "@/shared/hooks/useLobbyChat";
import styles from "./LobbyChrome.module.css";

interface LobbyChatProps {
  lines: LobbyChatLine[];
  youId?: string;
  variant?: "drawer" | "sheet";
  onClose: () => void;
  onSend: (text: string) => void;
}

export function LobbyChat({ lines, youId, variant = "drawer", onClose, onSend }: LobbyChatProps) {
  const t = useT();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [lines.length]);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) {
      return;
    }
    onSend(text);
    setDraft("");
  };

  return (
    <div className={`${styles.layer} ${variant === "sheet" ? styles.sheetLayer : ""}`}>
      {variant === "drawer" ? (
        <button type="button" className={styles.backdrop} onClick={onClose} aria-label={t("closeChat")} />
      ) : null}
      <aside
        className={`${styles.panel} ${styles.chatPanel} ${variant === "sheet" ? styles.sheet : ""} theme-panel`}
        role="dialog"
        aria-labelledby="lobby-chat-title"
      >
        <header className={styles.chatHead}>
          <h2 id="lobby-chat-title">{t("chat")}</h2>
          <button type="button" className={styles.iconClose} onClick={onClose} aria-label={t("closeChat")}>
            <X size={16} />
          </button>
        </header>
        <div className={styles.transcript} ref={listRef}>
          {lines.length === 0 ? (
            <p className={styles.chatEmpty}>{t("chatEmpty")}</p>
          ) : (
            lines.map((line) => {
              const mine = Boolean(line.playerId && line.playerId === youId);
              if (line.kind === "system") {
                return (
                  <p key={line.id} className={styles.systemLine}>
                    {line.text}
                  </p>
                );
              }
              return (
                <p
                  key={line.id}
                  className={`${styles.bubble} ${mine ? styles.bubbleMine : styles.bubbleOther}`}
                  data-you={mine ? "true" : "false"}
                >
                  {mine ? null : <strong>{line.displayName ?? t("anonymousPlayer")}</strong>}
                  <span>{line.text}</span>
                </p>
              );
            })
          )}
          <div ref={endRef} />
        </div>
        <form className={styles.composer} onSubmit={submit}>
          <input
            className={styles.input}
            value={draft}
            maxLength={240}
            placeholder={t("chatPlaceholder")}
            onChange={(event) => setDraft(event.target.value)}
            aria-label={t("chatPlaceholder")}
          />
          <button type="submit" className={styles.save} disabled={!draft.trim()}>
            {t("chatSend")}
          </button>
        </form>
      </aside>
    </div>
  );
}
