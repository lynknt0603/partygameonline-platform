import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Bone, CircleDotDashed, Clock3, Eye, Heart, LogOut, MessageSquare, Moon, RotateCcw, Shield, ThumbsDown, ThumbsUp, Trophy, UserRound, Users } from "lucide-react";
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

const roleNames: Record<Locale, Record<string, string>> = {
  vi: { BONE_THIEF: "Chó Trộm Xương", WHITE_DOG: "Chó Trắng", YARD_DOG: "Chó Canh Sân", PACKMATE: "Đồng Bọn Trộm Xương" },
  en: { BONE_THIEF: "Bone Thief", WHITE_DOG: "White Dog", YARD_DOG: "Yard Dog", PACKMATE: "Secret Packmate" },
};

const roleDescriptions: Record<Locale, Record<string, { faction: string; condition: string; tip: string }>> = {
  vi: {
    BONE_THIEF: { faction: "Phe Trộm Xương", condition: "Lấy được xương và không bị cả sân chỉ điểm.", tip: "Đánh lạc hướng đàn chó, nhưng đừng để lộ giờ thức." },
    PACKMATE: { faction: "Phe Trộm Xương", condition: "Giúp Chó Trộm Xương không bị vote loại.", tip: "Bảo vệ đồng minh bằng những lập luận hợp lý." },
    WHITE_DOG: { faction: "Phe Độc Lập", condition: "Dụ cả bầy vote trúng chính mình khi khúc xương bị mất.", tip: "Hãy tỏ ra đáng nghi một cách tinh tế." },
    YARD_DOG: { faction: "Phe Đàn Chó", condition: "Tìm và vote đúng Chó Trộm Xương.", tip: "So sánh các manh mối về giờ thức và người đã thấy xương." },
  },
  en: {
    BONE_THIEF: { faction: "Thief Pack", condition: "Steal the bone and avoid getting voted out by the yard.", tip: "Deflect suspicion and keep your wake time secret." },
    PACKMATE: { faction: "Thief Pack", condition: "Protect the Bone Thief from being voted out.", tip: "Defend your ally with convincing arguments." },
    WHITE_DOG: { faction: "Independent", condition: "Trick the pack into voting you out when the bone is taken.", tip: "Act suspiciously in a subtle way." },
    YARD_DOG: { faction: "Yard Pack", condition: "Identify the Bone Thief and vote them out.", tip: "Compare clues about wake times and witnesses who saw the bone." },
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

export function WheresTheBonePlayPage({ room, view, snapshotPending, snapshotError, notice, rejectCode, sendCommand }: Props) {
  const locale = useLocale();
  const navigate = useNavigate();
  const leave = useLeaveRoom();
  const chat = useLobbyChat(room.id, view?.viewerPlayerId);
  const [chatDraft, setChatDraft] = useState("");
  const [showRole, setShowRole] = useState(false);
  const [roleSeen, setRoleSeen] = useState(false);
  const [now, setNow] = useState(Date.now());

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

  const left = useMemo(() => (view ? Math.max(0, Math.ceil((new Date(view.deadline).getTime() - now) / 1000)) : 0), [view, now]);
  const skipVoteLeft = useMemo(() => (view?.discussionSkipVoteDeadline ? Math.max(0, Math.ceil((new Date(view.discussionSkipVoteDeadline).getTime() - now) / 1000)) : 0), [view?.discussionSkipVoteDeadline, now]);
  const me = view?.players.find((p) => p.me);
  const role = view?.myRole ?? me?.role ?? null;
  const meta = (roleDescriptions[locale] ?? roleDescriptions.vi)[role ?? "YARD_DOG"] ?? roleDescriptions.vi.YARD_DOG;
  const mustTakeBone = Boolean(view?.phase === "NIGHT_HOUR" && !view.boneTaken && role === "BONE_THIEF" && view.players.length > 4 && view.currentAwakePlayerIds.includes(view.viewerPlayerId));
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
                <strong>{locale === "vi" ? "Chọn giờ thức bí mật" : "Choose secret wake time"}</strong>
                <p>{locale === "vi" ? "Mỗi người chọn một mặt xúc xắc. Các giờ còn lại được giữ kín." : "Each player chooses one dice face. The remaining hours remain secret."}</p>
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
                    ? locale === "vi" ? "Hãy thảo luận để tìm người chơi đáng nghi." : "Discuss to find suspicious players."
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
                  <span>{locale === "vi" ? "Chọn người để xem giờ thức" : "Choose a player to peek wake time"}</span>
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
                {locale === "vi" ? "Đợi đến giờ tiếp theo" : "Wait for next hour"}
              </button>
            )}
            {can("SELECT_PACKMATE") && (
              <div className={styles.actionGroup}>
                <div className={styles.actionLabel}>
                  <span>{locale === "vi" ? "Chọn một người đã thức cùng để trở thành Chó Nguyền" : "Choose an awake witness to become your Packmate"}</span>
                </div>
                <div className={styles.actionChoices}>
                  {view?.players.filter((p) => view.packmateCandidateIds.includes(p.playerId)).map((p) => (
                    <button key={p.playerId} type="button" className={styles.choice} onClick={() => command({ type: "SELECT_PACKMATE", targetPlayerId: p.playerId })}>
                      {p.displayName}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {can("START_VOTE") && (
              <button type="button" className={styles.primary} onClick={() => command({ type: "START_VOTE" })}>
                {locale === "vi" ? "Bỏ phiếu bỏ qua giai đoạn thảo luận" : "Vote to skip discussion phase"}
              </button>
            )}
            {view?.phase === "DISCUSSION" && view.discussionSkipVoteStarted && (
              <DiscussionSkipVote view={view} secondsLeft={skipVoteLeft} canVote={can("VOTE_TO_SKIP_DISCUSSION")} locale={locale} onVote={(approved) => command({ type: "VOTE_TO_SKIP_DISCUSSION", approved })} />
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
            <h2><Shield size={19} /> {locale === "vi" ? "Theo dõi đàn chó" : "Yard Dogs Status"}</h2>
            <div className={styles.playerGrid}>
              {view?.players.map((p) => (
                <div key={p.playerId} className={styles.playerCard} data-me={p.me} data-awake={p.awake}>
                  <PlayerAvatar playerId={p.playerId} displayName={p.displayName} avatarUrl={room.players.find((player) => player.playerId === p.playerId)?.avatarUrl} size={46} />
                  <strong>{p.displayName}</strong>
                  <span>{p.me ? roleLabel(p.role, locale) : view.finished ? roleLabel(p.role, locale) : p.awake ? (locale === "vi" ? "Đang thức" : "Awake") : "???"}</span>
                  {p.voted && <small>{locale === "vi" ? "Đã vote" : "Voted"}</small>}
                </div>
              ))}
            </div>
          </section>
          {view?.phase === "DISCUSSION" && (
            <section className={styles.panel}>
              <h2><MessageSquare size={19} /> {locale === "vi" ? "Chat trong phòng" : "Room Chat"}</h2>
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
                <input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder={locale === "vi" ? "Nhập tin nhắn…" : "Type a message…"} maxLength={240} />
                <button type="submit" disabled={!chatDraft.trim()}>{locale === "vi" ? "Gửi" : "Send"}</button>
              </form>
            </section>
          )}
        </section>
        <aside className={styles.side}>
          <section className={styles.privatePanel}>
            <div className={styles.privateTitle}><Heart size={18} /> {locale === "vi" ? "Chuồng riêng" : "Private Kennel"}</div>
            <span className={styles.label}>{locale === "vi" ? "VAI CỦA BẠN" : "YOUR ROLE"}</span>
            <h2>{roleLabel(role, locale)}</h2>
            <img className={styles.roleArt} src={roleArt(role, me?.seat)} alt={roleLabel(role, locale)} />
            <p className={styles.tip}>{meta?.tip}</p>
            <div className={styles.dice}>
              <span>{locale === "vi" ? "XÚC XẮC BÍ MẬT" : "SECRET DICE"}</span>
              <div>
                {view?.myDice.map((d, i) => (
                  <b key={i} data-selected={view.mySelectedWakeHours.includes(d)}>{d}:00am</b>
                ))}
              </div>
            </div>
            {view?.myClues.length ? (
              <div className={styles.clues}>
                <strong>{locale === "vi" ? "DẤU VẾT BẠN ĐÃ THẤY" : "CLUES OBSERVED"}</strong>
                {view.myClues.map((c, i) => (
                  <p key={i}>{translateClue(c, locale)}</p>
                ))}
              </div>
            ) : null}
            {view?.knownPackmateIds.length ? (
              <div className={styles.clues}>
                <strong>{locale === "vi" ? "ĐỒNG MINH" : "ALLIES"}</strong>
                <p>{view.knownPackmateIds.map((id) => view.players.find((p) => p.playerId === id)?.displayName ?? id).join(", ")}</p>
              </div>
            ) : null}
            {view?.currentAwakePlayerIds.length ? (
              <div className={styles.clues}>
                <strong>{locale === "vi" ? "ĐÃ THỨC CÙNG" : "AWOKE WITH"}</strong>
                <p>{view.currentAwakePlayerIds.map((id) => view.players.find((p) => p.playerId === id)?.displayName ?? id).join(", ")}</p>
              </div>
            ) : null}
          </section>
          <button type="button" className={styles.leave} onClick={() => leave.mutate(room.id)}>
            {locale === "vi" ? "Rời phòng" : "Leave Room"}
          </button>
        </aside>
      </div>
      {showRole && role && !view?.finished && (
        <div className={styles.modalLayer} role="dialog" aria-modal="true">
          <button className={styles.modalBackdrop} type="button" aria-label="Đóng" onClick={() => setShowRole(false)} />
          <section className={styles.roleModal}>
            <button type="button" className={styles.close} onClick={() => setShowRole(false)}>×</button>
            <span className={styles.secret}>{locale === "vi" ? "VAI TRÒ BÍ MẬT CỦA BẠN" : "YOUR SECRET ROLE"}</span>
            <h1>{roleLabel(role, locale)}</h1>
            <img className={styles.modalRoleImage} src={roleArt(role, me?.seat)} alt="" />
            <div className={styles.roleCondition}>
              <strong>{locale === "vi" ? "Phe: " : "Pack: "}{meta.faction}</strong>
              <p><b>{locale === "vi" ? "Điều kiện thắng:" : "Win condition:"}</b> {meta.condition}</p>
            </div>
            <h3>{locale === "vi" ? "💡 Mẹo chơi dành cho bạn:" : "💡 Strategy tips for you:"}</h3>
            <ul>
              <li>{meta.tip}</li>
              <li>{locale === "vi" ? "Giữ kín thông tin trên thẻ và quan sát lời nói của mọi người." : "Keep your card info secret and observe what others say."}</li>
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
          <span><ArrowRight size={18} /><h2>{locale === "vi" ? "Bảng vote" : "Voting Board"}</h2></span>
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

function DiscussionSkipVote({ view, secondsLeft, canVote, locale, onVote }: { view: WheresTheBoneView; secondsLeft: number; canVote: boolean; locale: Locale; onVote: (approved: boolean) => void }) {
  const yes = view.players.filter((player) => view.discussionSkipVotes[player.playerId] === true);
  const no = view.players.filter((player) => view.discussionSkipVotes[player.playerId] === false);
  const blank = view.players.filter((player) => !(player.playerId in view.discussionSkipVotes));
  const required = Math.floor(view.players.length / 2) + 1;
  const voted = view.viewerPlayerId in view.discussionSkipVotes;
  const names = (players: BonePlayer[]) => (players.length ? players.map((player) => player.displayName).join(", ") : locale === "vi" ? "Không có" : "None");

  return (
    <section className={styles.skipVotePanel} aria-label={locale === "vi" ? "Bỏ phiếu bỏ qua giai đoạn thảo luận" : "Vote to skip discussion phase"}>
      <div className={styles.skipVoteHeading}>
        <strong>{locale === "vi" ? "Bỏ phiếu bỏ qua giai đoạn thảo luận" : "Vote to skip discussion phase"}</strong>
        <span><Clock3 size={14} />{view.discussionSkipVoteOpen ? `${secondsLeft}s` : locale === "vi" ? "Đã kết thúc" : "Ended"}</span>
      </div>
      <p>
        {view.discussionSkipVoteOpen
          ? locale === "vi" ? `Cần ít nhất ${required} phiếu Có để chuyển ngay sang giai đoạn vote.` : `Need at least ${required} Yes votes to skip directly to voting.`
          : locale === "vi" ? "Không đạt quá bán. Giai đoạn thảo luận tiếp tục." : "Vote did not pass. Discussion phase continues."}
      </p>
      {canVote ? (
        <div className={styles.skipVoteActions}>
          <button type="button" data-choice="yes" onClick={() => onVote(true)}>
            <ThumbsUp size={16} /> {locale === "vi" ? "Có" : "Yes"}
          </button>
          <button type="button" data-choice="no" onClick={() => onVote(false)}>
            <ThumbsDown size={16} /> {locale === "vi" ? "Không" : "No"}
          </button>
        </div>
      ) : voted && view.discussionSkipVoteOpen ? (
        <small className={styles.skipVoteSubmitted}>{locale === "vi" ? "Bạn đã bỏ phiếu. Không thể thay đổi lựa chọn." : "You have voted. Selection cannot be changed."}</small>
      ) : null}
      <div className={styles.skipVoteResults}>
        <div data-result="yes">
          <ThumbsUp size={15} />
          <span>
            <b>{locale === "vi" ? `Có (${yes.length})` : `Yes (${yes.length})`}</b>
            <small>{names(yes)}</small>
          </span>
        </div>
        <div data-result="no">
          <ThumbsDown size={15} />
          <span>
            <b>{locale === "vi" ? `Không (${no.length})` : `No (${no.length})`}</b>
            <small>{names(no)}</small>
          </span>
        </div>
        <div data-result="blank">
          <CircleDotDashed size={15} />
          <span>
            <b>{locale === "vi" ? `Phiếu trống (${blank.length})` : `No vote (${blank.length})`}</b>
            <small>{names(blank)}</small>
          </span>
        </div>
      </div>
    </section>
  );
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
  if (view.phase === "WAKE_SELECTION") return locale === "vi" ? "Hãy chọn một giờ trên xúc xắc bí mật của bạn." : "Choose one hour from your secret dice.";
  if (view.phase === "NIGHT_HOUR") {
    if (view.boneTaken) return locale === "vi" ? "Xương đã mất. Ghi nhớ ai đã thức cùng bạn." : "The bone is gone. Remember who woke up with you.";
    if (mustTakeBone) return locale === "vi" ? "Bạn bắt buộc phải lấy xương trong lượt thức này." : "You must take the bone during this wake hour.";
    return locale === "vi" ? "Mỗi giờ, người đang thức có thể thực hiện hành động của mình." : "Each hour, awake players may perform their actions.";
  }
  if (view.phase === "PACK_SELECTION") return locale === "vi" ? "Chỉ những người đã thức cùng lúc xương bị lấy mới có thể trở thành Chó Nguyền." : "Only witnesses awake when the bone was stolen can be chosen as Packmates.";
  if (view.phase === "DISCUSSION") return locale === "vi" ? "Trao đổi manh mối, sau đó bắt đầu vote." : "Share clues, then start voting.";
  if (view.phase === "VOTING") return locale === "vi" ? "Chọn người bạn nghi ngờ nhất." : "Vote for the player you suspect most.";
  return "";
}
