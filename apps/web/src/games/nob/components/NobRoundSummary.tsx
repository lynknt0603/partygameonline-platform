import { useLocale, useT } from "@/shared/i18n/useT";
import { getNobBloodlineArt, getNobCardArt, getNobCardMeta } from "../assets/nobArt";
import { bloodlineTitle, roundWinnerLine } from "../model/nobBloodlineCopy";
import type { NobView } from "../model/nobTypes";
import { NobCountdown } from "./NobCountdown";
import { NobMoonTokens } from "./NobMoonTokens";
import styles from "./NobRoundSummary.module.css";

interface NobRoundSummaryProps {
  view: NobView;
  remainingMs: number | null;
  deadline?: string | null;
  serverTime?: string | null;
  reducedMotion?: boolean;
  timedOut?: boolean;
  tokenOptions: string[];
  canPickToken: boolean;
  pickedOption: string | null;
  pickedOptions?: string[];
  remainingOptions?: string[];
  revealedByOption?: Record<string, number>;
  revealedValue: number | null;
  spectatorPick: boolean;
  onPickToken: (option: string) => void;
  onViewRole: () => void;
  onViewCards: () => void;
}

export function NobRoundSummary({
  view,
  remainingMs,
  deadline = null,
  serverTime = null,
  reducedMotion = false,
  timedOut = false,
  tokenOptions,
  canPickToken,
  pickedOption,
  pickedOptions = [],
  remainingOptions,
  revealedByOption = {},
  revealedValue,
  spectatorPick,
  onPickToken,
  onViewRole,
  onViewCards,
}: NobRoundSummaryProps) {
  const t = useT();
  const locale = useLocale();
  const result = view.lastRoundResult;
  const headline = roundWinnerLine(result?.result, result?.winningBloodline, locale);
  const rewarded = new Set(view.roundRewardPlayerIds ?? []);
  const players = [...view.players].sort((left, right) => left.seat - right.seat);
  const awarded = players.filter((player) => rewarded.has(player.playerId));
  const winnerArt = factionArt(result?.winningBloodline, players);

  return (
    <section className={`${styles.wrap} ${reducedMotion ? styles.reduced : ""}`} aria-label={t("roundEnd")}>
      <header className={styles.banner}>
        <div>
          <p>{t("roundEnd")}</p>
          <h2>{headline.kicker}</h2>
        </div>
        <div className={styles.timerBox}>
          <span>{t("nextRoundIn")}</span>
          <NobCountdown
            remainingMs={remainingMs}
            deadline={deadline}
            serverTime={serverTime}
            reducedMotion={reducedMotion}
          />
        </div>
      </header>

      <div className={styles.grid}>
        <aside className={styles.winner}>
          {winnerArt ? <img src={winnerArt} alt="" /> : null}
          <h3>{headline.title}</h3>
          {result?.lastHopeTriggered ? <p className={styles.hope}>{t("lastHopeTitle")}</p> : null}
          <h4>{t("awardedPlayers")}</h4>
          {awarded.length === 0 ? (
            <p>{t("waitingSnapshot")}</p>
          ) : (
            <ul>
              {awarded.map((player) => (
                <li key={player.playerId}>
                  {player.displayName}
                  <span>{bloodlineTitle(player.publiclyRevealedBloodline, locale)}</span>
                </li>
              ))}
            </ul>
          )}
          {canPickToken || pickedOption || tokenOptions.length > 0 ? (
            <div className={styles.tokens}>
              <p>
                {pickedOptions.length > 0 && revealedValue != null
                  ? canPickToken
                    ? t("moonMarkDrawnMore").replace("{n}", String(revealedValue))
                    : t("moonMarkDrawn").replace("{n}", String(revealedValue))
                  : timedOut
                    ? t("timeUpWaiting")
                    : canPickToken && remainingOptions && remainingOptions.length < tokenOptions.length
                      ? t("pickMoonTokenMore")
                      : t("pickMoonToken")}
              </p>
              <NobMoonTokens
                options={tokenOptions}
                remainingOptions={remainingOptions}
                disabled={timedOut || !canPickToken}
                reducedMotion={reducedMotion}
                revealedByOption={revealedByOption}
                pickedOptions={pickedOptions.length > 0 ? pickedOptions : pickedOption ? [pickedOption] : []}
                onPick={onPickToken}
              />
            </div>
          ) : spectatorPick ? (
            <p>{t("othersPickingToken")}</p>
          ) : null}
          <div className={styles.inspect}>
            <button type="button" onClick={onViewRole}>
              {t("viewRole")}
            </button>
            <button type="button" onClick={onViewCards}>
              {t("viewCards")}
            </button>
          </div>
        </aside>

        <div className={styles.players}>
          <h3>{t("allPlayers")}</h3>
          <div className={styles.playerGrid}>
            {players.map((player) => {
              const line = player.publiclyRevealedBloodline;
              const art = line ? getNobBloodlineArt(line.type, line.rank) : null;
              return (
                <article
                  key={player.playerId}
                  className={styles.player}
                  data-rewarded={rewarded.has(player.playerId) ? "true" : "false"}
                  data-you={player.you || player.playerId === view.you ? "true" : "false"}
                >
                  {art ? <img className={styles.portrait} src={art} alt="" /> : <div className={styles.portrait} />}
                  <strong>{player.displayName}</strong>
                  <span>{bloodlineTitle(line, locale)}</span>
                  <span className={styles.badge} data-dead={player.alive ? "false" : "true"}>
                    {player.alive ? t("survived") : t("eliminated")}
                  </span>
                  {rewarded.has(player.playerId) ? <span className={styles.award}>{t("awarded")}</span> : null}
                  {player.revealedCards?.length ? (
                    <div className={styles.used}>
                      {player.revealedCards.map((card) => {
                        const src = getNobCardArt(card.cardCode);
                        const label = getNobCardMeta(card.cardCode)?.displayName ?? card.cardCode;
                        return src ? (
                          <img key={card.instanceId ?? card.cardCode} src={src} alt={label} title={label} />
                        ) : (
                          <span key={card.instanceId ?? card.cardCode}>{label}</span>
                        );
                      })}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

function factionArt(
  winningBloodline: string | null | undefined,
  players: NobView["players"],
): string | null {
  if (winningBloodline === "HALFBLOOD") {
    return getNobBloodlineArt("HALFBLOOD");
  }
  const match = players.find((player) => player.publiclyRevealedBloodline?.type === winningBloodline);
  if (match?.publiclyRevealedBloodline) {
    return getNobBloodlineArt(match.publiclyRevealedBloodline.type, match.publiclyRevealedBloodline.rank);
  }
  return null;
}
