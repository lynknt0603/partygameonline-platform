import { useState, type FormEvent } from "react";
import { PageHeading } from "@/shared/components/PageHeading/PageHeading";
import { RoomRow } from "@/shared/components/RoomRow/RoomRow";
import { useJoinRoom, useRooms } from "@/shared/hooks/useRooms";
import { useT } from "@/shared/i18n/useT";
import styles from "./HomePage.module.css";

export function RoomsPage() {
  const t = useT();
  const rooms = useRooms();
  const join = useJoinRoom();
  const [code, setCode] = useState("");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (code.trim()) {
      join.mutate(code.trim());
    }
  };

  return (
    <div>
      <PageHeading title={t("roomsTitle")} subtitle={t("roomsSub")} />
      <form className={styles.heroActions} onSubmit={submit}>
        <input
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
      {join.error ? <p>{join.error.message}</p> : null}
      <div className={styles.list}>
        {(rooms.data ?? []).map((room) => (
          <RoomRow key={room.id} room={room} />
        ))}
      </div>
      {rooms.data?.length === 0 ? <p>{t("emptyRooms")}</p> : null}
    </div>
  );
}
