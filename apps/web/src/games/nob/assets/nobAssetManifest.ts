const ROOT = "/assets/games/nob";

export const NOB_CARD_ART: Record<string, string> = {
  "NOB-SS-01": `${ROOT}/cards/NOB-SS-01.png`,
  "NOB-SS-02": `${ROOT}/cards/NOB-SS-02.png`,
  "NOB-SS-03": `${ROOT}/cards/NOB-SS-03.png`,
  "NOB-SS-04": `${ROOT}/cards/NOB-SS-04.png`,
  "NOB-SS-05": `${ROOT}/cards/NOB-SS-05.png`,
  "NOB-SS-06": `${ROOT}/cards/NOB-SS-06.png`,
  "NOB-BS-01": `${ROOT}/cards/NOB-BS-01.png`,
  "NOB-BS-02": `${ROOT}/cards/NOB-BS-02.png`,
  "NOB-BS-03": `${ROOT}/cards/NOB-BS-03.png`,
  "NOB-BS-04": `${ROOT}/cards/NOB-BS-04.png`,
  "NOB-BS-05": `${ROOT}/cards/NOB-BS-05.png`,
  "NOB-BS-06": `${ROOT}/cards/NOB-BS-06.png`,
  "NOB-SH-01": `${ROOT}/cards/NOB-SH-01.png`,
  "NOB-SH-02": `${ROOT}/cards/NOB-SH-02.png`,
  "NOB-SH-03": `${ROOT}/cards/NOB-SH-03.png`,
  "NOB-SH-04": `${ROOT}/cards/NOB-SH-04.png`,
  "NOB-SH-05": `${ROOT}/cards/NOB-SH-05.png`,
  "NOB-SH-06": `${ROOT}/cards/NOB-SH-06.png`,
  "NOB-FK-01": `${ROOT}/cards/NOB-FK-01.png`,
  "NOB-FK-02": `${ROOT}/cards/NOB-FK-02.png`,
  "NOB-FK-03": `${ROOT}/cards/NOB-FK-03.png`,
  "NOB-FK-04": `${ROOT}/cards/NOB-FK-04.png`,
  "NOB-FK-05": `${ROOT}/cards/NOB-FK-05.png`,
  "NOB-FK-06": `${ROOT}/cards/NOB-FK-06.png`,
  "NOB-HU-01": `${ROOT}/cards/NOB-HU-01.png`,
  "NOB-HU-02": `${ROOT}/cards/NOB-HU-02.png`,
  "NOB-HU-03": `${ROOT}/cards/NOB-HU-03.png`,
  "NOB-HU-04": `${ROOT}/cards/NOB-HU-04.png`,
  "NOB-HU-05": `${ROOT}/cards/NOB-HU-05.png`,
  "NOB-HU-06": `${ROOT}/cards/NOB-HU-06.png`,
  "NOB-SP-VEIL-REVERSAL": `${ROOT}/cards/NOB-SP-VEIL-REVERSAL.png`,
  "NOB-SP-LAST-OFFERING": `${ROOT}/cards/NOB-SP-LAST-OFFERING.png`,
  "NOB-SP-LAST-HOPE": `${ROOT}/cards/NOB-SP-LAST-HOPE.png`,
};

export const NOB_BLOODLINE_ART = {
  VAMPIRE: {
    1: `${ROOT}/bloodlines/vampire-01.png`,
    2: `${ROOT}/bloodlines/vampire-02.png`,
    3: `${ROOT}/bloodlines/vampire-03.png`,
    4: `${ROOT}/bloodlines/vampire-04.png`,
    5: `${ROOT}/bloodlines/vampire-05.png`,
  },
  WEREWOLF: {
    1: `${ROOT}/bloodlines/werewolf-01.png`,
    2: `${ROOT}/bloodlines/werewolf-02.png`,
    3: `${ROOT}/bloodlines/werewolf-03.png`,
    4: `${ROOT}/bloodlines/werewolf-04.png`,
    5: `${ROOT}/bloodlines/werewolf-05.png`,
  },
  HALFBLOOD: `${ROOT}/bloodlines/halfblood.png`,
} as const;

export const NOB_MOON_MARK_ART: Record<2 | 3 | 4, string> = {
  2: `${ROOT}/tokens/moon-mark-2.png`,
  3: `${ROOT}/tokens/moon-mark-3.png`,
  4: `${ROOT}/tokens/moon-mark-4.png`,
};

export const NOB_MOON_MARK_BACK = `${ROOT}/tokens/moon-mark-back.png`;

export const NOB_CARD_BACK = `${ROOT}/cards/card-back.png`;
export const NOB_BLOODLINE_CARD_BACK = `${ROOT}/bloodlines/bloodline-card-back.png`;

export const NOB_BRANDING = {
  visualIdentity: `${ROOT}/branding/visual-identity.png`,
  tableBackground: `${ROOT}/branding/table-background.png`,
} as const;

export const NOB_UI = {
  overCrest: `${ROOT}/ui/over-crest.png`,
  overCrestWin: `${ROOT}/ui/over-crest-win.jpg`,
  overCrestLose: `${ROOT}/ui/over-crest-lose.jpg`,
  winnerMedal: `${ROOT}/ui/winner-medal.png`,
  winnerMedalWin: `${ROOT}/ui/winner-medal-win.jpg`,
} as const;

export type NobBloodlineType = keyof typeof NOB_BLOODLINE_ART;
