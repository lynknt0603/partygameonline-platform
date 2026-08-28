import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlert,
  Clock3,
  EyeOff,
  Flame,
  Info,
  LogOut,
  RotateCcw,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Utensils,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { PlayerAvatar } from "@/shared/components/PlayerAvatar/PlayerAvatar";
import { useLeaveRoom } from "@/shared/hooks/useRooms";
import { useLocale } from "@/shared/i18n/useT";
import type { RoomView } from "@/shared/lobby/roomView";
import { NOT_IN_MY_POT_ASSETS, NOT_IN_MY_POT_PRELOAD_ASSETS } from "../assets/notInMyPotAssetManifest";
import type { NotInMyPotCommand } from "../api/notInMyPotApi";
import type {
  NotInMyPotCard,
  NotInMyPotEvent,
  NotInMyPotPendingAction,
  NotInMyPotPlayer,
  NotInMyPotView,
} from "../model/notInMyPotTypes";
import { CardPile } from "../components/CardPile";
import { PotRevealSequence } from "../components/PotRevealSequence";
import { TableEventAnimation } from "../components/TableEventAnimation";
import styles from "./NotInMyPotPlayPage.module.css";

interface NotInMyPotPlayPageProps {
  room: RoomView;
  view: NotInMyPotView | null;
  snapshotPending?: boolean;
  snapshotError?: Error | null;
  notice?: string | null;
  rejectCode?: string | null;
  sendCommand: (command: NotInMyPotCommand) => string | null;
}

interface CardMeta {
  labelVi: string;
  labelEn: string;
  descriptionVi: string;
  descriptionEn: string;
  art: string;
  ingredient?: boolean;
}

const CARD_META: Record<string, CardMeta> = {
  VEGETABLE: {
    labelVi: "Rau củ",
    labelEn: "Vegetable",
    descriptionVi: "Cộng 1 điểm cho nồi",
    descriptionEn: "Adds 1 point to the pot",
    art: NOT_IN_MY_POT_ASSETS.cards.vegetable,
    ingredient: true,
  },
  TOFU: {
    labelVi: "Đậu phụ",
    labelEn: "Tofu",
    descriptionVi: "Thành phần trung tính",
    descriptionEn: "A neutral ingredient",
    art: NOT_IN_MY_POT_ASSETS.cards.tofu,
    ingredient: true,
  },
  SALT: {
    labelVi: "Đậu phụ",
    labelEn: "Tofu",
    descriptionVi: "Thành phần trung tính",
    descriptionEn: "A neutral ingredient",
    art: NOT_IN_MY_POT_ASSETS.cards.tofu,
    ingredient: true,
  },
  MEAT: {
    labelVi: "Thịt",
    labelEn: "Meat",
    descriptionVi: "Trừ 2 điểm khỏi nồi",
    descriptionEn: "Subtracts 2 points from the pot",
    art: NOT_IN_MY_POT_ASSETS.cards.meat,
    ingredient: true,
  },
  OUT_OF_HOUSE: {
    labelVi: "Mời ra khỏi nhà",
    labelEn: "Out You Go",
    descriptionVi: "Tăng 1 dấu cửa của một người",
    descriptionEn: "Adds one door mark to a player",
    art: NOT_IN_MY_POT_ASSETS.cards.outOfHouse,
  },
  SCOOP_OUT: {
    labelVi: "Vớt bỏ",
    labelEn: "Scoop Out",
    descriptionVi: "Vớt tối đa 2 lá trên cùng",
    descriptionEn: "Scoop up to two cards from the pot",
    art: NOT_IN_MY_POT_ASSETS.cards.scoopOut,
  },
  SLOTTED_SPOON: {
    labelVi: "Muôi thủng",
    labelEn: "Slotted Spoon",
    descriptionVi: "Xem và xếp lại tối đa 3 lá",
    descriptionEn: "Inspect and reorder up to three cards",
    art: NOT_IN_MY_POT_ASSETS.cards.slottedSpoon,
  },
  EMERGENCY_SHOPPING: {
    labelVi: "Đi chợ gấp",
    labelEn: "Emergency Shopping",
    descriptionVi: "Rút 3 lá, trả lại 2 lá",
    descriptionEn: "Draw three cards, return two",
    art: NOT_IN_MY_POT_ASSETS.cards.emergencyShopping,
  },
  TRASH_OUT: {
    labelVi: "Đổ rác",
    labelEn: "Trash Out",
    descriptionVi: "Một người bỏ tay và rút 3 lá",
    descriptionEn: "A player discards their hand and draws three",
    art: NOT_IN_MY_POT_ASSETS.cards.trashOut,
  },
};

const ACTION_TYPES = new Set([
  "OUT_OF_HOUSE",
  "SCOOP_OUT",
  "SLOTTED_SPOON",
  "EMERGENCY_SHOPPING",
  "TRASH_OUT",
]);

function cardMeta(card: NotInMyPotCard): CardMeta {
  return (
    CARD_META[card.type] ?? {
      labelVi: card.type.replaceAll("_", " "),
      labelEn: card.type.replaceAll("_", " "),
      descriptionVi: "Lá bài của ván",
      descriptionEn: "A card from this game",
      art: NOT_IN_MY_POT_ASSETS.cards.gameplayBack,
    }
  );
}

function isIngredient(card: NotInMyPotCard): boolean {
  return card.category === "INGREDIENT" || Boolean(CARD_META[card.type]?.ingredient) || (!ACTION_TYPES.has(card.type) && card.category !== "ACTION");
}

function isTargetAction(type: string): boolean {
  return type === "OUT_OF_HOUSE" || type === "TRASH_OUT";
}

function roleLabel(role: string | null | undefined, locale: "vi" | "en"): string {
  if (role === "VEGETARIAN") {
    return locale === "vi" ? "Người ăn chay" : "Vegetarian";
  }
  if (role === "MEAT_EATER") {
    return locale === "vi" ? "Người ăn thịt" : "Meat eater";
  }
  return locale === "vi" ? "Ẩn danh" : "Hidden role";
}

function actionLabel(type: string, locale: "vi" | "en"): string {
  return locale === "vi"
    ? CARD_META[type]?.labelVi ?? type.replaceAll("_", " ")
    : CARD_META[type]?.labelEn ?? type.replaceAll("_", " ");
}

function cardLabel(card: NotInMyPotCard, locale: "vi" | "en"): string {
  const meta = cardMeta(card);
  return locale === "vi" ? meta.labelVi : meta.labelEn;
}

function phaseLabel(phase: string, locale: "vi" | "en"): string {
  if (phase === "PLAYING") {
    return locale === "vi" ? "Đang nấu" : "Cooking in progress";
  }
  if (phase === "RESOLVING_ACTION") {
    return locale === "vi" ? "Đang xử lý hành động" : "Resolving action";
  }
  if (phase === "GAME_OVER") {
    return locale === "vi" ? "Đã kết thúc" : "Game over";
  }
  return phase.replaceAll("_", " ");
}

function formatScore(score: number | null | undefined): string {
  if (score === null || score === undefined) {
    return "—";
  }
  if (score > 0) {
    return `+${score}`;
  }
  return String(score);
}

function playerName(players: NotInMyPotPlayer[], playerId: unknown, locale: "vi" | "en"): string {
  if (typeof playerId === "string") {
    return players.find((player) => player.playerId === playerId)?.displayName ?? (locale === "vi" ? "Một người" : "A player");
  }
  return locale === "vi" ? "Một người" : "A player";
}

function eventText(event: NotInMyPotEvent, players: NotInMyPotPlayer[], locale: "vi" | "en"): string {
  const payload = event.payload;
  const actor = playerName(players, payload.playerId, locale);
  const target = playerName(players, payload.targetPlayerId, locale);
  const actionType = typeof payload.actionType === "string" ? payload.actionType : "";
  const role = typeof payload.role === "string" ? payload.role : null;
  switch (event.type) {
    case "NOT_IN_MY_POT_GAME_STARTED":
      return locale === "vi" ? "Bếp đã mở cửa. Giữ bí mật vai của bạn." : "The kitchen is open. Keep your role secret.";
    case "TURN_STARTED":
      return locale === "vi" ? `Đến lượt ${actor}.` : `${actor}'s turn started.`;
    case "INGREDIENT_DECLARED":
      return locale === "vi" ? `${actor} đã bỏ nguyên liệu vào nồi.` : `${actor} added an ingredient to the pot.`;
    case "ACTION_STARTED":
      return locale === "vi" ? `${actor} dùng ${actionLabel(actionType, locale)}.` : `${actor} played ${actionLabel(actionType, locale)}.`;
    case "TARGET_SELECTION_REQUIRED":
      return locale === "vi" ? `${actor} đang chọn mục tiêu.` : `${actor} is choosing a target.`;
    case "PLAYER_DOOR_UPDATED":
      return locale === "vi" ? `${actor} nhận thêm một dấu cửa.` : `${actor} received another door mark.`;
    case "PLAYER_EXPELLED":
      return locale === "vi" ? `${actor} bị mời ra khỏi nhà${role ? ` — ${roleLabel(role, locale)}` : ""}.` : `${actor} was sent out${role ? ` — ${roleLabel(role, locale)}` : ""}.`;
    case "SCOOP_OUT_RESOLVED":
      return locale === "vi" ? `${actor} đã vớt bớt bài khỏi nồi.` : `${actor} scooped cards from the pot.`;
    case "POT_REORDER_REQUIRED":
      return locale === "vi" ? `${actor} đang sắp xếp lại nồi.` : `${actor} is rearranging the pot.`;
    case "POT_REORDERED":
      return locale === "vi" ? `${actor} đã xếp lại nồi.` : `${actor} reordered the pot.`;
    case "EMERGENCY_SHOPPING_RESOLVED":
      return locale === "vi" ? `${actor} vừa đi chợ gấp.` : `${actor} went emergency shopping.`;
    case "SHOPPING_RETURN_REQUIRED":
      return locale === "vi" ? `${actor} phải trả lại 2 lá.` : `${actor} must return two cards.`;
    case "TRASH_OUT_RESOLVED":
      return locale === "vi" ? `${actor} đã đổ rác của ${target}.` : `${actor} trashed ${target}'s hand.`;
    case "ACTION_TIMED_OUT":
      return locale === "vi" ? `Hành động của ${actor} hết giờ; máy chủ tự xử lý.` : `${actor}'s action timed out; the server resolved it.`;
    case "POT_REVEALED": {
      const score = typeof payload.score === "number" ? payload.score : null;
      return locale === "vi" ? `Nồi được mở: ${formatScore(score)} điểm.` : `The pot was revealed: ${formatScore(score)} points.`;
    }
    case "GAME_ENDED":
      return locale === "vi" ? "Ván đấu đã kết thúc." : "The game has ended.";
    default:
      return locale === "vi" ? "Một sự kiện vừa xảy ra trên bàn." : "A table event just happened.";
  }
}

function roleArt(role: string | null | undefined): string {
  return role === "MEAT_EATER"
    ? NOT_IN_MY_POT_ASSETS.cards.meatEaterRole
    : role === "VEGETARIAN"
      ? NOT_IN_MY_POT_ASSETS.cards.vegetarianRole
      : NOT_IN_MY_POT_ASSETS.cards.roleBack;
}

function remainingSeconds(deadline: string | null | undefined): number | null {
  if (!deadline) {
    return null;
  }
  const remaining = Math.ceil((new Date(deadline).getTime() - Date.now()) / 1000);
  return Math.max(0, remaining);
}

function ModalShell({ title, children, onClose, wide = false }: { title: string; children: ReactNode; onClose?: () => void; wide?: boolean }) {
  return (
    <div className={styles.modalLayer} role="dialog" aria-modal="true" aria-labelledby="nimp-modal-title">
      <div className={styles.modalBackdrop} />
      <section className={`${styles.modalCard} ${wide ? styles.modalWide : ""}`}>
        <header className={styles.modalHeader}>
          <h2 id="nimp-modal-title">{title}</h2>
          {onClose ? (
            <button type="button" className={styles.modalClose} onClick={onClose} aria-label="Close">
              <X size={18} />
            </button>
          ) : null}
        </header>
        <div className={styles.modalBody}>{children}</div>
      </section>
    </div>
  );
}

function NimpCard({
  card,
  locale,
  compact = false,
  interactive = true,
  selected = false,
  disabled = false,
  onClick,
  showScore = true,
}: {
  card: NotInMyPotCard;
  locale: "vi" | "en";
  compact?: boolean;
  interactive?: boolean;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  showScore?: boolean;
}) {
  const meta = cardMeta(card);
  const className = [
    styles.gameCard,
    compact ? styles.compactCard : "",
    selected ? styles.cardSelected : "",
    disabled ? styles.cardDisabled : "",
  ]
    .filter(Boolean)
    .join(" ");
  const content = (
    <>
      <img className={styles.cardImage} src={meta.art} alt="" loading="eager" decoding="async" />
      <span className={styles.cardFooter}>
        <strong>{locale === "vi" ? meta.labelVi : meta.labelEn}</strong>
        <span>{locale === "vi" ? meta.descriptionVi : meta.descriptionEn}</span>
        {showScore && card.score !== null ? <em>{formatScore(card.score)} {locale === "vi" ? "điểm" : "pts"}</em> : null}
      </span>
    </>
  );
  if (!interactive) {
    return <div className={className}>{content}</div>;
  }
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      disabled={disabled}
      aria-label={locale === "vi" ? `Chọn lá ${meta.labelVi}` : `Select ${meta.labelEn} card`}
    >
      {content}
    </button>
  );
}

function TableSeat({
  player,
  position,
  total,
  locale,
  targetable,
  onTarget,
}: {
  player: NotInMyPotPlayer;
  position: number;
  total: number;
  locale: "vi" | "en";
  targetable: boolean;
  onTarget: () => void;
}) {
  const angle = total > 1 ? 90 + (position * 360) / total : 90;
  const left = 50 + Math.cos((angle * Math.PI) / 180) * 42;
  const top = 50 + Math.sin((angle * Math.PI) / 180) * 38;
  const seatClass = [styles.seat, player.you ? styles.seatSelf : "", targetable ? styles.seatTarget : "", player.expelled ? styles.seatExpelled : ""]
    .filter(Boolean)
    .join(" ");
  const seatContent = (
    <>
      <span className={styles.seatMeta}>
        <strong className={styles.seatName}>{player.displayName}{player.you ? <em>{locale === "vi" ? "BẠN" : "YOU"}</em> : null}</strong>
      </span>
      <span className={styles.outCardTrack} aria-label={`${player.doorCount} / 3 ${locale === "vi" ? "lá Mời ra khỏi nhà" : "Out You Go cards"}`}>
        {Array.from({ length: Math.max(0, Math.min(3, player.doorCount)) }, (_, index) => (
          <img key={index} src={NOT_IN_MY_POT_ASSETS.cards.outOfHouse} alt="" aria-hidden="true" />
        ))}
      </span>
      {player.expelled && player.role ? (
        <span className={styles.expelledRoleReveal}>
          <img src={roleArt(player.role)} alt={roleLabel(player.role, locale)} />
          <small>{roleLabel(player.role, locale)}</small>
        </span>
      ) : null}
      <span className={styles.seatStatus}>
        {player.expelled ? (locale === "vi" ? "Ngoài nhà" : "Out of house") : !player.connected ? (locale === "vi" ? "Mất kết nối" : "Disconnected") : ""}
      </span>
    </>
  );
  return (
    <button
      type="button"
      className={seatClass}
      style={{ left: `${left}%`, top: `${top}%` }}
      disabled={!targetable}
      onClick={onTarget}
      aria-label={targetable ? (locale === "vi" ? `Chọn ${player.displayName}` : `Target ${player.displayName}`) : player.displayName}
    >
      {seatContent}
    </button>
  );
}

function ActionCardModal({
  card,
  players,
  locale,
  selectedTargetId,
  onSelectTarget,
  onConfirm,
  onClose,
  busy,
}: {
  card: NotInMyPotCard;
  players: NotInMyPotPlayer[];
  locale: "vi" | "en";
  selectedTargetId: string | null;
  onSelectTarget: (playerId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
  busy: boolean;
}) {
  const needsTarget = isTargetAction(card.type);
  const targets = players.filter((player) => player.active && !player.you && !player.expelled);
  return (
    <ModalShell title={locale === "vi" ? "Chọn cách dùng lá" : "Choose how to play this card"} onClose={onClose}>
      <div className={styles.actionPreview}>
        <NimpCard card={card} locale={locale} compact interactive={false} />
        <div>
          <p className={styles.modalEyebrow}>{locale === "vi" ? "HÀNH ĐỘNG" : "ACTION CARD"}</p>
          <h3>{cardLabel(card, locale)}</h3>
          <p>{locale === "vi" ? cardMeta(card).descriptionVi : cardMeta(card).descriptionEn}</p>
        </div>
      </div>
      {needsTarget ? (
        <>
          <p className={styles.modalPrompt}>{locale === "vi" ? "Chọn người bị tác động:" : "Choose a player to target:"}</p>
          <div className={styles.targetGrid}>
            {targets.map((player) => (
              <button type="button" key={player.playerId} className={`${styles.targetButton} ${selectedTargetId === player.playerId ? styles.targetSelected : ""}`} onClick={() => onSelectTarget(player.playerId)}>
                <PlayerAvatar playerId={player.playerId} displayName={player.displayName} size={34} decorative />
                <span>{player.displayName}</span>
                <small>{player.doorCount}/3 {locale === "vi" ? "cửa" : "doors"}</small>
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className={styles.modalPrompt}>{locale === "vi" ? "Lá này sẽ xử lý ngay khi bạn xác nhận." : "This card resolves as soon as you confirm."}</p>
      )}
      <div className={styles.modalFooter}>
        <button type="button" className={styles.ghostButton} onClick={onClose}>{locale === "vi" ? "Để sau" : "Not yet"}</button>
        <button type="button" className={styles.primaryButton} disabled={busy || (needsTarget && !selectedTargetId)} onClick={onConfirm}>
          <Sparkles size={16} /> {locale === "vi" ? "Dùng lá" : "Play card"}
        </button>
      </div>
    </ModalShell>
  );
}

function PendingActionModal({
  pending,
  inspectedCards,
  hand,
  players,
  locale,
  reorderIds,
  returnIds,
  onReorder,
  onToggleReturn,
  onTarget,
  onSubmitReorder,
  onSubmitReturn,
  busy,
}: {
  pending: NotInMyPotPendingAction;
  inspectedCards: NotInMyPotCard[];
  hand: NotInMyPotCard[];
  players: NotInMyPotPlayer[];
  locale: "vi" | "en";
  reorderIds: string[];
  returnIds: string[];
  onReorder: (index: number, delta: number) => void;
  onToggleReturn: (cardId: string) => void;
  onTarget: (playerId: string) => void;
  onSubmitReorder: () => void;
  onSubmitReturn: () => void;
  busy: boolean;
}) {
  const actorIsYou = pending.actorPlayerId.length > 0;
  const seconds = remainingSeconds(pending.deadline);
  if (pending.type === "SELECT_TARGET") {
    const targets = players.filter((player) => pending.allowedTargetPlayerIds.includes(player.playerId));
    return (
      <ModalShell title={locale === "vi" ? "Chọn mục tiêu" : "Choose a target"}>
        <div className={styles.pendingIntro}>
          <CircleAlert size={22} />
          <p>{locale === "vi" ? "Hành động của bạn cần một người chơi khác." : "Your action needs another player."}</p>
        </div>
        <div className={styles.targetGrid}>
          {targets.map((player) => (
            <button type="button" key={player.playerId} className={styles.targetButton} disabled={busy} onClick={() => onTarget(player.playerId)}>
              <PlayerAvatar playerId={player.playerId} displayName={player.displayName} size={34} decorative />
              <span>{player.displayName}</span>
              <small>{player.doorCount}/3 {locale === "vi" ? "cửa" : "doors"}</small>
            </button>
          ))}
        </div>
        {seconds !== null ? <p className={styles.timer}><Clock3 size={14} /> {seconds}s</p> : null}
      </ModalShell>
    );
  }
  if (pending.type === "REORDER_POT_CARDS") {
    const ordered = reorderIds.map((id) => inspectedCards.find((card) => card.cardId === id)).filter((card): card is NotInMyPotCard => Boolean(card));
    return (
      <ModalShell title={locale === "vi" ? "Xếp lại nồi" : "Reorder the pot"} wide>
        <div className={styles.pendingIntro}>
          <ShoppingBasket size={22} />
          <p>{locale === "vi" ? "Đây là thông tin riêng của bạn. Thứ tự 1 sẽ nằm trên cùng nồi." : "This information is private to you. Position 1 goes on top of the pot."}</p>
        </div>
        <div className={styles.reorderList}>
          {ordered.map((card, index) => (
            <div className={styles.reorderRow} key={card.cardId}>
              <span className={styles.orderNumber}>{index + 1}</span>
              <NimpCard card={card} locale={locale} compact interactive={false} />
              <span className={styles.reorderCopy}><strong>{cardLabel(card, locale)}</strong><small>{locale === "vi" ? "Thông tin bí mật" : "Private information"}</small></span>
              <span className={styles.reorderActions}>
                <button type="button" className={styles.reorderMove} disabled={index === 0 || busy} onClick={() => onReorder(index, -1)} aria-label="Move up"><ChevronUp size={16} /></button>
                <button type="button" className={styles.reorderMove} disabled={index === ordered.length - 1 || busy} onClick={() => onReorder(index, 1)} aria-label="Move down"><ChevronDown size={16} /></button>
              </span>
            </div>
          ))}
        </div>
        <div className={styles.modalFooter}>
          <span className={styles.selectionCount}>{ordered.length}/{pending.requiredCardCount} {locale === "vi" ? "lá" : "cards"}</span>
          <button type="button" className={styles.primaryButton} disabled={busy || ordered.length !== pending.requiredCardCount} onClick={onSubmitReorder}><Check size={16} /> {locale === "vi" ? "Đặt vào nồi" : "Place in pot"}</button>
        </div>
        {seconds !== null ? <p className={styles.timer}><Clock3 size={14} /> {seconds}s</p> : null}
      </ModalShell>
    );
  }
  if (pending.type === "RETURN_SHOPPING_CARDS") {
    const choices = hand.filter((card) => pending.allowedCardIds.includes(card.cardId));
    return (
      <ModalShell title={locale === "vi" ? "Trả bài đi chợ" : "Return shopping cards"} wide>
        <div className={styles.pendingIntro}>
          <ShoppingBasket size={22} />
          <p>{locale === "vi" ? `Chọn đúng ${pending.requiredCardCount} lá để trả lại chồng bài.` : `Choose exactly ${pending.requiredCardCount} cards to return to the deck.`}</p>
        </div>
        <div className={styles.pendingHand}>
          {choices.map((card) => (
            <NimpCard key={card.cardId} card={card} locale={locale} compact selected={returnIds.includes(card.cardId)} disabled={busy} onClick={() => onToggleReturn(card.cardId)} />
          ))}
        </div>
        <div className={styles.modalFooter}>
          <span className={styles.selectionCount}>{returnIds.length}/{pending.requiredCardCount} {locale === "vi" ? "đã chọn" : "selected"}</span>
          <button type="button" className={styles.primaryButton} disabled={busy || returnIds.length !== pending.requiredCardCount} onClick={onSubmitReturn}><Check size={16} /> {locale === "vi" ? "Trả bài" : "Return cards"}</button>
        </div>
        {seconds !== null ? <p className={styles.timer}><Clock3 size={14} /> {seconds}s</p> : null}
      </ModalShell>
    );
  }
  return (
    <ModalShell title={locale === "vi" ? "Đang xử lý" : "Resolving action"}>
      <p>{actorIsYou ? (locale === "vi" ? "Máy chủ đang xử lý hành động của bạn." : "The server is resolving your action.") : (locale === "vi" ? "Một người chơi đang hoàn thành hành động." : "Another player is completing an action.")}</p>
    </ModalShell>
  );
}

function ResultModal({
  view,
  room,
  locale,
  onPlayAgain,
  onLeave,
}: {
  view: NotInMyPotView;
  room: RoomView;
  locale: "vi" | "en";
  onPlayAgain: () => void;
  onLeave: () => void;
}) {
  const won = view.winnerPlayerIds.includes(view.you);
  const winners = view.players.filter((player) => view.winnerPlayerIds.includes(player.playerId));
  const winnerRole = roleLabel(view.winnerFaction, locale);
  const gameEndedEvent = [...view.publicEvents].reverse().find((event) => event.type === "GAME_ENDED");
  const endReason = typeof gameEndedEvent?.payload.reason === "string" ? gameEndedEvent.payload.reason : null;
  const automaticEnd = view.finalPotScore === null
    && (endReason === "FACTIONS_EQUAL"
      || endReason === "DRAW_PILE_EMPTY"
      || endReason === "ALL_MEAT_EATERS_EXPELLED");
  const automaticReasonText = endReason === "FACTIONS_EQUAL"
    ? (locale === "vi" ? "Số Người Ăn Thịt còn lại bằng số Người Ăn Chay còn lại." : "The remaining Meat Eaters equal the remaining Vegetarians.")
    : endReason === "ALL_MEAT_EATERS_EXPELLED"
      ? (locale === "vi" ? "Tất cả Người Ăn Thịt đã bị loại khỏi nhà." : "All Meat Eaters were expelled from the house.")
      : (locale === "vi" ? "Chồng bài rút đã hết." : "The draw pile is empty.");
  return (
    <div className={styles.resultLayer} role="dialog" aria-modal="true" aria-labelledby="nimp-result-title">
      <div className={styles.resultBackdrop} />
      <section className={`${styles.resultCard} ${won ? styles.resultWin : styles.resultLose}`}>
        <div className={styles.resultRibbon}><Sparkles size={16} /> {locale === "vi" ? "BẾP ĐÃ KHÉP LẠI" : "KITCHEN CLOSED"}</div>
        <div className={styles.resultOutcome}>
          <span className={styles.resultIcon}>{won ? <ShieldCheck size={30} /> : <CircleAlert size={30} />}</span>
          <p className={styles.modalEyebrow}>{won ? (locale === "vi" ? "PHE CỦA BẠN THẮNG" : "YOUR FACTION WON") : (locale === "vi" ? "PHE ĐỐI THỦ THẮNG" : "THE OTHER FACTION WON")}</p>
          <h2 id="nimp-result-title">{winnerRole}</h2>
        </div>
        <div className={styles.resultScore}>
          {automaticEnd ? (
            <>
              <span>{locale === "vi" ? "KẾT THÚC TỰ ĐỘNG" : "AUTOMATIC END"}</span>
              <strong>{locale === "vi" ? "Không mở nồi" : "Pot not revealed"}</strong>
              <small className={styles.automaticResultReason}>{automaticReasonText}</small>
            </>
          ) : (
            <>
              <span>{locale === "vi" ? "Điểm nồi cuối" : "Final pot score"}</span>
              <strong>{formatScore(view.finalPotScore)} <small>/ {view.targetScore}</small></strong>
            </>
          )}
        </div>
        <div className={styles.resultWinners}>
          <h3>{locale === "vi" ? "Người thắng" : "Winners"}</h3>
          <div className={styles.winnerList}>
            {winners.map((player) => (
              <div className={styles.winnerRow} key={player.playerId}>
                <PlayerAvatar playerId={player.playerId} displayName={player.displayName} avatarUrl={room.players.find((item) => item.playerId === player.playerId)?.avatarUrl} size={40} decorative />
                <span><strong>{player.displayName}</strong><small>{roleLabel(player.role, locale)}</small></span>
                {player.eloDelta !== null ? <em className={player.eloDelta >= 0 ? styles.eloUp : styles.eloDown}>{player.eloDelta >= 0 ? "+" : ""}{player.eloDelta} ELO</em> : null}
              </div>
            ))}
          </div>
        </div>
        {view.finalPot.length > 0 ? (
          <div className={styles.resultPot}>
            <h3>{locale === "vi" ? "Nồi được mở" : "Revealed pot"}</h3>
            <div className={styles.resultPotCards}>
              {view.finalPot.map((card) => <NimpCard key={card.cardId} card={card} locale={locale} compact interactive={false} />)}
            </div>
          </div>
        ) : null}
        <div className={styles.eloBoard}>
          {view.players.filter((player) => player.newElo !== null).map((player) => (
            <div className={styles.eloRow} key={player.playerId}>
              <span>{player.displayName}</span>
              <small>{player.oldElo} → {player.newElo}</small>
              <em className={player.eloDelta !== null && player.eloDelta >= 0 ? styles.eloUp : styles.eloDown}>{player.eloDelta !== null && player.eloDelta >= 0 ? "+" : ""}{player.eloDelta ?? 0}</em>
            </div>
          ))}
        </div>
        <div className={styles.resultActions}>
          <button type="button" className={styles.primaryButton} onClick={onPlayAgain}><RotateCcw size={17} /> {locale === "vi" ? "Chơi lại" : "Play again"}</button>
          <button type="button" className={styles.dangerButton} onClick={onLeave}><LogOut size={16} /> {locale === "vi" ? "Rời phòng" : "Leave room"}</button>
        </div>
      </section>
    </div>
  );
}

export function NotInMyPotPlayPage({
  room,
  view,
  snapshotPending = false,
  snapshotError = null,
  notice,
  rejectCode,
  sendCommand,
}: NotInMyPotPlayPageProps) {
  const locale = useLocale();
  const navigate = useNavigate();
  const leave = useLeaveRoom();
  const [showRole, setShowRole] = useState(false);
  const [roleSeen, setRoleSeen] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [logCollapsed, setLogCollapsed] = useState(false);
  const [selectedAction, setSelectedAction] = useState<NotInMyPotCard | null>(null);
  const [selectedActionTarget, setSelectedActionTarget] = useState<string | null>(null);
  const [showPotReady, setShowPotReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null);
  const [movingCard, setMovingCard] = useState<NotInMyPotCard | null>(null);
  const [revealCompletedVersion, setRevealCompletedVersion] = useState<number | null>(null);
  const [noticeHidden, setNoticeHidden] = useState(false);
  const [reorderIds, setReorderIds] = useState<string[]>([]);
  const [returnIds, setReturnIds] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [visibleActionEventKey, setVisibleActionEventKey] = useState<string | null>(null);
  const [activeMotionEvent, setActiveMotionEvent] = useState<NotInMyPotEvent | null>(null);
  const [showRemoteFlight, setShowRemoteFlight] = useState(false);

  useEffect(() => {
    const images = NOT_IN_MY_POT_PRELOAD_ASSETS.map((src) => {
      const image = new Image();
      image.src = src;
      return image;
    });
    return () => {
      images.forEach((image) => {
        image.onload = null;
        image.onerror = null;
      });
    };
  }, []);

  useEffect(() => {
    if (view?.myRole && !roleSeen) {
      setRoleSeen(true);
      setShowRole(true);
    }
  }, [roleSeen, view?.myRole]);

  useEffect(() => {
    setNoticeHidden(false);
  }, [notice]);

  useEffect(() => {
    if (!view?.pendingAction) {
      setReorderIds([]);
      setReturnIds([]);
      return;
    }
    if (view.pendingAction.type === "REORDER_POT_CARDS") {
      setReorderIds(view.privateInspectedCards.map((card) => card.cardId));
      setReturnIds([]);
    } else if (view.pendingAction.type === "RETURN_SHOPPING_CARDS") {
      setReturnIds((current) => current.filter((id) => view.pendingAction?.allowedCardIds.includes(id)));
      setReorderIds([]);
    } else {
      setReorderIds([]);
      setReturnIds([]);
    }
  }, [view?.pendingAction, view?.privateInspectedCards]);

  useEffect(() => {
    if (!view?.pendingAction?.deadline) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [view?.pendingAction?.deadline]);

  const submit = useCallback((command: NotInMyPotCommand): boolean => {
    const requestId = sendCommand(command);
    if (!requestId) {
      return false;
    }
    setBusy(true);
    window.setTimeout(() => setBusy(false), 1_600);
    return true;
  }, [sendCommand]);

  useEffect(() => {
    if (view?.stateVersion) {
      setBusy(false);
    }
  }, [view?.stateVersion]);

  useEffect(() => {
    if (!view || !selectedHandCardId || view.myHand.some((card) => card.cardId === selectedHandCardId)) {
      return;
    }
    setSelectedHandCardId(null);
  }, [selectedHandCardId, view]);

  useEffect(() => {
    if (!view?.finished) {
      setRevealCompletedVersion(null);
    }
  }, [view?.finished]);

  const tablePlayers = useMemo(() => {
    if (!view) {
      return [];
    }
    const sorted = [...view.players].sort((left, right) => left.seat - right.seat);
    const selfIndex = sorted.findIndex((player) => player.you || player.playerId === view.you);
    return selfIndex >= 0 ? [...sorted.slice(selfIndex), ...sorted.slice(0, selfIndex)] : sorted;
  }, [view]);
  const pending = view?.pendingAction ?? null;
  const pendingForYou = Boolean(view && pending && pending.actorPlayerId === view.you);
  const pendingTargetIds = pendingForYou && pending?.type === "SELECT_TARGET" ? new Set(pending.allowedTargetPlayerIds) : new Set<string>();
  const currentPlayer = view?.players.find((player) => player.playerId === view.currentPlayerId);
  const events = view?.publicEvents.slice(-24).reverse() ?? [];
  const latestActionEventIndex = view?.publicEvents.map((event) => event.type).lastIndexOf("ACTION_STARTED") ?? -1;
  const latestActionEvent = view && latestActionEventIndex >= 0 ? view.publicEvents[latestActionEventIndex] : null;
  const latestActionEventKey = latestActionEvent ? `${view?.roomId ?? room.id}:${latestActionEventIndex}` : null;
  const latestIngredientEvent = events.find((event) => event.type === "INGREDIENT_DECLARED") ?? null;
  const pendingSeconds = remainingSeconds(pending?.deadline);
  // Keep `now` in the component so the countdown updates even when the server is quiet.
  void now;

  useEffect(() => {
    if (!latestActionEventKey) {
      setVisibleActionEventKey(null);
      return;
    }
    setVisibleActionEventKey(latestActionEventKey);
    const timer = window.setTimeout(() => setVisibleActionEventKey(null), 10_000);
    return () => window.clearTimeout(timer);
  }, [latestActionEventKey]);

  const motionTypes = useMemo(() => ["SCOOP_OUT_RESOLVED", "POT_REORDER_REQUIRED", "EMERGENCY_SHOPPING_RESOLVED", "TRASH_OUT_RESOLVED"], []);
  const latestMotionIdx = view ? view.publicEvents.map((e) => e.type).reduce((acc, type, idx) => motionTypes.includes(type) ? idx : acc, -1) : -1;
  const latestMotionEvt = view && latestMotionIdx >= 0 ? view.publicEvents[latestMotionIdx] : null;
  const latestMotionEvtKey = latestMotionEvt ? `${view?.roomId ?? room.id}:motion:${latestMotionIdx}` : null;

  useEffect(() => {
    if (!latestMotionEvt || !latestMotionEvtKey) {
      setActiveMotionEvent(null);
      return;
    }
    setActiveMotionEvent(latestMotionEvt);
    const timer = window.setTimeout(() => {
      setActiveMotionEvent(null);
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [latestMotionEvtKey, latestMotionEvt]);

  const latestIngredientIdx = view ? view.publicEvents.map((e) => e.type).lastIndexOf("INGREDIENT_DECLARED") : -1;
  const latestIngredientEvt = view && latestIngredientIdx >= 0 ? view.publicEvents[latestIngredientIdx] : null;
  const isRemoteIngredient = Boolean(latestIngredientEvt && latestIngredientEvt.payload.playerId !== view?.you);
  const latestRemoteIngredientKey = isRemoteIngredient && latestIngredientEvt ? `${view?.roomId ?? room.id}:remote-ing:${latestIngredientIdx}` : null;

  useEffect(() => {
    if (!latestRemoteIngredientKey) {
      setShowRemoteFlight(false);
      return;
    }
    setShowRemoteFlight(true);
    const timer = window.setTimeout(() => {
      setShowRemoteFlight(false);
    }, 750);
    return () => window.clearTimeout(timer);
  }, [latestRemoteIngredientKey]);

  const onHandCard = (card: NotInMyPotCard) => {
    if (!view?.canAct || busy || pending || movingCard) {
      return;
    }
    if (isIngredient(card)) {
      setSelectedHandCardId((current) => current === card.cardId ? null : card.cardId);
      return;
    }
    setSelectedHandCardId(null);
    setSelectedActionTarget(null);
    setSelectedAction(card);
  };

  const playSelectedIngredient = () => {
    const card = view?.myHand.find((item) => item.cardId === selectedHandCardId);
    if (!card || !isIngredient(card) || busy || movingCard || !view?.canAct) {
      return;
    }
    if (submit({ type: "PLAY_INGREDIENT", cardId: card.cardId, declaredType: card.type })) {
      setMovingCard(card);
      setSelectedHandCardId(null);
      window.setTimeout(() => setMovingCard(null), 720);
    }
  };

  const confirmAction = () => {
    if (!selectedAction) {
      return;
    }
    submit({
      type: "PLAY_ACTION",
      cardId: selectedAction.cardId,
      actionType: selectedAction.type,
      ...(selectedActionTarget ? { targetPlayerId: selectedActionTarget } : {}),
    });
    setSelectedAction(null);
    setSelectedActionTarget(null);
  };

  const reorder = (index: number, delta: number) => {
    setReorderIds((current) => {
      const next = [...current];
      const target = index + delta;
      if (target < 0 || target >= next.length) {
        return current;
      }
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const toggleReturn = (cardId: string) => {
    setReturnIds((current) => {
      if (current.includes(cardId)) {
        return current.filter((id) => id !== cardId);
      }
      if (current.length >= (pending?.requiredCardCount ?? 0)) {
        return current;
      }
      return [...current, cardId];
    });
  };

  if (!view) {
    return (
      <main className={styles.page}>
        <section className={styles.waitingScreen}>
          <img src={NOT_IN_MY_POT_ASSETS.visualIdentity} alt="Not In My Pot!" className={styles.waitingPoster} />
          <div className={styles.waitingCopy}>
            <p className={styles.modalEyebrow}>NOT IN MY POT!</p>
            <h1>{locale === "vi" ? "Đang mở bàn bếp…" : "Opening the kitchen table…"}</h1>
            <p>{snapshotError ? (locale === "vi" ? "Chưa lấy được trạng thái ván. Thử tải lại hoặc quay về phòng." : "The game state could not be loaded. Reload or return to the room.") : locale === "vi" ? "Đang nhận vai bí mật và bộ bài của bạn từ máy chủ." : "Receiving your private role and hand from the server."}</p>
            {snapshotPending ? <span className={styles.loadingPill}><span className={styles.loadingDot} /> {locale === "vi" ? "Đang kết nối…" : "Connecting…"}</span> : null}
            <button type="button" className={styles.ghostButton} onClick={() => leave.mutate(room.id)}><ArrowLeft size={16} /> {locale === "vi" ? "Về phòng" : "Back to room"}</button>
          </div>
        </section>
      </main>
    );
  }

  const turnText = pendingForYou
    ? locale === "vi" ? "Bạn cần hoàn thành hành động" : "You need to finish an action"
    : view.canAct
      ? locale === "vi" ? "Lượt của bạn" : "Your turn"
      : currentPlayer
        ? locale === "vi" ? `Đợi ${currentPlayer.displayName}` : `Waiting for ${currentPlayer.displayName}`
        : locale === "vi" ? "Đang đợi bàn" : "Waiting for the table";
  const pendingTitle = pending?.type === "SELECT_TARGET"
    ? locale === "vi" ? "Chọn mục tiêu để tiếp tục" : "Choose a target to continue"
    : pending?.type === "REORDER_POT_CARDS"
      ? locale === "vi" ? "Sắp xếp lại nồi — thông tin riêng" : "Reorder the pot — private view"
      : pending?.type === "RETURN_SHOPPING_CARDS"
        ? locale === "vi" ? "Trả lại 2 lá đi chợ" : "Return two shopping cards"
        : null;
  const selectedHandCard = view.myHand.find((card) => card.cardId === selectedHandCardId) ?? null;
  const actionType = typeof latestActionEvent?.payload.actionType === "string" ? latestActionEvent.payload.actionType : null;
  const actionActor = latestActionEvent ? playerName(view.players, latestActionEvent.payload.playerId, locale) : null;
  const actionCard = actionType ? {
    cardId: `action-zone-${actionType}`,
    category: "ACTION",
    type: actionType,
    score: null,
  } satisfies NotInMyPotCard : null;
  const showActionToast = Boolean(actionCard && latestActionEventKey === visibleActionEventKey);
  const latestAnnouncement = latestIngredientEvent;
  const latestAnnouncementKey = latestAnnouncement ? JSON.stringify(latestAnnouncement) : "announcement-empty";
  const revealInProgress = view.finished && view.finalPot.length > 0 && revealCompletedVersion !== view.stateVersion;

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <button type="button" className={styles.topButton} onClick={() => leave.mutate(room.id)}>
          <ArrowLeft size={17} /> <span>{locale === "vi" ? "Rời bàn" : "Leave table"}</span>
        </button>
        <div className={styles.brand}>
          <div className={styles.brandIcon}><Utensils size={19} /></div>
          <div><strong>Not In My Pot!</strong><span>{room.name} · {room.code}</span></div>
        </div>
        <div className={styles.topTools}>
          <div className={`${styles.gameStatus} ${view.finished ? styles.statusFinished : styles.statusLive}`}><span className={styles.statusDot} /> {view.finished ? (locale === "vi" ? "Đã xong" : "Finished") : phaseLabel(view.phase, locale)}</div>
          <button type="button" className={styles.topButton} onClick={() => { setRoleSeen(true); setShowRole(true); }}><ShieldCheck size={16} /> <span>{locale === "vi" ? "Vai của tôi" : "My role"}</span></button>
          <button type="button" className={styles.topIconButton} onClick={() => setShowRules(true)} aria-label={locale === "vi" ? "Luật chơi" : "Rules"}><BookOpen size={17} /></button>
        </div>
      </header>

      <div className={`${styles.gameLayout} ${logCollapsed ? styles.gameLayoutLogCollapsed : ""}`}>
        <section className={styles.tablePanel}>
          <div className={styles.panelHeader}>
            <div><p className={styles.modalEyebrow}>{locale === "vi" ? "BÀN BẾP" : "KITCHEN TABLE"}</p><h1>{locale === "vi" ? "Nồi của ai đây?" : "Whose pot is it?"}</h1></div>
            <div className={styles.scoreTarget}><span>{locale === "vi" ? "Mục tiêu" : "Target"}</span><strong>{view.targetScore} <small>{locale === "vi" ? "điểm" : "pts"}</small></strong></div>
          </div>

          <div className={styles.tableSurface} data-finished={view.finished}>
            <div className={styles.tableTexture} />
            <div className={styles.seatRing} aria-label={locale === "vi" ? "Ghế người chơi" : "Player seats"}>
              {tablePlayers.map((player, index) => (
                <TableSeat
                  key={player.playerId}
                  player={player}
                  position={index}
                  total={tablePlayers.length}
                  locale={locale}
                  targetable={pendingTargetIds.has(player.playerId)}
                  onTarget={() => submit({ type: "SELECT_TARGET", targetPlayerId: player.playerId })}
                />
              ))}
            </div>

            <div className={`${styles.turnIndicator} ${view.canAct ? styles.turnIndicatorYou : ""}`}>
              <span className={styles.turnIcon}>{pendingForYou ? <CircleAlert size={17} /> : view.canAct ? <Flame size={17} /> : <Clock3 size={17} />}</span>
              <span><strong>{turnText}</strong>{pendingTitle ? <small>{pendingTitle}</small> : null}</span>
              {pendingSeconds !== null && pendingForYou ? <em>{pendingSeconds}s</em> : null}
            </div>

            <div className={styles.centerStage}>
              <div className={styles.pileRow}>
                <CardPile
                  count={view.drawPileCount}
                  label={locale === "vi" ? "CHỒNG RÚT" : "DRAW PILE"}
                  emptyLabel={locale === "vi" ? "HẾT BÀI" : "EMPTY"}
                  cardLabel={locale === "vi" ? "lá" : "cards"}
                  cardBack={NOT_IN_MY_POT_ASSETS.cards.gameplayBack}
                  className={styles.drawPile}
                />

                <div className={styles.potPlayZone}>
                  <CardPile
                    count={view.potCardCount}
                    label={locale === "vi" ? "NỒI" : "POT"}
                    emptyLabel={locale === "vi" ? "NỒI ĐANG TRỐNG" : "POT IS EMPTY"}
                    cardLabel={locale === "vi" ? "lá" : "cards"}
                    cardBack={NOT_IN_MY_POT_ASSETS.cards.gameplayBack}
                    className={styles.potPile}
                  />
                </div>

                <CardPile
                  count={view.discardPileCount}
                  label={locale === "vi" ? "CHỒNG BỎ" : "DISCARD"}
                  emptyLabel={locale === "vi" ? "CHƯA CÓ BÀI" : "EMPTY"}
                  cardLabel={locale === "vi" ? "lá" : "cards"}
                  cardBack={NOT_IN_MY_POT_ASSETS.cards.gameplayBack}
                  className={styles.discardPile}
                />
              </div>

              {showActionToast ? <div className={`${styles.actionZone} ${styles.actionZoneActive}`} key={latestActionEventKey ?? undefined}>
                <div className={styles.actionZoneLabel}><Sparkles size={14} /><span>ACTION ZONE</span></div>
                {actionCard ? (
                  <div className={styles.actionZoneContent}>
                    <NimpCard card={actionCard} locale={locale} compact interactive={false} showScore={false} />
                    <span><strong>{cardLabel(actionCard, locale)}</strong><small>{actionActor} {locale === "vi" ? "đang xử lý hành động" : "is resolving an action"}</small></span>
                  </div>
                ) : null}
              </div> : null}

              {latestAnnouncement ? <div className={styles.tableAnnouncement} key={latestAnnouncementKey}>{eventText(latestAnnouncement, view.players, locale)}</div> : null}
            </div>

            {movingCard ? (
              <div className={styles.cardFlight} aria-hidden="true">
                <div className={styles.cardFlightInner}>
                  <img className={styles.cardFlightFront} src={cardMeta(movingCard).art} alt="" />
                  <img className={styles.cardFlightBack} src={NOT_IN_MY_POT_ASSETS.cards.gameplayBack} alt="" />
                </div>
              </div>
            ) : null}
            {showRemoteFlight ? <img key={latestRemoteIngredientKey ?? undefined} className={styles.remoteCardFlight} src={NOT_IN_MY_POT_ASSETS.cards.gameplayBack} alt="" aria-hidden="true" /> : null}
            {activeMotionEvent ? <TableEventAnimation key={latestMotionEvtKey ?? undefined} event={activeMotionEvent} cardBack={NOT_IN_MY_POT_ASSETS.cards.gameplayBack} locale={locale} /> : null}

            <section className={styles.handPanel} aria-label={locale === "vi" ? "Bài trên tay" : "Cards in hand"}>
              <div className={styles.handTitle}>
                <span><strong>{locale === "vi" ? "BÀI TRÊN TAY" : "MY HAND"}</strong><small>{view.myHand.length} {locale === "vi" ? "lá" : "cards"}</small></span>
                <span>{selectedHandCard ? (locale === "vi" ? `Đã chọn: ${cardLabel(selectedHandCard, locale)}` : `Selected: ${cardLabel(selectedHandCard, locale)}`) : (locale === "vi" ? "Chọn một lá để đánh" : "Select a card to play")}</span>
              </div>
              <div className={styles.handGrid}>
                {view.myHand.map((card) => <NimpCard key={card.cardId} card={card} locale={locale} selected={card.cardId === selectedHandCardId} disabled={!view.canAct || busy || Boolean(pending) || Boolean(movingCard) || revealInProgress} onClick={() => onHandCard(card)} />)}
                {view.myHand.length === 0 ? <p className={styles.emptyHand}>{locale === "vi" ? "Bạn không còn lá trên tay." : "You have no cards in hand."}</p> : null}
              </div>
              {selectedHandCard || view.canDeclarePotReady ? <div className={styles.actionDock}>
                {selectedHandCard && isIngredient(selectedHandCard) ? <button type="button" className={styles.playCardButton} disabled={busy || Boolean(movingCard)} onClick={playSelectedIngredient}><Flame size={17} /> {locale === "vi" ? "ĐÁNH LÁ NÀY" : "PLAY THIS CARD"}</button> : null}
                {view.canDeclarePotReady ? <button type="button" className={styles.readyButton} disabled={busy || Boolean(movingCard)} onClick={() => setShowPotReady(true)}><ShieldCheck size={17} /> {locale === "vi" ? "Mở nồi tính điểm" : "Reveal Pot and Calculate Score"}</button> : null}
              </div> : null}
            </section>
          </div>

        </section>

        <aside className={`${styles.sidePanel} ${logCollapsed ? styles.sidePanelCollapsed : ""}`}>
          {logCollapsed ? (
            <button type="button" className={styles.logExpandButton} onClick={() => setLogCollapsed(false)} aria-label={locale === "vi" ? "Mở Nhật ký bàn" : "Expand table log"}>
              <ChevronLeft size={18} />
              <BookOpen size={17} />
              <span>{locale === "vi" ? "Nhật ký" : "Log"}</span>
            </button>
          ) : (
            <div className={styles.sideSection}>
              <div className={styles.sideHeader}>
                <div><p className={styles.modalEyebrow}>{locale === "vi" ? "CÔNG KHAI" : "PUBLIC"}</p><h2>{locale === "vi" ? "Nhật ký bàn" : "Table log"}</h2></div>
                <div className={styles.logHeaderActions}>
                  <button type="button" className={styles.mobileLogButton} onClick={() => setShowLog((current) => !current)}>{showLog ? <X size={16} /> : <Info size={16} />}</button>
                  <button type="button" className={styles.collapseLogButton} onClick={() => setLogCollapsed(true)} aria-label={locale === "vi" ? "Thu nhỏ Nhật ký bàn" : "Collapse table log"}><ChevronRight size={17} /></button>
                </div>
              </div>
              <div className={`${styles.logList} ${showLog ? styles.logOpen : ""}`}>
                {events.length === 0 ? <p className={styles.emptyLog}>{locale === "vi" ? "Bàn đang chờ sự kiện đầu tiên." : "Waiting for the first table event."}</p> : events.map((event, index) => <div className={styles.logItem} key={`${event.type}-${index}`}><span className={styles.logMarker} /><div><p>{eventText(event, view.players, locale)}</p><small>{event.type.replaceAll("_", " ")}</small></div></div>)}
              </div>
            </div>
          )}
        </aside>
      </div>

      {notice && !noticeHidden ? <div className={`${styles.notice} ${rejectCode ? styles.noticeError : ""}`} role="status"><CircleAlert size={15} /> <span>{notice}</span><button type="button" onClick={() => setNoticeHidden(true)} aria-label="Dismiss"><X size={14} /></button></div> : null}

      {showRole && !view.finished ? (
        <ModalShell title={locale === "vi" ? "Vai bí mật của bạn" : "Your hidden role"} onClose={() => setShowRole(false)}>
          <div className={styles.roleModal}>
            <img src={roleArt(view.myRole)} alt="" className={styles.roleImage} />
            <span className={styles.rolePill}><ShieldCheck size={15} /> {roleLabel(view.myRole, locale)}</span>
            <div className={styles.roleConditions}>
              <p><strong>{locale === "vi" ? "Điều kiện thắng:" : "Win conditions:"}</strong></p>
              <ul>
                {view.myRole === "MEAT_EATER" ? (
                  <>
                    <li>{locale === "vi" ? "Nồi được mở nhưng không đạt mục tiêu điểm" : "The pot is revealed but misses the target score"}</li>
                    <li>{locale === "vi" ? "Số lượng Người Ăn Chay bị đuổi bằng với Người Ăn Thịt" : "Equal number of Vegetarians and Meat Eaters remain"}</li>
                  </>
                ) : (
                  <>
                    <li>{locale === "vi" ? "Tất cả Người Ăn Thịt đã bị đuổi khỏi nhà" : "All Meat Eaters are expelled from the house"}</li>
                    <li>{locale === "vi" ? `Tích lũy được ${view.targetScore} điểm trong nồi` : `Accumulate ${view.targetScore} points in the pot`}</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </ModalShell>
      ) : null}

      {selectedAction ? <ActionCardModal card={selectedAction} players={view.players} locale={locale} selectedTargetId={selectedActionTarget} onSelectTarget={setSelectedActionTarget} onConfirm={confirmAction} onClose={() => { setSelectedAction(null); setSelectedActionTarget(null); }} busy={busy} /> : null}

      {pending && pendingForYou ? <PendingActionModal pending={pending} inspectedCards={view.privateInspectedCards} hand={view.myHand} players={view.players} locale={locale} reorderIds={reorderIds} returnIds={returnIds} onReorder={reorder} onToggleReturn={toggleReturn} onTarget={(playerId) => { submit({ type: "SELECT_TARGET", targetPlayerId: playerId }); }} onSubmitReorder={() => { submit({ type: "REORDER_POT_CARDS", cardIds: reorderIds }); }} onSubmitReturn={() => { submit({ type: "RETURN_SHOPPING_CARDS", cardIds: returnIds }); }} busy={busy} /> : null}

      {showPotReady ? <ModalShell title={locale === "vi" ? "Mở nồi tính điểm?" : "Reveal Pot and Calculate Score?"} onClose={() => setShowPotReady(false)}><div className={styles.readyModal}><div className={styles.readyIcon}><ShieldCheck size={26} /></div><h3>{locale === "vi" ? "Mở nồi và tính điểm ngay?" : "Reveal the pot and calculate its score now?"}</h3><p>{locale === "vi" ? `Máy chủ sẽ mở nồi và so sánh điểm với mục tiêu ${view.targetScore}. Hành động này kết thúc ván.` : `The server will reveal the pot and compare it with the ${view.targetScore}-point target. This ends the game.`}</p></div><div className={styles.modalFooter}><button type="button" className={styles.ghostButton} onClick={() => setShowPotReady(false)}>{locale === "vi" ? "Chưa" : "Not yet"}</button><button type="button" className={styles.primaryButton} disabled={busy} onClick={() => { submit({ type: "DECLARE_POT_READY" }); setShowPotReady(false); }}><Check size={16} /> {locale === "vi" ? "Mở nồi tính điểm" : "Reveal Pot and Calculate Score"}</button></div></ModalShell> : null}

      {showRules ? <ModalShell title={locale === "vi" ? "Luật nhanh — Not In My Pot!" : "Quick rules — Not In My Pot!"} onClose={() => setShowRules(false)} wide><div className={styles.rulesGrid}><div><span className={styles.rulesNumber}>01</span><h3>{locale === "vi" ? "Bỏ nguyên liệu" : "Play an ingredient"}</h3><p>{locale === "vi" ? "Mỗi lá nguyên liệu có loại và điểm cố định: Rau củ +1, Đậu phụ 0, Thịt −2. Máy chủ lấy đúng giá trị trên lá." : "Every ingredient has a fixed type and score: Vegetable +1, Tofu 0, Meat −2. The server uses the card's actual value."}</p></div><div><span className={styles.rulesNumber}>02</span><h3>{locale === "vi" ? "Dùng action" : "Use actions"}</h3><p>{locale === "vi" ? "Đuổi người, vớt nồi, xem lại bài, đi chợ gấp hoặc đổ rác để phá kế hoạch." : "Send someone out, scoop the pot, inspect cards, shop in an emergency, or trash a hand."}</p></div><div><span className={styles.rulesNumber}>03</span><h3>{locale === "vi" ? "Nồi đạt mục tiêu" : "Hit the target"}</h3><p>{locale === "vi" ? "Người ăn chay có thể bấm Mở nồi tính điểm ở đầu lượt để mở điểm thật." : "A Vegetarian may press Reveal Pot and Calculate Score at the start of their turn to reveal the true score."}</p></div><div><span className={styles.rulesNumber}>04</span><h3>{locale === "vi" ? "Cửa nhà" : "Door marks"}</h3><p>{locale === "vi" ? "Một người bị mời ra 3 lần sẽ bị loại và lộ vai. Suy luận cẩn thận." : "A player sent out three times is expelled and reveals their role. Deduce carefully."}</p></div></div><div className={styles.rulesPrivacy}><EyeOff size={17} /><span>{locale === "vi" ? "Thông tin riêng: vai, bài trên tay và các lá bạn xem chỉ được gửi cho chính bạn." : "Private data: your role, hand, and inspected cards are only projected to you."}</span></div></ModalShell> : null}

      {revealInProgress ? <PotRevealSequence cards={view.finalPot} targetScore={view.targetScore} locale={locale} onComplete={() => setRevealCompletedVersion(view.stateVersion)} /> : null}

      {view.finished && !revealInProgress ? <ResultModal view={view} room={room} locale={locale} onPlayAgain={() => navigate(`/rooms/${room.id}`)} onLeave={() => leave.mutate(room.id)} /> : null}
    </main>
  );
}
