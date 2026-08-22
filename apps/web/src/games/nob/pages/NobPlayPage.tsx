import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { LogOut, Sparkles, Volume2, VolumeX } from "lucide-react";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
import { useLeaveRoom } from "@/shared/hooks/useRooms";
import type { MessageKey } from "@/shared/i18n/messages";
import { useLocale, useT } from "@/shared/i18n/useT";
import type { RoomView } from "@/shared/lobby/roomView";
import { NOB_BRANDING } from "../assets/nobAssetManifest";
import { getNobBloodlineArt, getNobCardMeta, getNobCardText, getNobMoonMarkArt } from "../assets/nobArt";
import { NobCard } from "../components/NobCard";
import { NobCountdown } from "../components/NobCountdown";
import { NobInspectModals } from "../components/NobInspectModals";
import { NobRoundSummary } from "../components/NobRoundSummary";
import { NobSeatCards, NobSeatCardsZoom, type SeatCardBoard } from "../components/NobSeatCards";
import { bloodlineTitle } from "../model/nobBloodlineCopy";
import { nobCardName, replaceNobCardCodes } from "../model/nobCardLabel";
import { useMoonPickReveal } from "../components/NobMoonTokens";
import { animationFromAnnouncement, announceText } from "../model/nobAnnounce";
import { useNobClock } from "../model/nobClock";
import { useNobPrefs } from "../model/nobPrefs";
import { NOB_DEFAULT_TIMING } from "../model/nobTiming";
import {
  NOB_DRAFT_PHASES,
  NOB_NIGHT_PHASES,
  NOB_REACTION_OPTIONS,
  sendNobAction,
} from "../model/nobActions";
import type { NobCardInstance, NobView } from "../model/nobTypes";
import styles from "./NobPlayPage.module.css";

interface NobPlayPageProps {
  room: RoomView;
  view: NobView | null;
  notice?: string | null;
  rejectCode?: string | null;
}

function cardRole(card: NobCardInstance): string | null {
  return card.roleType ?? getNobCardMeta(card.cardCode)?.roleType ?? null;
}

function optionLabel(option: string, t: (key: MessageKey) => string): string {
  if (option === "SPARE") {
    return t("spare");
  }
  if (option === "ELIMINATE") {
    return t("eliminate");
  }
  if (option === "KEEP_SECRET") {
    return t("keepSecret");
  }
  if (option === "REVEAL_PUBLIC") {
    return t("revealPublic");
  }
  if (option === "PLAY_NOW") {
    return t("playNow");
  }
  if (option === "KEEP_FOR_LATER") {
    return t("keepForLater");
  }
  return option.replace(/_/g, " ");
}

function canPlayEchoNow(card: NobCardInstance): boolean {
  const role = card.roleType ?? getNobCardMeta(card.cardCode)?.roleType;
  if (role === "SPECIAL" || card.cardCode.startsWith("NOB-SP-")) {
    return false;
  }
  const effect = card.effectCode;
  return effect !== "VEIL_REVERSAL" && effect !== "LAST_OFFERING" && effect !== "LAST_HOPE";
}

export function NobPlayPage({ room, view, notice, rejectCode }: NobPlayPageProps) {
  const t = useT();
  const locale = useLocale();
  const leave = useLeaveRoom();
  const sound = useNobPrefs((state) => state.sound);
  const animations = useNobPrefs((state) => state.animations);
  const setSound = useNobPrefs((state) => state.setSound);
  const setAnimations = useNobPrefs((state) => state.setAnimations);
  const reducedMotion = animations === "REDUCED";
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actedKey, setActedKey] = useState<string | null>(null);
  const [selectedEchoId, setSelectedEchoId] = useState<string | null>(null);
  const [inspected, setInspected] = useState<NobCardInstance | null>(null);
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(null);
  const [inspectMode, setInspectMode] = useState<"role" | "cards" | null>(null);
  const [pickedToken, setPickedToken] = useState<string | null>(null);
  const [seatCards, setSeatCards] = useState<SeatCardBoard | null>(null);
  const [inspectShrunk, setInspectShrunk] = useState(false);
  const [hunterChoicesReady, setHunterChoicesReady] = useState(false);

  const phase = view?.phase ?? "Connecting";
  const phaseKey = `${view?.roundNumber ?? view?.round ?? 0}:${phase}`;
  const finished = Boolean(view?.finished || phase === "GAME_OVER" || room.status === "finished");
  const pending = view?.myPendingDecision ?? null;
  const alreadyActed = actedKey === phaseKey || Boolean(view?.submittedPlayerIds?.includes(view.you));
  const drafting = Boolean(view && NOB_DRAFT_PHASES.has(phase) && !finished);
  const resultDisplay = view?.phaseState === "RESOLUTION_RESULT_DISPLAY";
  const nightSubmit =
    Boolean(view) &&
    NOB_NIGHT_PHASES.has(phase) &&
    (view?.phaseState === "WAITING_FOR_PHASE_SUBMISSIONS" || !view?.phaseState) &&
    !resultDisplay &&
    !pending &&
    !finished;
  const you = view?.players.find((player) => player.you || player.playerId === view.you);
  const alive = you?.alive !== false;
  const draftHand = view?.myDraftHand ?? [];
  const hand = view?.myHand ?? [];
  const echoCards = view?.echoCards ?? [];
  const echoPending = pending?.type === "ECHO_CHOOSE";
  const pickHiddenPending = pending?.type === "CHOOSE_HIDDEN_CARD";
  const echoKey = echoCards.map((card) => card.instanceId).join(",");
  const selectedEchoCard = echoCards.find((card) => card.instanceId === selectedEchoId) ?? echoCards[0] ?? null;
  const visibleHand = drafting && draftHand.length > 0 ? draftHand : hand;
  const matchingNightCards = nightSubmit ? hand.filter((card) => cardRole(card) === phase) : [];
  const timing = view?.timing ?? room.nobTiming ?? NOB_DEFAULT_TIMING;
  const { remainingMs } = useNobClock(view?.serverTime);
  const deadline = pending?.expiresAt ?? view?.deadline ?? null;
  const remain = remainingMs(deadline);
  const timedOut = remain != null && remain <= 0 && remain >= -12_000;
  const canSubmitNight = nightSubmit && alive && matchingNightCards.length > 0 && !alreadyActed && !timedOut;
  const nightPromptCards = canSubmitNight ? matchingNightCards : [];
  const canDraft = drafting && alive && draftHand.length > 0 && !alreadyActed && !timedOut;
  const isSummary = phase === "ROUND_SUMMARY";
  const moonPick = pending?.type === "MOON_MARK_PICK";
  const tokenOptions = moonPick && pending ? pending.allowedOptions : [];
  const canPickToken = Boolean(isSummary && moonPick && !timedOut && !busy);
  const spectatorPick = Boolean(isSummary && view?.currentDecisionType === "MOON_MARK_PICK" && !moonPick);
  const revealedToken = useMoonPickReveal(view?.myMoonMarkValues, pickedToken);
  const frozen = busy || (finished && !isSummary) || timedOut;

  const seats = useMemo(() => {
    if (view?.players?.length) {
      return [...view.players].sort((left, right) => left.seat - right.seat);
    }
    return room.players.map((player, index) => ({
      playerId: player.playerId,
      displayName: player.displayName,
      seat: index,
      alive: true,
      you: false,
      moonMarkCount: 0,
      score: null,
      publiclyRevealedBloodline: null,
      revealedCards: [],
      hiddenCardCount: 0,
    }));
  }, [room.players, view?.players]);

  const tableSeats = useMemo(() => {
    const youIndex = seats.findIndex((seat) => seat.you || seat.playerId === view?.you);
    if (youIndex <= 0) {
      return seats;
    }
    return [...seats.slice(youIndex), ...seats.slice(0, youIndex)];
  }, [seats, view?.you]);

  const reveal = view?.inspectReveal ?? null;
  const hunterPending = pending?.type === "HUNTER_DECISION";
  const hunterTargetId = hunterPending ? (pending?.targetPlayerId ?? reveal?.targetPlayerId ?? null) : null;
  const hunterBloodline = hunterPending
    ? (reveal?.bloodline ??
        view?.myObservations?.find((obs) => obs.kind === "BLOODLINE" && obs.targetPlayerId === hunterTargetId)
          ?.bloodline ??
        null)
    : null;
  const hunterArt = hunterBloodline ? getNobBloodlineArt(hunterBloodline.type, hunterBloodline.rank) : null;
  const revealArt = reveal?.bloodline ? getNobBloodlineArt(reveal.bloodline.type, reveal.bloodline.rank) : null;
  const publicRevealId =
    view?.announcement?.type === "BLOODLINE_PUBLICLY_REVEALED" ? (view.announcement.targetPlayerId ?? null) : null;
  const publicRevealLine = publicRevealId
    ? (seats.find((seat) => seat.playerId === publicRevealId)?.publiclyRevealedBloodline ??
        view?.myObservations?.find((obs) => obs.kind === "BLOODLINE" && obs.targetPlayerId === publicRevealId)
          ?.bloodline ??
        null)
    : null;
  const publicRevealArt = publicRevealLine ? getNobBloodlineArt(publicRevealLine.type, publicRevealLine.rank) : null;
  const unmaskPending = pending?.type === "UNMASK_REVEAL";
  const showSeerFlash = Boolean(
    !hunterPending &&
      !canSubmitNight &&
      reveal &&
      (revealArt || reveal.cardCode),
  );

  const winners = view?.winnerPlayerIds ?? [];
  const youWon = Boolean(view && winners.includes(view.you));
  const bloodlineSrc = view?.myBloodline
    ? getNobBloodlineArt(view.myBloodline.type, view.myBloodline.rank)
    : null;
  const lastHopeOn =
    view?.lastRoundResult?.lastHopeTriggered === true || view?.announcement?.type === "LAST_HOPE_TRIGGERED";
  const resolvingFallback =
    view?.resolving?.[0] ?? (view?.resolvingCardCode ? { cardCode: view.resolvingCardCode, instanceId: "resolving" } : null);
  const centerCard: NobCardInstance | null = lastHopeOn
    ? { instanceId: "last-hope", cardCode: "NOB-SP-LAST-HOPE" }
    : (view?.currentResolvingCard ?? resolvingFallback);
  const actorId = view?.currentActorPlayerId ?? view?.announcement?.actorPlayerId ?? null;
  const publicTargetId = view?.announcement?.targetPlayerId ?? null;
  const showRevealed = view?.phaseState !== "WAITING_FOR_PHASE_SUBMISSIONS";
  const announceUntil = remainingMs(view?.announcement?.displayUntil);
  const showAnnounce = Boolean(view?.announcement) && (announceUntil == null || announceUntil > 0);
  const announceLine = showAnnounce
    ? announceText(view?.announcement, seats, locale, view?.lastRoundResult)
    : null;
  const showPublicBloodline = Boolean(showAnnounce && publicRevealId && (publicRevealArt || publicRevealLine));
  const fx = animationFromAnnouncement(view?.announcement?.type);
  const resolveMs = timing.resolutionCardDisplayMs;
  const announceMs = timing.announcementDisplayMs;

  useEffect(() => {
    setBusy(false);
    if (pending?.type !== "ECHO_CHOOSE") {
      setSelectedEchoId(null);
    }
    if (rejectCode && rejectCode !== "ALREADY_SUBMITTED") {
      setActedKey((current) => (current === phaseKey ? null : current));
    }
  }, [view?.version, view?.phase, view?.phaseState, pending?.decisionId, pending?.type, notice, rejectCode, phaseKey]);

  useEffect(() => {
    if (!echoPending) {
      return;
    }
    setSelectedEchoId((current) => {
      if (current && echoCards.some((card) => card.instanceId === current)) {
        return current;
      }
      return echoCards[0]?.instanceId ?? null;
    });
  }, [echoPending, pending?.decisionId, echoKey]);

  useEffect(() => {
    setSelectedTargetId(null);
  }, [pending?.decisionId, view?.phase]);

  useEffect(() => {
    if (pending?.type === "CHOOSE_TARGET" || pending?.type === "CHOOSE_HIDDEN_CARD") {
      setSeatCards(null);
    }
  }, [pending?.type, pending?.decisionId]);

  useEffect(() => {
    if (phase !== "ROUND_SUMMARY" && pending?.type !== "MOON_MARK_PICK") {
      setPickedToken(null);
    }
  }, [phase, pending?.type, pending?.decisionId]);

  useEffect(() => {
    if (!inspected) {
      return;
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setInspected(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inspected]);

  useEffect(() => {
    if (hunterPending) {
      setInspectShrunk(false);
      const timer = window.setTimeout(() => setHunterChoicesReady(true), reducedMotion ? 0 : 700);
      return () => window.clearTimeout(timer);
    }
    setHunterChoicesReady(false);
    if (!reveal) {
      setInspectShrunk(false);
      return;
    }
    const until = reveal.displayUntil ? Date.parse(reveal.displayUntil) : Date.now() + 3000;
    const wait = Number.isFinite(until) ? Math.max(0, until - Date.now()) : 3000;
    const timer = window.setTimeout(() => setInspectShrunk(true), wait);
    return () => window.clearTimeout(timer);
  }, [hunterPending, pending?.decisionId, reveal, reveal?.targetPlayerId, reveal?.cardCode, reveal?.displayUntil, reducedMotion]);

  const send = useCallback(
    (payload: Record<string, unknown>, lockPhase = false) => {
      if (frozen) {
        return;
      }
      if (!alive && payload.type !== "NOB_REACTION" && payload.type !== "NOB_CHOOSE_OPTION") {
        return;
      }
      if (payload.type === "NOB_TIMEOUT") {
        return;
      }
      const decisionTypes = new Set([
        "NOB_CHOOSE_TARGET",
        "NOB_CHOOSE_OPTION",
        "NOB_HUNTER_DECISION",
        "NOB_REACTION",
      ]);
      const next = { ...payload };
      if (decisionTypes.has(String(next.type)) && pending?.decisionId && next.decisionId == null) {
        next.decisionId = pending.decisionId;
      }
      setBusy(true);
      if (lockPhase) {
        setActedKey(phaseKey);
      }
      sendNobAction(room.id, next);
    },
    [alive, frozen, pending?.decisionId, phaseKey, room.id],
  );

  const playCard = (card: NobCardInstance) => {
    if (!view || frozen) {
      return;
    }
    const pendingType = pending?.type;
    if (pendingType === "REACTION" && pending) {
      const option = NOB_REACTION_OPTIONS[card.cardCode];
      if (option && pending.allowedOptions.includes(option)) {
        send({ type: "NOB_REACTION", option, cardInstanceId: card.instanceId });
      }
      return;
    }
    if (pendingType === "ECHO_CHOOSE") {
      if (echoCards.some((item) => item.instanceId === card.instanceId)) {
        setSelectedEchoId(card.instanceId);
      }
      return;
    }
    if (canDraft && draftHand.some((item) => item.instanceId === card.instanceId)) {
      send({ type: "NOB_DRAFT_PICK", cardInstanceId: card.instanceId }, true);
      return;
    }
    if (canSubmitNight && matchingNightCards.some((item) => item.instanceId === card.instanceId)) {
      send({ type: "NOB_PHASE_SUBMIT", cardInstanceId: card.instanceId }, true);
    }
  };

  const inspectCard = (card: NobCardInstance) => {
    setInspected(card);
    if (pending?.type === "ECHO_CHOOSE" && echoCards.some((item) => item.instanceId === card.instanceId)) {
      setSelectedEchoId(card.instanceId);
    }
  };

  const onTarget = (playerId: string) => {
    if (!pending || pending.type !== "CHOOSE_TARGET" || frozen) {
      return;
    }
    if (!pending.allowedTargetIds.includes(playerId)) {
      return;
    }
    setSelectedTargetId(playerId);
    send({ type: "NOB_CHOOSE_TARGET", targetPlayerId: playerId, targetPlayerIds: [playerId] });
  };

  const onOption = (option: string, cardInstanceId?: string) => {
    if (!pending || frozen) {
      return;
    }
    const echoId =
      cardInstanceId ??
      selectedEchoId ??
      (pending.type === "ECHO_CHOOSE" ? echoCards[0]?.instanceId : undefined);
    if (pending.type === "CHOOSE_HIDDEN_CARD") {
      const hiddenId = cardInstanceId ?? option;
      if (!hiddenId || !pending.allowedOptions.includes(hiddenId)) {
        return;
      }
      send({
        type: "NOB_CHOOSE_OPTION",
        option: hiddenId,
        cardInstanceId: hiddenId,
        decisionId: pending.decisionId,
      });
      return;
    }
    if (pending.type === "ECHO_CHOOSE" && !echoId) {
      return;
    }
    if (pending.type === "ECHO_CHOOSE" && option === "PLAY_NOW") {
      const chosen = echoCards.find((card) => card.instanceId === echoId);
      if (!chosen || !canPlayEchoNow(chosen)) {
        return;
      }
    }
    const type = pending.type;
    const actionType =
      type === "HUNTER_DECISION"
        ? "NOB_HUNTER_DECISION"
        : type === "REACTION"
          ? "NOB_REACTION"
          : "NOB_CHOOSE_OPTION";
    send({
      type: actionType,
      option,
      cardInstanceId: echoId,
      decisionId: pending.decisionId,
    });
  };

  const cardEnabled = (card: NobCardInstance): boolean => {
    if (frozen) {
      return false;
    }
    if (pending?.type === "REACTION") {
      const option = NOB_REACTION_OPTIONS[card.cardCode];
      return Boolean(option && pending.allowedOptions.includes(option));
    }
    if (!alive) {
      return false;
    }
    if (pending?.type === "ECHO_CHOOSE") {
      return echoCards.some((item) => item.instanceId === card.instanceId);
    }
    if (canDraft) {
      return draftHand.some((item) => item.instanceId === card.instanceId);
    }
    if (canSubmitNight) {
      return matchingNightCards.some((item) => item.instanceId === card.instanceId);
    }
    return false;
  };

  const youAreActor = Boolean(pending);
  const spectatorHint =
    !youAreActor && actorId
      ? `${seats.find((seat) => seat.playerId === actorId)?.displayName ?? ""} ${
          view?.currentDecisionType === "CHOOSE_TARGET" ? t("actorSelecting") : t("actorDeciding")
        }`
      : null;
  const prompt = timedOut
    ? t("timeUpWaiting")
    : echoPending
      ? t("chooseEchoCard")
      : pickHiddenPending
        ? t("chooseHiddenCard")
      : pending
      ? pending.type === "CHOOSE_TARGET"
        ? t("chooseTarget")
        : t("chooseOption")
      : drafting && !alreadyActed
        ? t("chooseOneCard")
        : alreadyActed && (drafting || nightSubmit)
          ? t("waitingOtherPlayers")
          : canSubmitNight
            ? matchingNightCards.length >= 2
              ? t("playBothHint")
              : t("playThisCard")
            : t("waitingOthers");
  const inspectedText = inspected ? getNobCardText(inspected.cardCode, locale) : null;
  const inspectedPlayable = inspected ? cardEnabled(inspected) : false;
  const publicLog = view?.publicLog ?? [];

  const nameOf = (playerId?: string | null) =>
    playerId ? (seats.find((seat) => seat.playerId === playerId)?.displayName ?? playerId) : "";

  const historyLine = (entry: {
    type?: string;
    text?: string;
    actorPlayerId?: string | null;
    targetPlayerId?: string | null;
  }) => {
    const actor = nameOf(entry.actorPlayerId);
    const target = nameOf(entry.targetPlayerId);
    const code = entry.text?.match(/NOB-[A-Z0-9-]+/)?.[0];
    const card = nobCardName(code, locale);
    if ((entry.type === "NOB_ROLE_REVEALED" || /revealed/i.test(entry.text ?? "")) && (actor || entry.text) && card) {
      const who = actor || entry.text?.replace(/\s+revealed.*$/i, "").trim() || "";
      return t("historyRevealed").replace("{actor}", who).replace("{card}", card);
    }
    if (entry.type === "NOB_BLOODLINE_PUBLICLY_REVEALED") {
      const who = target || actor || entry.text?.replace(/\s+Bloodline was revealed.*$/i, "").trim() || "";
      const line =
        seats.find((seat) => seat.playerId === entry.targetPlayerId)?.publiclyRevealedBloodline ??
        view?.myObservations?.find(
          (obs) => obs.kind === "BLOODLINE" && obs.targetPlayerId === entry.targetPlayerId && obs.bloodline,
        )?.bloodline ??
        null;
      return t("historyBloodlineRevealed")
        .replace("{target}", who)
        .replace("{bloodline}", bloodlineTitle(line, locale));
    }
    if (entry.type === "NOB_INSPECTED" && actor && target) {
      return t("historyInspect").replace("{actor}", actor).replace("{target}", target);
    }
    if (entry.type === "NOB_PLAYER_ELIMINATED" && target) {
      return actor
        ? t("historyKilled").replace("{actor}", actor).replace("{target}", target)
        : t("historyDied").replace("{target}", target);
    }
    if (entry.type === "NOB_PLAYER_SPARED" && actor && target) {
      return t("historySpared").replace("{actor}", actor).replace("{target}", target);
    }
    return replaceNobCardCodes(entry.text ?? entry.type ?? "", locale);
  };

  const seatCardBoard = (seat: (typeof seats)[number]): SeatCardBoard => {
    const isYou = Boolean(seat.you || seat.playerId === view?.you);
    const revealed = showRevealed ? (seat.revealedCards ?? []) : [];
    const revealedCodes = new Set(revealed.map((card) => card.cardCode));
    const peeked = (view?.myObservations ?? [])
      .filter((obs) => obs.kind === "CARD" && obs.targetPlayerId === seat.playerId && obs.cardCode)
      .filter((obs) => !revealedCodes.has(obs.cardCode as string))
      .map((obs, index) => ({
        instanceId: `peek-${seat.playerId}-${obs.cardCode}-${index}`,
        cardCode: obs.cardCode as string,
      }));
    const ownUnused = isYou ? (drafting ? draftHand : hand) : [];
    let hiddenCount = ownUnused.length;
    if (!isYou) {
      if (typeof seat.hiddenCardCount === "number") {
        hiddenCount = seat.hiddenCardCount;
      } else if (phase === "DRAFT_PICK_1") {
        hiddenCount = 3;
      } else if (phase === "DRAFT_PICK_2") {
        hiddenCount = 2;
      } else {
        hiddenCount = Math.max(0, 2 - revealed.length);
      }
    }
    return {
      playerId: seat.playerId,
      displayName: seat.displayName,
      revealed,
      peeked: isYou ? [] : peeked,
      hiddenCount,
      ownUnused,
    };
  };

  const seatStyle = (index: number, total: number): CSSProperties => {
    if (total <= 0) {
      return {};
    }
    const angle = (Math.PI * 2 * index) / total + Math.PI / 2;
    return {
      left: `${50 + Math.cos(angle) * 46}%`,
      top: `${50 + Math.sin(angle) * 40}%`,
    };
  };

  const historyAside = (
    <aside className={styles.history} aria-label={t("historyTitle")}>
      <h2>{t("historyTitle")}</h2>
      {publicLog.length === 0 ? (
        <p>{t("historyEmpty")}</p>
      ) : (
        <ul>
          {publicLog.map((entry, index) => (
            <li key={`${entry.type ?? "log"}-${index}`}>{historyLine(entry)}</li>
          ))}
        </ul>
      )}
    </aside>
  );

  return (
    <div
      className={`${styles.page} ${reducedMotion ? styles.reduced : ""}`}
      style={{
        backgroundImage: `url(${NOB_BRANDING.visualIdentity})`,
        ["--nob-resolve-ms" as string]: `${resolveMs}ms`,
        ["--nob-announce-ms" as string]: `${announceMs}ms`,
      }}
    >
      <header className={styles.hud}>
        <button type="button" className={styles.leave} onClick={() => setConfirmLeave(true)}>
          <LogOut size={16} />
          {t("leaveRoom")}
        </button>
        <div>
          <h1>Night of Bloodlines</h1>
          <p>
            {room.name} · {phase}
            {view?.roundNumber != null ? ` · R${view.roundNumber}` : ""}
          </p>
        </div>
        <NobCountdown remainingMs={remain} reducedMotion={reducedMotion} />
        <div className={styles.hudTools}>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={sound ? t("soundOn") : t("soundOff")}
            onClick={() => setSound(!sound)}
          >
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </button>
          <button
            type="button"
            className={styles.iconBtn}
            aria-label={reducedMotion ? t("animationsReduced") : t("animationsFull")}
            onClick={() => setAnimations(reducedMotion ? "FULL" : "REDUCED")}
          >
            <Sparkles size={16} />
          </button>
          <button type="button" className={styles.textBtn} onClick={() => setInspectMode("role")}>
            {t("viewRole")}
          </button>
          <button type="button" className={styles.textBtn} onClick={() => setInspectMode("cards")}>
            {t("viewCards")}
          </button>
        </div>
      </header>

      {showAnnounce && announceLine ? (
        <p className={`${styles.announce} ${fx ? styles[`fx_${fx}`] : ""}`} role="status">
          {announceLine}
        </p>
      ) : null}

      {isSummary && view ? (
        <div className={styles.body}>
          <div className={styles.table}>
          <NobRoundSummary
            view={view}
            remainingMs={remain}
            reducedMotion={reducedMotion}
            timedOut={timedOut}
            tokenOptions={tokenOptions}
            canPickToken={canPickToken}
            pickedOption={pickedToken}
            revealedValue={revealedToken}
            spectatorPick={spectatorPick}
            onPickToken={(option) => {
              if (!canPickToken) {
                return;
              }
              setPickedToken(option);
              send({ type: "NOB_CHOOSE_OPTION", option, decisionId: pending?.decisionId });
            }}
            onViewRole={() => setInspectMode("role")}
            onViewCards={() => setInspectMode("cards")}
          />
          </div>
          {historyAside}
        </div>
      ) : (
      <>
      <div className={styles.body}>
        <aside className={styles.secret} aria-label="Private knowledge">
          {bloodlineSrc ? (
            <img src={bloodlineSrc} alt="Your Bloodline" />
          ) : (
            <p>
              {view?.myBloodlineKnowledge === "UNKNOWN_AFTER_SWAP" ? t("bloodlineUnknown") : t("hiddenBloodline")}
            </p>
          )}
          {view?.myMoonMarkValues?.length ? (
            <div className={styles.marks}>
              {view.myMoonMarkValues.map((value, index) => {
                const src = getNobMoonMarkArt(value);
                return src ? (
                  <img key={`${value}-${index}`} src={src} alt={`Moon ${value}`} />
                ) : (
                  <span key={`${value}-${index}`}>{value}</span>
                );
              })}
            </div>
          ) : null}
          {view?.myObservations?.length ? (
            <ul className={styles.notes}>
              {view.myObservations.map((obs, index) => (
                <li key={`${obs.kind}-${obs.targetPlayerId}-${index}`}>
                  {obs.kind} · {seats.find((seat) => seat.playerId === obs.targetPlayerId)?.displayName ?? obs.targetPlayerId}
                  {obs.bloodline ? ` · ${obs.bloodline.type} ${obs.bloodline.rank ?? ""}` : ""}
                  {obs.cardCode ? ` · ${nobCardName(obs.cardCode, locale)}` : ""}
                  {obs.moonMarkValue != null ? ` · ${obs.moonMarkValue}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </aside>

        <section className={styles.table}>
          <div className={styles.seats}>
            {tableSeats.map((seat, index) => {
              const targetable = Boolean(
                youAreActor &&
                  pending?.type === "CHOOSE_TARGET" &&
                  pending.allowedTargetIds.includes(seat.playerId) &&
                  !frozen,
              );
              const submitted = Boolean(view?.submittedPlayerIds?.includes(seat.playerId));
              const publicLine = seat.publiclyRevealedBloodline;
              const peekedLine = view?.myObservations?.find(
                (obs) => obs.kind === "BLOODLINE" && obs.targetPlayerId === seat.playerId && obs.bloodline,
              )?.bloodline;
              const line = publicLine ?? peekedLine ?? null;
              const lineArt = line ? getNobBloodlineArt(line.type, line.rank) : null;
              const board = seatCardBoard(seat);
              return (
                <div
                  key={seat.playerId}
                  className={styles.seat}
                  style={seatStyle(index, tableSeats.length)}
                  data-you={seat.you || seat.playerId === view?.you ? "true" : "false"}
                  data-dead={seat.alive === false ? "true" : "false"}
                  data-target={targetable ? "true" : "false"}
                  data-actor={actorId === seat.playerId ? "true" : "false"}
                  data-submitted={submitted ? "true" : "false"}
                  data-selected={
                    selectedTargetId === seat.playerId || publicTargetId === seat.playerId ? "true" : "false"
                  }
                >
                  <button
                    type="button"
                    className={styles.seatHit}
                    disabled={pending?.type === "CHOOSE_TARGET" && !targetable}
                    onClick={() => onTarget(seat.playerId)}
                  >
                    {lineArt ? (
                      <img
                        className={styles.seatArt}
                        data-peeked={!publicLine && peekedLine ? "true" : "false"}
                        src={lineArt}
                        alt=""
                      />
                    ) : null}
                    <strong>{seat.displayName}</strong>
                    <span>
                      {line ? `${line.type}${line.rank != null ? ` ${line.rank}` : ""} · ` : ""}
                      {seat.alive === false ? "—" : `M${seat.moonMarkCount ?? 0}`}
                      {submitted ? ` · ✓` : ""}
                      {showRevealed && seat.score != null ? ` · ${seat.score}` : ""}
                    </span>
                  </button>
                  <NobSeatCards
                    board={board}
                    onOpen={() => {
                      if (pending?.type === "CHOOSE_TARGET") {
                        if (targetable) {
                          onTarget(seat.playerId);
                        }
                        return;
                      }
                      setSeatCards(board);
                    }}
                  />
                </div>
              );
            })}
          </div>
          <div className={styles.centerStage}>
            {lastHopeOn ? <p className={styles.lastHope}>{t("lastHopeTitle")}</p> : null}
            {lastHopeOn && view?.lastRoundResult ? (
              <p className={styles.hint}>
                {view.lastRoundResult.winningBloodline
                  ? view.lastRoundResult.winningBloodline
                  : locale === "vi"
                    ? "Vòng này hòa / Halfblood."
                    : "The round is tied / Halfblood."}
              </p>
            ) : null}
            {echoPending ? (
              <div className={styles.echoPick} aria-label={t("chooseEchoCard")}>
                <p className={styles.hint}>{t("chooseEchoCard")}</p>
                <div className={styles.echoRow}>
                  {echoCards.map((card) => (
                    <NobCard
                      key={card.instanceId}
                      cardCode={card.cardCode}
                      selected={selectedEchoCard?.instanceId === card.instanceId}
                      playable
                      revealed
                      onClick={() => setSelectedEchoId(card.instanceId)}
                    />
                  ))}
                </div>
                {selectedEchoCard && !canPlayEchoNow(selectedEchoCard) ? (
                  <p className={styles.hint}>{t("echoCannotPlayNow")}</p>
                ) : null}
                <div className={styles.options}>
                  <button
                    type="button"
                    className={styles.pass}
                    disabled={frozen || !selectedEchoCard || !canPlayEchoNow(selectedEchoCard)}
                    onClick={() => onOption("PLAY_NOW", selectedEchoCard?.instanceId)}
                  >
                    {t("playNow")}
                  </button>
                  <button
                    type="button"
                    className={styles.pass}
                    disabled={frozen || !selectedEchoCard}
                    onClick={() => onOption("KEEP_FOR_LATER", selectedEchoCard?.instanceId)}
                  >
                    {t("keepForLater")}
                  </button>
                </div>
              </div>
            ) : pickHiddenPending ? (
              <div className={styles.echoPick} aria-label={t("chooseHiddenCard")}>
                {revealArt ? <img className={styles.peekRole} src={revealArt} alt={nameOf(pending?.targetPlayerId)} /> : null}
                <p className={styles.hint}>{t("chooseHiddenCard")}</p>
                <div className={styles.echoRow}>
                  {(pending?.allowedOptions ?? []).map((cardId) => (
                    <NobCard
                      key={cardId}
                      face="down"
                      playable={!frozen}
                      selected={false}
                      onClick={() => onOption(cardId, cardId)}
                    />
                  ))}
                </div>
              </div>
            ) : hunterPending ? (
              <div className={styles.hunterReveal} aria-label={t("hunterSeeRole")}>
                {hunterArt ? (
                  <img src={hunterArt} alt={t("hunterSeeRole")} />
                ) : (
                  <p>{nameOf(hunterTargetId)}</p>
                )}
                {hunterChoicesReady && pending?.allowedOptions.length ? (
                  <div className={styles.options}>
                    {pending.allowedOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={styles.pass}
                        disabled={frozen}
                        onClick={() => onOption(option)}
                      >
                        {optionLabel(option, t)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : showPublicBloodline ? (
              <div className={styles.inspectFlash} aria-label={nameOf(publicRevealId)}>
                {publicRevealArt ? (
                  <img src={publicRevealArt} alt={bloodlineTitle(publicRevealLine, locale)} />
                ) : null}
                <p className={styles.hint}>{nameOf(publicRevealId)}</p>
                <p className={styles.hint}>{bloodlineTitle(publicRevealLine, locale)}</p>
              </div>
            ) : unmaskPending || (showSeerFlash && pending) ? (
              <div className={styles.inspectFlash} aria-label={nameOf(reveal?.targetPlayerId ?? pending?.targetPlayerId)}>
                {revealArt ? <img src={revealArt} alt={nameOf(reveal?.targetPlayerId)} /> : null}
                {reveal?.cardCode ? <NobCard cardCode={reveal.cardCode} revealed /> : null}
                {pending?.allowedOptions.length ? (
                  <div className={styles.options}>
                    {pending.allowedOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={styles.pass}
                        disabled={frozen || (pending.type === "ECHO_CHOOSE" && !selectedEchoId)}
                        onClick={() => onOption(option)}
                      >
                        {optionLabel(option, t)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : nightPromptCards.length > 0 ? (
              <div className={styles.phasePrompt} aria-label={t("yourPhaseCard")}>
                {nightPromptCards.map((card) => {
                  const text = getNobCardText(card.cardCode, locale);
                  return (
                    <div key={card.instanceId ?? card.cardCode} className={styles.phasePromptCard}>
                      <NobCard cardCode={card.cardCode} playable revealed onClick={() => playCard(card)} />
                      <p>{text?.name ?? nobCardName(card.cardCode, locale)}</p>
                      <button
                        type="button"
                        className={styles.pass}
                        disabled={frozen}
                        onClick={() => playCard(card)}
                      >
                        {t("playThisCard")}
                      </button>
                    </div>
                  );
                })}
                {nightPromptCards.length >= 2 ? (
                  <div className={styles.playBoth}>
                    <button
                      type="button"
                      className={styles.pass}
                      disabled={frozen}
                      onClick={() => send({ type: "NOB_PHASE_SUBMIT", option: "PLAY_BOTH" }, true)}
                    >
                      {t("playBothCards")}
                    </button>
                  </div>
                ) : null}
                <button
                  type="button"
                  className={styles.detailClose}
                  disabled={frozen}
                  onClick={() => send({ type: "NOB_PHASE_SUBMIT", option: "PASS" }, true)}
                >
                  {t("skipCard")}
                </button>
              </div>
            ) : inspected && inspectedText ? (
              <article className={styles.detail} aria-label={t("cardDetailTitle")}>
                <NobCard
                  cardCode={inspected.cardCode}
                  selected
                  revealed
                  playable={inspectedPlayable}
                  onClick={() => setInspected(null)}
                />
                <div className={styles.detailCopy}>
                  <h2>{inspectedText.name}</h2>
                  <p className={styles.detailTip}>{inspectedText.tooltip}</p>
                  <p>{inspectedText.description}</p>
                  <div className={styles.detailActions}>
                    {echoPending && echoCards.some((card) => card.instanceId === inspected.instanceId) ? (
                      <>
                        <button
                          type="button"
                          className={styles.pass}
                          disabled={frozen || !canPlayEchoNow(inspected)}
                          onClick={() => {
                            onOption("PLAY_NOW", inspected.instanceId);
                            setInspected(null);
                          }}
                        >
                          {t("playNow")}
                        </button>
                        <button
                          type="button"
                          className={styles.pass}
                          disabled={frozen}
                          onClick={() => {
                            onOption("KEEP_FOR_LATER", inspected.instanceId);
                            setInspected(null);
                          }}
                        >
                          {t("keepForLater")}
                        </button>
                      </>
                    ) : inspectedPlayable ? (
                      <button
                        type="button"
                        className={styles.pass}
                        disabled={frozen}
                        onClick={() => {
                          playCard(inspected);
                          setInspected(null);
                        }}
                      >
                        {canDraft ? t("pickThisCard") : t("playThisCard")}
                      </button>
                    ) : null}
                    <button type="button" className={styles.detailClose} onClick={() => setInspected(null)}>
                      {t("closeCardDetail")}
                    </button>
                  </div>
                </div>
              </article>
            ) : showSeerFlash ? (
              <div
                className={styles.inspectFlash}
                data-shrunk={inspectShrunk ? "true" : "false"}
                aria-label={nameOf(reveal?.targetPlayerId)}
              >
                {revealArt ? <img src={revealArt} alt={nameOf(reveal?.targetPlayerId)} /> : null}
                {reveal?.cardCode ? <NobCard cardCode={reveal.cardCode} revealed /> : null}
              </div>
            ) : centerCard ? (
              <div className={`${styles.centerCard} ${fx ? styles[`fx_${fx}`] : ""}`}>
                <NobCard cardCode={centerCard.cardCode} revealed onClick={() => inspectCard(centerCard)} />
              </div>
            ) : (
              <p className={styles.phase}>{drafting ? t("chooseOneCard") : phase}</p>
            )}
            <p className={styles.hint}>{spectatorHint || prompt}</p>
            {pending?.allowedOptions.length &&
            pending.type !== "HUNTER_DECISION" &&
            pending.type !== "UNMASK_REVEAL" &&
            pending.type !== "ECHO_CHOOSE" &&
            pending.type !== "CHOOSE_HIDDEN_CARD" &&
            nightPromptCards.length === 0 ? (
              <div className={styles.options}>
                {pending.allowedOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={styles.pass}
                    disabled={frozen || (pending.type === "ECHO_CHOOSE" && !selectedEchoId)}
                    onClick={() => onOption(option)}
                  >
                    {optionLabel(option, t)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>
        {historyAside}
      </div>

      {echoCards.length > 0 && !echoPending ? (
        <section className={styles.hand} aria-label="Echo cards">
          {echoCards.map((card) => (
            <NobCard
              key={card.instanceId}
              cardCode={card.cardCode}
              selected={selectedEchoId === card.instanceId || inspected?.instanceId === card.instanceId}
              playable={cardEnabled(card)}
              dimmed={!cardEnabled(card)}
              onClick={() => inspectCard(card)}
            />
          ))}
        </section>
      ) : null}

      <section className={styles.hand} aria-label="Hand">
        {visibleHand.length === 0 ? (
          <p>{view ? t("noCardsInHand") : t("waitingSnapshot")}</p>
        ) : (
          visibleHand.map((card) => (
            <NobCard
              key={card.instanceId ?? card.cardCode}
              cardCode={card.cardCode}
              selected={selectedEchoId === card.instanceId || inspected?.instanceId === card.instanceId}
              playable={cardEnabled(card)}
              dimmed={!cardEnabled(card)}
              onClick={() => (canSubmitNight && cardEnabled(card) ? playCard(card) : inspectCard(card))}
            />
          ))
        )}
      </section>
      </>
      )}

      {notice ? <p className={styles.notice}>{notice}</p> : null}

      <NobInspectModals
        view={view}
        roleOpen={inspectMode === "role"}
        cardsOpen={inspectMode === "cards"}
        onClose={() => setInspectMode(null)}
      />
      <NobSeatCardsZoom board={seatCards} onClose={() => setSeatCards(null)} />

      {phase === "GAME_OVER" || (finished && !isSummary) ? (
        <div className={styles.overLayer}>
          <div className={`${styles.over} theme-panel`}>
            <h2>{t("gameOver")}</h2>
            <p>{youWon ? t("youWin") : winners.length > 1 ? t("sharedWin") : t("youLose")}</p>
            <ul>
              {seats
                .filter((seat) => winners.includes(seat.playerId))
                .map((seat) => (
                  <li key={seat.playerId}>
                    {seat.displayName}
                    {seat.score != null ? ` · ${seat.score}` : ""}
                  </li>
                ))}
            </ul>
            <button type="button" className={styles.leave} onClick={() => setConfirmLeave(true)}>
              <LogOut size={16} />
              {t("leaveRoom")}
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={confirmLeave}
        title={t("leaveConfirmTitle")}
        body={t("leaveConfirmBody")}
        confirmLabel={t("leaveConfirmYes")}
        cancelLabel={t("leaveConfirmNo")}
        pending={leave.isPending}
        error={leave.error?.message ?? null}
        onConfirm={() => leave.mutate(room.id)}
        onCancel={() => setConfirmLeave(false)}
      />
    </div>
  );
}
