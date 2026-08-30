import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Bone, Clock3, Eye, Heart, LogOut, MessageSquare, Moon, RotateCcw, Shield, Trophy, UserRound, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { RoomView } from "@/shared/lobby/roomView";
import { PlayerAvatar } from "@/shared/components/PlayerAvatar/PlayerAvatar";
import { useLeaveRoom } from "@/shared/hooks/useRooms";
import { useLobbyChat } from "@/shared/hooks/useLobbyChat";
import { useLocale } from "@/shared/i18n/useT";
import type { WheresTheBoneCommand } from "../api/wheresTheBoneApi";
import type { BonePlayer, BoneRole, WheresTheBoneView } from "../model/wheresTheBoneTypes";
import styles from "./WheresTheBonePlayPage.module.css";

type Locale = "vi" | "en";

interface Props { room: RoomView; view: WheresTheBoneView | null; snapshotPending?: boolean; snapshotError?: Error | null; notice?: string | null; rejectCode?: string | null; sendCommand: (command: WheresTheBoneCommand) => string | null; }

type ClueAlert = {
  kind: "peek" | "witness" | "present" | "missing";
  title: string;
  body: string;
};

const roleNames: Record<Locale, Record<string, string>> = {
  vi: { BONE_THIEF: "Chó Trộm Xương", WHITE_DOG: "Chó Trắng", YARD_DOG: "Chó Canh Sân", PACKMATE: "Đồng Bọn Trộm Xương" },
  en: { BONE_THIEF: "Bone Thief", WHITE_DOG: "White Dog", YARD_DOG: "Yard Dog", PACKMATE: "Secret Packmate" },
};

const roleDescriptions: Record<Locale, Record<string, { faction: string; condition: string; tips: string[] }>> = {
  vi: {
    BONE_THIEF: {
      faction: "Phe Trộm Xương 🕵️",
      condition: "Lấy trộm khúc xương vào ban đêm và thuyết phục cả bầy không bỏ phiếu treo cổ mình ở cuối ván.",
      tips: [
        "Chọn đồng bọn khéo léo để phối hợp kéo phiếu và che mắt bầy chó.",
        "Thảo luận chủ động để hướng sự nghi ngờ sang Chó Canh Sân hoặc Đồng Bọn Trộm Xương.",
      ],
    },
    PACKMATE: {
      faction: "Phe Trộm Xương 🐾",
      condition: "Bảo vệ thành công Chó Trộm Xương không bị cả bầy vote treo cổ ở cuối ván.",
      tips: [
        "Hệ thống sẽ hiển thị vai trò và tên thật của Chó Trộm Xương cho bạn.",
        "Hãy bào chữa và lái dư luận sang người khác khi thảo luận nhóm.",
        "Vote trùng mục tiêu với Chó Trộm Xương để tăng cơ hội cứu nguy.",
      ],
    },
    YARD_DOG: {
      faction: "Phe Bảo Vệ Xương 🐶",
      condition: "Tìm ra Chó Trộm Xương và bỏ phiếu treo cổ hắn thành công ở cuối ván.",
      tips: ["Chia sẻ thông tin dấu vết trung thực với đồng đội để cùng phân tích."],
    },
    WHITE_DOG: {
      faction: "Phe Độc Lập 🤍",
      condition: "Dụ cả bầy vote treo cổ chính mình khi khúc xương bị mất để giành chiến thắng.",
      tips: [
        "Hãy tỏ ra đáng nghi một cách tinh tế (nhưng không quá lộ liễu).",
        "Lập luận mâu thuẫn hoặc nhận vơ mình là Chó Trộm Xương khi bị nghi ngờ.",
      ],
    },
  },
  en: {
    BONE_THIEF: {
      faction: "Thief Pack 🕵️",
      condition: "Successfully steal the bone at night and convince the yard not to vote you out in the Result phase.",
      tips: [
        "Select reliable packmates to defend you during discussions.",
        "Deflect suspicion towards Yard Dogs or Secret Packmates.",
      ],
    },
    PACKMATE: {
      faction: "Thief Pack 🐾",
      condition: "Protect the Bone Thief from being voted out by the pack at the end of the game.",
      tips: [
        "Identify the Bone Thief (revealed to you in your private state).",
        "Actively defend the Thief and redirect focus during debates.",
        "Coordinate your vote with the Bone Thief to secure their safety.",
      ],
    },
    YARD_DOG: {
      faction: "Bone Protection Pack 🐶",
      condition: "Identify the Bone Thief and successfully vote them out in the final phase.",
      tips: ["Share your clues honestly with teammates to analyze together."],
    },
    WHITE_DOG: {
      faction: "Independent 🤍",
      condition: "Trick the pack into voting you out when the bone is taken to win alone.",
      tips: [
        "Act suspiciously in a subtle, convincing manner.",
        "Give contradictory clues or pretend to be the Bone Thief if pressured.",
      ],
    },
  },
};

function roleArt(role: BoneRole | null, seat = 0) {
  if (role === "BONE_THIEF") return "/assets/games/wheres-the-bone/bone-thief.png";
  if (role === "WHITE_DOG") return "/assets/games/wheres-the-bone/white-dog.png";
  return `/assets/games/wheres-the-bone/yard-dog-${(seat % 8) + 1}.png`;
}

function roleLabel(role: string | null, locale: Locale) {
  if (!role) return "???";
  return roleNames[locale]?.[role] ?? roleNames.en[role] ?? role;
}

const clueTranslations: Record<Locale, Record<string, string>> = {
  vi: {
    "Wait for the pack to gather. The host will start the game.": "Đợi đủ Dog rồi host sẽ bắt đầu ván.",
    "Choose 1 of your 2 secret wake times. You only act on the chosen hour.": "Chọn 1 trong 2 giờ thức bí mật. Bạn chỉ hành động ở giờ đã chọn.",
    "Wait for the Yard Dogs to choose their secret wake time.": "Đợi các Dog Canh Sân chọn giờ thức bí mật.",
    "You are asleep in your kennel. Keep your secret and wait.": "Bạn đang ngủ trong chuồng. Giữ bí mật và chờ giờ của mình.",
    "You are done for this hour. Wait for the next wake call.": "Bạn đã xong lượt ở canh giờ này. Chờ tiếng gọi giờ tiếp theo.",
    "You are awake. Take the bone quietly.": "Bạn đang thức. Hãy lấy xương thật gọn.",
    "You are awake alone. You may peek at another Dog's wake time.": "Bạn thức một mình. Có thể xem dấu vết giờ thức của một Dog khác.",
    "You are awake. There is no private clue to peek at this hour.": "Bạn đang thức. Không có dấu vết riêng để xem ở giờ này.",
    "You were seen. Choose 1 witness to join your side.": "Bạn vừa bị nhìn thấy. Chọn 1 nhân chứng sẽ đứng về phía mình.",
    "Choose the Dog who will join your side.": "Chọn Dog sẽ đứng về phía bạn.",
    "You saw the bone being taken. Wait for a secret choice to finish, then this hour will continue.": "Bạn vừa thấy xương bị lấy. Đợi một nhịp để xử lý lựa chọn bí mật, sau đó bạn sẽ tiếp tục canh giờ này.",
    "Wait for the secret choice to finish.": "Đợi lựa chọn bí mật hoàn tất.",
    "Try to avoid being detected and accused by the pack.": "Hãy cố gắng tránh bị đàn chó phát hiện và buộc tội.",
    "You are the White Dog recruited into the thief pack. You still win alone if voted out, or win with the thief pack if the Bone Thief escapes.": "Bạn là Chó Trắng đã vào bầy trộm. Bạn vẫn thắng một mình nếu bị vote treo cổ, hoặc thắng chung nếu Chó Trộm Xương không bị phát hiện.",
    "Protect the bone thief from being detected.": "Hãy bảo vệ cho chó trộm xương không bị phát hiện.",
    "You are the White Dog. If the pack votes you out, you win alone.": "Bạn là Chó Trắng. Nếu bị cả đàn vote treo cổ, bạn thắng một mình.",
    "Join the pack in searching for the bone thief.": "Hãy cùng đàn chó truy tìm kẻ trộm xương.",
    "You have voted. Wait for the other Dogs.": "Bạn đã vote. Chờ các Dog còn lại.",
    "Choose the Dog you suspect took the bone.": "Chọn Dog bạn nghi đã lấy xương.",
    "The game has ended.": "Ván đã có kết quả.",
    "Blank vote": "Phiếu trống",
  },
  en: {
    "Đợi đủ Dog rồi host sẽ bắt đầu ván.": "Wait for the pack to gather. The host will start the game.",
    "Chọn 1 trong 2 giờ thức bí mật. Bạn chỉ hành động ở giờ đã chọn.": "Choose 1 of your 2 secret wake times. You only act on the chosen hour.",
    "Đợi các Dog Canh Sân chọn giờ thức bí mật.": "Wait for the Yard Dogs to choose their secret wake time.",
    "Bạn đang ngủ trong chuồng. Giữ bí mật và chờ giờ của mình.": "You are asleep in your kennel. Keep your secret and wait.",
    "Bạn đã xong lượt ở canh giờ này. Chờ tiếng gọi giờ tiếp theo.": "You are done for this hour. Wait for the next wake call.",
    "Bạn đang thức. Hãy lấy xương thật gọn.": "You are awake. Take the bone quietly.",
    "Bạn thức một mình. Có thể xem dấu vết giờ thức của một Dog khác.": "You are awake alone. You may peek at another Dog's wake time.",
    "Bạn đang thức. Không có dấu vết riêng để xem ở giờ này.": "You are awake. There is no private clue to peek at this hour.",
    "Bạn vừa bị nhìn thấy. Chọn 1 nhân chứng sẽ đứng về phía mình.": "You were seen. Choose 1 witness to join your side.",
    "Chọn Dog sẽ đứng về phía bạn.": "Choose the Dog who will join your side.",
    "Bạn vừa thấy xương bị lấy. Đợi một nhịp để xử lý lựa chọn bí mật, sau đó bạn sẽ tiếp tục canh giờ này.": "You saw the bone being taken. Wait for a secret choice to finish, then this hour will continue.",
    "Đợi lựa chọn bí mật hoàn tất.": "Wait for the secret choice to finish.",
    "Hãy cố gắng tránh bị đàn chó phát hiện và buộc tội.": "Try to avoid being detected and accused by the pack.",
    "Bạn là Chó Trắng đã vào bầy trộm. Bạn vẫn thắng một mình nếu bị vote treo cổ, hoặc thắng chung nếu Chó Trộm Xương không bị phát hiện.": "You are the White Dog recruited into the thief pack. You still win alone if voted out, or win with the thief pack if the Bone Thief escapes.",
    "Hãy bảo vệ cho chó trộm xương không bị phát hiện.": "Protect the bone thief from being detected.",
    "Bạn là Chó Trắng. Nếu bị cả đàn vote treo cổ, bạn thắng một mình.": "You are the White Dog. If the pack votes you out, you win alone.",
    "Hãy cùng đàn chó truy tìm kẻ trộm xương.": "Join the pack in searching for the bone thief.",
    "Bạn đã vote. Chờ các Dog còn lại.": "You have voted. Wait for the other Dogs.",
    "Chọn Dog bạn nghi đã lấy xương.": "Choose the Dog you suspect took the bone.",
    "Ván đã có kết quả.": "The game has ended.",
    "Phiếu trống": "Blank vote",
  },
};

function translateClue(clue: string, locale: Locale): string {
  if (!clue) return "";
  const trimmed = clue.trim();
  if (clueTranslations[locale]?.[trimmed]) return clueTranslations[locale][trimmed];

  if (locale === "en") {
    const seenMatch = trimmed.match(/^(?:Đã thấy|Thấy)\s+khúc xương\s+lúc\s+(\d+):00am/i);
    if (seenMatch) return `Bone was still there at ${seenMatch[1]}:00am`;

    const missingMatch = trimmed.match(/^Khúc xương đã mất(?:\s+khi bạn thức)?\s+lúc\s+(\d+):00am/i);
    if (missingMatch) return `Bone was already missing at ${missingMatch[1]}:00am`;

    const tookMatch = trimmed.match(/^(.+?)\s+đã lấy xương\s+lúc\s+(\d+):00am/i);
    if (tookMatch) return `${tookMatch[1]} took the bone at ${tookMatch[2]}:00am`;

    const peekMatch = trimmed.match(/^Xem giờ thức của\s+(.+?):\s*(.+)$/i);
    if (peekMatch) return `Peeked ${peekMatch[1]}'s wake times: ${peekMatch[2]}`;
  } else {
    const seenEn = trimmed.match(/^Bone was still there at\s+(\d+):00am/i);
    if (seenEn) return `Đã thấy khúc xương lúc ${seenEn[1]}:00am`;

    const missingEn = trimmed.match(/^Bone was already missing at\s+(\d+):00am/i);
    if (missingEn) return `Khúc xương đã mất lúc ${missingEn[1]}:00am`;

    const tookEn = trimmed.match(/^(.+?)\s+took the bone at\s+(\d+):00am/i);
    if (tookEn) return `${tookEn[1]} đã lấy xương lúc ${tookEn[2]}:00am`;

    const peekEn = trimmed.match(/^Peeked\s+(.+?)'s wake times:\s*(.+)$/i);
    if (peekEn) return `Xem giờ thức của ${peekEn[1]}: ${peekEn[2]}`;
  }

  return clue;
}

const eventNames: Record<Locale, Record<string, string>> = {
  vi: {
    GAME_STARTED: "Ván chơi bắt đầu",
    BONE_TAKEN: "Khúc xương đã bị lấy",
    DISCUSSION_SKIP_REQUESTED: "Một người chơi đề nghị bỏ qua thảo luận",
    DISCUSSION_SKIP_APPROVED: "Đề nghị bỏ qua thảo luận đã được thông qua",
    DISCUSSION_SKIP_REJECTED: "Đề nghị bỏ qua thảo luận không được thông qua",
    DISCUSSION_SKIP_CANCELLED: "Đề nghị bỏ qua thảo luận đã bị hủy",
    VOTING_STARTED: "Bắt đầu bỏ phiếu",
    VOTE_CAST: "Một phiếu đã được gửi",
    GAME_FINISHED: "Ván chơi kết thúc",
    PLAYER_ABANDONED: "Một người chơi đã rời ván",
  },
  en: {
    GAME_STARTED: "Game started",
    BONE_TAKEN: "The bone was taken",
    DISCUSSION_SKIP_REQUESTED: "A player requested to skip discussion",
    DISCUSSION_SKIP_APPROVED: "The discussion skip request was approved",
    DISCUSSION_SKIP_REJECTED: "The discussion skip request was rejected",
    DISCUSSION_SKIP_CANCELLED: "The discussion skip request was cancelled",
    VOTING_STARTED: "Voting started",
    VOTE_CAST: "A vote was submitted",
    GAME_FINISHED: "Game finished",
    PLAYER_ABANDONED: "A player left the game",
  },
};

function eventLabel(type: string, locale: Locale): string {
  return eventNames[locale]?.[type] ?? type.replaceAll("_", " ").toLowerCase().replace(/^./, (letter) => letter.toUpperCase());
}

export function WheresTheBonePlayPage({ room, view, snapshotPending, snapshotError, notice, rejectCode, sendCommand }: Props) {
  const locale = useLocale();
  const navigate = useNavigate();
  const leave = useLeaveRoom();
  const chat = useLobbyChat(room.id, view?.viewerPlayerId);
  const [chatDraft, setChatDraft] = useState("");
  const [showRole, setShowRole] = useState(false);
  const [roleSeen, setRoleSeen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [serverOffset, setServerOffset] = useState(0);
  const [selectedPackmates, setSelectedPackmates] = useState<string[]>([]);
  const [clueAlert, setClueAlert] = useState<ClueAlert | null>(null);
  const clueCountsRef = useRef<{ peek: number; witnessed: number; present: number; missing: number } | null>(null);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (view?.myRole && !roleSeen) {
      setRoleSeen(true);
      setShowRole(true);
    }
  }, [view?.myRole, roleSeen]);

  useEffect(() => {
    if (view?.serverTime) setServerOffset(new Date(view.serverTime).getTime() - Date.now());
  }, [view?.serverTime]);

  // Keep the private clues as an event stream in the UI. The API intentionally
  // sends the current snapshot, so compare counts between snapshots and turn
  // each newly revealed clue into an immediate, dismissible popup.
  useEffect(() => {
    if (!view || view.finished) {
      clueCountsRef.current = null;
      return;
    }

    const next = {
      peek: view.myPeekCount,
      witnessed: view.myWitnessedBoneTakenHours.length,
      present: view.myObservedBonePresentHours.length,
      missing: view.myObservedBoneMissingHours.length,
    };
    const previous = clueCountsRef.current;
    const openAlert = (alert: ClueAlert) => {
      // A new clue is more important than the role reveal and should never be
      // hidden underneath it.
      setShowRole(false);
      setClueAlert(alert);
    };

    if (previous) {
      if (next.peek > previous.peek) {
        const entries = Object.entries(view.myPeekResults);
        const latest = entries[entries.length - 1];
        if (latest) {
          const [targetId, hours] = latest;
          const targetName = view.players.find((player) => player.playerId === targetId)?.displayName ?? targetId;
          openAlert({
            kind: "peek",
            title: locale === "vi" ? "🔍 Xem dấu vết" : "🔍 Peek Clue",
            body: locale === "vi"
              ? `Chú chó ${targetName} thức dậy lúc ${hours.map((hour) => `${hour}:00am`).join(", ")}.`
              : `Dog ${targetName} woke up at ${hours.map((hour) => `${hour}:00am`).join(", ")}.`,
          });
        }
      }
      if (next.witnessed > previous.witnessed) {
        const latestHour = view.myWitnessedBoneTakenHours[view.myWitnessedBoneTakenHours.length - 1];
        const thiefName = view.players.find((player) => player.playerId === view.boneTakenBy)?.displayName
          ?? (locale === "vi" ? "Chó Trộm Xương" : "Bone Thief");
        if (latestHour !== undefined) {
          openAlert({
            kind: "witness",
            title: locale === "vi" ? "🦴 Phát hiện Trộm Xương!" : "🦴 Bone Theft Caught!",
            body: locale === "vi"
              ? `${thiefName} đã lấy xương lúc ${latestHour}:00am!`
              : `Bone Thief ${thiefName} took the bone at ${latestHour}:00am!`,
          });
        }
      }
      if (next.present > previous.present) {
        const latestHour = view.myObservedBonePresentHours[view.myObservedBonePresentHours.length - 1];
        if (latestHour !== undefined) {
          openAlert({
            kind: "present",
            title: locale === "vi" ? "🦴 Xương vẫn còn" : "🦴 Bone Is Still There",
            body: locale === "vi"
              ? `Khi bạn thức lúc ${latestHour}:00am, xương vẫn còn trong sân.`
              : `When you woke at ${latestHour}:00am, the bone was still in the yard.`,
          });
        }
      }
      if (next.missing > previous.missing) {
        const latestHour = view.myObservedBoneMissingHours[view.myObservedBoneMissingHours.length - 1];
        if (latestHour !== undefined) {
          openAlert({
            kind: "missing",
            title: locale === "vi" ? "🦴 Xương đã mất!" : "🦴 Bone Is Missing!",
            body: locale === "vi"
              ? `Khi bạn thức lúc ${latestHour}:00am, xương đã bị lấy mất.`
              : `When you woke at ${latestHour}:00am, the bone was already missing.`,
          });
        }
      }
    }
    clueCountsRef.current = next;
  }, [view, locale]);

  useEffect(() => {
    if (view?.phase !== "PACK_SELECTION") setSelectedPackmates([]);
  }, [view?.phase, view?.version]);

  const left = useMemo(() => (view?.deadline ? Math.max(0, Math.ceil((new Date(view.deadline).getTime() - (now + serverOffset)) / 1000)) : 0), [view?.deadline, now, serverOffset]);
  const me = view?.players.find((p) => p.me);
  const discussionSkipRequester = view?.players.find((player) => player.playerId === view.discussionSkipRequesterId);
  const role = view?.myRole ?? me?.role ?? null;
  const meta = (roleDescriptions[locale] ?? roleDescriptions.vi)[role ?? "YARD_DOG"] ?? roleDescriptions.vi.YARD_DOG;
  const recruitedWhiteDog = role === "WHITE_DOG" && view?.myWhiteDogRecruited;
  const knownThiefId = view?.knownBoneThiefId
    ?? (view && view.myWitnessedBoneTakenHours.length > 0 ? view.boneTakenBy : null);
  // The API intentionally omits the viewer from currentAwakePlayerIds, so use
  // the viewer's private player row when deciding whether the thief is forced
  // to act this hour.
  const mustTakeBone = Boolean(
    view?.phase === "NIGHT_HOUR"
      && !view.boneTaken
      && role === "BONE_THIEF"
      && me?.awake
      && view.legalActions.includes("TAKE_BONE")
      && !view.legalActions.includes("WAIT"),
  );
  const command = (value: WheresTheBoneCommand) => {
    sendCommand(value);
  };
  const can = (type: WheresTheBoneCommand["type"]) => Boolean(view?.legalActions.includes(type));

  if (view?.finished) {
    return <WheresTheBoneResult view={view} room={room} locale={locale} onPlayAgain={() => navigate(`/rooms/${room.id}`)} onLeave={() => leave.mutate(room.id)} />;
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.roomCode}>#{room.code}</div>
        <div className={styles.phase}>
          <span className={styles.phaseIcon}>{view?.phase === "NIGHT_HOUR" ? <Moon size={16} /> : view?.phase === "VOTING" ? <Shield size={16} /> : <Bone size={16} />}</span>
          {phaseTitle(view?.phase, locale)}
          <span className={styles.timer}><Clock3 size={14} />{left}s</span>
        </div>
        <button type="button" className={styles.roleButton} onClick={() => setShowRole(true)}>
          <Heart size={15} /> {locale === "vi" ? "Vai của tôi" : "My Role"}
        </button>
      </header>
      <div className={styles.layout}>
        <section className={styles.mainColumn}>
          {view?.phase === "WAKE_SELECTION" && (
            <section className={styles.banner}>
              <Moon size={28} />
              <div>
                <strong>{locale === "vi" ? "Chọn giờ thức" : "Wake choice"}</strong>
                <p>{locale === "vi" ? "Ván 4 chú chó: mỗi Chó Canh Sân chọn 1 giờ thức từ 2 xúc xắc bí mật." : "4 Players room: each Yard Dog chooses 1 wake hour from 2 secret dice."}</p>
              </div>
            </section>
          )}
          {view?.phase === "NIGHT_HOUR" && (
            <section className={styles.banner}>
              <Bone size={30} />
              <div>
                <strong>
                  {view.boneTaken
                    ? locale === "vi" ? "Xương đã biến mất" : "The bone is gone"
                    : locale === "vi" ? `Giờ ${view.currentHour}:00am · Cả sân cùng thức` : `Hour ${view.currentHour}:00am · Yard waking up`}
                </strong>
                <p>
                  {view.boneTaken
                    ? locale === "vi" ? "Ghi nhớ người thức cùng; sau đêm sẽ đến lúc thảo luận." : "Remember who woke with you; discussion starts after the night."
                    : mustTakeBone
                      ? locale === "vi" ? "Bạn là Chó Trộm Xương và phải lấy xương ngay trong lượt này." : "You are the Bone Thief and must take the bone this turn."
                      : locale === "vi" ? "Người đang thức hãy thực hiện hành động của mình." : "Awake players, perform your actions."}
                </p>
              </div>
            </section>
          )}
          <section className={styles.panel}>
            <h2><Bone size={19} /> {locale === "vi" ? "Hành động" : "Actions"}</h2>
            <p className={styles.muted}>{actionHint(view, mustTakeBone, locale)}</p>
            {can("SELECT_WAKE_TIME") && (
              <div className={styles.actionRow}>
                <span>{locale === "vi" ? "Giờ thức của bạn" : "Your wake time"}</span>
                {view?.myDice.map((hour, index) => (
                  <button key={`${hour}-${index}`} type="button" className={styles.choice} data-selected={view.mySelectedWakeHours.includes(hour)} onClick={() => command({ type: "SELECT_WAKE_TIME", hour })}>
                    {hour}:00am
                  </button>
                ))}
              </div>
            )}
            {can("TAKE_BONE") && (
              <button type="button" className={styles.primary} onClick={() => command({ type: "TAKE_BONE" })}>
                <Bone size={17} /> {locale === "vi" ? "Lấy xương" : "Take bone"}
              </button>
            )}
            {can("PEEK_WAKE_TIME") && (
              <div className={styles.actionGroup}>
                <div className={styles.actionLabel}>
                  <Eye size={17} />
                  <span>{locale === "vi" ? "Chọn người chơi để xem giờ" : "Choose player to peek"}</span>
                </div>
                <div className={styles.actionChoices}>
                  {view?.players.filter((p) => !p.me).map((p) => (
                    <button key={p.playerId} type="button" className={styles.choice} onClick={() => command({ type: "PEEK_WAKE_TIME", targetPlayerId: p.playerId })}>
                      {p.displayName}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {can("WAIT") && (
              <button type="button" className={styles.secondary} onClick={() => command({ type: "WAIT" })}>
                {locale === "vi" ? "Đợi qua giờ này" : "Wait out this hour"}
              </button>
            )}
            {can("SELECT_PACKMATE") && (
              <div className={styles.actionGroup}>
                <div className={styles.actionLabel}>
                  <span>{locale === "vi" ? `Chọn đúng ${view?.requiredPackmateCount ?? 1} chú chó.` : `Choose exactly ${view?.requiredPackmateCount ?? 1} players.`}</span>
                </div>
                <div className={styles.actionChoices}>
                  {view?.players.filter((p) => view.packmateCandidateIds.includes(p.playerId)).map((p) => (
                    <button key={p.playerId} type="button" className={styles.choice} data-selected={selectedPackmates.includes(p.playerId)} onClick={() => setSelectedPackmates((current) => current.includes(p.playerId) ? current.filter((id) => id !== p.playerId) : [...current, p.playerId])}>
                      {p.displayName}
                    </button>
                  ))}
                </div>
                <button type="button" className={styles.primary} disabled={selectedPackmates.length !== (view?.requiredPackmateCount ?? 0)} onClick={() => command({ type: "SELECT_PACKMATE", targetPlayerIds: selectedPackmates })}>
                  {locale === "vi" ? "Xác nhận đồng bọn" : "Confirm packmates"}
                </button>
              </div>
            )}
            {can("REQUEST_SKIP_DISCUSSION") && (
              <button type="button" className={styles.primary} onClick={() => command({ type: "REQUEST_SKIP_DISCUSSION" })}>
                {locale === "vi" ? "Bỏ qua thảo luận" : "Skip discussion"}
              </button>
            )}
            {view?.phase === "DISCUSSION" && view.discussionSkipRequesterId && (
              <div className={styles.skipVotePanel} role="alert" aria-live="assertive">
                <div className={styles.skipVoteHeading}>
                  <strong>{locale === "vi" ? "Đề nghị bỏ qua thảo luận" : "Skip discussion request"}</strong>
                  <span>
                    {view.discussionSkipAgreeCount}/{view.discussionSkipRequiredAgreeCount} {locale === "vi" ? "đồng ý" : "agreed"}
                  </span>
                </div>
                <p>
                  <strong>{discussionSkipRequester?.displayName ?? view.discussionSkipRequesterId}</strong>{" "}
                  {locale === "vi"
                    ? "muốn bỏ qua bước thảo luận để bỏ phiếu luôn:"
                    : "wants to skip discussion and start voting now:"}
                </p>
                {can("RESPOND_SKIP_DISCUSSION") ? (
                  <div className={styles.skipVoteActions}>
                    <button type="button" data-choice="yes" onClick={() => command({ type: "RESPOND_SKIP_DISCUSSION", agree: true })}>
                      {locale === "vi" ? "Đồng ý" : "Agree"}
                    </button>
                    <button type="button" data-choice="no" onClick={() => command({ type: "RESPOND_SKIP_DISCUSSION", agree: false })}>
                      {locale === "vi" ? "Không đồng ý" : "Disagree"}
                    </button>
                  </div>
                ) : (
                  <span className={styles.skipVoteSubmitted}>
                    {view.myDiscussionSkipResponse === true
                      ? locale === "vi" ? "Bạn đã đồng ý. Đang chờ những người chơi khác." : "You agreed. Waiting for the other players."
                      : view.myDiscussionSkipResponse === false
                        ? locale === "vi" ? "Bạn đã không đồng ý. Đang chờ những người chơi khác." : "You disagreed. Waiting for the other players."
                        : locale === "vi" ? "Đang chờ kết quả biểu quyết." : "Waiting for the result."}
                  </span>
                )}
                <small>
                  {locale === "vi"
                    ? `${view.discussionSkipResponseCount}/${view.players.filter((player) => player.connected).length} người đã phản hồi · Cần quá bán để thông qua.`
                    : `${view.discussionSkipResponseCount}/${view.players.filter((player) => player.connected).length} players responded · A strict majority is required.`}
                </small>
              </div>
            )}
            {can("VOTE") && (
              <div className={styles.voteGrid}>
                {view?.players.filter((p) => !p.me).map((p) => (
                  <button key={p.playerId} type="button" className={styles.voteButton} onClick={() => command({ type: "VOTE", targetPlayerId: p.playerId })}>
                    {p.displayName}
                  </button>
                ))}
              </div>
            )}
            {!view?.canAct && !view?.finished && (
              <p className={styles.waiting}>
                <Clock3 size={16} /> {locale === "vi" ? "Chờ người chơi khác hành động…" : "Waiting for other players to act…"}
              </p>
            )}
            {notice && <p className={styles.error}>{rejectCode ? `${rejectCode}: ` : ""}{notice}</p>}
            {snapshotPending && !view && <p className={styles.muted}>{locale === "vi" ? "Đang tải ván chơi…" : "Loading game…"}</p>}
            {snapshotError && <p className={styles.error}>{snapshotError.message}</p>}
          </section>
          <section className={styles.panel}>
            <h2><Shield size={19} /> {locale === "vi" ? "Theo dõi đàn chó" : "Pack Overview"}</h2>
            <div className={styles.playerGrid}>
              {view?.players.map((p) => (
                <div key={p.playerId} className={styles.playerCard} data-me={p.me} data-awake={p.awake} data-known-thief={knownThiefId === p.playerId}>
                  <PlayerAvatar playerId={p.playerId} displayName={p.displayName} avatarUrl={room.players.find((player) => player.playerId === p.playerId)?.avatarUrl} size={46} />
                  <strong>{p.displayName}</strong>
                  <span>{p.me ? roleLabel(p.role, locale) : view.finished ? roleLabel(p.role, locale) : knownThiefId === p.playerId ? roleLabel("BONE_THIEF", locale) : p.awake ? (locale === "vi" ? "Đang thức" : "Awake") : "???"}</span>
                  {knownThiefId === p.playerId && !p.me && <small className={styles.knownThiefBadge}>🦴 {locale === "vi" ? "Bạn đã thấy kẻ trộm" : "Theft witnessed"}</small>}
                  {p.voted && <small>{locale === "vi" ? "Đã vote" : "Voted"}</small>}
                </div>
              ))}
            </div>
          </section>
          {view?.phase === "DISCUSSION" && (
            <section className={styles.panel}>
              <h2><MessageSquare size={19} /> {locale === "vi" ? "Chat trong phòng" : "Pack Chat"}</h2>
              <div className={styles.chatTranscript}>
                {chat.lines.length ? (
                  chat.lines.slice(-8).map((line) => (
                    <p key={line.id}>
                      <strong>{line.kind === "system" ? "•" : line.displayName ?? (locale === "vi" ? "Bạn" : "You")}</strong> {line.text}
                    </p>
                  ))
                ) : (
                  <p className={styles.muted}>{locale === "vi" ? "Chưa có tin nhắn nào." : "No messages yet."}</p>
                )}
              </div>
              <form
                className={styles.chatFake}
                onSubmit={(event) => {
                  event.preventDefault();
                  chat.send(chatDraft);
                  setChatDraft("");
                }}
              >
                <input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder={locale === "vi" ? "Nhập tin nhắn..." : "Type a message..."} maxLength={240} />
                <button type="submit" disabled={!chatDraft.trim()}>{locale === "vi" ? "Gửi" : "Send"}</button>
              </form>
            </section>
          )}
        </section>
        <aside className={styles.side}>
          <section className={styles.privatePanel}>
            <div className={styles.privateTitle}><Heart size={18} /> {locale === "vi" ? "Chuồng riêng" : "Kennel"}</div>
            <span className={styles.label}>{locale === "vi" ? "Vai của bạn" : "Your role"}</span>
            <h2>{roleLabel(role, locale)}</h2>
            <img className={styles.roleArt} src={roleArt(role, me?.seat)} alt={roleLabel(role, locale)} />
            <p className={styles.tip}>{meta?.tips[0]}</p>
            <div className={styles.dice}>
              <span>{locale === "vi" ? "Xúc xắc bí mật" : "Secret dice"}</span>
              <div>
                {view?.myDice.map((d, i) => (
                  <b key={i} data-selected={view.mySelectedWakeHours.includes(d)}>{d}:00am</b>
                ))}
              </div>
            </div>
            {view && (view.myClues.length || view.myObservedBonePresentHours.length || view.myObservedBoneMissingHours.length || view.myWitnessedBoneTakenHours.length) ? (
              <div className={styles.clues}>
                <strong>{locale === "vi" ? "Dấu vết bạn đã thấy" : "Witnessed clues"}</strong>
                <div className={styles.memoryList}>
                  {view.myObservedBonePresentHours.map((hour) => (
                    <p key={`bone-present-${hour}`}>
                      <span>{locale === "vi" ? "Kiểm tra xương" : "Bone check"}</span>
                      <b>{locale === "vi" ? "Xương vẫn còn" : "Bone was still there"}</b>
                      <span>{locale === "vi" ? `lúc ${hour}:00am` : `at ${hour}:00am`}</span>
                    </p>
                  ))}
                  {view.myWitnessedBoneTakenHours.map((hour) => (
                    <p key={`bone-theft-${hour}`}>
                      <span>{locale === "vi" ? "Chó Trộm Xương" : "Bone Thief"}</span>
                      <b>{view.players.find((player) => player.playerId === view.boneTakenBy)?.displayName ?? (locale === "vi" ? "Chó Trộm Xương" : "Bone Thief")}</b>
                      <span>{locale === "vi" ? `đã lấy xương lúc ${hour}:00am` : `took bone at ${hour}:00am`}</span>
                    </p>
                  ))}
                  {view.myObservedBoneMissingHours.map((hour) => (
                    <p key={`bone-missing-${hour}`}>
                      <span>{locale === "vi" ? "Kiểm tra xương" : "Bone check"}</span>
                      <b>{locale === "vi" ? "Xương đã mất" : "Bone was already missing"}</b>
                      <span>{locale === "vi" ? `khi bạn thức lúc ${hour}:00am` : `when you woke at ${hour}:00am`}</span>
                    </p>
                  ))}
                  {!view.myObservedBonePresentHours.length && !view.myObservedBoneMissingHours.length && !view.myWitnessedBoneTakenHours.length && view.myClues.map((clue, index) => (
                    <p key={`clue-${index}`}>{translateClue(clue, locale)}</p>
                  ))}
                </div>
              </div>
            ) : null}
            {view?.myPeekResults && Object.keys(view.myPeekResults).length ? (
              <div className={styles.clues}>
                <strong>{locale === "vi" ? "Dấu vết đã xem" : "Peeked clues"}</strong>
                <div className={styles.memoryList}>
                  {Object.entries(view.myPeekResults).map(([id, hours]) => (
                    <p key={id}>
                      <b>{view.players.find((p) => p.playerId === id)?.displayName ?? id} {locale === "vi" ? "giờ dậy:" : "wake hour:"}</b>
                      <span>{hours.map((hour) => `${hour}:00am`).join(", ")}</span>
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            {view?.myCoAwakeRecords.length ? (
              <div className={styles.clues}>
                <strong>{locale === "vi" ? "Đã thức cùng" : "Woke up with"}</strong>
                <div className={styles.memoryList}>
                  {view.myCoAwakeRecords.map((record) => (
                    <p key={record.hour}>
                      <b>{record.hour}:00am</b>
                      <span>{locale === "vi" ? "cùng " : "with "}{record.playerIds.map((id) => view.players.find((p) => p.playerId === id)?.displayName ?? id).join(", ")}</span>
                    </p>
                  ))}
                </div>
              </div>
            ) : null}
            {view?.knownBoneThiefId ? <div className={styles.clues}><strong>{locale === "vi" ? "Chó lấy xương" : "Bone Thief"}</strong><p>{view.players.find((p) => p.playerId === view.knownBoneThiefId)?.displayName ?? view.knownBoneThiefId}</p></div> : null}
            {view?.myWhiteDogRecruited ? <div className={styles.clues}><strong>{locale === "vi" ? "Bạn đã vào Bầy Trộm" : "You joined the Thief Pack"}</strong><p>{locale === "vi" ? "Bạn thắng cùng phe trộm, hoặc thắng riêng nếu bị vote loại." : "You win with the thief pack, or alone if the pack votes you out."}</p></div> : null}
            {view?.events.length ? <div className={styles.clues}><strong>{locale === "vi" ? "Nhật ký hành động" : "Action history"}</strong>{view.events.slice(-8).map((event, index) => <p key={`${event.type}-${index}`}>{eventLabel(event.type, locale)}</p>)}</div> : null}
            {view?.knownPackmateIds.length ? (
              <div className={styles.clues}>
                <strong>{locale === "vi" ? "Đồng bọn bạn biết" : "Known packmates"}</strong>
                <p>{view.knownPackmateIds.map((id) => view.players.find((p) => p.playerId === id)?.displayName ?? id).join(", ")}</p>
              </div>
            ) : null}
            {me?.awake ? (
              <div className={styles.clues}>
                <strong>{locale === "vi" ? "Dog cùng thức" : "Awake together"}</strong>
                {view && view.currentAwakePlayerIds.length ? (
                  <p>{view.currentAwakePlayerIds.map((id) => view.players.find((p) => p.playerId === id)?.displayName ?? id).join(", ")}</p>
                ) : (
                  <p className={styles.aloneNotice}>{locale === "vi" ? "Bạn thức một mình." : "You are awake alone."}</p>
                )}
              </div>
            ) : null}
          </section>
          <button type="button" className={styles.leave} onClick={() => leave.mutate(room.id)}>
            {locale === "vi" ? "Rời phòng" : "Leave Room"}
          </button>
        </aside>
      </div>
      {clueAlert && !view?.finished && (
        <div className={styles.modalLayer} role="alertdialog" aria-modal="true" aria-live="assertive">
          <button className={styles.modalBackdrop} type="button" aria-label={locale === "vi" ? "Đóng dấu vết" : "Dismiss clue"} onClick={() => setClueAlert(null)} />
          <section className={styles.clueModal}>
            <button type="button" className={styles.close} aria-label={locale === "vi" ? "Đóng" : "Close"} onClick={() => setClueAlert(null)}>×</button>
            <span className={styles.clueModalIcon}>{clueAlert.kind === "peek" ? <Eye size={34} /> : <Bone size={34} />}</span>
            <span className={styles.secret}>{locale === "vi" ? "DẤU VẾT MỚI" : "NEW CLUE"}</span>
            <h1>{clueAlert.title}</h1>
            <p className={styles.clueModalBody}>{clueAlert.body}</p>
            <button type="button" className={styles.modalContinue} onClick={() => setClueAlert(null)}>
              {locale === "vi" ? "Xác nhận" : "Confirm"}
            </button>
          </section>
        </div>
      )}
      {showRole && role && !view?.finished && (
        <div className={styles.modalLayer} role="dialog" aria-modal="true">
          <button className={styles.modalBackdrop} type="button" aria-label={locale === "vi" ? "Đóng" : "Close"} onClick={() => setShowRole(false)} />
          <section className={styles.roleModal}>
            <button type="button" className={styles.close} aria-label={locale === "vi" ? "Đóng" : "Close"} onClick={() => setShowRole(false)}>×</button>
            <span className={styles.secret}>{locale === "vi" ? "Vai Trò Bí Mật Của Bạn" : "Your Secret Role"}</span>
            <h1>{roleLabel(role, locale)}</h1>
            <img className={styles.modalRoleImage} src={roleArt(role, me?.seat)} alt="" />
            <div className={styles.roleCondition}>
              <strong>{locale === "vi" ? "Phe: " : "Alignment: "}{recruitedWhiteDog ? locale === "vi" ? "Phe Trộm Xương 🕵️" : "Thief Pack 🕵️" : meta.faction}</strong>
              <p><b>{locale === "vi" ? "Điều kiện thắng: " : "Win Condition: "}</b>{role === "WHITE_DOG" && view?.myWhiteDogRecruited
                ? locale === "vi" ? "Thắng cùng phe trộm, hoặc thắng riêng nếu bị vote loại." : "Win with the thief pack, or alone if voted out."
                : meta.condition}</p>
            </div>
            <h3>{locale === "vi" ? "💡 Mẹo chơi dành cho bạn:" : "💡 Tips for you:"}</h3>
            <ul>
              {meta.tips.map((tip) => <li key={tip}>{tip}</li>)}
            </ul>
            <button type="button" className={styles.modalContinue} onClick={() => setShowRole(false)}>
              {locale === "vi" ? "Đã nhớ vai của tôi" : "I understand my role"}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}

function WheresTheBoneResult({ view, room, locale, onPlayAgain, onLeave }: { view: WheresTheBoneView; room: RoomView; locale: Locale; onPlayAgain: () => void; onLeave: () => void; }) {
  const winnerIds = new Set(view.winnerPlayerIds);
  const winners = view.players.filter((player) => winnerIds.has(player.playerId));
  const meWon = winnerIds.has(view.viewerPlayerId);
  const faction = winningFactionLabel(view.winnerFaction, locale);
  const thief = view.players.find((player) => player.role === "BONE_THIEF");
  const targetName = (id: string | null | undefined) => view.players.find((player) => player.playerId === id)?.displayName ?? id ?? (locale === "vi" ? "Không bỏ phiếu" : "No vote");
  const summary = view.winnerFaction === "WHITE_DOG"
    ? locale === "vi" ? "Chó Trắng đã dụ cả đàn bỏ phiếu cho mình và giành chiến thắng một mình." : "White Dog tricked the pack into voting for them and won alone."
    : view.winnerFaction === "YARD_PACK"
      ? locale === "vi" ? `Cả sân đã tìm đúng Chó Trộm Xương${thief ? ` ${thief.displayName}` : ""}.` : `The yard found the Bone Thief${thief ? ` ${thief.displayName}` : ""}.`
      : view.winnerFaction === "THIEF_PACK"
        ? locale === "vi" ? `Chó Trộm Xương${thief ? ` ${thief.displayName}` : ""} đã thoát khỏi cuộc bỏ phiếu.` : `The Bone Thief${thief ? ` ${thief.displayName}` : ""} escaped the vote.`
        : locale === "vi" ? "Ván chơi đã kết thúc." : "The game has ended.";

  return (
    <main className={styles.resultPage}>
      <header className={styles.resultHeader}>
        <p>GAME OVER</p>
        <div>
          <h1>{locale === "vi" ? "Phe thắng: " : "Winner: "}<span>{faction.icon} {faction.label}</span></h1>
          <b>#{room.code}</b>
        </div>
        <small>{meWon ? (locale === "vi" ? "Bạn đã chiến thắng trong ván này!" : "You won this match!") : (locale === "vi" ? "Hẹn may mắn ở ván tiếp theo!" : "Better luck next time!")}</small>
      </header>

      <section className={styles.resultWinnerPanel}>
        <div className={styles.resultSummary}>
          <Trophy size={26} />
          <span>
            <strong>{summary}</strong>
            <small>{view.boneTakenHour ? (locale === "vi" ? `Xương được lấy lúc ${view.boneTakenHour}:00am.` : `The bone was stolen at ${view.boneTakenHour}:00am.`) : (locale === "vi" ? "Kết quả được xác định từ bảng vote cuối ván." : "Result determined by the final vote.")}</small>
          </span>
        </div>
        <div className={styles.winnerGrid}>
          {winners.map((player) => (
            <article className={styles.winnerCard} key={player.playerId}>
              <em>WINNER</em>
              <img src={roleArt(player.role, player.seat)} alt={roleLabel(player.role, locale)} />
              <strong>{player.displayName}</strong>
              <small>{roleLabel(player.role, locale)}</small>
              <EloBadge player={player} locale={locale} />
            </article>
          ))}
        </div>
      </section>

      <section className={styles.resultPanel}>
        <div className={styles.resultPanelHeading}>
          <span><ArrowRight size={18} /><h2>{locale === "vi" ? "Bảng vote" : "Vote Table"}</h2></span>
          <small>{locale === "vi" ? "Phiếu bầu được mở sau khi tất cả đã chọn" : "Votes are revealed after everyone has cast their ballot"}</small>
        </div>
        <div className={styles.resultVoteGrid}>
          {view.players.map((voter) => {
            const targetId = view.votes[voter.playerId];
            return (
              <div className={styles.resultVoteCard} key={voter.playerId}>
                <strong>{voter.displayName}</strong>
                <ArrowRight size={16} />
                <span>{targetName(targetId)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className={styles.resultPanel}>
        <div className={styles.resultPanelHeading}>
          <span><Users size={19} /><h2>{locale === "vi" ? "Vai cuối ván" : "Final Roles"}</h2></span>
          <small>{locale === "vi" ? "Vai trò, giờ thức, số phiếu và thay đổi ELO" : "Roles, wake times, votes, and ELO changes"}</small>
        </div>
        <div className={styles.resultRoleGrid}>
          {view.players.map((player) => (
            <article className={styles.resultRoleCard} data-role={roleTone(player.role)} data-winner={winnerIds.has(player.playerId)} key={player.playerId}>
              <img src={roleArt(player.role, player.seat)} alt={roleLabel(player.role, locale)} />
              <div className={styles.resultPlayerName}>
                <UserRound size={14} />
                <strong>{player.displayName}{player.me ? (locale === "vi" ? " (Bạn)" : " (You)") : ""}</strong>
              </div>
              <small>{roleLabel(player.role, locale)}</small>
              <span>⏰ {player.wakeHours.length ? player.wakeHours.map((hour) => `${hour}:00am`).join(", ") : "—"}</span>
              <span>🗳️ {view.voteCounts[player.playerId] ?? 0} {locale === "vi" ? "phiếu" : "votes"}</span>
              <EloBadge player={player} locale={locale} />
            </article>
          ))}
        </div>
      </section>

      <div className={styles.resultActions}>
        <button type="button" className={styles.resultPrimary} onClick={onPlayAgain}>
          <RotateCcw size={17} /> {locale === "vi" ? "Chơi lại" : "Play again"}
        </button>
        <button type="button" className={styles.resultLeave} onClick={onLeave}>
          <LogOut size={17} /> {locale === "vi" ? "Rời phòng" : "Leave room"}
        </button>
      </div>
    </main>
  );
}

function EloBadge({ player, locale }: { player: BonePlayer; locale: Locale }) {
  if (player.eloDelta === null) return <span className={styles.eloPending}>{locale === "vi" ? "Đang cập nhật ELO…" : "Updating ELO…"}</span>;
  const signed = player.eloDelta > 0 ? `+${player.eloDelta}` : player.eloDelta < 0 ? String(player.eloDelta) : "±0";
  return <span className={player.eloDelta < 0 ? styles.eloDown : styles.eloUp}>ELO {player.newElo ?? ((player.oldElo ?? 0) + player.eloDelta)} ({signed})</span>;
}

function winningFactionLabel(faction: string | null, locale: Locale) {
  if (faction === "WHITE_DOG") return { label: locale === "vi" ? "Chó Trắng" : "White Dog", icon: "🤍" };
  if (faction === "YARD_PACK") return { label: locale === "vi" ? "Phe Canh Sân" : "Yard Dogs", icon: "🏡" };
  if (faction === "THIEF_PACK") return { label: locale === "vi" ? "Phe Trộm Xương" : "Thief Pack", icon: "🦴" };
  return { label: locale === "vi" ? "Những người còn lại" : "Other players", icon: "🏆" };
}

function roleTone(role: BoneRole | null) {
  return role === "WHITE_DOG" ? "white" : role === "BONE_THIEF" || role === "PACKMATE" ? "thief" : "yard";
}

function phaseTitle(phase?: string, locale: Locale = "vi") {
  if (locale === "en") {
    if (phase === "WAKE_SELECTION") return "Wake choice";
    if (phase === "NIGHT_HOUR") return "Kennel night";
    if (phase === "PACK_SELECTION") return "Pack selection";
    if (phase === "DISCUSSION") return "Yard discussion";
    if (phase === "VOTING") return "Voting";
    return "Result";
  }
  if (phase === "WAKE_SELECTION") return "Chọn giờ thức";
  if (phase === "NIGHT_HOUR") return "Đêm trong sân";
  if (phase === "PACK_SELECTION") return "Chọn đồng minh";
  if (phase === "DISCUSSION") return "Cả sân cùng thảo luận";
  if (phase === "VOTING") return "Bỏ phiếu";
  return "Kết quả";
}

function actionHint(view: WheresTheBoneView | null, mustTakeBone = false, locale: Locale = "vi") {
  if (!view) return locale === "vi" ? "Đang kết nối bàn chơi…" : "Connecting to game table…";
  if (view.phase === "WAKE_SELECTION") {
    return view.legalActions.includes("SELECT_WAKE_TIME")
      ? locale === "vi" ? "Chọn 1 giờ thức từ 2 xúc sắc bí mật của bạn." : "Choose 1 wake time from your 2 secret dice."
      : locale === "vi" ? "Đợi các Chó Canh Sân chọn giờ thức bí mật." : "Wait for Yard Dogs to choose wake time.";
  }
  if (view.phase === "NIGHT_HOUR") {
    const me = view.players.find((player) => player.me);
    const witnessedThisHour = view.myWitnessedBoneTakenHours.includes(view.currentHour);
    if (witnessedThisHour && !me?.awake && view.legalActions.length === 0) {
      return locale === "vi" ? "Bạn vừa thấy xương bị lấy. Đợi lựa chọn bí mật hoàn tất rồi canh giờ sẽ tiếp tục." : "You saw the bone being taken. Wait for the secret choice to finish, then this hour will continue.";
    }
    if (!me?.awake && view.legalActions.length === 0) {
      return locale === "vi" ? "Bạn đang ngủ trong chuồng. Giữ bí mật và chờ giờ của mình." : "You are asleep in your kennel. Keep your secret and wait.";
    }
    if (me?.awake && view.legalActions.length === 0) {
      return locale === "vi" ? "Bạn đã xong lượt ở canh giờ này. Chờ canh giờ tiếp theo." : "You are done for this hour. Wait for the next wake call.";
    }
    if (view.boneTaken) return locale === "vi" ? "Xương đã mất. Ghi nhớ ai đã thức cùng bạn." : "The bone is gone. Remember who woke up with you.";
    if (mustTakeBone) return locale === "vi" ? "Bạn đang thức. Hãy lấy xương thật gọn." : "You are awake. Take the bone quietly.";
    return locale === "vi" ? "Mỗi giờ, người đang thức có thể thực hiện hành động của mình." : "Each hour, awake players may perform their actions.";
  }
  if (view.phase === "PACK_SELECTION") {
    return view.legalActions.includes("SELECT_PACKMATE")
      ? locale === "vi" ? `Chọn đúng ${view.requiredPackmateCount} chú chó.` : `Choose exactly ${view.requiredPackmateCount} players.`
      : locale === "vi" ? "Chờ Chó Trộm Xương chọn đồng bọn." : "Wait for Bone Thief to choose packmates.";
  }
  if (view.phase === "DISCUSSION") return locale === "vi" ? "Xương đã biến mất. Cả sân thảo luận để tìm người chơi đáng nghi." : "The bone is missing. Discuss to find the suspicious thief.";
  if (view.phase === "VOTING") return view.legalActions.includes("VOTE")
    ? locale === "vi" ? "Bỏ phiếu cho người chơi bạn nghi đã lấy xương." : "Vote for the player you suspect took the bone."
    : locale === "vi" ? "Bạn đã vote. Đợi những người chơi còn lại." : "You have voted. Wait for others.";
  return "";
}
