import { useState } from "react";
import { NOB_CATALOGUE_ID } from "@/games/nob";
import { NOT_IN_MY_POT_ID } from "@/games/notInMyPot";
import { WHERES_THE_BONE_ID } from "@/games/wheresTheBone";
import { WHERES_THE_BONE_DEFAULT_SETTINGS, type WheresTheBoneSettings } from "@/games/wheresTheBone/model/wheresTheBoneSettings";
import {
  NOB_DEFAULT_TIMING,
  NOB_GAMEPLAY_PRESETS,
  NOB_REACTION_PRESETS,
  type NobTiming,
} from "@/games/nob/model/nobTiming";
import {
  NIMP_DEFAULT_SETTINGS,
  NIMP_TURN_PRESETS,
  type NotInMyPotSettings,
} from "@/games/notInMyPot/model/notInMyPotSettings";
import { useUpdateRoomSettings } from "@/shared/hooks/useRooms";
import { useT } from "@/shared/i18n/useT";
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
  const [locked, setLocked] = useState(room.locked);
  const [nob, setNob] = useState<NobTiming>(room.nobTiming ?? NOB_DEFAULT_TIMING);
  const [notInMyPot, setNotInMyPot] = useState<NotInMyPotSettings>(room.notInMyPotSettings ?? NIMP_DEFAULT_SETTINGS);
  const [wheresTheBone, setWheresTheBone] = useState<WheresTheBoneSettings>(room.wheresTheBoneSettings ?? WHERES_THE_BONE_DEFAULT_SETTINGS);
  const isNob = room.gameId === NOB_CATALOGUE_ID;
  const isNotInMyPot = room.gameId === NOT_IN_MY_POT_ID;
  const isWheresTheBone = room.gameId === WHERES_THE_BONE_ID;
  const save = () => {
    if (!canEdit || (!isNob && !isNotInMyPot && !isWheresTheBone)) {
      onClose();
      return;
    }
    update.mutate(isNob ? { nob, locked } : isNotInMyPot ? { notInMyPot, locked } : { wheresTheBone, locked }, { onSuccess: () => onClose() });
  };

  return (
    <div className={styles.layer}>
      <button type="button" className={styles.backdrop} onClick={onClose} aria-label={t("save")} />
      <aside className={`${styles.panel} theme-panel`} role="dialog" aria-labelledby="room-settings-title">
        <h2 id="room-settings-title">{t("roomSettings")}</h2>

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

        <label className={styles.row}>
          <input type="checkbox" checked={locked} onChange={() => setLocked((value) => !value)} disabled={!canEdit} />
          {t("lockRoom")}
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

        {isNotInMyPot ? (
          <section className={styles.timerBlock}>
            <h3>{t("nimpSettings")}</h3>
            <TimerRow
              label={`${t("nimpTurnSeconds")} Â· ${notInMyPot.turnSeconds}s`}
              value={notInMyPot.turnSeconds}
              presets={NIMP_TURN_PRESETS}
              disabled={!canEdit}
              onChange={(next) => setNotInMyPot((current) => ({ ...current, turnSeconds: next }))}
            />
            <label className={styles.row}>
              <input
                type="checkbox"
                checked={notInMyPot.showActionHistory}
                onChange={() => setNotInMyPot((current) => ({ ...current, showActionHistory: !current.showActionHistory }))}
                disabled={!canEdit}
              />
              {t("nimpShowActionHistory")}
            </label>
            {!canEdit ? <p className={styles.bubble}>{waiting ? t("nobTimersHostOnly") : t("nobTimersLocked")}</p> : null}
          </section>
        ) : null}

        {isWheresTheBone ? (
          <section className={styles.timerBlock}>
            <h3>{t("wtbSettings")}</h3>
            <TimerRow label={`${t("wtbNightSeconds")} · ${wheresTheBone.nightSeconds}s`} value={wheresTheBone.nightSeconds} presets={[5, 10, 15, 20, 30]} disabled={!canEdit} onChange={(next) => setWheresTheBone((current) => ({ ...current, nightSeconds: next }))} />
            <TimerRow label={`${t("wtbDiscussionSeconds")} · ${wheresTheBone.discussionSeconds}s`} value={wheresTheBone.discussionSeconds} presets={[60, 120, 180, 300]} disabled={!canEdit} onChange={(next) => setWheresTheBone((current) => ({ ...current, discussionSeconds: next }))} />
            <TimerRow label={`${t("wtbVotingSeconds")} · ${wheresTheBone.votingSeconds}s`} value={wheresTheBone.votingSeconds} presets={[30, 60, 90, 120]} disabled={!canEdit} onChange={(next) => setWheresTheBone((current) => ({ ...current, votingSeconds: next }))} />
            <label className={styles.row}><input type="checkbox" checked={wheresTheBone.showActionHistory} onChange={() => setWheresTheBone((current) => ({ ...current, showActionHistory: !current.showActionHistory }))} disabled={!canEdit} /> {t("wtbShowActionHistory")}</label>
            <label className={styles.row}><input type="checkbox" checked={wheresTheBone.whiteDogEnabled} onChange={() => setWheresTheBone((current) => ({ ...current, whiteDogEnabled: !current.whiteDogEnabled }))} disabled={!canEdit} /> {t("wtbWhiteDogEnabled")}</label>
            {!canEdit ? <p className={styles.bubble}>{waiting ? t("nobTimersHostOnly") : t("nobTimersLocked")}</p> : null}
          </section>
        ) : null}

        {update.error ? <p className={styles.saveError}>{update.error.message}</p> : null}

        <button type="button" className={styles.save} onClick={save} disabled={update.isPending}>
          {t("save")}
        </button>

        {isHost ? (
          <div className={styles.danger}>
            <button type="button" className={styles.closeRoom} onClick={onCloseRoom}>
              {t("disbandRoom")}
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
