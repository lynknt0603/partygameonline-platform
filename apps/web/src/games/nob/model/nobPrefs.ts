import { create } from "zustand";

export type NobAnimationPref = "FULL" | "REDUCED";

interface NobPrefsState {
  sound: boolean;
  animations: NobAnimationPref;
  setSound: (sound: boolean) => void;
  setAnimations: (animations: NobAnimationPref) => void;
}

const STORAGE_KEY = "nob-play-prefs";

function load(): Pick<NobPrefsState, "sound" | "animations"> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { sound: true, animations: "FULL" };
    }
    const parsed = JSON.parse(raw) as Partial<Pick<NobPrefsState, "sound" | "animations">>;
    return {
      sound: parsed.sound !== false,
      animations: parsed.animations === "REDUCED" ? "REDUCED" : "FULL",
    };
  } catch {
    return { sound: true, animations: "FULL" };
  }
}

function persist(sound: boolean, animations: NobAnimationPref) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sound, animations }));
  } catch {
    /* ignore quota */
  }
}

export const useNobPrefs = create<NobPrefsState>((set) => {
  const initial = load();
  return {
    ...initial,
    setSound: (sound) =>
      set((state) => {
        persist(sound, state.animations);
        return { sound };
      }),
    setAnimations: (animations) =>
      set((state) => {
        persist(state.sound, animations);
        return { animations };
      }),
  };
});
