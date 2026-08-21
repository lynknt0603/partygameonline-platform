import type { WsEnvelope } from "./types";

export type WsListener = (message: WsEnvelope) => void;

export class RealtimeSocket {
  private socket: WebSocket | null = null;
  private readonly listeners = new Set<WsListener>();
  private readonly pending: string[] = [];
  private lastSequence = 0;
  private reconnectTimer: number | null = null;
  private closedByUs = false;

  connect(): void {
    this.closedByUs = false;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const socket = new WebSocket(`${protocol}//${window.location.host}/ws`);
    this.socket = socket;
    socket.addEventListener("open", () => {
      if (this.socket !== socket) {
        return;
      }
      this.flush();
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data as string) as WsEnvelope;
      if (typeof message.serverSequence === "number") {
        this.lastSequence = message.serverSequence;
      }
      this.listeners.forEach((listener) => listener(message));
    });
    socket.addEventListener("close", () => {
      if (this.socket === socket) {
        this.socket = null;
      }
      if (!this.closedByUs) {
        this.scheduleReconnect();
      }
    });
    socket.addEventListener("error", () => {
      socket.close();
    });
  }

  isOpen(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  lastServerSequence(): number {
    return this.lastSequence;
  }

  subscribe(listener: WsListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
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
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 400);
  }
}

export const realtime = new RealtimeSocket();
