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
      "Chọn 1 người chơi còn sống. Tùy lựa chọn hiện có, bạn có thể kiểm tra Bloodline, kiểm tra một Moon Mark, thực hiện trao đổi Moon Mark, hoặc bỏ qua.",
    descriptionEn:
      "Choose a living player. Depending on the available options, you may inspect their Bloodline, inspect a Moon Mark, make a Moon Mark exchange, or skip.",
  }),
  "NOB-SH-05": shapeshifter(5, {
    tooltipVi: "Reveal Bloodline để cướp 1 Moon Mark.",
    tooltipEn: "Reveal your Bloodline to steal 1 Moon Mark.",
    descriptionVi:
      "Công khai Bloodline của bạn. Chọn một người chơi đang sở hữu nhiều Moon Mark hơn bạn và cướp 1 Moon Mark từ người đó. Giá trị Moon Mark do máy chủ chọn.",
    descriptionEn:
      "Reveal your Bloodline publicly. Choose a player who owns more Moon Marks than you and steal 1 Moon Mark from them. The stolen value is chosen by the server.",
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
    tooltipVi: "Phản ngược đòn kết liễu về người tấn công.",
    tooltipEn: "Reflect an elimination back to the attacker.",
    descriptionVi:
      "Khi bạn trở thành mục tiêu của một hiệu ứng loại hợp lệ từ Feral Killer hoặc Hunter, bạn có thể kích hoạt Veil Reversal. Hủy việc bạn bị loại và phản ngược hiệu ứng về người tấn công. Người tấn công bị loại thay bạn.",
    descriptionEn:
      "When an eligible elimination from a Feral Killer or Hunter targets you, you may activate Veil Reversal. Cancel your elimination and reflect the effect back. The attacker is eliminated instead.",
  },
  "NOB-SP-LAST-OFFERING": {
    roleType: "SPECIAL",
    number: null,
    displayName: "Glorious Sacrifice",
    displayNameVi: "Glorious Sacrifice",
    tooltipVi: "Chấp nhận bị loại để nhận 1 Moon Mark danh dự.",
    tooltipEn: "Accept elimination to gain 1 Honor Moon Mark.",
    descriptionVi:
      "Khi bạn trở thành mục tiêu của một hiệu ứng loại hợp lệ, bạn có thể kích hoạt Glorious Sacrifice. Bạn vẫn bị loại, nhưng sự hy sinh được tưởng thưởng: nhận 1 Moon Mark trước khi rời vòng chơi. Không phản đòn về người tấn công.",
    descriptionEn:
      "When an eligible elimination targets you, you may activate Glorious Sacrifice. You are still eliminated, but your sacrifice is honored: gain 1 Moon Mark before leaving the round. This does not reflect the attack.",
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
