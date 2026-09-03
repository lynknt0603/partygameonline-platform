import { useCallback, useEffect, useMemo, useState, type CSSProperties } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { ArrowRight, LogOut, Sparkles, Swords, Trophy, Volume2, VolumeX } from "lucide-react";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
import { PlayerAvatar } from "@/shared/components/PlayerAvatar/PlayerAvatar";
import { fetchRoom } from "@/shared/api/rooms";
import { useLeaveRoom } from "@/shared/hooks/useRooms";
import type { MessageKey } from "@/shared/i18n/messages";
import { useLocale, useT } from "@/shared/i18n/useT";
import type { RoomView } from "@/shared/lobby/roomView";
import { NOB_UI } from "../assets/nobAssetManifest";
import {
  getNobBloodlineArt,
  getNobBloodlineCardBack,
  getNobCardMeta,
  getNobCardText,
  getNobMoonMarkArt,
  getNobMoonMarkBack,
} from "../assets/nobArt";
import { NobCard } from "../components/NobCard";
import { NobCountdown } from "../components/NobCountdown";
import { NobInspectModals } from "../components/NobInspectModals";
import { NobMoonTokens, useMoonPickReveals } from "../components/NobMoonTokens";
import { NobRoundSummary } from "../components/NobRoundSummary";
import { NobSeatCards, NobSeatCardsZoom, type SeatCardBoard } from "../components/NobSeatCards";
import { bloodlineTitle } from "../model/nobBloodlineCopy";
import { formatNobHistory } from "../model/nobHistory";
import { nobCardName } from "../model/nobCardLabel";
import { formatCurrentElo } from "../model/nobElo";
import { animationFromAnnouncement, announceText } from "../model/nobAnnounce";
import { useNobClock } from "../model/nobClock";
import { useNobPrefs } from "../model/nobPrefs";
import { playNobSfx, unlockNobSfx } from "../model/nobSfx";
import { NOB_DEFAULT_TIMING } from "../model/nobTiming";
import {
  NOB_DRAFT_PHASES,
  NOB_NIGHT_PHASES,
  NOB_REACTION_OPTIONS,
  sendNobAction,
} from "../model/nobActions";
import type { NobCardInstance, NobPlayerPublic, NobView } from "../model/nobTypes";
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

function formatNobPhase(phase: string, t: (key: MessageKey) => string): string {
  switch (phase) {
    case "DRAFT_HAND_1":
      return t("phaseDraft1");
    case "DRAFT_HAND_2":
      return t("phaseDraft2");
    case "SHADOW_STALKER":
      return t("phaseShadowStalker");
    case "BLOOD_SEER":
      return t("phaseBloodSeer");
    case "SHAPESHIFTER":
      return t("phaseShapeshifter");
    case "FERAL_KILLER":
      return t("phaseFeralKiller");
    case "HUNTER":
      return t("phaseHunter");
    case "ROUND_SUMMARY":
      return t("phaseRoundSummary");
    case "GAME_OVER":
      return t("phaseGameOver");
    case "Connecting":
      return t("phaseConnecting");
    default:
      return phase;
  }
}

function optionLabel(option: string, t: (key: MessageKey) => string, pendingType?: string | null): string {
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
  if (option === "INSPECT_BLOODLINE") {
    return t("inspectBloodline");
  }
  if (option === "INSPECT_TOKEN") {
    return t("inspectToken");
  }
  if (option === "SKIP") {
    return t("skipCard");
  }
  if (option === "SWAP") {
    return pendingType === "MOON_BROKER" ? t("swapMoonToken") : t("swapBloodlines");
  }
  if (option === "KEEP") {
    return pendingType === "MOON_BROKER" ? t("keepMoonToken") : t("keepBloodlines");
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
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
  const [pickedTokens, setPickedTokens] = useState<string[]>([]);
  const [tokenSnapshot, setTokenSnapshot] = useState<string[]>([]);
  const [moonStealReveal, setMoonStealReveal] = useState<{
    optionId: string;
    decisionId: string | null;
    initialRejectCode: string | null;
  } | null>(null);
  const [seatCards, setSeatCards] = useState<SeatCardBoard | null>(null);
  const [inspectShrunk, setInspectShrunk] = useState(false);
  const [hunterChoicesReady, setHunterChoicesReady] = useState(false);
  const [returningToLobby, setReturningToLobby] = useState(false);

  const phase = view?.phase ?? "Connecting";
  const phaseKey = `${view?.roundNumber ?? view?.round ?? 0}:${phase}`;
  const phaseIntro = view?.phaseState === "PHASE_INTRO";
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
  const echoSourceCard = view?.echoSourceCard ?? null;
  const echoPending = pending?.type === "ECHO_CHOOSE";
  const pickHiddenPending = pending?.type === "CHOOSE_HIDDEN_CARD";
  const pickMoonPending = pending?.type === "CHOOSE_MOON_TOKEN";
  const moonStealPending = Boolean(pickMoonPending && pending?.optionValues !== undefined);
  const moonBrokerPending = pending?.type === "MOON_BROKER";
  const moonSwapStep = Boolean(moonBrokerPending && pending?.allowedOptions.includes("KEEP"));
  const lastMoonPeek = [...(view?.myObservations ?? [])].reverse().find((obs) => obs.kind === "MOON");
  const lastMoonArt =
    lastMoonPeek?.moonMarkValue != null ? getNobMoonMarkArt(lastMoonPeek.moonMarkValue) : null;
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
  const liveTokenOptions = moonPick && pending ? pending.allowedOptions : [];
  const tokenOptionKey = liveTokenOptions.join("|");
  const tokenOptions = tokenSnapshot.length > 0 ? tokenSnapshot : liveTokenOptions;
  const canPickToken = Boolean(isSummary && moonPick && !timedOut && !busy);
  const spectatorPick = Boolean(isSummary && view?.currentDecisionType === "MOON_MARK_PICK" && !moonPick);
  const revealedByOption = useMoonPickReveals(view?.myMoonMarkValues, pickedTokens);
  const lastPickedToken = pickedTokens[pickedTokens.length - 1] ?? pickedToken;
  const revealedToken = lastPickedToken ? (revealedByOption[lastPickedToken] ?? null) : null;
  const moonStealPickedOptions = moonStealReveal ? [moonStealReveal.optionId] : [];
  const revealedMoonStealByOption = useMoonPickReveals(view?.myMoonMarkValues, moonStealPickedOptions);
  const revealedMoonStealValue = moonStealReveal
    ? (revealedMoonStealByOption[moonStealReveal.optionId] ?? null)
    : null;
  const frozen = busy || phaseIntro || (finished && !isSummary);

  const returnToLobby = useCallback(async () => {
    if (returningToLobby) {
      return;
    }
    setReturningToLobby(true);
    setInspectMode(null);
    setConfirmLeave(false);
    const normalizedRoomId = room.id.toUpperCase();
    try {
      let freshRoom = await fetchRoom(normalizedRoomId);
      for (let attempt = 0; freshRoom.status !== "WAITING" && attempt < 20; attempt += 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 100));
        freshRoom = await fetchRoom(normalizedRoomId);
      }
      queryClient.setQueryData(["room", normalizedRoomId], freshRoom);
      navigate(`/rooms/${freshRoom.id}`, { replace: true });
    } catch {
      await queryClient.invalidateQueries({ queryKey: ["room", normalizedRoomId] });
      navigate(`/rooms/${normalizedRoomId}`, { replace: true });
    }
  }, [navigate, queryClient, returningToLobby, room.id]);

  const seats = useMemo<NobPlayerPublic[]>(() => {
    if (view?.players?.length) {
      return view.players
        .map((player) => ({
          ...player,
          avatarUrl: room.players.find((roomPlayer) => roomPlayer.playerId === player.playerId)?.avatarUrl ?? player.avatarUrl,
        }))
        .sort((left, right) => left.seat - right.seat);
    }
    return room.players.map((player, index) => ({
      playerId: player.playerId,
      displayName: player.displayName,
      avatarUrl: player.avatarUrl,
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
  const swapPending = pending?.type === "SHAPE_SWAP";
  const swapTargetIds = swapPending ? pending.allowedTargetIds : [];
  const swapLines = swapTargetIds.map((id) => ({
    id,
    bloodline:
      view?.myObservations?.find((obs) => obs.kind === "BLOODLINE" && obs.targetPlayerId === id)?.bloodline ?? null,
  }));
  const inspectDecision =
    pending?.type === "UNMASK_REVEAL" ||
    pending?.type === "SHAPE_SWAP" ||
    pending?.type === "HUNTER_DECISION" ||
    pending?.type === "CHOOSE_HIDDEN_CARD";
  const showSeerFlash = Boolean(
    !hunterPending &&
      !swapPending &&
      !canSubmitNight &&
      reveal &&
      (revealArt || reveal.cardCode) &&
      (inspectDecision || !pending),
  );

  const winners = view?.winnerPlayerIds ?? [];
  const youWon = Boolean(view && winners.includes(view.you));
  const finalStandings = useMemo(() => {
    const sorted = [...seats].sort((left, right) => {
      const scoreDifference = (right.score ?? right.moonMarkCount ?? 0) - (left.score ?? left.moonMarkCount ?? 0);
      return scoreDifference !== 0 ? scoreDifference : left.seat - right.seat;
    });
    let previousScore: number | null = null;
    let rank = 0;
    return sorted.map((seat, index) => {
      const score = seat.score ?? seat.moonMarkCount ?? 0;
      if (previousScore == null || score !== previousScore) {
        rank = index + 1;
        previousScore = score;
      }
      return { seat, score, rank };
    });
  }, [seats]);
  const yourEloDisplay = you ? formatCurrentElo(you) : null;
  const bloodlineSrc = view?.myBloodline
    ? getNobBloodlineArt(view.myBloodline.type, view.myBloodline.rank)
    : null;
  const lastHopeOn =
    view?.lastRoundResult?.lastHopeTriggered === true || view?.announcement?.type === "LAST_HOPE_TRIGGERED";
  const resolvingFallback =
    view?.resolving?.[0] ?? (view?.resolvingCardCode ? { cardCode: view.resolvingCardCode, instanceId: "resolving" } : null);
  const specialRevealCode =
    view?.announcement?.type === "VEIL_REVERSAL" ||
    view?.announcement?.type === "GLORIOUS_SACRIFICE" ||
    view?.announcement?.type === "LAST_HOPE_TRIGGERED"
      ? (view.announcement.cardCode ?? view.announcement.reactionCardCode ?? null)
      : null;
  const centerCard: NobCardInstance | null = lastHopeOn
    ? { instanceId: "last-hope", cardCode: "NOB-SP-LAST-HOPE" }
    : specialRevealCode
      ? { instanceId: "special-reveal", cardCode: specialRevealCode }
      : (view?.currentResolvingCard ?? resolvingFallback);
  const echoPair = (() => {
    const cards: NobCardInstance[] = [];
    const push = (card: NobCardInstance | null | undefined) => {
      if (!card?.cardCode) {
        return;
      }
      const id = card.instanceId ?? card.cardCode;
      if (cards.some((item) => (item.instanceId ?? item.cardCode) === id)) {
        return;
      }
      cards.push(card);
    };
    push(echoSourceCard);
    if (echoPending || echoSourceCard) {
      echoCards.forEach(push);
    }
    return cards;
  })();
  const showEchoPair = echoPair.length > 0;
  const actorId = view?.currentActorPlayerId ?? view?.announcement?.actorPlayerId ?? null;
  const publicTargetId = view?.announcement?.targetPlayerId ?? null;
  const showRevealed = view?.phaseState !== "WAITING_FOR_PHASE_SUBMISSIONS";
  const announceUntil = remainingMs(view?.announcement?.displayUntil);
  const showAnnounce = Boolean(view?.announcement) && (announceUntil == null || announceUntil > 0);
  const hideSubmitterName = Boolean(nightSubmit && !pending);
  const announceLine = showAnnounce
    ? announceText(
        view?.announcement,
        seats,
        locale,
        view?.lastRoundResult,
        hideSubmitterName ? t("anonymousPlayer") : null,
      )
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
    if (!tokenOptionKey) {
      return;
    }
    const next = tokenOptionKey.split("|");
    setTokenSnapshot((current) => (current.length === 0 ? next : current));
  }, [tokenOptionKey]);

  useEffect(() => {
    if (phase !== "ROUND_SUMMARY" && pending?.type !== "MOON_MARK_PICK") {
      setPickedToken(null);
      setPickedTokens([]);
      setTokenSnapshot([]);
    }
  }, [phase, pending?.type, pending?.decisionId]);

  useEffect(() => {
    if (!moonStealReveal) {
      return;
    }
    const timer = window.setTimeout(
      () => setMoonStealReveal(null),
      revealedMoonStealValue == null ? 5000 : reducedMotion ? 1800 : 3200,
    );
    return () => window.clearTimeout(timer);
  }, [moonStealReveal, revealedMoonStealValue, reducedMotion]);

  useEffect(() => {
    if (
      !moonStealReveal ||
      !rejectCode ||
      rejectCode === moonStealReveal.initialRejectCode ||
      pending?.decisionId !== moonStealReveal.decisionId
    ) {
      return;
    }
    setMoonStealReveal(null);
  }, [moonStealReveal, pending?.decisionId, rejectCode]);

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

  const inspectCue = hunterPending
    ? `hunter:${hunterTargetId ?? ""}`
    : unmaskPending || showSeerFlash
      ? `seer:${reveal?.targetPlayerId ?? ""}:${reveal?.cardCode ?? ""}`
      : pickHiddenPending
        ? `hidden:${pending?.targetPlayerId ?? ""}`
        : "";

  useEffect(() => {
    const unlock = () => unlockNobSfx();
    window.addEventListener("pointerdown", unlock, { once: true });
    return () => window.removeEventListener("pointerdown", unlock);
  }, []);

  useEffect(() => {
    if (!inspectCue) {
      return;
    }
    playNobSfx("inspect");
  }, [inspectCue]);

  useEffect(() => {
    if (hunterPending) {
      setInspectShrunk(false);
      const timer = window.setTimeout(() => setHunterChoicesReady(true), reducedMotion ? 0 : 280);
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
  const actorIsYou = Boolean(actorId && (actorId === view?.you || seats.some((seat) => seat.playerId === actorId && seat.you)));
  const spectatorHint =
    !youAreActor && actorId && !actorIsYou
      ? `${hideSubmitterName ? t("anonymousPlayer") : (seats.find((seat) => seat.playerId === actorId)?.displayName ?? t("anonymousPlayer"))} ${
          view?.currentDecisionType === "CHOOSE_TARGET" ? t("actorSelecting") : t("actorDeciding")
        }`
      : null;
  const prompt = timedOut
    ? t("timeUpWaiting")
    : echoPending
      ? t("chooseEchoCard")
      : pickHiddenPending
        ? t("chooseHiddenCard")
      : pickMoonPending
        ? t("chooseMoonToken")
      : moonBrokerPending
        ? t("chooseOption")
      : pending
      ? pending.type === "CHOOSE_TARGET"
        ? view?.currentResolvingCard?.effectCode === "BLOODLINE_EXCHANGE" ||
          view?.currentResolvingCard?.cardCode === "NOB-SH-01"
          ? t("chooseTwoTargets")
          : t("chooseTarget")
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
    extraTargetPlayerId?: string | null;
    cardCode?: string | null;
  }) => {
    const line =
      seats.find((seat) => seat.playerId === entry.targetPlayerId)?.publiclyRevealedBloodline ??
      view?.myObservations?.find(
        (obs) => obs.kind === "BLOODLINE" && obs.targetPlayerId === entry.targetPlayerId && obs.bloodline,
      )?.bloodline ??
      null;
    return formatNobHistory(entry, nameOf, t, locale, bloodlineTitle(line, locale));
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
    const peekedRoles = isYou ? [] : peeked;
    const hiddenCount = Math.max(0, 2 - revealed.length - peekedRoles.length);
    const publicLine = seat.publiclyRevealedBloodline;
    const peekedLine = view?.myObservations?.find(
      (obs) => obs.kind === "BLOODLINE" && obs.targetPlayerId === seat.playerId && obs.bloodline,
    )?.bloodline;
    const ownLine = isYou ? (view?.myBloodline ?? null) : null;
    const identityLine = publicLine ?? peekedLine ?? ownLine ?? null;
    const identityFace: "up" | "down" = identityLine ? "up" : "down";
    return {
      playerId: seat.playerId,
      displayName: seat.displayName,
      identity: {
        face: identityFace,
        artSrc: identityLine ? getNobBloodlineArt(identityLine.type, identityLine.rank) : null,
        peeked: Boolean(!publicLine && peekedLine && identityLine === peekedLine),
      },
      revealed,
      peeked: peekedRoles,
      hiddenCount,
      ownUnused,
      moonMarkCount: seat.moonMarkCount ?? 0,
      moonMarkValues: isYou ? (view?.myMoonMarkValues ?? []) : [],
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
          {publicLog.map((entry, index) => {
            const line = historyLine(entry);
            return line ? <li key={`${entry.type ?? "log"}-${index}`}>{line}</li> : null;
          })}
        </ul>
      )}
    </aside>
  );

  return (
    <div
      className={`${styles.page} ${reducedMotion ? styles.reduced : ""}`}
      style={{
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
            {room.name} · {formatNobPhase(phase, t)}
            {view?.roundNumber != null ? ` · R${view.roundNumber}` : ""}
          </p>
        </div>
        <NobCountdown
          deadline={deadline}
          serverTime={view?.serverTime}
          remainingMs={remain}
          reducedMotion={reducedMotion}
        />
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
            {t("viewRoundOrder")}
          </button>
        </div>
      </header>

      {showAnnounce && announceLine ? (
        <p className={`${styles.announce} ${fx ? styles[`fx_${fx}`] : ""}`} role="status">
          {announceLine}
        </p>
      ) : null}

      {phaseIntro ? (
        <div className={styles.phaseIntro} role="status" aria-live="polite">
          <p className={styles.phaseIntroKicker}>{room.name}</p>
          <h2>
            {locale === "vi" ? "Vòng" : "Round"} {view?.roundNumber ?? view?.round ?? 1}
          </h2>
          <strong>{formatNobPhase(phase, t)}</strong>
          <p>{t("phaseIntroHint")}</p>
          <NobCountdown
            deadline={deadline}
            serverTime={view?.serverTime}
            remainingMs={remain}
            reducedMotion={reducedMotion}
          />
        </div>
      ) : null}

      {isSummary && view ? (
        <div className={styles.body}>
          <div className={styles.table}>
          <NobRoundSummary
            view={view}
            remainingMs={remain}
            deadline={deadline}
            serverTime={view?.serverTime}
            reducedMotion={reducedMotion}
            timedOut={timedOut}
            tokenOptions={tokenOptions}
            canPickToken={canPickToken}
            pickedOption={pickedToken}
            pickedOptions={pickedTokens}
            remainingOptions={liveTokenOptions}
            revealedByOption={revealedByOption}
            revealedValue={revealedToken}
            spectatorPick={spectatorPick}
            onPickToken={(option) => {
              if (!canPickToken || pickedTokens.includes(option)) {
                return;
              }
              setPickedToken(option);
              setPickedTokens((current) => [...current, option]);
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
            <>
              <img src={getNobBloodlineCardBack()} alt={t("identityCard")} />
              <p>
                {view?.myBloodlineKnowledge === "UNKNOWN_AFTER_SWAP" ? t("bloodlineUnknown") : t("hiddenBloodline")}
              </p>
            </>
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
          <div className={styles.seats} data-target-mode={pending?.type === "CHOOSE_TARGET" ? "true" : "false"}>
            {tableSeats.map((seat, index) => {
              const targetable = Boolean(
                youAreActor &&
                  pending?.type === "CHOOSE_TARGET" &&
                  pending.allowedTargetIds.includes(seat.playerId) &&
                  !frozen,
              );
              const submitted = Boolean(
                !hideSubmitterName && view?.submittedPlayerIds?.includes(seat.playerId),
              );
              const publicLine = seat.publiclyRevealedBloodline;
              const peekedLine = view?.myObservations?.find(
                (obs) => obs.kind === "BLOODLINE" && obs.targetPlayerId === seat.playerId && obs.bloodline,
              )?.bloodline;
              const line = publicLine ?? peekedLine ?? null;
              const board = seatCardBoard(seat);
              const isYouSeat = Boolean(seat.you || seat.playerId === view?.you);
              const blocked = Boolean(
                pending?.type === "CHOOSE_TARGET" && seat.alive !== false && !targetable && !isYouSeat,
              );
              return (
                <div
                  key={seat.playerId}
                  className={styles.seat}
                  style={seatStyle(index, tableSeats.length)}
                  data-you={isYouSeat ? "true" : "false"}
                  data-dead={seat.alive === false ? "true" : "false"}
                  data-blocked={blocked ? "true" : "false"}
                  data-target={targetable ? "true" : "false"}
                  data-actor={!hideSubmitterName && actorId === seat.playerId ? "true" : "false"}
                  data-submitted={submitted ? "true" : "false"}
                  data-selected={
                    selectedTargetId === seat.playerId ||
                    publicTargetId === seat.playerId ||
                    swapTargetIds.includes(seat.playerId)
                      ? "true"
                      : "false"
                  }
                  >
                  <button
                    type="button"
                    className={styles.seatHit}
                    disabled={pending?.type === "CHOOSE_TARGET" && !targetable}
                    onClick={() => {
                      if (!blocked) {
                        onTarget(seat.playerId);
                      }
                    }}
                  >
                    <strong>{seat.displayName}{isYouSeat ? <span className={styles.youBadge}>{t("you")}</span> : null}</strong>
                    <span>
                      {line ? bloodlineTitle(line, locale) : ""}
                      {submitted ? `${line ? " · " : ""}✓` : ""}
                      {showRevealed && seat.score != null ? `${line || submitted ? " · " : ""}${seat.score}` : ""}
                    </span>
                    {seat.alive !== false && (seat.moonMarkCount ?? 0) > 0 ? (
                      <span className={styles.tokenCoins} aria-label={`${seat.moonMarkCount} ${t("moonMarkCountLabel")}`}>
                        {Array.from({ length: Math.min(seat.moonMarkCount ?? 0, 6) }, (_, coin) => (
                          <img key={`${seat.playerId}-token-${coin}`} src={getNobMoonMarkBack()} alt="" />
                        ))}
                        {(seat.moonMarkCount ?? 0) > 6 ? <em>+{(seat.moonMarkCount ?? 0) - 6}</em> : null}
                      </span>
                    ) : null}
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
          <div
            className={styles.centerStage}
            data-card-choice={
              pickHiddenPending || echoPending || nightPromptCards.length > 0 ? "true" : "false"
            }
          >
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
            {showEchoPair ? (
              <div className={styles.echoPick} aria-label={echoPending ? t("chooseEchoCard") : t("playerCards")}>
                {echoPending ? <p className={styles.hint}>{t("chooseEchoCard")}</p> : null}
                <div className={styles.echoRow}>
                  {echoPair.map((card) => {
                    const fromPool = echoCards.some((item) => item.instanceId === card.instanceId);
                    return (
                      <NobCard
                        key={card.instanceId ?? card.cardCode}
                        cardCode={card.cardCode}
                        selected={echoPending && fromPool && selectedEchoCard?.instanceId === card.instanceId}
                        playable={echoPending && fromPool}
                        revealed
                        onClick={() => {
                          if (echoPending && fromPool) {
                            setSelectedEchoId(card.instanceId);
                            return;
                          }
                          inspectCard(card);
                        }}
                      />
                    );
                  })}
                </div>
                {echoPending && selectedEchoCard && !canPlayEchoNow(selectedEchoCard) ? (
                  <p className={styles.hint}>{t("echoCannotPlayNow")}</p>
                ) : null}
                {echoPending ? (
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
                ) : null}
              </div>
            ) : null}
            {echoPending ? null : pickMoonPending ? (
              <div className={styles.echoPick} aria-label={pending?.optionValues?.length ? t("chooseMoonTokenSteal") : t("chooseMoonToken")}>
                <p className={styles.hint}>
                  {pending?.optionValues?.length ? t("chooseMoonTokenSteal") : t("chooseMoonToken")}
                </p>
                <div className={styles.echoRow}>
                  {(pending?.allowedOptions ?? []).map((tokenId, index) => {
                    const value = pending?.optionValues?.[index];
                    return (
                      <button
                        key={tokenId}
                        type="button"
                        className={value != null ? styles.moonPickValue : styles.moonPick}
                        disabled={frozen}
                        onClick={() => {
                          if (moonStealPending) {
                            setMoonStealReveal({
                              optionId: tokenId,
                              decisionId: pending?.decisionId ?? null,
                              initialRejectCode: rejectCode ?? null,
                            });
                          }
                          onOption(tokenId, tokenId);
                        }}
                      >
                        {value != null ? (
                          <span>{value}</span>
                        ) : (
                          <img src={getNobMoonMarkBack()} alt={t("moonTokenBack")} />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : moonStealReveal ? (
              <div className={styles.echoPick} aria-live="polite">
                <p className={styles.hint}>
                  {revealedMoonStealValue != null
                    ? t("moonMarkStolen").replace("{n}", String(revealedMoonStealValue))
                    : t("chooseMoonTokenSteal")}
                </p>
                <NobMoonTokens
                  options={[moonStealReveal.optionId]}
                  pickedOptions={[moonStealReveal.optionId]}
                  revealedByOption={revealedMoonStealValue == null ? {} : revealedMoonStealByOption}
                  disabled
                  reducedMotion={reducedMotion}
                  onPick={() => undefined}
                />
              </div>
            ) : moonBrokerPending ? (
              <div className={styles.hunterReveal} aria-label={t("chooseOption")}>
                {moonSwapStep && lastMoonArt ? (
                  <img className={styles.peekRole} src={lastMoonArt} alt={t("inspectToken")} />
                ) : null}
                <div className={styles.options}>
                  {(moonSwapStep ? ["SWAP", "KEEP"] : ["INSPECT_BLOODLINE", "INSPECT_TOKEN", "SKIP"]).map((option) => {
                    const allowed = pending?.allowedOptions.includes(option) ?? false;
                    return (
                      <button
                        key={option}
                        type="button"
                        className={styles.pass}
                        disabled={frozen || !allowed}
                        onClick={() => onOption(option)}
                      >
                        {optionLabel(option, t, pending?.type)}
                      </button>
                    );
                  })}
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
            ) : swapPending ? (
              <div className={styles.hunterReveal} aria-label={t("chooseOption")}>
                <div className={styles.echoRow}>
                  {swapLines.map((entry) => {
                    const art = entry.bloodline
                      ? getNobBloodlineArt(entry.bloodline.type, entry.bloodline.rank)
                      : null;
                    return (
                      <div key={entry.id} className={styles.phasePromptCard}>
                        {art ? (
                          <img className={styles.peekRole} src={art} alt={nameOf(entry.id)} />
                        ) : (
                          <p>{nameOf(entry.id)}</p>
                        )}
                        <p className={styles.hint}>
                          {nameOf(entry.id)}
                          {entry.bloodline ? ` · ${bloodlineTitle(entry.bloodline, locale)}` : ""}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {pending?.allowedOptions.length ? (
                  <div className={styles.options}>
                    {pending.allowedOptions.map((option) => (
                      <button
                        key={option}
                        type="button"
                        className={styles.pass}
                        disabled={frozen}
                        onClick={() => onOption(option)}
                      >
                        {optionLabel(option, t, pending?.type)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : hunterPending ? (
              <div
                key={`hunter-${hunterTargetId ?? "none"}`}
                className={styles.hunterReveal}
                aria-label={t("hunterSeeRole")}
              >
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
                        {optionLabel(option, t, pending?.type)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : showPublicBloodline ? (
              <div
                key={`public-${publicRevealId ?? "none"}`}
                className={styles.inspectFlash}
                aria-label={nameOf(publicRevealId)}
              >
                {publicRevealArt ? (
                  <img src={publicRevealArt} alt={bloodlineTitle(publicRevealLine, locale)} />
                ) : null}
                <p className={styles.hint}>{nameOf(publicRevealId)}</p>
                <p className={styles.hint}>{bloodlineTitle(publicRevealLine, locale)}</p>
              </div>
            ) : unmaskPending || (showSeerFlash && pending) ? (
              <div
                key={`inspect-${reveal?.targetPlayerId ?? pending?.targetPlayerId ?? "none"}-${reveal?.cardCode ?? ""}`}
                className={styles.inspectFlash}
                aria-label={nameOf(reveal?.targetPlayerId ?? pending?.targetPlayerId)}
              >
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
                        {optionLabel(option, t, pending?.type)}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : nightPromptCards.length > 0 ? (
              <div className={styles.phasePrompt} aria-label={t("yourPhaseCard")}>
                <div className={styles.promptCardsRow}>
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
                </div>
                <div className={styles.promptActionsRow}>
                  {nightPromptCards.length >= 2 ? (
                    <button
                      type="button"
                      className={styles.pass}
                      disabled={frozen}
                      onClick={() => send({ type: "NOB_PHASE_SUBMIT", option: "PLAY_BOTH" }, true)}
                    >
                      {t("playBothCards")}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={styles.skipBtn}
                    disabled={frozen}
                    onClick={() => send({ type: "NOB_PHASE_SUBMIT", option: "PASS" }, true)}
                  >
                    {t("skipCard")}
                  </button>
                </div>
              </div>
            ) : showSeerFlash ? (
              <div
                key={`seer-${reveal?.targetPlayerId ?? "none"}-${reveal?.cardCode ?? ""}`}
                className={styles.inspectFlash}
                data-shrunk={inspectShrunk ? "true" : "false"}
                aria-label={nameOf(reveal?.targetPlayerId)}
              >
                {revealArt ? <img src={revealArt} alt={nameOf(reveal?.targetPlayerId)} /> : null}
                {reveal?.cardCode ? <NobCard cardCode={reveal.cardCode} revealed /> : null}
              </div>
            ) : centerCard && !showEchoPair ? (
              <div className={`${styles.centerCard} ${fx ? styles[`fx_${fx}`] : ""}`}>
                <NobCard cardCode={centerCard.cardCode} revealed onClick={() => inspectCard(centerCard)} />
              </div>
            ) : (
              <p className={styles.phase}>{drafting ? t("chooseOneCard") : formatNobPhase(phase, t)}</p>
            )}
            <p className={styles.hint}>{spectatorHint || prompt}</p>
            {pending?.allowedOptions.length &&
            pending.type !== "HUNTER_DECISION" &&
            pending.type !== "UNMASK_REVEAL" &&
            pending.type !== "ECHO_CHOOSE" &&
            pending.type !== "CHOOSE_HIDDEN_CARD" &&
            pending.type !== "SHAPE_SWAP" &&
            pending.type !== "MOON_BROKER" &&
            pending.type !== "CHOOSE_MOON_TOKEN" &&
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
                    {optionLabel(option, t, pending.type)}
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </section>
        {historyAside}
      </div>

      {echoCards.length > 0 && !echoPending && !echoSourceCard ? (
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

      {inspected && inspectedText ? (
        <div className={styles.detailLayer}>
          <button
            type="button"
            className={styles.detailBackdrop}
            aria-label={t("closeCardDetail")}
            onClick={() => setInspected(null)}
          />
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
        </div>
      ) : null}

      <NobInspectModals
        view={view}
        roleOpen={inspectMode === "role"}
        cardsOpen={inspectMode === "cards"}
        onClose={() => setInspectMode(null)}
      />
      <NobSeatCardsZoom board={seatCards} onClose={() => setSeatCards(null)} />

      {!returningToLobby && (phase === "GAME_OVER" || (finished && !isSummary)) ? (
        <div className={styles.overLayer} data-win={youWon ? "true" : "false"}>
          <div className={styles.over} data-win={youWon ? "true" : "false"} role="dialog" aria-labelledby="nob-game-over-title">
            <img
              className={styles.overCrest}
              src={youWon ? NOB_UI.overCrestWin : NOB_UI.overCrestLose}
              alt=""
            />
            <h2 id="nob-game-over-title">{t("gameOver")}</h2>
            <span className={styles.overRule} aria-hidden="true" />
            <p className={styles.overResult}>{youWon ? t("youWin") : t("youLose")}</p>
            {you ? (
              <div className={styles.overPlayer}>
                <PlayerAvatar
                  playerId={you.playerId}
                  displayName={you.displayName}
                  avatarUrl={you.avatarUrl}
                  size={56}
                  decorative
                />
                <span className={styles.overPlayerDetails}>
                  <strong>
                    {you.displayName}
                    {!youWon && you.score != null ? (
                      <small className={styles.overMoonScore}>
                        {t("moonMarkScore").replace("{count}", String(you.score))}
                      </small>
                    ) : null}
                  </strong>
                  {!youWon && yourEloDisplay ? (
                    <small
                      className={styles.overElo}
                      data-positive={you.eloDelta! > 0 ? "true" : you.eloDelta! < 0 ? "false" : "neutral"}
                    >
                      {t("eloRating")}: {yourEloDisplay}
                    </small>
                  ) : null}
                </span>
              </div>
            ) : null}
            <section className={styles.overWinners} aria-label={t("finalStandings")}>
              <h3>
                <Trophy size={18} aria-hidden="true" />
                {t("finalStandings")}
              </h3>
              <div className={styles.overStandingsList}>
                {finalStandings.map(({ seat, score, rank }) => {
                  const eloDisplay = formatCurrentElo(seat);
                  return (
                    <div
                      key={seat.playerId}
                      className={styles.overWinner}
                      data-winner={winners.includes(seat.playerId) ? "true" : "false"}
                    >
                      <span className={styles.overRank}>#{rank}</span>
                      <PlayerAvatar
                        playerId={seat.playerId}
                        displayName={seat.displayName}
                        avatarUrl={seat.avatarUrl}
                        size={44}
                        className={styles.overAvatar}
                        decorative
                      />
                      <span className={styles.overPlayerDetails}>
                        <strong>
                          {seat.displayName}
                          <small className={styles.overMoonScore}>
                            {t("moonMarkScore").replace("{count}", String(score))}
                          </small>
                        </strong>
                        {eloDisplay ? (
                          <small
                            className={styles.overElo}
                            data-positive={seat.eloDelta! > 0 ? "true" : seat.eloDelta! < 0 ? "false" : "neutral"}
                          >
                            {t("eloRating")}: {eloDisplay}
                          </small>
                        ) : null}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
            <button
              type="button"
              className={styles.overPlay}
              disabled={returningToLobby}
              onClick={() => void returnToLobby()}
            >
              <Swords size={18} aria-hidden="true" />
              {t("playAgain")}
            </button>
            <button type="button" className={styles.overLeave} onClick={() => setConfirmLeave(true)}>
              <ArrowRight size={18} aria-hidden="true" />
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
        error={leave.error}
        onConfirm={() => leave.mutate(room.id)}
        onCancel={() => {
          leave.reset();
          setConfirmLeave(false);
        }}
      />
    </div>
  );
}
