export type BloodClan = "ROSE" | "FAN" | "INQUISITOR";

export type ClueTokenType = "COLOR" | "CREST" | "RANK" | "QUESTION";

export type BloodBoundRoleRank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export interface BloodBoundRoleInfo {
  rank: BloodBoundRoleRank;
  roleName: string;
  roleNameVi: string;
  abilityDesc: string;
  abilityDescVi: string;
}

export const BLOOD_BOUND_ROLES: Record<BloodBoundRoleRank, BloodBoundRoleInfo> = {
  1: {
    rank: 1,
    roleName: "Leader",
    roleNameVi: "Thủ Lĩnh",
    abilityDesc: "Passive. If captured, the capturing team wins. Must be protected.",
    abilityDescVi: "Bị động. Nếu bị bắt, đối phương thắng. Cần được bảo vệ bằng mọi giá.",
  },
  2: {
    rank: 2,
    roleName: "Assassin",
    roleNameVi: "Sát Thủ",
    abilityDesc: "Immediately deal 1 wound to any other player.",
    abilityDescVi: "Gây ngay 1 vết thương lên bất kỳ người chơi nào khác.",
  },
  3: {
    rank: 3,
    roleName: "Harlequin",
    roleNameVi: "Tắc Kè Hoa",
    abilityDesc: "Shows clues from both clans to deceive enemies.",
    abilityDescVi: "Hiển thị manh mối của cả hai phe để đánh lừa đối phương.",
  },
  4: {
    rank: 4,
    roleName: "Alchemist",
    roleNameVi: "Nhà Giả Kim",
    abilityDesc: "Heal 1 wound from yourself or another player.",
    abilityDescVi: "Hồi phục 1 vết thương cho bản thân hoặc người khác.",
  },
  5: {
    rank: 5,
    roleName: "Mentalist",
    roleNameVi: "Thần Trí",
    abilityDesc: "Force a chosen player to take and reveal a clue token.",
    abilityDescVi: "Ép một người chơi chỉ định phải tự lấy và để lộ 1 token manh mối.",
  },
  6: {
    rank: 6,
    roleName: "Guardian",
    roleNameVi: "Hộ Vệ",
    abilityDesc: "Grant a shield to a player, protecting them from the next attack.",
    abilityDescVi: "Ban khiên bảo vệ cho 1 người chơi, miễn nhiễm sát thương ở đòn tiếp theo.",
  },
  7: {
    rank: 7,
    roleName: "Berserker",
    roleNameVi: "Cuồng Nộ",
    abilityDesc: "Reflect 1 wound back to the attacker who struck you.",
    abilityDescVi: "Phản lại 1 vết thương cho kẻ vừa tấn công mình.",
  },
  8: {
    rank: 8,
    roleName: "Courtesan",
    roleNameVi: "Mê Hoặc",
    abilityDesc: "Force the next dagger holder to attack a target of your choice.",
    abilityDescVi: "Ép người cầm kiếm tiếp theo phải tấn công mục tiêu bạn chỉ định.",
  },
};

export interface BloodBoundCard {
  clan: BloodClan;
  rank: BloodBoundRoleRank;
  roleInfo: BloodBoundRoleInfo;
}

export interface RevealedToken {
  type: ClueTokenType;
  value: string | number;
}

export interface BloodBoundPlayerPublic {
  playerId: string;
  displayName: string;
  avatarUrl?: string | null;
  seatIndex: number;
  wounds: number;                      // 0 to 4. 4 = Captured
  revealedTokens: RevealedToken[];
  hasRevealedRank: boolean;
  hasUsedAbility: boolean;
  isShielded: boolean;
  isDaggerHolder: boolean;
}

export type BloodBoundPhase =
  | "LOOK_LEFT"
  | "ATTACK_CHOICE"
  | "INTERVENTION_WINDOW"
  | "WOUND_ASSIGNMENT"
  | "ABILITY_RESOLUTION"
  | "GAME_OVER";

export interface BloodBoundView {
  gameId: string;
  roomId: string;
  version?: number;
  you: string;
  phase: BloodBoundPhase;
  roundNumber: number;
  daggerHolderPlayerId: string;
  currentTargetPlayerId: string | null;
  intervenedByPlayerId: string | null;
  forcedAttackTargetId?: string | null;
  players: BloodBoundPlayerPublic[];
  mySecretCard: { clan: BloodClan; rank: BloodBoundRoleRank; roleInfo?: BloodBoundRoleInfo } | null;
  leftNeighborClue: { clan: BloodClan; crest: string } | null;
  timeRemainingSeconds?: number;
  winnerClan: BloodClan | null;
  winnerPlayerIds?: string[];
  finalSecretCards?: Record<string, { clan: BloodClan; rank: BloodBoundRoleRank; roleInfo?: BloodBoundRoleInfo }>;
  phaseDeadline?: string | null;
  turnSeconds?: number;
  interventionSeconds?: number;
  capturedPlayerId: string | null;
  publicLog: Array<{ text: string; textVi: string; timestamp: string }>;
}

export type BloodBoundCommand =
  | { type: "ACKNOWLEDGE_LOOK_LEFT" }
  | { type: "ATTACK"; targetPlayerId: string }
  | { type: "INTERVENE" }
  | { type: "PASS_INTERVENE" }
  | { type: "REVEAL_CLUE"; tokenType: ClueTokenType }
  | { type: "USE_ABILITY"; targetPlayerId?: string; abilityTargetPlayerId?: string };

export function hydrateBloodBoundCard(
  card: { clan: BloodClan; rank: BloodBoundRoleRank; roleInfo?: BloodBoundRoleInfo } | null | undefined,
): BloodBoundCard | null {
  if (!card) return null;
  const rank = Math.min(8, Math.max(1, card.rank)) as BloodBoundRoleRank;
  return {
    clan: card.clan,
    rank,
    roleInfo: card.roleInfo ?? BLOOD_BOUND_ROLES[rank],
  };
}

export const BLOOD_BOUND_ID = "blood-bound";
