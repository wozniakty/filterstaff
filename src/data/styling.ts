/** Item recolor IDs — from FILTER STYLING REFERENCE.xml */
export const ItemColor = {
  WHITE: 0,
  GRAY: 1,
  SICKLY_GREEN: 2,
  YELLOW: 3,
  ORANGE: 4,
  RED_ORANGE: 5,
  SLIGHTLY_LIGHTER_RED: 6,
  RED: 7,
  PINK: 8,
  MAGENTA: 9,
  BLUEISH_PURPLE: 10,
  PURPLE: 11,
  BLUE: 12,
  SLIGHTLY_LIGHTER_BLUE: 13,
  TURQUOISE: 14,
  LIGHT_TEAL: 15,
  LIME_GREEN: 16,
  GREEN: 17,
} as const;

/** Sound IDs — from FILTER STYLING REFERENCE.xml */
export const Sound = {
  DEFAULT: 0,
  NONE: 1,
  SHING: 2,
  SHAKER: 3,
  ZAP: 4,
  DRUM: 5,
  BEGIN: 6,
  FIGHT: 7,
  DISCOVERY: 8,
  INSPIRATION: 9,
  ANVIL: 10,
  WILD: 11,
  COMET: 12,
  SMASH: 13,
  SMITH: 14,
  PRECIOUS: 15,
  METAL: 16,
  UNLOCK: 17,
} as const;

/** Map icon IDs — from FILTER STYLING REFERENCE.xml */
export const MapIcon = {
  DEFAULT: 0,
  NONE: 1,
  RARE: 2,
  UNIQUE: 3,
  SET: 4,
  LEGENDARY: 5,
  RESOURCE: 6,
  EXALTED: 7,
  GOLDEN: 8,
  OBSIDIAN: 9,
  TUTORIAL: 10,
} as const;

export type ItemColorValue = (typeof ItemColor)[keyof typeof ItemColor];
export type SoundValue = (typeof Sound)[keyof typeof Sound];
export type MapIconValue = (typeof MapIcon)[keyof typeof MapIcon];

/** Beam color IDs — from FILTER STYLING REFERENCE.xml */
export const BeamColor = {
  WHITE: 0,
  GRAY: 1,
  BLACK: 2,
  SICKLY_GREEN: 3,
  YELLOW: 4,
  SLIGHTLY_DARKER_YELLOW: 5,
  GOLDEN: 6,
  ORANGE: 7,
  RED_ORANGE: 8,
  BROWN: 9,
  RED: 10,
  PINK: 11,
  MAGENTA: 12,
  PURPLE: 13,
  PALE_PURPLE: 14,
  BLUE: 15,
  SLIGHTLY_LIGHTER_BLUE: 16,
  PALE_BLUE: 17,
  TURQUOISE: 18,
  LIGHT_TEAL: 19,
  LIME_GREEN: 20,
  GREEN: 21,
} as const;

export type BeamColorValue = (typeof BeamColor)[keyof typeof BeamColor];
