import type { PlayerClass } from "../types";

/** For ClassCondition: given a player's class, these are the OTHER classes to hide */
export const OTHER_CLASSES: Record<PlayerClass, PlayerClass[]> = {
  Rogue: ["Primalist", "Mage", "Sentinel", "Acolyte"],
  Mage: ["Primalist", "Sentinel", "Acolyte", "Rogue"],
  Sentinel: ["Primalist", "Mage", "Acolyte", "Rogue"],
  Acolyte: ["Primalist", "Mage", "Sentinel", "Rogue"],
  Primalist: ["Mage", "Sentinel", "Acolyte", "Rogue"],
};

export const ALL_CLASSES: PlayerClass[] = [
  "Rogue",
  "Mage",
  "Sentinel",
  "Acolyte",
  "Primalist",
];
