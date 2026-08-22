import { useEffect, useState } from "react";
import { NOB_CATALOGUE_ID } from "@/games/nob";
import {
  NOB_DEFAULT_TIMING,
  NOB_GAMEPLAY_PRESETS,
  NOB_REACTION_PRESETS,
  type NobTiming,
} from "@/games/nob/model/nobTiming";
import { useUpdateRoomSettings } from "@/shared/hooks/useRooms";
import { useT } from "@/shared/i18n/useT";
import { useSessionStore } from "@/shared/state/sessionStore";
import type { RoomView } from "@/shared/lobby/roomView";
import styles from "./LobbyChrome.module.css";

interface RoomSettingsPanelProps {
  room: RoomView;
  maxCap: number;
  isHost: boolean;
  onClose: () => void;
  onCloseRoom: () => void;
}

const GAMEPLAY_FIELDS: Array<{ key: keyof NobTiming; labelKey: "nobDraftSeconds" | "nobPhaseSeconds" | "nobTargetSeconds" | "nobOptionSeconds" | "nobHunterSeconds" }> = [
  { key: "draftPickSeconds", labelKey: "nobDraftSeconds" },
  { key: "phaseSubmitSeconds", labelKey: "nobPhaseSeconds" },
  { key: "targetDecisionSeconds", labelKey: "nobTargetSeconds" },
  { key: "optionDecisionSeconds", labelKey: "nobOptionSeconds" },
  { key: "hunterDecisionSeconds", labelKey: "nobHunterSeconds" },
];

export function RoomSettingsPanel({ room, maxCap, isHost, onClose, onCloseRoom }: RoomSettingsPanelProps) {
  const t = useT();
  const waiting = room.status === "waiting";
  const canEdit = isHost && waiting;
  const update = useUpdateRoomSettings(room.id);
  const [name, setName] = useState(room.name);
  const [visibility, setVisibility] = useState(room.visibility);
  const [players, setPlayers] = useState(room.capacity);
  const [spectators, setSpectators] = useState(true);
  const [nob, setNob] = useState<NobTiming>(room.nobTiming ?? NOB_DEFAULT_TIMING);
  const isNob = room.gameId === NOB_CATALOGUE_ID;
  const sessionName = useSessionStore((state) => state.session?.displayName ?? "");
  const rename = useSessionStore((state) => state.rename);
  const [displayName, setDisplayName] = useState(sessionName);

  useEffect(() => {
    setDisplayName(sessionName);
  }, [sessionName]);

  const save = () => {
    const nextName = displayName.trim().slice(0, 32);
    const afterName = () => {
      if (!canEdit || !isNob) {
        onClose();
        return;
      }
      update.mutate(nob, { onSuccess: () => onClose() });
    };
    if (nextName && nextName !== sessionName) {
      void rename(nextName).then(afterName);
      return;
    }
    afterName();
  };

  return (
    <div className={styles.layer}>
      <button type="button" className={styles.backdrop} onClick={onClose} aria-label={t("save")} />
      <aside className={`${styles.panel} theme-panel`} role="dialog" aria-labelledby="room-settings-title">
        <h2 id="room-settings-title">{t("roomSettings")}</h2>

        <label className={styles.stack}>
          {t("guestName")}
          <input
            className={styles.input}
            value={displayName}
            maxLength={32}
            autoComplete="nickname"
            onChange={(event) => setDisplayName(event.target.value)}
          />
        </label>

        <label className={styles.stack}>
          {t("roomName")}
          <input className={styles.input} value={name} onChange={(event) => setName(event.target.value)} disabled />
        </label>

        <fieldset className={styles.fieldset}>
          <legend>{t("publicRoom")} / {t("privateRoom")}</legend>
          <label>
            <input
              type="radio"
              name="vis"
              checked={visibility === "public"}
              onChange={() => setVisibility("public")}
              disabled
            />
            {t("publicRoom")}
          </label>
          <label>
            <input
              type="radio"
              name="vis"
              checked={visibility === "private"}
              onChange={() => setVisibility("private")}
              disabled
            />
            {t("privateRoom")}
          </label>
        </fieldset>

        <label className={styles.stack}>
          {t("maxPlayers")} ({players})
          <input
            type="range"
            min={2}
            max={Math.max(2, maxCap)}
            value={players}
            onChange={(event) => setPlayers(Number(event.target.value))}
            disabled
          />
        </label>

        <label className={styles.row}>
          <input type="checkbox" checked={spectators} onChange={() => setSpectators((value) => !value)} disabled />
          {t("allowSpectators")}
        </label>

        {isNob ? (
          <section className={styles.timerBlock}>
            <h3>{t("nobTimers")}</h3>
            {GAMEPLAY_FIELDS.map((field) => (
              <TimerRow
                key={field.key}
                label={`${t(field.labelKey)} · ${nob[field.key]}s`}
                value={nob[field.key]}
                presets={NOB_GAMEPLAY_PRESETS}
                disabled={!canEdit}
                onChange={(next) => setNob((current) => ({ ...current, [field.key]: next }))}
              />
            ))}
            <TimerRow
              label={`${t("nobReactionSeconds")} · ${nob.reactionDecisionSeconds}s`}
              value={nob.reactionDecisionSeconds}
              presets={NOB_REACTION_PRESETS}
              disabled={!canEdit}
              onChange={(next) => setNob((current) => ({ ...current, reactionDecisionSeconds: next }))}
            />
            {!canEdit ? <p className={styles.bubble}>{waiting ? t("nobTimersHostOnly") : t("nobTimersLocked")}</p> : null}
          </section>
        ) : null}

        {update.error ? <p className={styles.saveError}>{update.error.message}</p> : null}

        <button type="button" className={styles.save} onClick={save} disabled={update.isPending}>
          {t("save")}
        </button>

        {isHost ? (
          <div className={styles.danger}>
            <p>{t("dangerZone")}</p>
            <button type="button" className={styles.closeRoom} onClick={onCloseRoom}>
              {t("closeRoom")}
            </button>
          </div>
        ) : null}
      </aside>
    </div>
  );
}

function TimerRow({
  label,
  value,
  presets,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  presets: readonly number[];
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className={styles.timerRow}>
      <span>{label}</span>
      <div className={styles.chips}>
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            className={styles.chip}
            data-on={preset === value}
            disabled={disabled}
            onClick={() => onChange(preset)}
          >
            {preset}
          </button>
        ))}
      </div>
    </div>
  );
}
