import { useEffect, useState, type FormEvent } from "react";
import { PageHeading } from "@/shared/components/PageHeading/PageHeading";
import { RoomRow } from "@/shared/components/RoomRow/RoomRow";
import { useCreateRoom, useJoinRoom, useRooms } from "@/shared/hooks/useRooms";
import { useGames } from "@/shared/hooks/useGames";
import { useLocale, useT } from "@/shared/i18n/useT";
import styles from "./RoomsPage.module.css";

export function RoomsPage() {
  const t = useT();
  const locale = useLocale();
  const rooms = useRooms();
  const games = useGames();
  const create = useCreateRoom();
  const join = useJoinRoom();
  const [code, setCode] = useState("");
  const [gameId, setGameId] = useState("");
  const [roomName, setRoomName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(4);
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  const availableGames = games.data?.filter((game) => game.enabled) ?? [];
  const firstGameId = availableGames[0]?.id;
  const selectedGame = availableGames.find((game) => game.id === gameId) ?? availableGames[0];

  useEffect(() => {
    if (!gameId && firstGameId) {
      setGameId(firstGameId);
    }
  }, [firstGameId, gameId]);

  useEffect(() => {
    if (!selectedGame) {
      return;
    }
    setMaxPlayers((current) => Math.min(selectedGame.maxPlayers, Math.max(selectedGame.minPlayers, current)));
  }, [selectedGame?.id, selectedGame?.maxPlayers, selectedGame?.minPlayers]);

  const submitCreate = (event: FormEvent) => {
    event.preventDefault();
    if (!selectedGame || !roomName.trim()) {
      return;
    }
    create.mutate({
      gameId: selectedGame.id,
      name: roomName.trim().slice(0, 40),
      maxPlayers,
      visibility,
    });
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code.trim()) {
      join.mutate(code.trim());
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
              onChange={(event) => setGameId(event.target.value)}
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
            <span>{t("roomName")}</span>
            <input
              className={styles.control}
              value={roomName}
              onChange={(event) => setRoomName(event.target.value)}
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
            disabled={create.isPending || !selectedGame || !roomName.trim()}
          >
            {create.isPending ? t("creatingRoom") : t("createRoom")}
          </button>
        </form>
        {create.error ? <p className={styles.error}>{create.error.message}</p> : null}
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
    </div>
  );
}
