export interface AvatarAsset {
  key: string;
  src: string;
  free: boolean;
  achievementCode?: string;
}

/**
 * Keep the catalogue in one place so adding an avatar does not require
 * changing any of the lobby, table, or result views.
 */
export const AVATAR_ASSETS: AvatarAsset[] = [
  { key: "default.png", src: "/assets/avatars/default.png", free: true },
  { key: "09_happy_dog.png", src: "/assets/avatars/09_happy_dog.png", free: true },
  { key: "10_black_cat.png", src: "/assets/avatars/10_black_cat.png", free: true },
  { key: "11_calm_panda.png", src: "/assets/avatars/11_calm_panda.png", free: true },
  { key: "15_rabbit.png", src: "/assets/avatars/15_rabbit.png", free: true },
  { key: "16_frog.png", src: "/assets/avatars/16_frog.png", free: true },
  { key: "23_pot.png", src: "/assets/avatars/23_pot.png", free: false, achievementCode: "NIMP_POT_REVEALED" },
  { key: "20_tofu.png", src: "/assets/avatars/20_tofu.png", free: false, achievementCode: "NIMP_TOFU_PLAYED" },
  { key: "21_meat.png", src: "/assets/avatars/21_meat.png", free: false, achievementCode: "NIMP_MEAT_PLAYED" },
  { key: "17_broccoli.png", src: "/assets/avatars/17_broccoli.png", free: false, achievementCode: "NIMP_VEGETABLE_PLAYED" },
  { key: "01_chef_girl.png", src: "/assets/avatars/01_chef_girl.png", free: false, achievementCode: "NIMP_VEGETARIAN_WINS" },
  { key: "03_smirking_guy.png", src: "/assets/avatars/03_smirking_guy.png", free: false, achievementCode: "NIMP_MEAT_EATER_WINS" },
  { key: "halfblood_2.png", src: "/assets/avatars/halfblood_2.png", free: false, achievementCode: "NOB_HALFBLOOD_PLAYED" },
  { key: "vampire_2.png", src: "/assets/avatars/vampire_2.png", free: false, achievementCode: "NOB_VAMPIRE_PLAYED" },
  { key: "werewolf_2.png", src: "/assets/avatars/werewolf_2.png", free: false, achievementCode: "NOB_WEREWOLF_PLAYED" },
  { key: "halfblood.png", src: "/assets/avatars/halfblood.png", free: false, achievementCode: "NOB_HALFBLOOD_WINS" },
  { key: "vampire.png", src: "/assets/avatars/vampire.png", free: false, achievementCode: "NOB_VAMPIRE_WINS" },
  { key: "werewolf.png", src: "/assets/avatars/werewolf.png", free: false, achievementCode: "NOB_WEREWOLF_WINS" },
  { key: "top1.png", src: "/assets/avatars/top1.png", free: false, achievementCode: "RANKING_TOP_ONE" },
  { key: "master.png", src: "/assets/avatars/master.png", free: false, achievementCode: "ACHIEVEMENT_MASTER" },
  { key: "master_girl.png", src: "/assets/avatars/master_girl.png", free: false, achievementCode: "ACHIEVEMENT_MASTER" },
];

export const DEFAULT_AVATAR = "/assets/avatars/default.png";

/** Use the server-selected avatar and keep a stable default for new/guest users. */
export function avatarUrlForPlayer(_playerId: string | undefined | null, explicitUrl?: string | null): string {
  return explicitUrl?.trim() || DEFAULT_AVATAR;
}

export function initialsForAvatar(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";
}
