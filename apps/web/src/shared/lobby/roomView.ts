import type { RoomDto, RoomPlayerDto } from "@/shared/api/types";
import { nobSettingsFromUnknown, type NobTiming } from "@/games/nob/model/nobTiming";
import { notInMyPotSettingsFromUnknown, type NotInMyPotSettings } from "@/games/notInMyPot/model/notInMyPotSettings";
import type { SeatState } from "@/shared/types/status";

export interface LobbySeat {
  id: string;
  name: string;
  initials: string;
  avatarUrl?: string | null;
  isYou: boolean;
  isHost: boolean;
  state: SeatState;
}

export interface RoomView {
  id: string;
  code: string;
  name: string;
  gameId: string;
  host: string;
  hostPlayerId: string;
  occupied: number;
  capacity: number;
  visibility: "public" | "private";
  status: "waiting" | "in_game" | "finished";
  players: RoomPlayerDto[];
  serverSequence: number;
  nobTiming: NobTiming | null;
  notInMyPotSettings: NotInMyPotSettings | null;
  locked: boolean;
}

export function toRoomView(room: RoomDto): RoomView {
  const host = room.players.find((player) => player.playerId === room.hostPlayerId);
  return {
    id: room.id,
    code: room.id,
    name: room.name,
    gameId: room.gameId,
    host: host?.displayName ?? room.hostPlayerId,
    hostPlayerId: room.hostPlayerId,
    occupied: room.players.length,
    capacity: room.maxPlayers,
    visibility: room.visibility === "PRIVATE" ? "private" : "public",
    status: room.status === "WAITING" ? "waiting" : room.status === "FINISHED" ? "finished" : "in_game",
    players: room.players,
    serverSequence: room.serverSequence,
    nobTiming: nobSettingsFromUnknown(room.settings),
    notInMyPotSettings: notInMyPotSettingsFromUnknown(room.settings),
    locked: roomLockedFromUnknown(room.settings),
  };
}

export function seatsForRoom(room: RoomView, youId: string | undefined): LobbySeat[] {
  const filled = room.players.map((player) => ({
    id: player.playerId,
    name: player.displayName,
    initials: initials(player.displayName),
    avatarUrl: player.avatarUrl,
    isYou: player.playerId === youId,
    isHost: player.playerId === room.hostPlayerId,
    state: player.playerId === room.hostPlayerId ? "ready" : toSeatState(player.state),
  }));
  const seats = [...filled];
  while (seats.length < room.capacity) {
    seats.push({
      id: `empty-${seats.length}`,
      name: "",
      initials: "+",
      avatarUrl: null,
      isYou: false,
      isHost: false,
      state: "empty",
    });
  }
  return seats;
}

function toSeatState(state: RoomPlayerDto["state"]): SeatState {
  if (state === "READY") {
    return "ready";
  }
  if (state === "DISCONNECTED") {
    return "disconnected";
  }
  return "waiting";
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function roomLockedFromUnknown(value: unknown): boolean {
  if (!value || typeof value !== "object") {
    return false;
  }
  const locked = (value as Record<string, unknown>).locked;
  return locked === true;
}
