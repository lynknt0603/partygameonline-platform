import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
  LogOut,
  RotateCcw,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
  Trophy,
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
    descriptionVi: "Xem 3 lá trên cùng đã được tráo",
    descriptionEn: "Inspect the three shuffled top cards",
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

const TABLE_MOTION_TYPES = new Set([
  "INGREDIENT_DECLARED",
  "CARDS_DRAWN",
  "PLAYER_DOOR_UPDATED",
  "SCOOP_OUT_RESOLVED",
  "SLOTTED_SPOON_INSPECTION_REQUIRED",
  "EMERGENCY_SHOPPING_RESOLVED",
  "SHOPPING_CARDS_RETURNED",
  "TRASH_OUT_RESOLVED",
]);

interface TableMotionItem {
  key: string;
  event: NotInMyPotEvent;
}

function shouldQueueTableMotion(event: NotInMyPotEvent, selfPlayerId: string | undefined): boolean {
  if (!TABLE_MOTION_TYPES.has(event.type)) {
    return false;
  }
  if (event.type === "INGREDIENT_DECLARED") {
    return event.payload.playerId !== selfPlayerId;
  }
  if (event.type === "CARDS_DRAWN") {
    return event.payload.reason === "TURN_REFILL";
  }
  return true;
}

function motionDuration(event: NotInMyPotEvent): number {
  if (event.type === "TRASH_OUT_RESOLVED") return 2_600;
  if (event.type === "EMERGENCY_SHOPPING_RESOLVED") return 1_450;
  if (event.type === "SHOPPING_CARDS_RETURNED") return 1_250;
  return 1_100;
}

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

const HIDDEN_ACTIVITY_EVENT_TYPES: ReadonlySet<string> = new Set([
  "NOT_IN_MY_POT_GAME_STARTED",
  "TURN_STARTED",
  "TURN_TIMED_OUT",
  "ACTION_TIMED_OUT",
  "CARDS_DRAWN",
  "ACTION_RESOLVED",
  "TARGET_SELECTION_REQUIRED",
  "SCOOP_OUT_RESOLVED",
  "SLOTTED_SPOON_INSPECTION_REQUIRED",
  "SLOTTED_SPOON_RESOLVED",
  "EMERGENCY_SHOPPING_RESOLVED",
  "SHOPPING_RETURN_REQUIRED",
  "SHOPPING_CARDS_RETURNED",
]);

function eventText(event: NotInMyPotEvent, players: NotInMyPotPlayer[], locale: "vi" | "en"): string {
  const payload = event.payload;
  const actor = playerName(players, payload.playerId, locale);
  const target = playerName(players, payload.targetPlayerId, locale);
  const initiator = playerName(players, payload.actorPlayerId, locale);
  const actionType = typeof payload.actionType === "string" ? payload.actionType : "";
  const role = typeof payload.role === "string" ? payload.role : null;
  switch (event.type) {
    case "NOT_IN_MY_POT_GAME_STARTED":
      return locale === "vi" ? "Bếp đã mở cửa. Giữ bí mật vai của bạn." : "The kitchen is open. Keep your role secret.";
    case "TURN_STARTED":
      return locale === "vi" ? `Đến lượt ${actor}.` : `${actor}'s turn started.`;
    case "INGREDIENT_DECLARED":
      return locale === "vi" ? `${actor} bỏ nguyên liệu vào nồi.` : `${actor} added an ingredient to the pot.`;
    case "ACTION_STARTED":
      return locale === "vi"
        ? `${actor} dùng lá ${actionLabel(actionType, locale)}.`
        : `${actor} used the ${actionLabel(actionType, locale)} card.`;
    case "TARGET_SELECTION_REQUIRED":
      return locale === "vi" ? `${actor} đang chọn mục tiêu.` : `${actor} is choosing a target.`;
    case "PLAYER_DOOR_UPDATED":
      if (typeof payload.actorPlayerId === "string") {
        return locale === "vi"
          ? `${initiator} dùng lá ${actionLabel("OUT_OF_HOUSE", locale)} lên ${actor}.`
          : `${initiator} used the ${actionLabel("OUT_OF_HOUSE", locale)} card on ${actor}.`;
      }
      return locale === "vi" ? `${actor} nhận thêm một dấu cửa.` : `${actor} received another door mark.`;
    case "PLAYER_EXPELLED":
      return locale === "vi" ? `${actor} bị mời ra khỏi nhà${role ? ` — ${roleLabel(role, locale)}` : ""}.` : `${actor} was sent out${role ? ` — ${roleLabel(role, locale)}` : ""}.`;
    case "SCOOP_OUT_RESOLVED":
      return locale === "vi" ? `${actor} đã vớt bớt bài khỏi nồi.` : `${actor} scooped cards from the pot.`;
    case "SLOTTED_SPOON_INSPECTION_REQUIRED":
      return locale === "vi" ? `Hệ thống đang xáo ba lá trên cùng cho ${actor}.` : `The system is shuffling the top three cards for ${actor}.`;
    case "SLOTTED_SPOON_RESOLVED":
      return locale === "vi" ? "Ba lá trên cùng đã được xáo ngẫu nhiên." : "The top three cards were shuffled at random.";
    case "EMERGENCY_SHOPPING_RESOLVED":
      return locale === "vi" ? `${actor} vừa dùng lá đi chợ gấp.` : `${actor} just used the Emergency Shopping card.`;
    case "SHOPPING_RETURN_REQUIRED":
      return locale === "vi" ? `${actor} phải trả lại 2 lá.` : `${actor} must return two cards.`;
    case "TRASH_OUT_RESOLVED":
      return locale === "vi"
        ? `${actor} dùng lá ${actionLabel("TRASH_OUT", locale)} lên ${target}.`
        : `${actor} used the ${actionLabel("TRASH_OUT", locale)} card on ${target}.`;
    case "ACTION_TIMED_OUT":
      return locale === "vi" ? `Hành động của ${actor} hết giờ; máy chủ tự xử lý.` : `${actor}'s action timed out; the server resolved it.`;
    case "TURN_TIMED_OUT":
      return locale === "vi" ? `Lượt của ${actor} đã hết giờ.` : `${actor}'s turn timed out.`;
    case "PLAYER_ABANDONED":
      return locale === "vi" ? `${actor} đã rời bàn.` : `${actor} left the table.`;
    case "SHOPPING_CARDS_RETURNED":
      return locale === "vi" ? `${actor} đã trả lại bài đi chợ.` : `${actor} returned the shopping cards.`;
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
  isCurrentTurn,
}: {
  player: NotInMyPotPlayer;
  position: number;
  total: number;
  locale: "vi" | "en";
  targetable: boolean;
  onTarget: () => void;
  isCurrentTurn: boolean;
}) {
  const angle = total > 1 ? 90 + (position * 360) / total : 90;
  const left = 50 + Math.cos((angle * Math.PI) / 180) * 42;
  const top = 50 + Math.sin((angle * Math.PI) / 180) * 38;
  const isTurn = Boolean(isCurrentTurn && !player.expelled);
  const seatClass = [
    styles.seat,
    player.you ? styles.seatSelf : "",
    isTurn && !player.you ? styles.seatActiveOther : "",
    isTurn && player.you ? styles.seatActiveSelf : "",
    targetable ? styles.seatTarget : "",
    player.expelled ? styles.seatExpelled : "",
  ]
    .filter(Boolean)
    .join(" ");
  const seatContent = (
    <>
      <span className={styles.seatMeta}>
        <strong className={styles.seatName}>
          <span>{player.displayName}</span>
          {player.you ? <em className={styles.selfBadge}>{locale === "vi" ? "BẠN" : "YOU"}</em> : null}
          {isTurn && !player.you ? (
            <em className={styles.otherTurnBadge}>{locale === "vi" ? "Lượt của họ" : "Their turn"}</em>
          ) : null}
          {isTurn && player.you ? (
            <em className={styles.selfTurnBadge}>{locale === "vi" ? "Lượt của bạn" : "Your turn"}</em>
          ) : null}
        </strong>
      </span>
      {!player.expelled ? (
        <span className={styles.outCardTrack} aria-label={`${player.doorCount} / 3 ${locale === "vi" ? "lá Mời ra khỏi nhà" : "Out You Go cards"}`}>
          {Array.from({ length: Math.max(0, Math.min(3, player.doorCount)) }, (_, index) => (
            <img key={index} src={NOT_IN_MY_POT_ASSETS.cards.outOfHouse} alt="" aria-hidden="true" />
          ))}
        </span>
      ) : null}
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
  returnIds,
  onToggleReturn,
  onTarget,
  onAcknowledgeSpoon,
  onSubmitReturn,
  busy,
}: {
  pending: NotInMyPotPendingAction;
  inspectedCards: NotInMyPotCard[];
  hand: NotInMyPotCard[];
  players: NotInMyPotPlayer[];
  locale: "vi" | "en";
  returnIds: string[];
  onToggleReturn: (cardId: string) => void;
  onTarget: (playerId: string) => void;
  onAcknowledgeSpoon: () => void;
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
  if (pending.type === "INSPECT_SHUFFLED_POT") {
    return (
      <ModalShell title={locale === "vi" ? "Muôi thủng — Ba lá trên cùng" : "Slotted Spoon — Top three cards"} wide>
        <div className={styles.spoonInspection}>
          {inspectedCards.map((card, index) => (
            <div className={styles.spoonInspectionCard} key={card.cardId} style={{ animationDelay: `${index * 120}ms` }}>
              <NimpCard card={card} locale={locale} compact interactive={false} />
            </div>
          ))}
        </div>
        <p className={styles.spoonPrivacy}><EyeOff size={16} /> {locale === "vi" ? "Thứ tự hiển thị đã được tráo ngẫu nhiên." : "The display order has been shuffled."}</p>
        <div className={styles.modalFooter}>
          <span className={styles.selectionCount}>{inspectedCards.length} {locale === "vi" ? "lá riêng tư" : "private cards"}</span>
          <button type="button" className={styles.primaryButton} disabled={busy} onClick={onAcknowledgeSpoon}><Check size={16} /> {locale === "vi" ? "Đã xem" : "Done"}</button>
        </div>
        {seconds !== null ? <p className={styles.timer}><Clock3 size={14} /> {seconds}s</p> : null}
      </ModalShell>
    );
  }
  // Returning shopping cards is handled inline in the hand panel so the
  // player can select cards without opening a second modal.
  if (pending.type === "RETURN_SHOPPING_CARDS") {
    return null;
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

function formatPlayerElo(player: NotInMyPotPlayer): string | null {
  if (typeof player.eloDelta !== "number") {
    return null;
  }
  const currentElo =
    typeof player.newElo === "number"
      ? player.newElo
      : typeof player.oldElo === "number"
        ? player.oldElo + player.eloDelta
        : null;

  const signedDelta =
    player.eloDelta > 0
      ? `+${player.eloDelta}`
      : player.eloDelta < 0
        ? String(player.eloDelta)
        : "±0";

  if (currentElo !== null) {
    return `${currentElo} (${signedDelta})`;
  }
  return signedDelta;
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
  const winningIds = new Set(view.winnerPlayerIds.length > 0 ? view.winnerPlayerIds : view.players.filter((player) => player.winner).map((player) => player.playerId));
  const won = winningIds.has(view.you);
  const winners = view.players.filter((player) => winningIds.has(player.playerId));
  const otherPlayers = view.players.filter((player) => !winningIds.has(player.playerId));
  const winnerRole = roleLabel(view.winnerFaction, locale);
  const losingRole = view.winnerFaction === "VEGETARIAN"
    ? roleLabel("MEAT_EATER", locale)
    : view.winnerFaction === "MEAT_EATER"
      ? roleLabel("VEGETARIAN", locale)
      : locale === "vi" ? "Phe còn lại" : "Other faction";
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
  const winnerTeamText = locale === "vi" ? `${winnerRole} thắng` : `The ${winnerRole} team won`;
  const secondaryTitle = endReason === "ALL_MEAT_EATERS_EXPELLED"
    ? locale === "vi" ? "Đã bị loại" : "Eliminated"
    : won
      ? locale === "vi" ? "Đội đối thủ" : "Other Team"
      : locale === "vi" ? "Đội của bạn" : "Your Team";
  const reasonTitle = won
    ? view.winnerFaction === "VEGETARIAN"
      ? locale === "vi" ? "Căn bếp đã được bảo vệ!" : "The kitchen stayed safe!"
      : locale === "vi" ? "Phe ăn thịt đã giành chiến thắng!" : "The Meat Eater team took the win!"
    : locale === "vi" ? "Đừng lo, mỗi ván là một cơ hội mới!" : "Better luck next time — every game is a new chance!";
  const reasonBody = automaticEnd
    ? automaticReasonText
    : view.finalPotScore !== null
      ? locale === "vi" ? `Nồi đạt ${view.finalPotScore}/${view.targetScore} điểm.` : `The pot reached ${view.finalPotScore}/${view.targetScore} points.`
      : locale === "vi" ? "Ván đấu đã kết thúc theo luật của trò chơi." : "The match ended according to the game rules.";
  const renderPlayerRows = (players: NotInMyPotPlayer[], variant: "winner" | "other") => players.map((player, index) => {
    const isYou = player.playerId === view.you;
    const avatarUrl = room.players.find((item) => item.playerId === player.playerId)?.avatarUrl;
    const delta = player.eloDelta;
    const eloText = formatPlayerElo(player);
    return (
      <div className={`${styles.resultPlayerRow} ${isYou ? styles.resultPlayerYou : ""}`} key={player.playerId}>
        <span className={`${styles.resultRank} ${variant === "winner" ? styles.resultRankWinner : styles.resultRankOther}`}>{index + 1}</span>
        <span className={styles.resultAvatarSlot}>
          <PlayerAvatar playerId={player.playerId} displayName={player.displayName} avatarUrl={avatarUrl} size={38} decorative />
        </span>
        <span className={styles.resultPlayerInfo}>
          <strong>{player.displayName}{isYou ? (locale === "vi" ? " (Bạn)" : " (You)") : ""}</strong>
          <small>{roleLabel(player.role, locale)}</small>
        </span>
        {eloText ? <em className={delta !== null && delta < 0 ? styles.eloDown : styles.eloUp}>{eloText}</em> : null}
      </div>
    );
  });
  return (
    <div className={styles.resultLayer} role="dialog" aria-modal="true" aria-labelledby="nimp-result-title">
      <div className={styles.resultBackdrop} />
      <section className={`${styles.resultCard} ${won ? styles.resultWin : styles.resultLose}`}>
        <div className={styles.resultKitchenPill}><Utensils size={15} /> {locale === "vi" ? "BẾP ĐÃ ĐÓNG" : "KITCHEN CLOSED"}</div>
        <div className={styles.resultHero}>
          <div className={`${styles.resultHeroBadge} ${won ? styles.resultHeroBadgeWin : styles.resultHeroBadgeLose}`} aria-hidden="true">
            {won ? <Trophy size={28} /> : <CircleAlert size={28} />}
          </div>
          <div className={`${styles.resultHeroTitle} ${won ? styles.resultHeroTitleWin : styles.resultHeroTitleLose}`}>
            <h2 id="nimp-result-title">{won ? (locale === "vi" ? "Chiến thắng!" : "Victory!") : (locale === "vi" ? "Hẹn may mắn lần sau!" : "Better Luck Next Time!")}</h2>
          </div>
          <p className={styles.resultTeamOutcome}>{winnerTeamText}</p>
        </div>
        <div className={`${styles.resultMessage} ${won ? styles.resultMessageWin : styles.resultMessageLose}`}>
          <span className={styles.resultMessageIcon}>{won ? <ShieldCheck size={24} /> : <Sparkles size={24} />}</span>
          <span><strong>{reasonTitle}</strong><small>{reasonBody}</small></span>
        </div>
        <div className={`${styles.resultTeamBlock} ${styles.resultWinnersBlock}`}>
          <div className={styles.resultTeamHeading}><h3><Trophy size={17} /> {locale === "vi" ? "Người thắng" : "Winners"}</h3><span>{winnerRole}</span></div>
          <div className={styles.resultPlayerList}>{renderPlayerRows(winners, "winner")}</div>
        </div>
        {otherPlayers.length > 0 ? (
          <div className={`${styles.resultTeamBlock} ${styles.resultOthersBlock}`}>
            <div className={styles.resultTeamHeading}><h3><CircleAlert size={17} /> {secondaryTitle}</h3><span>{losingRole}</span></div>
            <div className={styles.resultPlayerList}>{renderPlayerRows(otherPlayers, "other")}</div>
          </div>
        ) : null}
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
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [logCollapsed, setLogCollapsed] = useState(false);
  const [selectedAction, setSelectedAction] = useState<NotInMyPotCard | null>(null);
  const [selectedActionTarget, setSelectedActionTarget] = useState<string | null>(null);
  const [showPotReady, setShowPotReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selectedHandCardId, setSelectedHandCardId] = useState<string | null>(null);
  const [movingCard, setMovingCard] = useState<NotInMyPotCard | null>(null);
  const [revealCompletedVersion, setRevealCompletedVersion] = useState<number | null>(null);
  const [noticeHidden, setNoticeHidden] = useState(false);
  const [returnIds, setReturnIds] = useState<string[]>([]);
  const [now, setNow] = useState(() => Date.now());
  const [visibleActionEventKey, setVisibleActionEventKey] = useState<string | null>(null);
  const [activeMotion, setActiveMotion] = useState<TableMotionItem | null>(null);
  const [motionQueue, setMotionQueue] = useState<TableMotionItem[]>([]);
  const motionCursor = useRef<{ roomId: string; eventCount: number } | null>(null);

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
      setReturnIds([]);
      return;
    }
    if (view.pendingAction.type === "RETURN_SHOPPING_CARDS") {
      setSelectedHandCardId(null);
      setReturnIds((current) => current.filter((id) => view.pendingAction?.allowedCardIds.includes(id)));
    } else {
      setReturnIds([]);
    }
  }, [view?.pendingAction]);

  useEffect(() => {
    const deadline = view?.pendingAction?.deadline ?? view?.turnDeadline;
    if (!deadline) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [view?.pendingAction?.deadline, view?.turnDeadline]);

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
  const shoppingReturnPending = pendingForYou && pending?.type === "RETURN_SHOPPING_CARDS";
  const shoppingReturnAllowedIds = shoppingReturnPending ? new Set(pending.allowedCardIds) : new Set<string>();
  const allPublicEvents = view?.publicEvents ?? [];
  const visiblePublicEvents = view?.actionHistoryVisible === false ? [] : allPublicEvents;
  const events = visiblePublicEvents
    .filter((event) => !HIDDEN_ACTIVITY_EVENT_TYPES.has(event.type))
    .filter((event) => {
      if (event.type === "ACTION_STARTED") {
        return event.payload.actionType !== "OUT_OF_HOUSE" && event.payload.actionType !== "TRASH_OUT";
      }
      return true;
    })
    .slice(-24)
    .reverse();
  const latestActionEventIndex = visiblePublicEvents.map((event) => event.type).lastIndexOf("ACTION_STARTED");
  const latestActionEvent = view && latestActionEventIndex >= 0 ? visiblePublicEvents[latestActionEventIndex] : null;
  const latestActionEventKey = latestActionEvent ? `${view?.roomId ?? room.id}:${latestActionEventIndex}` : null;
  const latestIngredientEvent = events.find((event) => event.type === "INGREDIENT_DECLARED") ?? null;
  const turnSecondsRemaining = view && !view.finished && view.currentPlayerId
    ? remainingSeconds(view.turnDeadline)
    : null;
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

  useEffect(() => {
    const roomId = view?.roomId ?? room.id;
    const previous = motionCursor.current;
    if (!view || !previous || previous.roomId !== roomId || allPublicEvents.length < previous.eventCount) {
      motionCursor.current = { roomId, eventCount: allPublicEvents.length };
      setMotionQueue([]);
      setActiveMotion(null);
      return;
    }
    if (allPublicEvents.length === previous.eventCount) {
      return;
    }
    const added = allPublicEvents
      .slice(previous.eventCount)
      .map((event, offset) => ({
        key: `${roomId}:motion:${previous.eventCount + offset}`,
        event,
      }))
      .filter((item) => shouldQueueTableMotion(item.event, view.you));
    motionCursor.current = { roomId, eventCount: allPublicEvents.length };
    if (added.length > 0) {
      setMotionQueue((current) => [...current, ...added]);
    }
  }, [allPublicEvents.length, room.id, view?.roomId, view?.you]);

  useEffect(() => {
    if (activeMotion || motionQueue.length === 0) {
      return;
    }
    setActiveMotion(motionQueue[0]);
    setMotionQueue((current) => current.slice(1));
  }, [activeMotion, motionQueue]);

  useEffect(() => {
    if (!activeMotion) {
      return;
    }
    const timer = window.setTimeout(() => {
      setActiveMotion(null);
    }, motionDuration(activeMotion.event));
    return () => window.clearTimeout(timer);
  }, [activeMotion]);

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
      <header className={`${styles.topbar} ${headerCollapsed ? styles.topbarCollapsed : ""}`}>
        {headerCollapsed ? (
          <button type="button" className={styles.headerExpandButton} onClick={() => setHeaderCollapsed(false)} aria-label={locale === "vi" ? "Hiện thanh điều khiển" : "Show game controls"}>
            <ChevronDown size={15} />
            <span>{locale === "vi" ? "Hiện điều khiển" : "Show controls"}</span>
          </button>
        ) : (
          <>
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
              <button type="button" className={styles.collapseHeaderButton} onClick={() => setHeaderCollapsed(true)} aria-label={locale === "vi" ? "Thu nhỏ thanh điều khiển" : "Collapse game controls"}><ChevronUp size={17} /></button>
            </div>
          </>
        )}
      </header>

          <div className={styles.gameLayout}>
        <section className={styles.tablePanel}>
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
                  isCurrentTurn={!view.finished && view.currentPlayerId === player.playerId}
                />
              ))}
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
                  <div className={styles.potTargetBadge}>
                    <span>{locale === "vi" ? "Mục tiêu" : "Target"}</span>
                    <strong>{view.targetScore} <small>{locale === "vi" ? "điểm" : "pts"}</small></strong>
                  </div>
                  <CardPile
                    count={view.potCardCount}
                    label={locale === "vi" ? "NỒI" : "POT"}
                    emptyLabel={locale === "vi" ? "NỒI ĐANG TRỐNG" : "POT IS EMPTY"}
                    cardLabel={locale === "vi" ? "lá" : "cards"}
                    cardBack={NOT_IN_MY_POT_ASSETS.cards.gameplayBack}
                    className={styles.potPile}
                  />
                </div>

              </div>

              {turnSecondsRemaining !== null ? (
                <div className={styles.tableTurnTimer} aria-live="polite">
                  <Clock3 size={14} />
                  <span>{locale === "vi" ? "Thời gian lượt" : "Turn time"}</span>
                  <strong>{turnSecondsRemaining}s</strong>
                </div>
              ) : null}

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
            {activeMotion ? <TableEventAnimation key={activeMotion.key} event={activeMotion.event} cardBack={NOT_IN_MY_POT_ASSETS.cards.gameplayBack} locale={locale} players={tablePlayers} /> : null}

          </div>

        </section>

        <aside className={`${styles.sidePanel} ${view.actionHistoryVisible ? "" : styles.sidePanelHandOnly} ${logCollapsed ? styles.sidePanelLogCollapsed : ""}`}>
          {view.actionHistoryVisible ? (
            <div className={`${styles.logPane} ${logCollapsed ? styles.logPaneCollapsed : ""}`}>
              {logCollapsed ? (
                <button type="button" className={styles.logExpandButton} onClick={() => setLogCollapsed(false)} aria-label={locale === "vi" ? "Mở Nhật ký bàn" : "Expand table log"}>
                  <ChevronLeft size={18} />
                  <BookOpen size={17} />
                  <span>{locale === "vi" ? "Nhật ký" : "Log"}</span>
                </button>
              ) : (
                <div className={styles.sideSection}>
                  <div className={styles.sideHeader}>
                    <p className={styles.modalEyebrow}>{locale === "vi" ? "NHẬT KÝ" : "ACTIVITY LOG"}</p>
                    <div className={styles.logHeaderActions}>
                      <button type="button" className={styles.collapseLogButton} onClick={() => setLogCollapsed(true)} aria-label={locale === "vi" ? "Thu nhỏ Nhật ký bàn" : "Collapse table log"}><ChevronRight size={17} /></button>
                    </div>
                  </div>
                  <div className={styles.logList}>
                    {events.length === 0 ? <p className={styles.emptyLog}>{locale === "vi" ? "Bàn đang chờ sự kiện đầu tiên." : "Waiting for the first table event."}</p> : events.map((event, index) => <div className={styles.logItem} key={`${event.type}-${index}`}><span className={styles.logMarker} /><div><p>{eventText(event, view.players, locale)}</p></div></div>)}
                  </div>
                </div>
              )}
            </div>
          ) : null}

          <section className={styles.sideHandDock} aria-label={locale === "vi" ? "Bài trên tay" : "Cards in hand"}>
            <div className={styles.handTitle}>
              <span><strong>{locale === "vi" ? "BÀI TRÊN TAY" : "MY HAND"}</strong><small>{view.myHand.length} {locale === "vi" ? "lá" : "cards"}</small></span>
              <span>{selectedHandCard ? (locale === "vi" ? `Đã chọn: ${cardLabel(selectedHandCard, locale)}` : `Selected: ${cardLabel(selectedHandCard, locale)}`) : (locale === "vi" ? "Chọn một lá để đánh" : "Select a card to play")}</span>
            </div>
            {shoppingReturnPending ? (
              <div className={styles.shoppingReturnPrompt} role="status">
                <ShoppingBasket size={16} />
                <span>
                  <strong>{locale === "vi" ? "Đi chợ gấp" : "Emergency shopping"}</strong>
                  <small>{locale === "vi" ? `Chọn đúng ${pending?.requiredCardCount ?? 2} lá để trả lại chồng bài.` : `Choose exactly ${pending?.requiredCardCount ?? 2} cards to return to the deck.`}</small>
                </span>
                <em>{returnIds.length}/{pending?.requiredCardCount ?? 2}</em>
              </div>
            ) : null}
            <div className={styles.handGrid}>
              {view.myHand.map((card) => {
                const returnable = shoppingReturnAllowedIds.has(card.cardId);
                return (
                  <NimpCard
                    key={card.cardId}
                    card={card}
                    locale={locale}
                    selected={shoppingReturnPending ? returnIds.includes(card.cardId) : card.cardId === selectedHandCardId}
                    disabled={shoppingReturnPending ? busy || !returnable || Boolean(movingCard) || revealInProgress : !view.canAct || busy || Boolean(pending) || Boolean(movingCard) || revealInProgress}
                    onClick={() => shoppingReturnPending ? toggleReturn(card.cardId) : onHandCard(card)}
                  />
                );
              })}
              {view.myHand.length === 0 ? <p className={styles.emptyHand}>{locale === "vi" ? "Bạn không còn lá trên tay." : "You have no cards in hand."}</p> : null}
            </div>
            {shoppingReturnPending || selectedHandCard || view.canDeclarePotReady ? <div className={styles.actionDock}>
              {shoppingReturnPending ? (
                <>
                  <span className={styles.shoppingReturnTimer}>{pending?.deadline ? `${remainingSeconds(pending.deadline) ?? 0}s` : null}</span>
                  <button type="button" className={styles.primaryButton} disabled={busy || returnIds.length !== (pending?.requiredCardCount ?? 2)} onClick={() => { submit({ type: "RETURN_SHOPPING_CARDS", cardIds: returnIds }); }}>
                    <Check size={16} /> {locale === "vi" ? "Trả bài" : "Return cards"}
                  </button>
                </>
              ) : null}
              {selectedHandCard && isIngredient(selectedHandCard) ? <button type="button" className={styles.playCardButton} disabled={busy || Boolean(movingCard)} onClick={playSelectedIngredient}><Flame size={17} /> {locale === "vi" ? "ĐÁNH LÁ NÀY" : "PLAY THIS CARD"}</button> : null}
              {view.canDeclarePotReady ? <button type="button" className={styles.readyButton} disabled={busy || Boolean(movingCard)} onClick={() => setShowPotReady(true)}><ShieldCheck size={17} /> {locale === "vi" ? "Mở nồi tính điểm" : "Reveal Pot and Calculate Score"}</button> : null}
            </div> : null}
          </section>
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

      {pending && pendingForYou && pending.type !== "RETURN_SHOPPING_CARDS" ? <PendingActionModal pending={pending} inspectedCards={view.privateInspectedCards} hand={view.myHand} players={view.players} locale={locale} returnIds={returnIds} onToggleReturn={toggleReturn} onTarget={(playerId) => { submit({ type: "SELECT_TARGET", targetPlayerId: playerId }); }} onAcknowledgeSpoon={() => { submit({ type: "ACKNOWLEDGE_SLOTTED_SPOON" }); }} onSubmitReturn={() => { submit({ type: "RETURN_SHOPPING_CARDS", cardIds: returnIds }); }} busy={busy} /> : null}

      {showPotReady ? <ModalShell title={locale === "vi" ? "Mở nồi tính điểm?" : "Reveal Pot and Calculate Score?"} onClose={() => setShowPotReady(false)}><div className={styles.readyModal}><div className={styles.readyIcon}><ShieldCheck size={26} /></div><h3>{locale === "vi" ? "Mở nồi và tính điểm ngay?" : "Reveal the pot and calculate its score now?"}</h3><p>{locale === "vi" ? `Máy chủ sẽ mở nồi và so sánh điểm với mục tiêu ${view.targetScore}. Hành động này kết thúc ván.` : `The server will reveal the pot and compare it with the ${view.targetScore}-point target. This ends the game.`}</p></div><div className={styles.modalFooter}><button type="button" className={styles.ghostButton} onClick={() => setShowPotReady(false)}>{locale === "vi" ? "Chưa" : "Not yet"}</button><button type="button" className={styles.primaryButton} disabled={busy} onClick={() => { submit({ type: "DECLARE_POT_READY" }); setShowPotReady(false); }}><Check size={16} /> {locale === "vi" ? "Mở nồi tính điểm" : "Reveal Pot and Calculate Score"}</button></div></ModalShell> : null}

      {showRules ? <ModalShell title={locale === "vi" ? "Luật nhanh — Not In My Pot!" : "Quick rules — Not In My Pot!"} onClose={() => setShowRules(false)} wide><div className={styles.rulesGrid}><div><span className={styles.rulesNumber}>01</span><h3>{locale === "vi" ? "Bỏ nguyên liệu" : "Play an ingredient"}</h3><p>{locale === "vi" ? "Mỗi lá nguyên liệu có loại và điểm cố định: Rau củ +1, Đậu phụ 0, Thịt −2. Máy chủ lấy đúng giá trị trên lá." : "Every ingredient has a fixed type and score: Vegetable +1, Tofu 0, Meat −2. The server uses the card's actual value."}</p></div><div><span className={styles.rulesNumber}>02</span><h3>{locale === "vi" ? "Dùng action" : "Use actions"}</h3><p>{locale === "vi" ? "Đuổi người, vớt nồi, xem lại bài, đi chợ gấp hoặc đổ rác để phá kế hoạch." : "Send someone out, scoop the pot, inspect cards, shop in an emergency, or trash a hand."}</p></div><div><span className={styles.rulesNumber}>03</span><h3>{locale === "vi" ? "Nồi đạt mục tiêu" : "Hit the target"}</h3><p>{locale === "vi" ? "Người ăn chay có thể bấm Mở nồi tính điểm ở đầu lượt để mở điểm thật." : "A Vegetarian may press Reveal Pot and Calculate Score at the start of their turn to reveal the true score."}</p></div><div><span className={styles.rulesNumber}>04</span><h3>{locale === "vi" ? "Cửa nhà" : "Door marks"}</h3><p>{locale === "vi" ? "Một người bị mời ra 3 lần sẽ bị loại và lộ vai. Suy luận cẩn thận." : "A player sent out three times is expelled and reveals their role. Deduce carefully."}</p></div></div><div className={styles.rulesPrivacy}><EyeOff size={17} /><span>{locale === "vi" ? "Thông tin riêng: vai, bài trên tay và các lá bạn xem chỉ được gửi cho chính bạn." : "Private data: your role, hand, and inspected cards are only projected to you."}</span></div></ModalShell> : null}

      {revealInProgress ? <PotRevealSequence cards={view.finalPot} targetScore={view.targetScore} locale={locale} onComplete={() => setRevealCompletedVersion(view.stateVersion)} /> : null}

      {view.finished && !revealInProgress ? <ResultModal view={view} room={room} locale={locale} onPlayAgain={() => navigate(`/rooms/${room.id}`)} onLeave={() => leave.mutate(room.id)} /> : null}
    </main>
  );
}
