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
    displayNameVi: `Kẻ Hóa Hình ${n}`,
    ...copy,
  };
}

const SHADOW_STALKER: Copy = {
  tooltipVi: "Bí mật xem Gia Tộc của 1 người chơi.",
  tooltipEn: "Privately inspect 1 player's Bloodline.",
  descriptionVi: "Chọn 1 người chơi còn sống khác. Bí mật xem Gia Tộc của người đó.",
  descriptionEn: "Choose another living player. Privately view that player's Bloodline.",
};

const BLOOD_SEER: Copy = {
  tooltipVi: "Xem Gia Tộc + 1 Thẻ Vai Trò ngẫu nhiên của mục tiêu.",
  tooltipEn: "Inspect a target's Bloodline + 1 random Role Card.",
  descriptionVi:
    "Chọn 1 người chơi còn sống khác. Bí mật xem Gia Tộc và 1 Thẻ Vai Trò ngẫu nhiên trong tay họ, nếu có.",
  descriptionEn:
    "Choose another living player. Privately view their Bloodline and 1 random Role Card from their hand, if available.",
};

const FERAL_KILLER: Copy = {
  tooltipVi: "Chọn và loại mục tiêu mà không biết Gia Tộc của họ.",
  tooltipEn: "Attempt to eliminate a target without knowing their Bloodline.",
  descriptionVi:
    "Chọn 1 người chơi còn sống khác và cố gắng loại người đó mà không được xem Gia Tộc trước. Mục tiêu có thể dùng Phản Đòn hoặc Hiến Tế Vinh Quang.",
  descriptionEn:
    "Choose another living player and attempt to eliminate them without inspecting their Bloodline first. The target may use Veil Reversal or Glorious Sacrifice.",
};

const HUNTER: Copy = {
  tooltipVi: "Xem Gia Tộc của mục tiêu rồi quyết định Tha hoặc Loại.",
  tooltipEn: "Inspect the target's Bloodline, then Spare or Eliminate.",
  descriptionVi:
    "Chọn 1 người chơi còn sống khác. Bí mật xem Gia Tộc của họ, sau đó chọn Tha hoặc Loại. Nếu chọn Loại, mục tiêu vẫn có thể dùng Thẻ Phản Ứng hợp lệ.",
  descriptionEn:
    "Choose another living player. Privately view their Bloodline, then choose Spare or Eliminate. If you Eliminate, the target may still use a valid Reaction.",
};

export const NOB_CARD_META: Record<string, NobCardMeta> = {
  ...numbered("SHADOW_STALKER", "Shadow Stalker", "Kẻ Theo Dõi", SHADOW_STALKER),
  ...numbered("BLOOD_SEER", "Blood Seer", "Tiên Tri", BLOOD_SEER),
  "NOB-SH-01": shapeshifter(1, {
    tooltipVi: "Hoán đổi Gia Tộc của 2 người chơi.",
    tooltipEn: "Exchange the Bloodlines of 2 players.",
    descriptionVi:
      "Chọn 2 người chơi còn sống. Bạn có thể hoán đổi Gia Tộc của họ. Nếu Gia Tộc của chính bạn bị đổi, bạn không được biết Gia Tộc mới.",
    descriptionEn:
      "Choose 2 living players. You may exchange their Bloodlines. If your own Bloodline is exchanged, you do not learn your new Bloodline.",
  }),
  "NOB-SH-02": shapeshifter(2, {
    tooltipVi: "Thu hồi một Bài Đã Dùng và giữ hoặc sử dụng nó.",
    tooltipEn: "Claim an Echo and keep or play it.",
    descriptionVi:
      "Chọn 1 Thẻ Vai Trò hợp lệ từ Khu Bài Đã Dùng. Giữ lá đó để dùng sau, hoặc sử dụng ngay nếu hiệu ứng của lá cho phép. Thẻ Phản Ứng / Thẻ Đặc Biệt không được dùng ngay trừ khi máy chủ cho phép.",
    descriptionEn:
      "Choose an eligible Role Card from the Echo pool. Keep it for later, or play it immediately if its effect allows. Reaction/Special cards cannot be played now unless the server allows it.",
  }),
  "NOB-SH-03": shapeshifter(3, {
    tooltipVi: "Xem Gia Tộc rồi quyết định có công khai hay không.",
    tooltipEn: "Inspect a Bloodline, then choose whether to reveal it.",
    descriptionVi:
      "Chọn 1 người chơi còn sống và bí mật xem Gia Tộc của họ. Sau đó chọn giữ bí mật hoặc công khai Gia Tộc đó cho mọi người.",
    descriptionEn:
      "Choose a living player and privately view their Bloodline. Then choose to keep it secret or reveal it publicly.",
  }),
  "NOB-SH-04": shapeshifter(4, {
    tooltipVi: "Thu thập thông tin hoặc đổi Xu Mặt Trăng.",
    tooltipEn: "Gather information or broker Moon Marks.",
    descriptionVi:
      "Chọn 1 người chơi còn sống. Nếu họ có Xu Mặt Trăng, chọn 1 trong tối đa 2 Xu Mặt Trăng úp để xem điểm, rồi mới quyết định đổi Xu Mặt Trăng hay không. Không có Xu Mặt Trăng thì không xem được; bạn không có Xu Mặt Trăng thì không đổi được.",
    descriptionEn:
      "Choose a living player. If they have Moon Marks, pick 1 of up to 2 facedown Moon Marks to see its value, then decide whether to swap a Moon Mark. Inspect is unavailable if they have none; swap is unavailable if you have none.",
  }),
  "NOB-SH-05": shapeshifter(5, {
    tooltipVi: "Cướp 1 Xu Mặt Trăng từ người có nhiều Xu Mặt Trăng hơn bạn.",
    tooltipEn: "Steal 1 Moon Mark from someone with more Moon Marks than you.",
    descriptionVi:
      "Chỉ chọn người đang có nhiều Xu Mặt Trăng hơn bạn. Người ít hơn hoặc bằng sẽ bị khóa. Nếu mục tiêu có từ 2 Xu Mặt Trăng trở lên, bạn chọn 1 trong toàn bộ Xu Mặt Trăng đang úp của họ (2, 3, 4... tùy số lượng). Cướp thành công mới công khai Gia Tộc của bạn. Nếu không ai nhiều Xu Mặt Trăng hơn, bạn đã là người có nhiều Xu Mặt Trăng nhất: không lộ Gia Tộc, thông báo rồi đếm 5 giây.",
    descriptionEn:
      "You may only choose a player with more Moon Marks than you. Players with fewer or equal Moon Marks are locked. If the target has 2 or more Moon Marks, pick 1 from all of their facedown Moon Marks (2, 3, 4... depending on the count). Your Bloodline is revealed only after a successful steal. If nobody has more Moon Marks than you, you already have the most: no Bloodline reveal, a notice, then a 5-second wait.",
  }),
  "NOB-SH-06": shapeshifter(6, {
    tooltipVi: "Công khai Gia Tộc và loại 1 người. Không thể phản ứng.",
    tooltipEn: "Reveal your Bloodline and eliminate 1 player. No reaction.",
    descriptionVi:
      "Công khai Gia Tộc của bạn, sau đó chọn 1 người chơi còn sống để loại ngay lập tức. Mục tiêu không thể sử dụng Thẻ Phản Ứng để ngăn hiệu ứng này.",
    descriptionEn:
      "Reveal your Bloodline, then choose 1 living player to eliminate immediately. The target cannot use a Reaction Card against this effect.",
  }),
  ...numbered("FERAL_KILLER", "Feral Killer", "Sát Thủ Hoang Dã", FERAL_KILLER),
  ...numbered("HUNTER", "Hunter", "Thợ Săn", HUNTER),
  "NOB-SP-VEIL-REVERSAL": {
    roleType: "SPECIAL",
    number: null,
    displayName: "Veil Reversal",
    displayNameVi: "Phản Đòn",
    tooltipVi: "Tự kích hoạt: phản ngược đòn kết liễu về người tấn công.",
    tooltipEn: "Auto-activates: reflect an elimination back to the attacker.",
    descriptionVi:
      "Khi bạn trở thành mục tiêu loại hợp lệ từ Sát Thủ Hoang Dã hoặc Thợ Săn, Phản Đòn tự động kích hoạt. Lá được lật giữa bàn và trên bàn cá nhân. Hủy việc bạn bị loại, phản ngược đòn, người tấn công bị loại thay bạn. Nếu bạn cũng có Hiến Tế Vinh Quang, Phản Đòn luôn kích hoạt trước.",
    descriptionEn:
      "When an eligible elimination from a Feral Killer or Hunter targets you, Veil Reversal auto-activates. The card is revealed in the center and on your personal board. Cancel your elimination and reflect the effect: the attacker is eliminated instead. If you also hold Glorious Sacrifice, Veil Reversal always activates first.",
  },
  "NOB-SP-LAST-OFFERING": {
    roleType: "SPECIAL",
    number: null,
    displayName: "Glorious Sacrifice",
    displayNameVi: "Hiến Tế Vinh Quang",
    tooltipVi: "Tự kích hoạt khi bị loại. Phe thắng thì mở 2/3 Xu Mặt Trăng.",
    tooltipEn: "Auto-activates on elimination. Open 2 of 3 Moon Marks if your side wins.",
    descriptionVi:
      "Khi bị loại hợp lệ từ Sát Thủ Hoang Dã hoặc Thợ Săn, Hiến Tế Vinh Quang tự động kích hoạt. Lá được lật giữa bàn và trên bàn cá nhân. Bạn vẫn chết và nhận 1 Xu Mặt Trăng danh dự; cuối vòng vẫn được bốc Xu Mặt Trăng. Nếu phe bạn thắng, bạn mở 2 trong 3 thẻ Xu Mặt Trăng. Nếu cũng có Phản Đòn, Phản Đòn kích hoạt trước.",
    descriptionEn:
      "When an eligible elimination from a Feral Killer or Hunter targets you, Glorious Sacrifice auto-activates. The card is revealed in the center and on your personal board. You still die and gain 1 honor Moon Mark, then still pick Moon Marks at round end. If your faction wins, you open 2 of 3 Moon Mark cards. If you also hold Veil Reversal, Veil Reversal activates first.",
  },
  "NOB-SP-LAST-HOPE": {
    roleType: "SPECIAL",
    number: null,
    displayName: "Last Hope",
    displayNameVi: "Hy Vọng Cuối Cùng",
    tooltipVi: "Còn sống đến Công Khai Thân Phận Kết Thúc Ván → Gia Tộc của bạn thắng vòng.",
    tooltipEn: "Survive until Final Reveal → your Bloodline wins the round.",
    descriptionVi:
      "Nếu bạn vẫn còn sống khi Gia Tộc được công khai cuối vòng, Hy Vọng Cuối Cùng tự động được kích hoạt và công khai. Gia Tộc của bạn lập tức trở thành phe thắng của vòng đó, thay thế kết quả thắng thông thường. Điều này không thắng cả ván ngay; sau đó vẫn trao Xu Mặt Trăng và kiểm tra tổng điểm.",
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
