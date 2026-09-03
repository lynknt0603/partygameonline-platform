import type { WsEnvelope } from "./types";
import { readAccessToken } from "./tokenStorage";

export type WsListener = (message: WsEnvelope) => void;
export type RealtimeStatus = "idle" | "connecting" | "open" | "reconnecting";
export type StatusListener = (status: RealtimeStatus) => void;

const BACKOFF_MS = [400, 800, 1600, 3200, 5000];

export class RealtimeSocket {
  private socket: WebSocket | null = null;
  private readonly listeners = new Set<WsListener>();
  private readonly statusListeners = new Set<StatusListener>();
  private readonly pending: string[] = [];
  private lastSequence = 0;
  private reconnectTimer: number | null = null;
  private closedByUs = false;
  private attempts = 0;
  private status: RealtimeStatus = "idle";
  private windowHooked = false;

  connect(): void {
    this.closedByUs = false;
    this.hookWindow();
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    this.setStatus(this.attempts > 0 || this.status === "reconnecting" ? "reconnecting" : "connecting");
    const wsBase = (import.meta.env.VITE_WS_URL || "").trim().replace(/\/+$/, "");
    let wsUrl: string;
    if (wsBase) {
      wsUrl = wsBase.endsWith("/ws") ? wsBase : `${wsBase}/ws`;
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      wsUrl = `${protocol}//${window.location.host}/ws`;
    }
    const accessToken = readAccessToken();
    if (!accessToken) {
      this.setStatus("reconnecting");
      this.scheduleReconnect();
      return;
    }
    const socket = new WebSocket(wsUrl, ["boardverse", `bearer.${accessToken}`]);
    this.socket = socket;
    socket.addEventListener("open", () => {
      if (this.socket !== socket) {
        return;
      }
      this.attempts = 0;
      this.setStatus("open");
      this.flush();
    });
    socket.addEventListener("message", (event) => {
      if (this.socket !== socket) {
        return;
      }
      const message = JSON.parse(event.data as string) as WsEnvelope;
      if (typeof message.serverSequence === "number") {
        this.lastSequence = message.serverSequence;
      }
      this.listeners.forEach((listener) => listener(message));
    });
    socket.addEventListener("close", () => {
      if (this.socket !== socket) {
        return;
      }
      this.socket = null;
      if (!this.closedByUs) {
        this.setStatus("reconnecting");
        this.scheduleReconnect();
      } else {
        this.setStatus("idle");
      }
    });
    socket.addEventListener("error", () => {
      socket.close();
    });
  }

  isOpen(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  currentStatus(): RealtimeStatus {
    return this.status;
  }

  reconnect(): void {
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.closedByUs = false;
    this.attempts = 0;
    const previous = this.socket;
    this.socket = null;
    previous?.close();
    this.setStatus("connecting");
    this.connect();
  }

  lastServerSequence(): number {
    return this.lastSequence;
  }

  subscribe(listener: WsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  subscribeStatus(listener: StatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => this.statusListeners.delete(listener);
  }

  send(type: string, roomId: string, payload: Record<string, unknown> = {}): string {
    const requestId = crypto.randomUUID();
    const envelope = JSON.stringify({
      version: 1,
      type,
      requestId,
      roomId: roomId.toUpperCase(),
      lastServerSequence: this.lastSequence,
      payload,
    });
    if (this.isOpen()) {
      this.socket?.send(envelope);
    } else if (type !== "GAME_ACTION") {
      this.pending.push(envelope);
      this.connect();
    } else {
      this.connect();
    }
    return requestId;
  }

  close(): void {
    this.closedByUs = true;
    if (this.reconnectTimer !== null) {
      window.clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.socket?.close();
    this.socket = null;
    this.setStatus("idle");
  }

  private setStatus(status: RealtimeStatus): void {
    if (this.status === status) {
      return;
    }
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private flush(): void {
    while (this.pending.length > 0 && this.isOpen()) {
      const next = this.pending.shift();
      if (next) {
        this.socket?.send(next);
      }
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer !== null || this.closedByUs) {
      return;
    }
    const wait = BACKOFF_MS[Math.min(this.attempts, BACKOFF_MS.length - 1)];
    this.attempts += 1;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, wait);
  }

  private hookWindow(): void {
    if (this.windowHooked || typeof window === "undefined") {
      return;
    }
    this.windowHooked = true;
    window.addEventListener("online", () => {
      if (this.closedByUs || this.isOpen()) {
        return;
      }
      this.attempts = 0;
      this.connect();
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible" || this.closedByUs || this.isOpen()) {
        return;
      }
      this.attempts = 0;
      this.connect();
    });
  }
}

export const realtime = new RealtimeSocket();
