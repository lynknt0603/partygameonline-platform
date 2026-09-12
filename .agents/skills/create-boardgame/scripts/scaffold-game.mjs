#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");
const gamesDir = path.join(rootDir, "apps", "web", "src", "games");

const rawId = process.argv[2];
const rawName = process.argv[3];

if (!rawId || !rawName) {
  console.error("❌ Usage: node scripts/scaffold-game.mjs <game-id> \"<Game Display Name>\"");
  console.error("   Example: node scripts/scaffold-game.mjs spyfall \"Spyfall (Gián Điệp)\"");
  process.exit(1);
}

// Convert kebab/snake/space to camelCase and PascalCase
function toCamelCase(str) {
  return str
    .replace(/[-_ ]+(.)/g, (_, c) => c.toUpperCase())
    .replace(/^([A-Z])/, (c) => c.toLowerCase());
}

function toPascalCase(str) {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function toKebabCase(str) {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

const kebabId = toKebabCase(rawId);
const camelId = toCamelCase(rawId);
const pascalName = toPascalCase(rawId);
const displayName = rawName;
const targetDir = path.join(gamesDir, camelId);

if (fs.existsSync(targetDir)) {
  console.error(`❌ Error: Directory already exists at ${targetDir}`);
  process.exit(1);
}

console.log(`🚀 Scaffolding new game module: ${displayName} (${kebabId})...`);

fs.mkdirSync(path.join(targetDir, "model"), { recursive: true });
fs.mkdirSync(path.join(targetDir, "api"), { recursive: true });
fs.mkdirSync(path.join(targetDir, "pages"), { recursive: true });

// 1. Types
const typesContent = `export const ${pascalName.toUpperCase()}_ID = "${kebabId}";

export interface ${pascalName}Player {
  playerId: string;
  displayName: string;
  avatarUrl?: string | null;
  seat: number;
  alive: boolean;
  connected: boolean;
  score: number;
}

export type ${pascalName}Phase = "WAITING" | "PLAYING" | "ROUND_SUMMARY" | "GAME_OVER";

export interface ${pascalName}View {
  gameType: string;
  roomId: string;
  you: string;
  phase: ${pascalName}Phase;
  round: number;
  version: number;
  timeRemainingSeconds: number;
  winnerPlayerIds: string[];
  players: ${pascalName}Player[];
  publicLogs: string[];
}

export type ${pascalName}ActionType = "SUBMIT_ACTION" | "VOTE" | "PASS";

export interface ${pascalName}Command {
  type: ${pascalName}ActionType;
  targetPlayerId?: string;
  payload?: Record<string, unknown>;
}
`;
fs.writeFileSync(path.join(targetDir, "model", `${camelId}Types.ts`), typesContent, "utf8");

// 2. Rules
const rulesContent = `import type {
  ${pascalName}View,
  ${pascalName}Player,
  ${pascalName}Command,
} from "./${camelId}Types";
import { ${pascalName.toUpperCase()}_ID } from "./${camelId}Types";

export interface PlayerSetupInfo {
  playerId: string;
  displayName: string;
  avatarUrl?: string | null;
}

/**
 * Khởi tạo trạng thái ban đầu của trò chơi
 */
export function init${pascalName}Game(
  roomId: string,
  playersInfo: PlayerSetupInfo[],
  viewingPlayerId: string,
): ${pascalName}View {
  const players: ${pascalName}Player[] = playersInfo.map((info, idx) => ({
    playerId: info.playerId,
    displayName: info.displayName,
    avatarUrl: info.avatarUrl ?? null,
    seat: idx,
    alive: true,
    connected: true,
    score: 0,
  }));

  return {
    gameType: ${pascalName.toUpperCase()}_ID,
    roomId,
    you: viewingPlayerId,
    phase: "PLAYING",
    round: 1,
    version: 1,
    timeRemainingSeconds: 60,
    winnerPlayerIds: [],
    players,
    publicLogs: [\`Trò chơi ${displayName} bắt đầu ván 1!\`],
  };
}

/**
 * Kiểm tra tính hợp lệ của hành động người chơi
 */
export function validate${pascalName}Action(
  view: ${pascalName}View,
  playerId: string,
  command: ${pascalName}Command,
): { valid: boolean; reason?: string } {
  if (view.phase !== "PLAYING") {
    return { valid: false, reason: "Trò chơi chưa ở trạng thái có thể tương tác." };
  }
  const player = view.players.find((p) => p.playerId === playerId);
  if (!player || !player.alive) {
    return { valid: false, reason: "Người chơi không tồn tại hoặc đã bị loại." };
  }
  if (!command.type) {
    return { valid: false, reason: "Hành động không hợp lệ." };
  }
  return { valid: true };
}

/**
 * Xử lý hành động người chơi và sinh ra State kế tiếp (Pure Transition)
 */
export function process${pascalName}Action(
  view: ${pascalName}View,
  playerId: string,
  command: ${pascalName}Command,
): ${pascalName}View {
  const validation = validate${pascalName}Action(view, playerId, command);
  if (!validation.valid) {
    throw new Error(validation.reason);
  }

  const actor = view.players.find((p) => p.playerId === playerId);
  const actorName = actor ? actor.displayName : playerId;
  const newLog = \`\${actorName} đã thực hiện \${command.type}\`;

  return {
    ...view,
    version: view.version + 1,
    publicLogs: [newLog, ...view.publicLogs.slice(0, 49)],
  };
}
`;
fs.writeFileSync(path.join(targetDir, "model", `${camelId}Rules.ts`), rulesContent, "utf8");

// 3. Tests
const testsContent = `import { describe, it, expect } from "vitest";
import {
  init${pascalName}Game,
  validate${pascalName}Action,
  process${pascalName}Action,
} from "./${camelId}Rules";
import { ${pascalName.toUpperCase()}_ID } from "./${camelId}Types";

describe("${pascalName} Rules Engine", () => {
  const mockPlayers = [
    { playerId: "p1", displayName: "Alice" },
    { playerId: "p2", displayName: "Bob" },
    { playerId: "p3", displayName: "Charlie" },
  ];

  it("khởi tạo ván đấu thành công với số lượng người chơi đầy đủ", () => {
    const view = init${pascalName}Game("ROOM-1", mockPlayers, "p1");
    expect(view.gameType).toBe(${pascalName.toUpperCase()}_ID);
    expect(view.roomId).toBe("ROOM-1");
    expect(view.players.length).toBe(3);
    expect(view.phase).toBe("PLAYING");
    expect(view.version).toBe(1);
    expect(view.winnerPlayerIds).toEqual([]);
  });

  it("validate từ chối khi game không ở phase PLAYING", () => {
    const view = init${pascalName}Game("ROOM-1", mockPlayers, "p1");
    view.phase = "GAME_OVER";
    const res = validate${pascalName}Action(view, "p1", { type: "SUBMIT_ACTION" });
    expect(res.valid).toBe(false);
    expect(res.reason).toBeDefined();
  });

  it("validate chấp nhận hành động hợp lệ từ người chơi còn sống", () => {
    const view = init${pascalName}Game("ROOM-1", mockPlayers, "p1");
    const res = validate${pascalName}Action(view, "p1", { type: "SUBMIT_ACTION" });
    expect(res.valid).toBe(true);
  });

  it("process action tăng version và ghi nhật ký công khai", () => {
    const view = init${pascalName}Game("ROOM-1", mockPlayers, "p1");
    const next = process${pascalName}Action(view, "p1", { type: "SUBMIT_ACTION" });
    expect(next.version).toBe(2);
    expect(next.publicLogs[0]).toContain("Alice đã thực hiện SUBMIT_ACTION");
  });
});
`;
fs.writeFileSync(path.join(targetDir, "model", `${camelId}Rules.test.ts`), testsContent, "utf8");

// 4. API
const apiContent = `import { api } from "@/shared/api/http";
import { realtime } from "@/shared/api/ws";
import type { RoomDto } from "@/shared/api/types";
import type { ${pascalName}View, ${pascalName}Command } from "../model/${camelId}Types";

export function start${pascalName}Game(roomId: string): Promise<RoomDto> {
  return api<RoomDto>(\`/api/v1/games/${kebabId}/rooms/\${roomId.toUpperCase()}/start\`, {
    method: "POST",
  });
}

export async function fetch${pascalName}Snapshot(roomId: string): Promise<${pascalName}View | null> {
  try {
    return await api<${pascalName}View>(\`/api/v1/games/${kebabId}/rooms/\${roomId.toUpperCase()}/snapshot\`);
  } catch {
    return null;
  }
}

export function send${pascalName}Command(
  roomId: string,
  command: ${pascalName}Command,
  expectedVersion?: number,
): string {
  const commandId = crypto.randomUUID();
  return realtime.send("GAME_ACTION", roomId, {
    commandId,
    ...(expectedVersion === undefined ? {} : { expectedVersion }),
    ...command,
  });
}
`;
fs.writeFileSync(path.join(targetDir, "api", `${camelId}Api.ts`), apiContent, "utf8");

// 5. PlayPage Component
const playPageContent = `import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Users, Play, ShieldAlert } from "lucide-react";
import type { RoomDto } from "@/shared/api/types";
import type { RoomView } from "@/shared/lobby/roomView";
import { useSessionStore } from "@/shared/state/sessionStore";
import {
  init${pascalName}Game,
  process${pascalName}Action,
  validate${pascalName}Action,
} from "../model/${camelId}Rules";
import type { ${pascalName}View, ${pascalName}Command } from "../model/${camelId}Types";
import styles from "./${pascalName}PlayPage.module.css";

interface ${pascalName}PlayPageProps {
  roomId: string;
  room?: RoomView | RoomDto;
}

export function ${pascalName}PlayPage({ roomId, room }: ${pascalName}PlayPageProps) {
  const navigate = useNavigate();
  const session = useSessionStore((state) => state.session);
  const myPlayerId = session?.playerId ?? "player-1";

  // Danh sách người chơi mẫu hoặc từ phòng
  const initialPlayers = useMemo(() => {
    if (room && room.players.length >= 3) {
      return room.players.map((p) => ({
        playerId: p.playerId,
        displayName: p.displayName,
        avatarUrl: p.avatarUrl,
      }));
    }
    return [
      { playerId: myPlayerId, displayName: session?.displayName ?? "Bạn" },
      { playerId: "bot-1", displayName: "🤖 Bot Alfa" },
      { playerId: "bot-2", displayName: "🤖 Bot Bravo" },
      { playerId: "bot-3", displayName: "🤖 Bot Charlie" },
    ];
  }, [room, myPlayerId, session?.displayName]);

  const [gameState, setGameState] = useState<${pascalName}View>(() => {
    return init${pascalName}Game(roomId, initialPlayers, myPlayerId);
  });

  const [actionError, setActionError] = useState<string | null>(null);

  const handleAction = (type: ${pascalName}Command["type"]) => {
    setActionError(null);
    const command: ${pascalName}Command = { type };
    const validation = validate${pascalName}Action(gameState, myPlayerId, command);
    if (!validation.valid) {
      setActionError(validation.reason ?? "Hành động không hợp lệ");
      return;
    }
    setGameState((curr) => process${pascalName}Action(curr, myPlayerId, command));
  };

  return (
    <main className={styles.tableCanvas}>
      <header className={styles.headerBar}>
        <div className={styles.gameInfo}>
          <span className={styles.gameTitle}>🎮 ${displayName}</span>
          <span className={styles.roomTag}>#{roomId.toUpperCase()}</span>
          <span className={styles.phaseBadge}>{gameState.phase}</span>
        </div>
        <button
          type="button"
          className={styles.leaveBtn}
          onClick={() => navigate(\`/rooms/\${roomId}\`)}
          title="Rời bàn chơi"
        >
          <LogOut size={16} />
          <span>Rời bàn</span>
        </button>
      </header>

      {actionError && (
        <div className={styles.errorAlert} role="alert">
          <ShieldAlert size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Vòng tròn ghế ngồi người chơi */}
      <section className={styles.playerSection}>
        <h2 className={styles.sectionHeading}>
          <Users size={16} /> Danh sách người chơi ({gameState.players.length})
        </h2>
        <div className={styles.playerGrid}>
          {gameState.players.map((p) => {
            const isMe = p.playerId === myPlayerId;
            return (
              <div
                key={p.playerId}
                className={\`\${styles.playerCard} \${isMe ? styles.myCard : ""}\`}
              >
                <div className={styles.avatarCircle}>
                  {p.displayName.charAt(0).toUpperCase()}
                </div>
                <div className={styles.playerMeta}>
                  <span className={styles.playerName}>
                    {p.displayName} {isMe && "(Bạn)"}
                  </span>
                  <span className={styles.playerStatus}>
                    {p.alive ? "🟢 Sẵn sàng" : "🔴 Đã loại"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bảng tương tác hành động */}
      <section className={styles.controlPanel}>
        <div className={styles.actionRow}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={() => handleAction("SUBMIT_ACTION")}
          >
            <Play size={16} />
            <span>Thực hiện lượt</span>
          </button>
          <button
            type="button"
            className={styles.secondaryBtn}
            onClick={() => handleAction("PASS")}
          >
            Bỏ qua
          </button>
        </div>
      </section>

      {/* Nhật ký công khai */}
      <footer className={styles.logSection}>
        <h3 className={styles.logTitle}>📜 Nhật ký ván đấu</h3>
        <div className={styles.logList}>
          {gameState.publicLogs.map((log, i) => (
            <div key={i} className={styles.logItem}>
              {log}
            </div>
          ))}
        </div>
      </footer>
    </main>
  );
}
`;
fs.writeFileSync(path.join(targetDir, "pages", `${pascalName}PlayPage.tsx`), playPageContent, "utf8");

// 6. PlayPage CSS Modules
const cssContent = `.tableCanvas {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
  background: var(--bg);
  color: var(--text);
  padding: clamp(0.75rem, 2vw, 1.5rem);
  box-sizing: border-box;
  gap: 1rem;
}

.headerBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md, 8px);
}

.gameInfo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.gameTitle {
  font-weight: 700;
  font-size: 1.1rem;
  color: var(--brand);
}

.roomTag {
  font-size: 0.85rem;
  color: var(--text-muted);
  font-family: monospace;
}

.phaseBadge {
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  background: var(--surface-active, rgba(61, 156, 140, 0.15));
  color: var(--brand);
  font-size: 0.75rem;
  font-weight: 600;
}

.leaveBtn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 44px;
  padding: 0.4rem 0.8rem;
  border-radius: var(--radius-sm, 6px);
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.leaveBtn:hover {
  background: var(--surface-hover);
  color: var(--text);
}

.errorAlert {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgba(239, 68, 68, 0.12);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: var(--radius-md, 8px);
  color: #ef4444;
  font-size: 0.9rem;
}

.playerSection {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md, 8px);
  padding: 1rem;
}

.sectionHeading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 0.95rem;
  color: var(--text-muted);
}

.playerGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 0.75rem;
}

.playerCard {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm, 6px);
}

.myCard {
  border-color: var(--brand);
  box-shadow: 0 0 0 1px var(--brand);
}

.avatarCircle {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--brand);
  color: var(--on-brand, #202824);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.playerMeta {
  display: flex;
  flex-direction: column;
}

.playerName {
  font-weight: 600;
  font-size: 0.9rem;
}

.playerStatus {
  font-size: 0.75rem;
  color: var(--text-muted);
}

.controlPanel {
  padding: 1rem;
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md, 8px);
}

.actionRow {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.primaryBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0 1.25rem;
  border-radius: var(--radius-md, 8px);
  background: var(--brand);
  color: var(--on-brand, #202824);
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.primaryBtn:hover {
  opacity: 0.9;
}

.secondaryBtn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0 1.25rem;
  border-radius: var(--radius-md, 8px);
  background: transparent;
  color: var(--text);
  border: 1px solid var(--border-subtle);
  cursor: pointer;
  transition: all 0.2s;
}

.secondaryBtn:hover {
  background: var(--surface-hover);
}

.logSection {
  background: var(--surface);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-md, 8px);
  padding: 1rem;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.logTitle {
  margin: 0 0 0.5rem 0;
  font-size: 0.9rem;
  color: var(--text-muted);
}

.logList {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 160px;
  overflow-y: auto;
  font-size: 0.85rem;
}

.logItem {
  padding: 0.25rem 0.5rem;
  border-left: 2px solid var(--brand);
  background: rgba(0, 0, 0, 0.05);
}
`;
fs.writeFileSync(path.join(targetDir, "pages", `${pascalName}PlayPage.module.css`), cssContent, "utf8");

// 7. index.ts
const indexContent = `export const ${pascalName.toUpperCase()}_ID = "${kebabId}";

export * from "./model/${camelId}Types";
export * from "./model/${camelId}Rules";
export * from "./api/${camelId}Api";
export { ${pascalName}PlayPage } from "./pages/${pascalName}PlayPage";
`;
fs.writeFileSync(path.join(targetDir, "index.ts"), indexContent, "utf8");

console.log(`\n✅ Successfully generated game module: apps/web/src/games/${camelId}/`);
console.log(`\nNext integration steps to complete:`);
console.log(`1. Add entry in 'apps/web/src/shared/api/catalog.ts':`);
console.log(`   "${kebabId}": {`);
console.log(`     displayName: "${displayName}",`);
console.log(`     displayNameVi: "${displayName}",`);
console.log(`     genre: "Tabletop • Party",`);
console.log(`     genreVi: "Board game • Tiệc",`);
console.log(`     summary: "Trò chơi ${displayName}",`);
console.log(`     summaryVi: "Trò chơi ${displayName}",`);
console.log(`     durationMin: 15,`);
console.log(`     durationMax: 30,`);
console.log(`     theme: { id: "${kebabId}-default", name: "${displayName}", prefersDarkCanvas: true, hudVariant: "platform" },`);
console.log(`   },`);
console.log(`\n2. Add route in 'apps/web/src/pages/GamePage.tsx':`);
console.log(`   import { ${pascalName.toUpperCase()}_ID, ${pascalName}PlayPage } from "@/games/${camelId}";`);
console.log(`   ...`);
console.log(`   if (room.gameId === ${pascalName.toUpperCase()}_ID) {`);
console.log(`     return <${pascalName}PlayPage roomId={roomId} room={room} />;`);
console.log(`   }`);
console.log(`\n3. Run tests to verify:`);
console.log(`   cd apps/web && npm test\n`);
