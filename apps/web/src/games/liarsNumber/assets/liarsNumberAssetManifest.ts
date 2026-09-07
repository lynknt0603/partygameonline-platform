const root = "/assets/games/liars-number";

export const LIARS_NUMBER_ASSETS = {
  cardBack: `${root}/Card_Back.png`,
  normal: (typeId: number) => `${root}/Card_${typeId}.png`,
  roman: (typeId: number) => `${root}/Roman_${["I", "II", "III", "IV", "V", "VI", "VII", "VIII"][typeId - 1]}.png`,
};
