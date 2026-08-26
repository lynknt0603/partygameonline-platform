const ROOT = "/assets/games/not-in-my-pot";
const CARD_ROOT = `${ROOT}/cards`;

export const NOT_IN_MY_POT_ASSETS = {
  visualIdentity: `${ROOT}/visual-identity.png`,
  referenceSheet: `${ROOT}/reference-sheet.png`,
  cards: {
    vegetable: `${CARD_ROOT}/vegetable-plus1.png`,
    salt: `${CARD_ROOT}/salt-0.png`,
    meat: `${CARD_ROOT}/meat-minus2.png`,
    outOfHouse: `${CARD_ROOT}/out-you-go.png`,
    scoopOut: `${CARD_ROOT}/scoop-out.png`,
    slottedSpoon: `${CARD_ROOT}/slotted-spoon.png`,
    emergencyShopping: `${CARD_ROOT}/emergency-shopping.png`,
    trashOut: `${CARD_ROOT}/trash-out.png`,
    vegetarianRole: `${CARD_ROOT}/role-vegetarian.png`,
    meatEaterRole: `${CARD_ROOT}/role-meat-eater.png`,
    roleBack: `${CARD_ROOT}/role-back.png`,
    gameplayBack: `${CARD_ROOT}/gameplay-back.png`,
  },
} as const;

export const NOT_IN_MY_POT_PRELOAD_ASSETS = [
  NOT_IN_MY_POT_ASSETS.visualIdentity,
  NOT_IN_MY_POT_ASSETS.cards.vegetable,
  NOT_IN_MY_POT_ASSETS.cards.salt,
  NOT_IN_MY_POT_ASSETS.cards.meat,
  NOT_IN_MY_POT_ASSETS.cards.outOfHouse,
  NOT_IN_MY_POT_ASSETS.cards.scoopOut,
  NOT_IN_MY_POT_ASSETS.cards.slottedSpoon,
  NOT_IN_MY_POT_ASSETS.cards.emergencyShopping,
  NOT_IN_MY_POT_ASSETS.cards.trashOut,
  NOT_IN_MY_POT_ASSETS.cards.vegetarianRole,
  NOT_IN_MY_POT_ASSETS.cards.meatEaterRole,
  NOT_IN_MY_POT_ASSETS.cards.roleBack,
  NOT_IN_MY_POT_ASSETS.cards.gameplayBack,
] as const;
