import type { NobPlayerPublic } from "./nobTypes";

type EloSnapshot = Pick<NobPlayerPublic, "elo" | "eloDelta" | "newElo">;

export function formatCurrentElo(snapshot: EloSnapshot): string | null {
  if (typeof snapshot.eloDelta !== "number") {
    return null;
  }

  const currentElo =
    typeof snapshot.newElo === "number"
      ? snapshot.newElo
      : typeof snapshot.elo === "number"
        ? snapshot.elo
        : null;

  if (currentElo == null) {
    return null;
  }

  const signedDelta =
    snapshot.eloDelta > 0
      ? `+${snapshot.eloDelta}`
      : snapshot.eloDelta < 0
        ? String(snapshot.eloDelta)
        : "±0";
  return `${currentElo} (${signedDelta})`;
}
