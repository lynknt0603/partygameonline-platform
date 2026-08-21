import { realtime } from "@/shared/api/ws";

export const NOB_DRAFT_PHASES = new Set(["DRAFT_PICK_1", "DRAFT_PICK_2"]);
export const NOB_NIGHT_PHASES = new Set([
  "SHADOW_STALKER",
  "BLOOD_SEER",
  "SHAPESHIFTER",
  "FERAL_KILLER",
  "HUNTER",
]);

export const NOB_REACTION_OPTIONS: Record<string, string> = {
  "NOB-SP-VEIL-REVERSAL": "VEIL_REVERSAL",
  "NOB-SP-LAST-OFFERING": "LAST_OFFERING",
};

export function sendNobAction(roomId: string, payload: Record<string, unknown>): string {
  const commandId = crypto.randomUUID();
  return realtime.send("GAME_ACTION", roomId, { commandId, ...payload });
}
