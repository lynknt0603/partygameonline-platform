import { useEffect, useState } from "react";
import { avatarUrlForPlayer, initialsForAvatar } from "@/shared/avatar/avatar";
import { useSessionStore } from "@/shared/state/sessionStore";
import styles from "./PlayerAvatar.module.css";

interface PlayerAvatarProps {
  playerId?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  decorative?: boolean;
}

export function PlayerAvatar({
  playerId,
  displayName,
  avatarUrl,
  size = 48,
  className,
  decorative = false,
}: PlayerAvatarProps) {
  const [failed, setFailed] = useState(false);
  const sessionAvatarUrl = useSessionStore((state) =>
    playerId && state.session?.playerId === playerId ? state.session.avatarUrl : null,
  );
  const src = avatarUrlForPlayer(playerId, sessionAvatarUrl ?? avatarUrl);
  const classes = [styles.avatar, className].filter(Boolean).join(" ");

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <span
        className={`${classes} ${styles.fallback}`}
        style={{ width: size, height: size }}
        aria-hidden={decorative ? true : undefined}
        aria-label={decorative ? undefined : displayName}
      >
        {initialsForAvatar(displayName)}
      </span>
    );
  }

  return (
    <img
      className={classes}
      src={src}
      alt={decorative ? "" : displayName}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
