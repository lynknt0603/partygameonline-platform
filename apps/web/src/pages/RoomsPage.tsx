import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Dices } from "lucide-react";
import { PageHeading } from "@/shared/components/PageHeading/PageHeading";
import { RoomRow } from "@/shared/components/RoomRow/RoomRow";
import { useCreateRoom, useJoinRoom, useRooms } from "@/shared/hooks/useRooms";
import { useGames } from "@/shared/hooks/useGames";
import { useLocale, useT } from "@/shared/i18n/useT";
import { useActiveGame } from "@/shared/hooks/useActiveGame";
import { ActiveGameConflictDialog } from "@/shared/components/ActiveGameGuard/ActiveGameConflictDialog";
import { generateRandomRoomName } from "@/shared/utils/randomRoomNames";
import styles from "./RoomsPage.module.css";

export function RoomsPage() {
  const navigate = useNavigate();
  const t = useT();
  const locale = useLocale();
  const rooms = useRooms();
  const games = useGames();
  const create = useCreateRoom();
  const join = useJoinRoom();
  const [code, setCode] = useState("");
  const [gameId, setGameId] = useState("");
  const availableGames = games.data?.filter((game) => game.enabled) ?? [];
  const firstGameId = availableGames[0]?.id;
  const selectedGame = availableGames.find((game) => game.id === gameId) ?? availableGames[0];

  const hasUserEditedNameRef = useRef(false);
  const [roomName, setRoomName] = useState(() =>
    generateRandomRoomName("blood-bound", locale === "vi" ? "vi" : "en")
  );
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");

  useEffect(() => {
    if (!gameId && firstGameId) {
      setGameId(firstGameId);
    }
  }, [firstGameId, gameId]);

  useEffect(() => {
    if (!selectedGame) {
      return;
    }
    if (selectedGame.id === "blood-bound") {
      setMaxPlayers((current) => Math.min(selectedGame.maxPlayers, Math.max(selectedGame.minPlayers, current || 8)));
    } else {
      setMaxPlayers((current) => Math.min(selectedGame.maxPlayers, Math.max(selectedGame.minPlayers, current)));
    }
  }, [selectedGame?.id, selectedGame?.maxPlayers, selectedGame?.minPlayers]);

  // Tự động cập nhật tên phòng ngẫu nhiên theo tựa game khi đổi game (nếu người dùng chưa tự sửa)
  useEffect(() => {
    if (!selectedGame) {
      return;
    }
    if (!hasUserEditedNameRef.current) {
      setRoomName(generateRandomRoomName(selectedGame.id, locale === "vi" ? "vi" : "en"));
    }
  }, [selectedGame?.id, locale]);

  const handleRerollRoomName = () => {
    hasUserEditedNameRef.current = false;
    setRoomName(generateRandomRoomName(selectedGame?.id, locale === "vi" ? "vi" : "en"));
  };

  const { activeGame, rejoin, abandon } = useActiveGame();
  const [conflictAction, setConflictAction] = useState<{
    type: "create" | "join";
    payload?: {
      gameId?: string;
      name?: string;
      maxPlayers?: number;
      visibility?: "PUBLIC" | "PRIVATE";
      roomId?: string;
    };
  } | null>(null);

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGame) {
      return;
    }
    const finalRoomName = roomName.trim() || generateRandomRoomName(selectedGame.id, locale === "vi" ? "vi" : "en");
    if (!roomName.trim()) {
      setRoomName(finalRoomName);
    }
    const payload = {
      gameId: selectedGame.id,
      name: finalRoomName.slice(0, 40),
      maxPlayers,
      visibility,
    };
    if (activeGame) {
      setConflictAction({ type: "create", payload });
      return;
    }
    create.mutate(payload);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const target = code.trim().toUpperCase();
    if (!target) return;
    if (activeGame && activeGame.roomId.toUpperCase() !== target) {
      setConflictAction({ type: "join", payload: { roomId: target } });
      return;
    }
    join.mutate(target);
  };

  const handleAbandonAndProceed = async () => {
    if (activeGame) {
      await abandon(activeGame.roomId);
    }
    const action = conflictAction;
    setConflictAction(null);
    if (!action) return;
    if (action.type === "create" && action.payload?.gameId && action.payload?.name) {
      create.mutate({
        gameId: action.payload.gameId,
        name: action.payload.name,
        maxPlayers: action.payload.maxPlayers ?? 4,
        visibility: action.payload.visibility ?? "PUBLIC",
      });
    } else if (action.type === "join" && action.payload?.roomId) {
      join.mutate(action.payload.roomId);
    }
  };

  return (
    <div className={styles.page}>
      <PageHeading title={t("roomsTitle")} subtitle={t("roomsSub")} />

      <section className={`${styles.panel} theme-panel`}>
        <div className={styles.sectionHeading}>
          <h2>{t("createRoomTitle")}</h2>
          <p>{t("createRoomSub")}</p>
        </div>
        <form className={styles.createForm} onSubmit={submitCreate}>
          <label className={styles.field}>
            <span>{t("selectGame")}</span>
            <select
              className={styles.control}
              value={selectedGame?.id ?? ""}
              onChange={(event) => {
                const nextId = event.target.value;
                setGameId(nextId);
                if (nextId === "blood-bound") {
                  setMaxPlayers((current) => Math.min(16, Math.max(4, current || 8)));
                }
              }}
              disabled={games.isLoading || availableGames.length === 0 || create.isPending}
            >
              {availableGames.map((game) => (
                <option key={game.id} value={game.id}>
                  {locale === "vi" ? game.displayNameVi : game.displayName}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <div className={styles.labelRow}>
              <span>{t("roomName")}</span>
              <button
                type="button"
                className={styles.rerollButton}
                onClick={handleRerollRoomName}
                title={t("rerollRoomNameTitle")}
                disabled={create.isPending}
              >
                <Dices size={15} />
                <span>{t("rerollRoomName")}</span>
              </button>
            </div>
            <input
              className={styles.control}
              value={roomName}
              onChange={(event) => {
                hasUserEditedNameRef.current = true;
                setRoomName(event.target.value);
              }}
              placeholder={t("roomNamePlaceholder")}
              maxLength={40}
              required
              disabled={create.isPending}
            />
          </label>

          <label className={styles.field}>
            <span>{t("maxPlayers")}</span>
            <input
              className={styles.control}
              type="number"
              min={selectedGame?.minPlayers ?? 2}
              max={selectedGame?.maxPlayers ?? 16}
              value={maxPlayers}
              onChange={(event) => setMaxPlayers(Number(event.target.value))}
              disabled={!selectedGame || create.isPending}
            />
          </label>

          <fieldset className={styles.visibilityField}>
            <legend>{t("roomVisibility")}</legend>
            <label>
              <input
                type="radio"
                name="room-visibility"
                checked={visibility === "PUBLIC"}
                onChange={() => setVisibility("PUBLIC")}
                disabled={create.isPending}
              />
              {t("publicRoom")}
            </label>
            <label>
              <input
                type="radio"
                name="room-visibility"
                checked={visibility === "PRIVATE"}
                onChange={() => setVisibility("PRIVATE")}
                disabled={create.isPending}
              />
              {t("privateRoom")}
            </label>
          </fieldset>

          <button
            type="submit"
            className={styles.primary}
            disabled={create.isPending || !selectedGame}
          >
            {create.isPending ? t("creatingRoom") : t("createRoom")}
          </button>
        </form>
        {create.error ? (
          <div className={styles.errorBox} role="alert">
            <p className={styles.errorText}>
              {create.error.message === "SERVER_UNREACHABLE"
                ? t("serverUnreachableTip")
                : create.error.message}
            </p>
            {create.error.message === "SERVER_UNREACHABLE" && selectedGame && (
              <button
                type="button"
                className={styles.demoFallbackBtn}
                onClick={() => navigate(`/play/demo-${selectedGame.id}`)}
              >
                🎮 {t("playDemoFallback")}
              </button>
            )}
          </div>
        ) : null}
      </section>

      <section className={`${styles.panel} theme-panel`}>
        <div className={styles.sectionHeading}>
          <h2>{t("joinRoomTitle")}</h2>
          <p>{t("joinRoomSub")}</p>
        </div>
        <form className={styles.joinForm} onSubmit={submit}>
          <input
            className={styles.control}
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder={t("joinCode")}
            maxLength={8}
            aria-label={t("roomCode")}
          />
          <button type="submit" className={styles.primary} disabled={join.isPending || code.trim().length < 4}>
            {t("join")}
          </button>
        </form>
        {join.error ? <p className={styles.error}>{join.error.message}</p> : null}
      </section>

      <div className={styles.list}>
        {(rooms.data ?? []).map((room) => (
          <RoomRow key={room.id} room={room} />
        ))}
      </div>
      {rooms.data?.length === 0 ? <p>{t("emptyRooms")}</p> : null}

      {conflictAction && activeGame && (
        <ActiveGameConflictDialog
          open={Boolean(conflictAction)}
          activeRoomId={activeGame.roomId}
          actionType={conflictAction.type}
          onRejoin={() => rejoin(activeGame.roomId)}
          onAbandonAndProceed={handleAbandonAndProceed}
          onCancel={() => setConflictAction(null)}
        />
      )}
    </div>
  );
}
