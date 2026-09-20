interface NobSeatTargetStateInput {
  pendingType?: string | null;
  allowedTargetIds: string[];
  playerId: string;
  alive: boolean;
  frozen: boolean;
  actorId?: string | null;
  hideActor: boolean;
}

export interface NobSeatTargetState {
  targetable: boolean;
  blocked: boolean;
  actorHighlighted: boolean;
}

export function nobSeatTargetState({
  pendingType,
  allowedTargetIds,
  playerId,
  alive,
  frozen,
  actorId,
  hideActor,
}: NobSeatTargetStateInput): NobSeatTargetState {
  const choosingTarget = pendingType === "CHOOSE_TARGET";
  const targetable = choosingTarget && allowedTargetIds.includes(playerId) && !frozen;

  return {
    targetable,
    blocked: choosingTarget && alive && !targetable,
    actorHighlighted: !choosingTarget && !hideActor && actorId === playerId,
  };
}
