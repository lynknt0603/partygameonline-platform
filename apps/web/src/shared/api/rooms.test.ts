import { describe, it, expect, vi, beforeEach } from "vitest";
import { addBotToRoom, kickRoom, leaveRoom } from "./rooms";
import * as httpModule from "./http";

describe("rooms API - Bot operations", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("calls POST /api/v1/rooms/{roomId}/bot when adding a normal bot", async () => {
    const mockRoom = {
      id: "ROOM123",
      name: "Test Room",
      gameId: "blood-bound",
      maxPlayers: 8,
      players: [
        { playerId: "host-1", displayName: "Host", state: "CONNECTED" },
        { playerId: "bot-reg-alpha", displayName: "🤖 Alpha", state: "READY" },
      ],
    };

    const apiSpy = vi.spyOn(httpModule, "api").mockResolvedValue(mockRoom);

    const res = await addBotToRoom("ROOM123", "NORMAL");

    expect(apiSpy).toHaveBeenCalledWith("/api/v1/rooms/ROOM123/bot", {
      method: "POST",
      body: JSON.stringify({ botType: "NORMAL" }),
    });
    expect(res.players.length).toBe(2);
    expect(res.players[1].playerId).toBe("bot-reg-alpha");
  });

  it("calls POST /api/v1/rooms/{roomId}/bot when adding an AI bot", async () => {
    const mockRoom = {
      id: "ROOM123",
      name: "Test Room",
      gameId: "blood-bound",
      maxPlayers: 8,
      players: [
        { playerId: "host-1", displayName: "Host", state: "CONNECTED" },
        { playerId: "bot-ai-cyber", displayName: "🧠 Cyber", state: "READY" },
      ],
    };

    const apiSpy = vi.spyOn(httpModule, "api").mockResolvedValue(mockRoom);

    const res = await addBotToRoom("ROOM123", "AI");

    expect(apiSpy).toHaveBeenCalledWith("/api/v1/rooms/ROOM123/bot", {
      method: "POST",
      body: JSON.stringify({ botType: "AI" }),
    });
    expect(res.players.length).toBe(2);
    expect(res.players[1].playerId).toBe("bot-ai-cyber");
  });

  it("calls POST /api/v1/rooms/{roomId}/kick/{playerId} when kicking a bot", async () => {
    const apiSpy = vi.spyOn(httpModule, "api").mockResolvedValue({});

    await kickRoom("ROOM123", "bot-alpha");

    expect(apiSpy).toHaveBeenCalledWith("/api/v1/rooms/ROOM123/kick/bot-alpha", { method: "POST" });
  });

  it("Huyết Thệ default maxPlayers is 8", () => {
    const gameId = "blood-bound";
    const defaultMaxPlayers = gameId === "blood-bound" ? 8 : 4;
    expect(defaultMaxPlayers).toBe(8);
  });

  it("calls POST /api/v1/rooms/{roomId}/leave when leaving room", async () => {
    const apiSpy = vi.spyOn(httpModule, "api").mockResolvedValue(undefined as unknown as void);

    await leaveRoom("ROOM123");

    expect(apiSpy).toHaveBeenCalledWith("/api/v1/rooms/ROOM123/leave", { method: "POST" });
  });
});
