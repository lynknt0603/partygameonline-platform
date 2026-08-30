import { Clock, Play, Users } from "lucide-react";
import type { GameManifest } from "@/game/core/GameManifest";
import { NOB_BRANDING, NOB_CATALOGUE_ID } from "@/games/nob";
import { NOT_IN_MY_POT_ASSETS } from "@/games/notInMyPot";
const WHERES_THE_BONE_ART = "/assets/games/wheres-the-bone/boner-thief.png";
import { usePlayGame } from "@/shared/hooks/useRooms";
import { useLocale, useT } from "@/shared/i18n/useT";
import { memberLoginPath } from "@/shared/auth/memberAccess";
import { useSessionStore } from "@/shared/state/sessionStore";
import { useNavigate } from "react-router-dom";
import styles from "./GameCard.module.css";

interface GameCardProps {
  game: GameManifest;
}

export function GameCard({ game }: GameCardProps) {
  const t = useT();
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
  const locale = useLocale();
  const play = usePlayGame();
  const artClass = styles[game.id.replace(/-/g, "")] ?? styles.artDefault;
  const title = locale === "vi" ? game.displayNameVi : game.displayName;
  const genre = locale === "vi" ? game.genreVi : game.genre;

  return (
    <article className={`${styles.card} theme-card`}>
      <div className={`${styles.art} ${artClass}`} aria-hidden="true">
        {game.id === NOB_CATALOGUE_ID ? (
          <img className={styles.artPhoto} src={NOB_BRANDING.visualIdentity} alt="" />
        ) : game.id === "not-in-my-pot" ? (
          <img className={styles.artPhoto} src={NOT_IN_MY_POT_ASSETS.visualIdentity} alt="" />
        ) : game.id === "wheres-the-bone" ? (
          <img className={styles.artPhoto} src={WHERES_THE_BONE_ART} alt="" />
        ) : (
          <span className={styles.artMark} />
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.genre}>{genre}</p>
        <h3 className={styles.title}>{title}</h3>
        <div className={styles.meta}>
          <span className={styles.stat}>
            <Users size={14} aria-hidden="true" />
            {game.minPlayers}–{game.maxPlayers}
          </span>
          <span className={styles.stat}>
            <Clock size={14} aria-hidden="true" />
            {game.durationMin}–{game.durationMax} {t("minutes")}
          </span>
          <button
            type="button"
            className={styles.play}
            disabled={!game.enabled || play.isPending}
            onClick={() => {
              if (session?.kind !== "MEMBER") {
                navigate(memberLoginPath());
                return;
              }
              play.mutate(game.id);
            }}
            aria-label={`${t("play")} ${title}`}
          >
            <Play size={14} fill="currentColor" aria-hidden="true" />
            {play.isPending ? t("playingNow") : game.enabled ? t("play") : t("comingSoon")}
          </button>
        </div>
      </div>
    </article>
  );
}
