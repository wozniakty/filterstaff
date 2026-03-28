import type { EquipmentType, IdolType } from "../types";

export const ALL_WEAPON_TYPES: EquipmentType[] = [
  "ONE_HANDED_SWORD",
  "ONE_HANDED_AXE",
  "ONE_HANDED_MACES",
  "ONE_HANDED_SCEPTRE",
  "ONE_HANDED_DAGGER",
  "WAND",
  "TWO_HANDED_SWORD",
  "TWO_HANDED_AXE",
  "TWO_HANDED_MACE",
  "TWO_HANDED_STAFF",
  "TWO_HANDED_SPEAR",
  "BOW",
  "SHIELD",
  "CATALYST",
  "QUIVER",
];

export const WEAPON_TYPE_LABELS: Record<EquipmentType, string> = {
  ONE_HANDED_SWORD: "One-Handed Sword",
  ONE_HANDED_AXE: "One-Handed Axe",
  ONE_HANDED_MACES: "One-Handed Mace",
  ONE_HANDED_SCEPTRE: "Sceptre",
  ONE_HANDED_DAGGER: "Dagger",
  WAND: "Wand",
  TWO_HANDED_SWORD: "Two-Handed Sword",
  TWO_HANDED_AXE: "Two-Handed Axe",
  TWO_HANDED_MACE: "Two-Handed Mace",
  TWO_HANDED_STAFF: "Staff",
  TWO_HANDED_SPEAR: "Spear",
  BOW: "Bow",
  SHIELD: "Shield",
  CATALYST: "Catalyst",
  QUIVER: "Quiver",
};

export const ALL_IDOL_TYPES: IdolType[] = [
  "IDOL_1x1_ETERRA",
  "IDOL_1x1_LAGON",
  "IDOL_2x1",
  "IDOL_1x2",
  "IDOL_3x1",
  "IDOL_1x3",
  "IDOL_4x1",
  "IDOL_1x4",
  "IDOL_2x2",
  "IDOL_ALTAR",
];
