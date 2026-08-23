import { create } from "zustand";
import {
  bootstrapSession,
  cacheSession,
  cachedSession,
  createGuest,
  endSession,
  loginUser,
  registerUser,
  storedDisplayName,
} from "@/shared/api/session";
import type { AuthPayload, SessionDto } from "@/shared/api/types";

interface SessionState {
  session: SessionDto | null;
  ready: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  refresh: () => Promise<void>;
  rename: (displayName: string) => Promise<void>;
  login: (payload: AuthPayload) => Promise<SessionDto>;
  register: (payload: AuthPayload) => Promise<SessionDto>;
  logout: () => Promise<void>;
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
  login: async (payload: AuthPayload) => {
    const session = await loginUser(payload);
    set({ session, ready: true, error: null });
    return session;
  },
  register: async (payload: AuthPayload) => {
    const session = await registerUser(payload);
    set({ session, ready: true, error: null });
    return session;
  },
  logout: async () => {
    try {
      await endSession();
    } catch {
      /* ignore */
    }
    try {
      const guestSession = await createGuest(storedDisplayName());
      set({ session: guestSession, ready: true, error: null });
    } catch {
      set({ session: null, ready: true, error: null });
    }
  },
}));
