export type NobRoleType =
  | "SHADOW_STALKER"
  | "BLOOD_SEER"
  | "SHAPESHIFTER"
  | "FERAL_KILLER"
  | "HUNTER"
  | "SPECIAL";

export interface NobCardMeta {
  roleType: NobRoleType;
  number: number | null;
  displayName: string;
  displayNameVi: string;
  tooltipVi: string;
  tooltipEn: string;
  descriptionVi: string;
  descriptionEn: string;
}

export interface NobCardText {
  name: string;
  tooltip: string;
  description: string;
}

interface Copy {
  tooltipVi: string;
  tooltipEn: string;
  descriptionVi: string;
  descriptionEn: string;
}

const PREFIX: Record<Exclude<NobRoleType, "SPECIAL">, string> = {
  SHADOW_STALKER: "NOB-SS",
  BLOOD_SEER: "NOB-BS",
  SHAPESHIFTER: "NOB-SH",
  FERAL_KILLER: "NOB-FK",
  HUNTER: "NOB-HU",
};

function numbered(
  roleType: Exclude<NobRoleType, "SPECIAL">,
  nameEn: string,
  nameVi: string,
  copy: Copy,
  count = 6,
): Record<string, NobCardMeta> {
  const out: Record<string, NobCardMeta> = {};
  for (let n = 1; n <= count; n += 1) {
    out[`${PREFIX[roleType]}-${String(n).padStart(2, "0")}`] = {
      roleType,
      number: n,
      displayName: `${nameEn} ${n}`,
      displayNameVi: `${nameVi} ${n}`,
      ...copy,
    };
  }
  return out;
}

function shapeshifter(n: number, copy: Copy): NobCardMeta {
  return {
    roleType: "SHAPESHIFTER",
    number: n,
    displayName: `Shapeshifter ${n}`,
    displayNameVi: `Shapeshifter ${n}`,
    ...copy,
  };
}

const SHADOW_STALKER: Copy = {
  tooltipVi: "Bí mật xem Bloodline của 1 người chơi.",
  tooltipEn: "Privately inspect 1 player's Bloodline.",
  descriptionVi: "Chọn 1 người chơi còn sống khác. Bí mật xem Bloodline của người đó.",
  descriptionEn: "Choose another living player. Privately view that player's Bloodline.",
};

const BLOOD_SEER: Copy = {
  tooltipVi: "Xem Bloodline + 1 Role Card ngẫu nhiên của mục tiêu.",
  tooltipEn: "Inspect a target's Bloodline + 1 random Role Card.",
  descriptionVi:
    "Chọn 1 người chơi còn sống khác. Bí mật xem Bloodline và 1 Role Card ngẫu nhiên trong tay họ, nếu có.",
  descriptionEn:
    "Choose another living player. Privately view their Bloodline and 1 random Role Card from their hand, if available.",
};

const FERAL_KILLER: Copy = {
  tooltipVi: "Chọn và loại mục tiêu mà không biết Bloodline của họ.",
  tooltipEn: "Attempt to eliminate a target without knowing their Bloodline.",
  descriptionVi:
    "Chọn 1 người chơi còn sống khác và cố gắng loại người đó mà không được xem Bloodline trước. Mục tiêu có thể dùng Veil Reversal hoặc Glorious Sacrifice.",
  descriptionEn:
    "Choose another living player and attempt to eliminate them without inspecting their Bloodline first. The target may use Veil Reversal or Glorious Sacrifice.",
};

const HUNTER: Copy = {
  tooltipVi: "Xem Bloodline của mục tiêu rồi quyết định Tha hoặc Loại.",
  tooltipEn: "Inspect the target's Bloodline, then Spare or Eliminate.",
  descriptionVi:
    "Chọn 1 người chơi còn sống khác. Bí mật xem Bloodline của họ, sau đó chọn Tha hoặc Loại. Nếu chọn Loại, mục tiêu vẫn có thể dùng Reaction hợp lệ.",
  descriptionEn:
    "Choose another living player. Privately view their Bloodline, then choose Spare or Eliminate. If you Eliminate, the target may still use a valid Reaction.",
};

export const NOB_CARD_META: Record<string, NobCardMeta> = {
  ...numbered("SHADOW_STALKER", "Shadow Stalker", "Shadow Stalker", SHADOW_STALKER),
  ...numbered("BLOOD_SEER", "Blood Seer", "Blood Seer", BLOOD_SEER),
  "NOB-SH-01": shapeshifter(1, {
    tooltipVi: "Hoán đổi Bloodline của 2 người chơi.",
    tooltipEn: "Exchange the Bloodlines of 2 players.",
    descriptionVi:
      "Chọn 2 người chơi còn sống. Bạn có thể hoán đổi Bloodline của họ. Nếu Bloodline của chính bạn bị đổi, bạn không được biết Bloodline mới.",
    descriptionEn:
      "Choose 2 living players. You may exchange their Bloodlines. If your own Bloodline is exchanged, you do not learn your new Bloodline.",
  }),
  "NOB-SH-02": shapeshifter(2, {
    tooltipVi: "Thu hồi một Echo và giữ hoặc sử dụng nó.",
    tooltipEn: "Claim an Echo and keep or play it.",
    descriptionVi:
      "Chọn 1 Role Card hợp lệ từ những lá đã trở thành Echo. Giữ lá đó để dùng sau, hoặc sử dụng ngay nếu hiệu ứng của lá cho phép. Reaction/Special không được dùng ngay trừ khi server cho phép.",
    descriptionEn:
      "Choose an eligible Role Card from the Echo pool. Keep it for later, or play it immediately if its effect allows. Reaction/Special cards cannot be played now unless the server allows it.",
  }),
  "NOB-SH-03": shapeshifter(3, {
    tooltipVi: "Xem Bloodline rồi quyết định có công khai hay không.",
    tooltipEn: "Inspect a Bloodline, then choose whether to reveal it.",
    descriptionVi:
      "Chọn 1 người chơi còn sống và bí mật xem Bloodline của họ. Sau đó chọn giữ bí mật hoặc công khai Bloodline đó cho mọi người.",
    descriptionEn:
      "Choose a living player and privately view their Bloodline. Then choose to keep it secret or reveal it publicly.",
  }),
  "NOB-SH-04": shapeshifter(4, {
    tooltipVi: "Thu thập thông tin hoặc thương lượng Moon Marks.",
    tooltipEn: "Gather information or broker Moon Marks.",
    descriptionVi:
      "Chọn 1 người chơi còn sống. Nếu họ có Moon Mark, chọn 1 trong tối đa 2 token úp để xem điểm, rồi mới quyết định đổi token hay không. Không có token thì không xem được; bạn không có token thì không đổi được.",
    descriptionEn:
      "Choose a living player. If they have Moon Marks, pick 1 of up to 2 facedown tokens to see its value, then decide whether to swap. Inspect is unavailable if they have none; swap is unavailable if you have none.",
  }),
  "NOB-SH-05": shapeshifter(5, {
    tooltipVi: "Cướp 1 Moon Mark từ người có nhiều token hơn bạn.",
    tooltipEn: "Steal 1 Moon Mark from someone with more tokens than you.",
    descriptionVi:
      "Chỉ chọn người đang có nhiều Moon Mark hơn bạn. Người ít hơn hoặc bằng sẽ bị khóa. Nếu mục tiêu có từ 2 token trở lên, bạn chọn 1 trong 2 token thật của họ. Cướp thành công mới công khai Bloodline của bạn. Nếu không ai nhiều token hơn, bạn đã là người giàu nhất: không lộ Bloodline, thông báo rồi đếm 5 giây.",
    descriptionEn:
      "You may only choose a player with more Moon Marks than you. Players with fewer or equal tokens are locked. If the target has 2 or more tokens, pick 1 of 2 of their actual tokens. Your Bloodline is revealed only after a successful steal. If nobody has more tokens than you, you already have the most: no Bloodline reveal, a notice, then a 5-second wait.",
  }),
  "NOB-SH-06": shapeshifter(6, {
    tooltipVi: "Reveal Bloodline và loại 1 người. Không thể phản ứng.",
    tooltipEn: "Reveal your Bloodline and eliminate 1 player. No reaction.",
    descriptionVi:
      "Công khai Bloodline của bạn, sau đó chọn 1 người chơi còn sống để loại ngay lập tức. Mục tiêu không thể sử dụng Reaction Card để ngăn hiệu ứng này.",
    descriptionEn:
      "Reveal your Bloodline, then choose 1 living player to eliminate immediately. The target cannot use a Reaction Card against this effect.",
  }),
  ...numbered("FERAL_KILLER", "Feral Killer", "Feral Killer", FERAL_KILLER),
  ...numbered("HUNTER", "Hunter", "Hunter", HUNTER),
  "NOB-SP-VEIL-REVERSAL": {
    roleType: "SPECIAL",
    number: null,
    displayName: "Veil Reversal",
    displayNameVi: "Veil Reversal",
    tooltipVi: "Tự kích hoạt: phản ngược đòn kết liễu về người tấn công.",
    tooltipEn: "Auto-activates: reflect an elimination back to the attacker.",
    descriptionVi:
      "Khi bạn trở thành mục tiêu loại hợp lệ từ Feral Killer hoặc Hunter, Veil Reversal tự động kích hoạt. Lá được lật giữa bàn và trên bàn cá nhân. Hủy việc bạn bị loại, phản ngược đòn, người tấn công bị loại thay bạn. Nếu bạn cũng có Glorious Sacrifice, Veil Reversal luôn kích hoạt trước.",
    descriptionEn:
      "When an eligible elimination from a Feral Killer or Hunter targets you, Veil Reversal auto-activates. The card is revealed in the center and on your personal board. Cancel your elimination and reflect the effect: the attacker is eliminated instead. If you also hold Glorious Sacrifice, Veil Reversal always activates first.",
  },
  "NOB-SP-LAST-OFFERING": {
    roleType: "SPECIAL",
    number: null,
    displayName: "Glorious Sacrifice",
    displayNameVi: "Glorious Sacrifice",
    tooltipVi: "Tự kích hoạt khi bị loại. Phe thắng thì mở 2/3 token.",
    tooltipEn: "Auto-activates on elimination. Open 2 of 3 tokens if your side wins.",
    descriptionVi:
      "Khi bị loại hợp lệ từ Feral Killer hoặc Hunter, Glorious Sacrifice tự động kích hoạt. Lá được lật giữa bàn và trên bàn cá nhân. Bạn vẫn chết và nhận 1 Moon Mark danh dự; cuối vòng vẫn được bốc token. Nếu phe bạn thắng, bạn mở 2 trong 3 thẻ Moon Mark. Nếu cũng có Veil Reversal, phản đòn kích hoạt trước.",
    descriptionEn:
      "When an eligible elimination from a Feral Killer or Hunter targets you, Glorious Sacrifice auto-activates. The card is revealed in the center and on your personal board. You still die and gain 1 honor Moon Mark, then still pick tokens at round end. If your faction wins, you open 2 of 3 Moon Mark cards. If you also hold Veil Reversal, Veil Reversal activates first.",
  },
  "NOB-SP-LAST-HOPE": {
    roleType: "SPECIAL",
    number: null,
    displayName: "Last Hope",
    displayNameVi: "Last Hope",
    tooltipVi: "Còn sống đến Final Reveal → Bloodline của bạn thắng vòng.",
    tooltipEn: "Survive until Final Reveal → your Bloodline wins the round.",
    descriptionVi:
      "Nếu bạn vẫn còn sống khi Bloodlines được công khai cuối vòng, Last Hope tự động được kích hoạt và công khai. Bloodline của bạn lập tức trở thành phe thắng của vòng đó, thay thế kết quả thắng thông thường. Điều này không thắng cả ván ngay; sau đó vẫn trao Moon Mark và kiểm tra tổng điểm.",
    descriptionEn:
      "If you are still alive when Bloodlines are revealed at the end of the round, Last Hope automatically activates and is revealed. Your Bloodline immediately becomes the winning Bloodline for that round, overriding the normal round result. This does not automatically win the entire game. Moon Marks are still awarded, and the total-score victory condition is checked afterward.",
  },
};

export function describeNobCard(cardCode: string, locale: "vi" | "en"): NobCardText | null {
  const meta = NOB_CARD_META[cardCode];
  if (!meta) {
    return null;
  }
  const vi = locale === "vi";
  return {
    name: vi ? meta.displayNameVi : meta.displayName,
    tooltip: vi ? meta.tooltipVi : meta.tooltipEn,
    description: vi ? meta.descriptionVi : meta.descriptionEn,
  };
}
