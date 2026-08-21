import { create } from "zustand";
import { bootstrapSession, createGuest } from "@/shared/api/session";
import type { SessionDto } from "@/shared/api/types";

interface SessionState {
  session: SessionDto | null;
  ready: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  refresh: () => Promise<void>;
  rename: (displayName: string) => Promise<void>;
}

export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  ready: false,
  error: null,
  bootstrap: async () => {
    try {
      const session = await bootstrapSession();
      set({ session, ready: true, error: null });
    } catch (error) {
      set({
        ready: true,
        error: error instanceof Error ? error.message : "Session failed",
      });
    }
  },
  refresh: async () => {
    const session = await bootstrapSession();
    set({ session, ready: true, error: null });
  },
  rename: async (displayName) => {
    const session = await createGuest(displayName);
    set({ session });
  },
}));
