import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Clock3, Eye, Flag, HelpCircle, LogOut, RotateCcw, Send, ShieldAlert, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { RoomView } from "@/shared/lobby/roomView";
import { ConfirmDialog } from "@/shared/components/ConfirmDialog/ConfirmDialog";
import { PlayerAvatar } from "@/shared/components/PlayerAvatar/PlayerAvatar";
import { useLeaveRoom } from "@/shared/hooks/useRooms";
import { useLocale } from "@/shared/i18n/useT";
import { LIARS_NUMBER_ASSETS } from "../assets/liarsNumberAssetManifest";
import type { LiarsNumberCard, LiarsNumberPlayer, LiarsNumberView } from "../model/liarsNumberTypes";
import type { LiarsNumberCommand } from "../api/liarsNumberApi";
import styles from "./LiarsNumberPlayPage.module.css";

interface Props {
  room: RoomView;
  view: LiarsNumberView | null;
  snapshotPending?: boolean;
  snapshotError?: Error | null;
  notice?: string | null;
  rejectCode?: string | null;
  sendCommand: (command: LiarsNumberCommand) => string | null;
}

function cardImage(card: LiarsNumberCard): string {
  if (!card.faceUp || !card.typeId || !card.variant) return LIARS_NUMBER_ASSETS.cardBack;
  return card.variant === "roman" ? LIARS_NUMBER_ASSETS.roman(card.typeId) : LIARS_NUMBER_ASSETS.normal(card.typeId);
}

function playerName(players: LiarsNumberPlayer[], id: string | null | undefined): string {
  return players.find((player) => player.playerId === id)?.displayName ?? id ?? "—";
}

function signed(value: number | null): string {
  if (value === null) return "—";
  return value > 0 ? `+${value}` : String(value);
}

function reasonText(view: LiarsNumberView, locale: string): string {
  const loser = playerName(view.players, view.loserId);
  if (view.gameOverReason === "NO_CARDS") {
    return locale === "vi" ? `${loser} không còn lá để mở vòng mới.` : `${loser} had no card left to start a new round.`;
  }
  if (view.gameOverReason === "ABANDONED") {
    return locale === "vi" ? `${loser} đã rời ván.` : `${loser} left the game.`;
  }
  if (view.lastPenaltyType && view.lastPenaltyScore) {
    return locale === "vi"
      ? `${loser} đạt ${view.lastPenaltyScore}/${view.lastPenaltyThreshold} điểm phạt của số ${view.lastPenaltyType}.`
      : `${loser} reached ${view.lastPenaltyScore}/${view.lastPenaltyThreshold} points for number ${view.lastPenaltyType}.`;
  }
  return locale === "vi" ? "Người chơi đầu tiên chạm ngưỡng điểm phạt đã thua." : "The first player to reach the point limit lost.";
}

function CardTile({ card, onClick, disabled, small = false }: { card: LiarsNumberCard; onClick?: () => void; disabled?: boolean; small?: boolean }) {
  const romanTooltip = card.faceUp && card.variant === "roman"
    ? `Roman ${card.label.replace(/^Roman\s*/i, "")} — number ${card.typeId}; this card counts as 2 points.`
    : undefined;
  const content = (
    <>
      <img src={cardImage(card)} alt={card.faceUp ? card.label : "Card back"} />
      {card.faceUp && card.variant === "roman" ? <span className={styles.romanTag}>×2</span> : null}
    </>
  );
  return onClick ? <button type="button" title={romanTooltip} aria-label={romanTooltip ?? card.label} className={`${styles.cardTile} ${small ? styles.cardTileSmall : ""}`} onClick={onClick} disabled={disabled}>{content}</button> : <div className={`${styles.cardTile} ${small ? styles.cardTileSmall : ""}`} title={romanTooltip}>{content}</div>;
}

function TurnTimer({ deadline, serverTime, turnSeconds, locale }: { deadline: string | null; serverTime: string | null; turnSeconds: number; locale: string }) {
  const [now, setNow] = useState(() => Date.now());
  const clockOffset = useMemo(() => {
    const parsed = serverTime ? Date.parse(serverTime) : Number.NaN;
    return Number.isFinite(parsed) ? parsed - Date.now() : 0;
  }, [serverTime]);

  useEffect(() => {
    if (!deadline) return;
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [deadline]);

  if (!deadline || turnSeconds <= 0) {
    return <span className={styles.turnTimer}><Clock3 size={15} /> {locale === "vi" ? "Không giới hạn" : "No time limit"}</span>;
  }
  const remaining = Math.max(0, Math.ceil((Date.parse(deadline) - (now + clockOffset)) / 1000));
  return <span className={`${styles.turnTimer} ${remaining <= 5 ? styles.turnTimerUrgent : ""}`}><Clock3 size={15} /> {remaining}s</span>;
}

function CollectedCards({ cards }: { cards: LiarsNumberCard[] }) {
  const groups = useMemo(() => {
    const grouped = new Map<number, LiarsNumberCard[]>();
    for (const card of cards) {
      if (card.typeId === null) continue;
      grouped.set(card.typeId, [...(grouped.get(card.typeId) ?? []), card]);
    }
    return [...grouped.entries()].sort(([left], [right]) => left - right);
  }, [cards]);

  if (!groups.length) return null;
  return <div className={styles.penaltyGroups}>{groups.map(([typeId, group]) => (
    <div key={typeId} className={styles.penaltyCards} role="group" aria-label={`Number ${typeId}`}>
      {group.map((card) => <CardTile key={card.cardId} card={card} small />)}
    </div>
  ))}</div>;
}

function currentActorId(view: LiarsNumberView): string | null {
  if (view.phase === "SELECT_CARD") return view.currentRoundStarterId;
  if (view.phase === "RECEIVER_DECISION") return view.activeRound?.currentReceiverId ?? null;
  if (["SELECT_TARGET", "DECLARE_TYPE", "SELECT_PASS_TARGET", "PASS_DECLARE_TYPE"].includes(view.phase)) {
    return view.activeRound?.currentSenderId ?? null;
  }
  return null;
}

function ResultPanel({ view, room, locale, onPlayAgain, onLeave }: { view: LiarsNumberView; room: RoomView; locale: string; onPlayAgain: () => void; onLeave: () => void }) {
  const loser = view.loserId === view.you;
  return (
    <main className={styles.page}>
      <section className={`${styles.resultPanel} ${loser ? styles.resultLose : styles.resultWin}`} role="dialog" aria-modal="true">
        <div className={styles.resultIcon}>{loser ? <ShieldAlert size={30} /> : <Trophy size={30} />}</div>
        <p className={styles.eyebrow}>LIAR’S NUMBER</p>
        <h1>{loser ? (locale === "vi" ? "Bạn đã thua" : "You lost") : (locale === "vi" ? "Bạn chiến thắng" : "You won")}</h1>
        <p className={styles.resultReason}>{reasonText(view, locale)}</p>
        <p className={styles.resultSubline}>{locale === "vi" ? "Những người chơi còn lại chiến thắng." : "All remaining players win."}</p>
        <div className={styles.resultHeaders}><span /><span /><span /><span>{locale === "vi" ? "KẾT QUẢ" : "RESULT"}</span><span>{locale === "vi" ? "ELO hiện tại" : "CURRENT ELO"}</span><span>{locale === "vi" ? "THAY ĐỔI" : "CHANGE"}</span></div>
        <div className={styles.resultRows}>
          {view.players.map((player) => {
            const currentElo = player.newElo ?? player.oldElo;
            return (
              <div key={player.playerId} className={`${styles.resultRow} ${player.loser ? styles.loserRow : styles.winnerRow}`}>
                <span className={styles.resultRank}>{player.loser ? "—" : "✓"}</span>
                <PlayerAvatar playerId={player.playerId} displayName={player.displayName} avatarUrl={room.players.find((item) => item.playerId === player.playerId)?.avatarUrl} size={38} decorative />
                <span className={styles.resultPlayerName}>{player.displayName}{player.you ? (locale === "vi" ? " (Bạn)" : " (You)") : ""}</span>
                <span className={styles.resultOutcome}>{player.loser ? (locale === "vi" ? "THUA" : "LOSS") : (locale === "vi" ? "THẮNG" : "WIN")}</span>
                <strong>{currentElo ?? "—"}</strong>
                <em className={player.eloDelta !== null && player.eloDelta < 0 ? styles.eloDown : styles.eloUp}>{signed(player.eloDelta)}</em>
              </div>
            );
          })}
        </div>
        <div className={styles.resultActions}>
          <button type="button" className={styles.primaryButton} onClick={onPlayAgain}><RotateCcw size={17} /> {locale === "vi" ? "Chơi lại" : "Play again"}</button>
          <button type="button" className={styles.secondaryButton} onClick={onLeave}><LogOut size={17} /> {locale === "vi" ? "Rời phòng" : "Leave room"}</button>
        </div>
      </section>
    </main>
  );
}

export function LiarsNumberPlayPage({ room, view, snapshotPending = false, snapshotError = null, notice, rejectCode, sendCommand }: Props) {
  const locale = useLocale();
  const navigate = useNavigate();
  const leave = useLeaveRoom();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [lastNotice, setLastNotice] = useState<string | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const leaveDialog = (
    <ConfirmDialog
      open={confirmLeave}
      title={locale === "vi" ? "Thoát ván Liar’s Number?" : "Leave Liar’s Number?"}
      body={view?.finished
        ? (locale === "vi" ? "Bạn sẽ rời phòng và quay về danh sách phòng." : "You will leave the room and return to the room list.")
        : (locale === "vi"
            ? "Rời ván lúc này sẽ tính bạn thua, trừ ELO theo số người bắt đầu ván và kết thúc ván ngay lập tức."
            : "Leaving now counts as a loss, deducts ELO based on the starting player count, and ends the match immediately.")}
      confirmLabel={locale === "vi" ? "Xác nhận thoát" : "Leave match"}
      cancelLabel={locale === "vi" ? "Ở lại" : "Stay"}
      pending={leave.isPending}
      error={leave.error}
      onConfirm={() => leave.mutate(room.id)}
      onCancel={() => {
        leave.reset();
        setConfirmLeave(false);
      }}
    />
  );

  const send = (command: LiarsNumberCommand) => {
    const result = sendCommand(command);
    if (result) setLastNotice(null);
  };
  const active = view?.activeRound;
  const sender = playerName(view?.players ?? [], active?.currentSenderId);
  const receiver = playerName(view?.players ?? [], active?.currentReceiverId);
  const currentPlayer = view?.players.find((player) => player.playerId === view.currentRoundStarterId);
  const myPlayer = view?.players.find((player) => player.you);
  const actingPlayerId = view ? currentActorId(view) : null;
  const warningTypeIds = myPlayer && view
    ? Object.entries(myPlayer.penaltyScores)
        .filter(([, score]) => score === view.lossThreshold - 1)
        .map(([type]) => Number(type))
        .sort((left, right) => left - right)
    : [];
  const activeTargets = useMemo(() => (view?.availableTargetPlayerIds ?? []).map((id) => view?.players.find((player) => player.playerId === id)).filter((player): player is LiarsNumberPlayer => Boolean(player)), [view]);

  if (!view) {
    return (
      <main className={styles.page}>
        <section className={styles.loadingPanel}>
          <img src={LIARS_NUMBER_ASSETS.cardBack} alt="" className={styles.loadingCard} />
          <p className={styles.eyebrow}>LIAR’S NUMBER</p>
          <h1>{locale === "vi" ? "Đang mở bàn chơi…" : "Opening the table…"}</h1>
          <p>{snapshotError ? (locale === "vi" ? "Không tải được trạng thái ván." : "The game state could not be loaded.") : locale === "vi" ? "Đang nhận bộ bài và trạng thái bí mật từ máy chủ." : "Receiving the deck and hidden game state from the server."}</p>
          {snapshotPending ? <span className={styles.loadingPill}>● {locale === "vi" ? "Đang kết nối…" : "Connecting…"}</span> : null}
          <button type="button" className={styles.secondaryButton} onClick={() => navigate(`/rooms/${room.id}`)}><ArrowLeft size={17} /> {locale === "vi" ? "Về phòng" : "Back to room"}</button>
        </section>
      </main>
    );
  }

  if (view.finished) {
    return <><ResultPanel view={view} room={room} locale={locale} onPlayAgain={() => navigate(`/rooms/${room.id}`)} onLeave={() => setConfirmLeave(true)} />{leaveDialog}</>;
  }

  const latestEvent = view.publicEvents[view.publicEvents.length - 1];
  const phaseLabel: Record<string, string> = locale === "vi" ? {
    SELECT_CARD: "Chọn một lá bài", SELECT_TARGET: "Chọn người nhận", DECLARE_TYPE: "Chọn số để tuyên bố", RECEIVER_DECISION: "Người nhận quyết định", SELECT_PASS_TARGET: "Chọn người chuyền tiếp", PASS_DECLARE_TYPE: "Tuyên bố mới",
  } : {
    SELECT_CARD: "Choose a card", SELECT_TARGET: "Choose a receiver", DECLARE_TYPE: "Choose a number to claim", RECEIVER_DECISION: "Receiver decides", SELECT_PASS_TARGET: "Choose a new receiver", PASS_DECLARE_TYPE: "Make a new claim",
  };
  const phaseTitle = phaseLabel[view.phase] ?? view.phase.replaceAll("_", " ");

  return (
    <>
    <main className={styles.page}>
      <header className={styles.header}>
        <button type="button" className={styles.leaveButton} onClick={() => setConfirmLeave(true)} disabled={leave.isPending}><LogOut size={16} /> {locale === "vi" ? "Thoát" : "Leave"}</button>
        <div className={styles.headerTitle}><p className={styles.eyebrow}>LIAR’S NUMBER</p><h1>{locale === "vi" ? "Ăn Gian Nói Dối" : "Liar’s Number"}</h1></div>
        <div className={styles.headerMeta}><span>Round {view.roundNumber}</span><span>{view.playerCount} players</span><TurnTimer deadline={view.turnDeadline} serverTime={view.serverTime} turnSeconds={view.turnSeconds} locale={locale} /><button type="button" className={styles.helpButton} onClick={() => setRulesOpen((open) => !open)} aria-label={locale === "vi" ? "Hướng dẫn chơi" : "Rules"}><HelpCircle size={18} /></button></div>
      </header>
      {notice || lastNotice || rejectCode ? <div className={styles.notice} role="status"><Flag size={16} /> {notice ?? lastNotice ?? rejectCode}</div> : null}
      {rulesOpen ? <section className={styles.rulesPanel}><h2>{locale === "vi" ? "HƯỚNG DẪN CHƠI" : "HOW TO PLAY"}</h2><ol><li>{locale === "vi" ? "Chọn một lá bài và đưa úp cho người khác." : "Choose a card and pass it face down."}</li><li>{locale === "vi" ? "Nói đó là một số từ 1–8; bạn được nói thật hoặc nói dối." : "Claim any number from 1–8; tell the truth or bluff."}</li><li>{locale === "vi" ? "Người nhận đoán thật/dối hoặc xem rồi chuyền tiếp." : "The receiver guesses or peeks and passes."}</li><li>{locale === "vi" ? "Người đoán sai hoặc người bị bắt quả tang nhận lá phạt." : "The wrong guesser or caught bluffer takes the card."}</li><li>{locale === "vi" ? `Lá thường = 1 điểm, Roman = 2 điểm. Đạt ${view.lossThreshold} điểm cùng số là thua.` : `Normal = 1 point, Roman = 2 points. Reach ${view.lossThreshold} points of one number to lose.`}</li></ol></section> : null}
      {warningTypeIds.length ? <div className={styles.warning} role="status">{locale === "vi" ? `Cảnh báo: thêm 1 điểm số ${warningTypeIds.join(", ")} cùng loại là bạn sẽ thua.` : `Warning: one more point for number ${warningTypeIds.join(", ")} and you lose.`}</div> : null}

      <div className={styles.layout}>
        <section className={styles.tablePanel}>
          <div className={styles.tableTopline}><span className={styles.phasePill}>{phaseTitle}</span><span className={styles.tableHint}>{currentPlayer ? `${currentPlayer.displayName} ${locale === "vi" ? "mở vòng" : "starts"}` : ""}</span></div>
          <div className={styles.claimArea}>
            {active ? <>
              <div className={styles.claimPlayers}><span>{sender}</span><Send size={16} /><span>{receiver}</span></div>
              <div className={styles.claimBubble}>{sender} {locale === "vi" ? "nói đây là số" : "claims number"} <strong>{active.declaredType ?? "?"}</strong></div>
              <CardTile card={active.card} small />
              <small className={styles.claimCaption}>{active.card.faceUp ? (locale === "vi" ? "Bạn đã xem lá bài này" : "You have seen this card") : (locale === "vi" ? "Lá bài đang úp" : "Card is face down")}</small>
            </> : <div className={styles.emptyTable}><img src={LIARS_NUMBER_ASSETS.cardBack} alt="" /><span>{locale === "vi" ? "Bắt đầu vòng mới" : "Start a new round"}</span></div>}
          </div>

          <div className={styles.actionArea}>
            <h2>{phaseTitle}</h2>
            {view.phase === "SELECT_CARD" && view.legalActions.includes("SELECT_CARD") ? <><p>{locale === "vi" ? "Chọn một lá trong tay để gửi." : "Choose a card from your hand to send."}</p><div className={styles.handGrid}>{view.myHand.map((card) => <CardTile key={card.cardId} card={card} onClick={() => card.cardId && send({ type: "SELECT_CARD", cardId: card.cardId })} />)}</div></> : null}
            {view.phase === "SELECT_TARGET" && view.legalActions.includes("SELECT_TARGET") ? <><p>{locale === "vi" ? "Đưa lá bài úp cho ai?" : "Who receives the face-down card?"}</p><div className={styles.targetGrid}>{activeTargets.map((player) => <button type="button" key={player.playerId} className={styles.targetButton} onClick={() => send({ type: "SELECT_TARGET", targetPlayerId: player.playerId })}><PlayerAvatar playerId={player.playerId} displayName={player.displayName} avatarUrl={room.players.find((item) => item.playerId === player.playerId)?.avatarUrl} size={34} decorative /><span>{player.displayName}</span></button>)}</div></> : null}
            {(view.phase === "DECLARE_TYPE" || view.phase === "PASS_DECLARE_TYPE") && view.legalActions.includes(view.phase) ? <><p>{locale === "vi" ? "Bạn muốn nói đây là số mấy?" : "What number do you want to claim?"}</p><div className={styles.numberGrid}>{Array.from({ length: 8 }, (_, index) => index + 1).map((number) => <button type="button" key={number} onClick={() => send({ type: view.phase === "DECLARE_TYPE" ? "DECLARE_TYPE" : "PASS_DECLARE_TYPE", declaredType: number })}>{number}</button>)}</div></> : null}
            {view.phase === "RECEIVER_DECISION" && view.legalActions.includes("GUESS") ? <><p>{locale === "vi" ? `Bạn có tin ${sender}?` : `Do you believe ${sender}?`}</p><div className={styles.decisionGrid}><button type="button" className={styles.truthButton} onClick={() => send({ type: "GUESS", guess: "TRUE" })}>{locale === "vi" ? "NÓI THẬT" : "TRUE"}</button><button type="button" className={styles.lieButton} onClick={() => send({ type: "GUESS", guess: "FALSE" })}>{locale === "vi" ? "NÓI DỐI" : "LIAR"}</button>{view.legalActions.includes("PEEK_AND_PASS") ? <button type="button" className={styles.peekButton} onClick={() => send({ type: "PEEK_AND_PASS" })}><Eye size={17} /> {locale === "vi" ? "XEM & CHUYỀN" : "PEEK & PASS"}</button> : null}</div></> : null}
            {view.phase === "SELECT_PASS_TARGET" && view.legalActions.includes("SELECT_PASS_TARGET") ? <><p>{locale === "vi" ? "Bạn đã xem bài. Chuyền cho người chưa xem." : "You saw the card. Pass it to someone who has not seen it."}</p><div className={styles.targetGrid}>{view.availablePassTargetPlayerIds.map((id) => { const player = view.players.find((item) => item.playerId === id); return player ? <button type="button" key={id} className={styles.targetButton} onClick={() => send({ type: "SELECT_PASS_TARGET", targetPlayerId: id })}><PlayerAvatar playerId={player.playerId} displayName={player.displayName} avatarUrl={room.players.find((item) => item.playerId === id)?.avatarUrl} size={34} decorative /><span>{player.displayName}</span></button> : null; })}</div></> : null}
            {!view.legalActions.length ? <p className={styles.waitingCopy}>{locale === "vi" ? "Đang chờ người chơi khác hành động…" : "Waiting for another player…"}</p> : null}
          </div>
          {latestEvent?.type === "LIARS_NUMBER_CARD_REVEALED" ? <div className={styles.revealBanner}><strong>{locale === "vi" ? "Đã lật bài:" : "Revealed:"} {view.lastResolvedCard?.label}</strong><span>{view.lastPenaltyPlayerId === view.you ? (locale === "vi" ? "Bạn nhận lá này" : "You take this card") : `${playerName(view.players, view.lastPenaltyPlayerId)} ${locale === "vi" ? "nhận lá này" : "takes this card"}`}</span></div> : null}
        </section>

        <aside className={styles.sidebar}>
          <section className={styles.playersPanel}><div className={styles.panelTitle}><h2>{locale === "vi" ? "Người chơi" : "Players"}</h2><span>{view.removedCardCount ? `${view.removedCardCount} hidden cards` : "64 cards"}</span></div>{view.players.map((player) => <article key={player.playerId} className={`${styles.playerCard} ${player.playerId === actingPlayerId ? styles.activePlayerCard : ""} ${player.loser ? styles.loserCard : ""}`}><PlayerAvatar playerId={player.playerId} displayName={player.displayName} avatarUrl={room.players.find((item) => item.playerId === player.playerId)?.avatarUrl} size={38} decorative /><div className={styles.playerInfo}><div className={styles.playerNameLine}><strong>{player.displayName}</strong>{player.you ? <span className={styles.meBadge}>{locale === "vi" ? "TÔI" : "ME"}</span> : null}{player.playerId === actingPlayerId ? <span className={styles.turnBadge}>{locale === "vi" ? "ĐANG LƯỢT" : "ACTING"}</span> : null}</div><small>{player.handCount} {locale === "vi" ? "lá trên tay" : "in hand"}</small><CollectedCards cards={player.penaltyCards} /></div></article>)}</section>
        </aside>
      </div>
    </main>
    {leaveDialog}
    </>
  );
}
