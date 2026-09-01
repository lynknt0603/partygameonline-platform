import { create } from "zustand";
import {
  bootstrapSession,
  cacheSession,
  cachedSession,
  createGuest,
  endSession,
  loginUser,
  registerUser,
  updateDisplayName as updateDisplayNameRequest,
  updateAvatar as updateAvatarRequest,
} from "@/shared/api/session";
import type { AuthPayload, RegisterPayload, SessionDto } from "@/shared/api/types";

interface SessionState {
  session: SessionDto | null;
  ready: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  refresh: () => Promise<void>;
  startGuest: (displayName: string) => Promise<SessionDto>;
  updateDisplayName: (displayName: string, hideGameStats?: boolean) => Promise<void>;
  setAvatar: (avatarKey: string) => Promise<void>;
  login: (payload: AuthPayload) => Promise<SessionDto>;
  register: (payload: RegisterPayload) => Promise<SessionDto>;
  logout: () => Promise<void>;
}

export const useSessionStore = create<SessionState>((set, get) => ({
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
  startGuest: async (displayName: string) => {
    const session = await createGuest(displayName);
    set({ session, ready: true, error: null });
    return session;
  },
  updateDisplayName: async (displayName: string, hideGameStats?: boolean) => {
    const current = get().session;
    if (!current) {
      const session = await createGuest(displayName);
      set({ session, ready: true, error: null });
      return;
    }
    const updated = await updateDisplayNameRequest(displayName, hideGameStats);
    const session = {
      ...current,
      ...updated,
      avatarUrl: updated.avatarUrl ?? current.avatarUrl,
    };
    cacheSession(session);
    set({ session, ready: true, error: null });
  },
  setAvatar: async (avatarKey: string) => {
    const current = get().session;
    if (!current) {
      return;
    }
    const updated = await updateAvatarRequest(avatarKey);
    const session = { ...current, ...updated };
    cacheSession(session);
    set({ session });
  },
  login: async (payload: AuthPayload) => {
    const session = await loginUser(payload);
    set({ session, ready: true, error: null });
    return session;
  },
  register: async (payload: RegisterPayload) => {
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
      const guestSession = await createGuest("Player");
      set({ session: guestSession, ready: true, error: null });
    } catch {
      set({ session: null, ready: true, error: null });
    }
  },
}));
