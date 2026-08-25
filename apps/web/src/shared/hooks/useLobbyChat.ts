import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { realtime } from "@/shared/api/ws";
import type { RoomDto, WsEnvelope } from "@/shared/api/types";
import { useT } from "@/shared/i18n/useT";

export interface LobbyChatLine {
  id: string;
  kind: "user" | "system";
  playerId?: string;
  displayName?: string;
  text: string;
  at: number;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function playerName(payload: Record<string, unknown>, playerId: string | undefined): string {
  if (!playerId) {
    return "";
  }
  const room = payload.room as RoomDto | undefined;
  const match = room?.players.find((player) => player.playerId === playerId);
  if (match?.displayName) {
    return match.displayName;
  }
  const message = asRecord(payload.message);
  if (typeof message?.displayName === "string" && message.displayName.trim()) {
    return message.displayName;
  }
  return playerId;
}

function parseUserLine(value: unknown): LobbyChatLine | null {
  const record = asRecord(value);
  if (!record) {
    return null;
  }
  const text = typeof record.text === "string" ? record.text.trim() : "";
  if (!text) {
    return null;
  }
  const atRaw = record.sentAt;
  const at = typeof atRaw === "string" ? Date.parse(atRaw) : typeof atRaw === "number" ? atRaw : Date.now();
  return {
    id: typeof record.messageId === "string" ? record.messageId : `chat-${at}-${text}`,
    kind: "user",
    playerId: typeof record.playerId === "string" ? record.playerId : undefined,
    displayName: typeof record.displayName === "string" ? record.displayName : undefined,
    text: text.slice(0, 240),
    at: Number.isFinite(at) ? at : Date.now(),
  };
}

export function useLobbyChat(roomId: string | undefined, youId: string | undefined) {
  const t = useT();
  const [lines, setLines] = useState<LobbyChatLine[]>([]);
  const [unread, setUnread] = useState(0);
  const openRef = useRef(false);

  const setOpen = useCallback((open: boolean) => {
    openRef.current = open;
    if (open) {
      setUnread(0);
    }
  }, []);

  useEffect(() => {
    setLines([]);
    setUnread(0);
  }, [roomId]);

  useEffect(() => {
    if (!roomId) {
      return;
    }
    const normalized = roomId.toUpperCase();
    const push = (line: LobbyChatLine) => {
      setLines((current) => {
        if (current.some((item) => item.id === line.id)) {
          return current;
        }
        return [...current, line].slice(-80);
      });
      if (!openRef.current && line.playerId !== youId) {
        setUnread((count) => count + 1);
      }
    };
    return realtime.subscribe((message: WsEnvelope) => {
      if (message.roomId && message.roomId.toUpperCase() !== normalized) {
        return;
      }
      const payload = message.payload ?? {};
      if (message.type === "ROOM_SNAPSHOT" && Array.isArray(payload.chat)) {
        const restored = payload.chat
          .map((item) => parseUserLine(item))
          .filter((item): item is LobbyChatLine => item !== null);
        setLines((current) => {
          const system = current.filter((line) => line.kind === "system");
          const merged = [...system, ...restored].sort((left, right) => left.at - right.at);
          const seen = new Set<string>();
          return merged.filter((line) => {
            if (seen.has(line.id)) {
              return false;
            }
            seen.add(line.id);
            return true;
          });
        });
        return;
      }
      if (message.type === "ROOM_CHAT") {
        const line = parseUserLine(payload.message ?? payload);
        if (line) {
          push(line);
        }
        return;
      }
      const playerId = typeof payload.playerId === "string" ? payload.playerId : undefined;
      const name = playerName(payload, playerId) || t("anonymousPlayer");
      if (message.type === "PLAYER_JOINED" && playerId && playerId !== youId) {
        push({
          id: `sys-join-${playerId}-${message.serverSequence ?? Date.now()}`,
          kind: "system",
          playerId,
          displayName: name,
          text: t("chatJoined").replace("{name}", name),
          at: Date.now(),
        });
      }
      if (message.type === "PLAYER_LEFT" && playerId) {
        push({
          id: `sys-left-${playerId}-${message.serverSequence ?? Date.now()}`,
          kind: "system",
          playerId,
          displayName: name,
          text: t("chatLeft").replace("{name}", name),
          at: Date.now(),
        });
      }
      if (message.type === "PLAYER_READY_CHANGED" && playerId) {
        const ready = payload.ready === true;
        push({
          id: `sys-ready-${playerId}-${ready}-${message.serverSequence ?? Date.now()}`,
          kind: "system",
          playerId,
          displayName: name,
          text: (ready ? t("chatReady") : t("chatUnready")).replace("{name}", name),
          at: Date.now(),
        });
      }
    });
  }, [roomId, youId, t]);

  const send = useCallback(
    (text: string) => {
      if (!roomId) {
        return;
      }
      const trimmed = text.trim().slice(0, 240);
      if (!trimmed) {
        return;
      }
      realtime.send("ROOM_CHAT", roomId, { text: trimmed });
    },
    [roomId],
  );

  const sorted = useMemo(
    () => [...lines].sort((left, right) => left.at - right.at || left.id.localeCompare(right.id)),
    [lines],
  );

  return { lines: sorted, unread, send, setOpen };
}
