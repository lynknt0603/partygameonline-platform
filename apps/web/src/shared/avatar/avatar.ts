export interface AvatarAsset {
  id: string;
  src: string;
}

/**
 * Keep the catalogue in one place so adding an avatar does not require
 * changing any of the lobby, table, or result views.
 */
export const AVATAR_ASSETS: AvatarAsset[] = [
  { id: "halfblood", src: "/assets/avatars/halfblood.png" },
  { id: "halfblood-2", src: "/assets/avatars/halfblood_2.png" },
  { id: "vampire", src: "/assets/avatars/vampire.png" },
  { id: "vampire-2", src: "/assets/avatars/vampire_2.png" },
  { id: "werewolf", src: "/assets/avatars/werewolf.png" },
  { id: "werewolf-2", src: "/assets/avatars/werewolf_2.png" },
];

const DEFAULT_AVATAR = "/assets/avatar-default.png";

/**
 * When no explicit avatar is available, assign one deterministically from the
 * player id. This keeps every player consistent across screens and reconnects.
 */
export function avatarUrlForPlayer(playerId: string | undefined | null, explicitUrl?: string | null): string {
  if (explicitUrl && explicitUrl !== DEFAULT_AVATAR) {
    return explicitUrl;
  }
  if (AVATAR_ASSETS.length === 0 || !playerId) {
    return DEFAULT_AVATAR;
  }

  let hash = 2166136261;
  for (const character of playerId) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return AVATAR_ASSETS[(hash >>> 0) % AVATAR_ASSETS.length]?.src ?? DEFAULT_AVATAR;
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
