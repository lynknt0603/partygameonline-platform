import { api } from "@/shared/api/http";
import { realtime } from "@/shared/api/ws";
import type { RoomDto } from "@/shared/api/types";
import { parseWheresTheBoneView, type WheresTheBoneView } from "../model/wheresTheBoneTypes";
export type WheresTheBoneCommand = { type: "SELECT_WAKE_TIME" | "TAKE_BONE" | "PEEK_WAKE_TIME" | "WAIT" | "SELECT_PACKMATE" | "REQUEST_SKIP_DISCUSSION" | "RESPOND_SKIP_DISCUSSION" | "VOTE"; targetPlayerId?: string; targetPlayerIds?: string[]; hour?: number; agree?: boolean };
export function startWheresTheBoneGame(roomId:string):Promise<RoomDto>{return api<RoomDto>(`/api/v1/games/wheres-the-bone/rooms/${roomId.toUpperCase()}/start`,{method:"POST"});}
export async function fetchWheresTheBoneSnapshot(roomId:string):Promise<WheresTheBoneView|null>{return parseWheresTheBoneView(await api<unknown>(`/api/v1/games/wheres-the-bone/rooms/${roomId.toUpperCase()}/snapshot`));}
export function sendWheresTheBoneCommand(roomId:string, command:WheresTheBoneCommand, expectedVersion?:number):string { const commandId=crypto.randomUUID(); return realtime.send("GAME_ACTION",roomId,{commandId,...(expectedVersion===undefined?{}:{expectedVersion}),...command}); }
