export const THEMATIC_ROOM_NAMES: Record<string, { vi: string[]; en: string[] }> = {
  "blood-bound": {
    vi: [
      "Lâu Đài Hoa Hồng",
      "Mật Lệnh Quạt Xanh",
      "Đêm Săn Ma Cà Rồng",
      "Hội Kín Huyết Tộc",
      "Thánh Điện Hoàng Gia",
      "Dạ Tiệc Bóng Tối",
      "Huyết Nguyệt Trùng Phùng",
      "Trận Chiến Quyền Lực",
      "Phán Quyết Bí Ẩn",
      "Vũ Điệu Huyết Tộc",
      "Phòng Thí Nghiệm Giả Kim",
      "Lãnh Địa Quạt Xanh",
    ],
    en: [
      "Rose Castle",
      "Emerald Fan Sanctum",
      "Vampire Masquerade",
      "Gothic Bloodlines",
      "Royal High Council",
      "Midnight Gathering",
      "Crimson Moon Clan",
      "Shadow Conclave",
      "Secret Inquisitor Hall",
      "Night of the Vow",
    ],
  },
  "not-in-my-pot": {
    vi: [
      "Nồi Lẩu Nghi Vấn",
      "Bếp Trưởng Ma Quái",
      "Bữa Tiệc Chay Bí Mật",
      "Đầu Bếp Giấu Nghề",
      "Gia Vị Nguy Hiểm",
      "Nồi Súp Hoàng Hôn",
      "Thử Thách Ăn Chay",
    ],
    en: [
      "Suspicious Pot",
      "Haunted Kitchen",
      "Secret Veggie Feast",
      "Sneaky Chef Table",
      "Mystery Boiling Stew",
      "Twilight Cauldron",
    ],
  },
  "wheres-the-bone": {
    vi: [
      "Vườn Chó Đêm Trăng",
      "Vụ Án Trộm Xương",
      "Thám Tử Cún Con",
      "Dấu Chân Trong Đêm",
      "Bí Ẩn Sân Sau",
      "Đêm Trăng Khám Phá",
    ],
    en: [
      "Moonlit Dog Yard",
      "The Stolen Bone Mystery",
      "Puppy Detective",
      "Tracks in the Night",
      "Backyard Sleuths",
    ],
  },
  "liars-number": {
    vi: [
      "Bàn Cờ Thật Giả",
      "Thánh Bốc Phét",
      "Đấu Trí Con Số",
      "Sàn Đấu Tâm Lý",
      "Nói Dối Đỉnh Cao",
      "Con Số Bí Mật",
    ],
    en: [
      "Truth or Bluff",
      "Master of Deception",
      "Number Mind Games",
      "Poker Face Arena",
      "The Golden Bluff",
    ],
  },
  "night-of-bloodlines": {
    vi: [
      "Đêm Huyết Thống",
      "Thợ Săn Trong Đêm",
      "Tiếng Gọi Gia Tộc",
    ],
    en: [
      "Night of Bloodlines",
      "Shadow Hunters",
      "Call of the Clan",
    ],
  },
  default: {
    vi: [
      "Bàn Chiến Thần Tốc",
      "Hội Bạn Chiến Game",
      "Giao Lưu Vui Vẻ",
      "Phòng Quẩy Đêm Nay",
      "Hội Quán Bàn Cờ",
      "Đấu Trường Bạn Bè",
    ],
    en: [
      "Party Arena",
      "Friendly Showdown",
      "Game Night Hangout",
      "Victory Table",
      "The Grand Board",
    ],
  },
};

/**
 * Sinh tên phòng ngẫu nhiên sinh động kèm mã số 3 chữ số
 */
export function generateRandomRoomName(gameId?: string, locale: "vi" | "en" = "vi"): string {
  const catalog = (gameId && THEMATIC_ROOM_NAMES[gameId]) ? THEMATIC_ROOM_NAMES[gameId] : THEMATIC_ROOM_NAMES.default;
  const list = catalog[locale] ?? catalog.vi;
  const baseName = list[Math.floor(Math.random() * list.length)];
  const randomSuffix = Math.floor(100 + Math.random() * 900); // 100 - 999
  return `${baseName} #${randomSuffix}`;
}
