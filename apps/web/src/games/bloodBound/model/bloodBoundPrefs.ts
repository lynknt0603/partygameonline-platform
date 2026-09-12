import { create } from "zustand";

interface BloodBoundPrefsState {
  sound: boolean;
  setSound: (sound: boolean) => void;
  toggleSound: () => void;
}

const STORAGE_KEY = "blood-bound-prefs";

function load(): Pick<BloodBoundPrefsState, "sound"> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { sound: true };
    }
    const parsed = JSON.parse(raw) as Partial<Pick<BloodBoundPrefsState, "sound">>;
    return {
      sound: parsed.sound !== false,
    };
  } catch {
    return { sound: true };
  }
}

function persist(sound: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sound }));
  } catch {
    /* ignore quota */
  }
}

export const useBloodBoundPrefs = create<BloodBoundPrefsState>((set) => {
  const initial = load();
  return {
    ...initial,
    setSound: (sound) =>
      set(() => {
        persist(sound);
        return { sound };
      }),
    toggleSound: () =>
      set((state) => {
        const next = !state.sound;
        persist(next);
        return { sound: next };
      }),
  };
});
