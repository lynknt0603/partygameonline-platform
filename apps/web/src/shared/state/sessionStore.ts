import { create } from "zustand";
import { bootstrapSession, cacheSession, cachedSession, createGuest } from "@/shared/api/session";
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
  session: cachedSession(),
  ready: false,
  error: null,
  bootstrap: async () => {
    set({ ready: false, error: null });
    try {
      const session = await bootstrapSession();
      cacheSession(session);
      set({ session, ready: true, error: null });
    } catch {
      set({
        ready: true,
        error: "SERVER_UNREACHABLE",
      });
    }
  },
  refresh: async () => {
    const session = await bootstrapSession();
    cacheSession(session);
    set({ session, ready: true, error: null });
  },
  rename: async (displayName: string) => {
    const session = await createGuest(displayName);
    cacheSession(session);
    set({ session });
  },
}));
