import type {
  ItemColorValue,
  SoundValue,
  MapIconValue,
  BeamColorValue,
} from "../data/styling";

/** User-facing configuration that drives XML generation */
export interface FilterConfig {
  name: string;
  playerClass: PlayerClass;
  /** Weapon types the player USES — everything else gets hidden */
  weaponTypes: EquipmentType[];
  /** Affix IDs the player considers build-defining */
  buildDefiningAffixIds: number[];
  /** Affix IDs the player considers bad/useless */
  badAffixIds: number[];
  /** Quality gradient configuration */
  gradient: GradientConfig;
  /** Visual treatment for BD markers */
  bdMarkerStyle: BdMarkerStyle;
  /** Visual treatment for BD T6+ rescues */
  bdT6Style: BdRescueStyle;
  /** Visual treatment for BD T7 rescues */
  bdT7Style: BdRescueStyle;
  /** LP/WW gradient tiers for uniques (highest LP first = highest priority) */
  uniqueLpTiers: UniqueLpTier[];
  /** Color for items with affixes but below gradient threshold */
  bottomTierColor: ItemColorValue;
  /** Color used for corrupted items */
  corruptedColor: ItemColorValue;
  filterIcon: number;
  filterIconColor: number;
  /** Raw XML rule strings (without <Order> tag) imported from a user's existing filter */
  customRules: string[];
}

export interface GradientConfig {
  tiers: GradientTier[];
}

export interface GradientTier {
  /** Total affix tier sum threshold (combinedComparsionValue) */
  threshold: number;
  /** Item recolor */
  color: ItemColorValue;
}

export interface BdMarkerStyle {
  mapIconId: MapIconValue;
  beamSize: BeamSize;
  beamColor: BeamColorValue;
  soundId: SoundValue;
  /** Sound to play for top-tier BD items */
  topTierSoundId: SoundValue;
  /** How many of the highest gradient tiers get the topTierSound */
  topTierCount: number;
}

export interface BdRescueStyle {
  mapIconId: MapIconValue;
  beamSize: BeamSize;
  beamColor: BeamColorValue;
  soundId: SoundValue;
}

/** A single tier in the unique LP/WW gradient */
export interface UniqueLpTier {
  /** Minimum Legendary Potential to match */
  minLp: number;
  /** Minimum Weaver's Will to match */
  minWw: number;
  /** Whether to emphasize (bold) the item name */
  emphasized: boolean;
  soundId: SoundValue;
  mapIconId: MapIconValue;
  beamSize: BeamSize;
  beamColor: BeamColorValue;
}

export type PlayerClass =
  | "Rogue"
  | "Mage"
  | "Sentinel"
  | "Acolyte"
  | "Primalist";

export type EquipmentType =
  | "ONE_HANDED_SWORD"
  | "ONE_HANDED_AXE"
  | "ONE_HANDED_MACES"
  | "ONE_HANDED_SCEPTRE"
  | "ONE_HANDED_DAGGER"
  | "WAND"
  | "TWO_HANDED_SWORD"
  | "TWO_HANDED_AXE"
  | "TWO_HANDED_MACE"
  | "TWO_HANDED_STAFF"
  | "TWO_HANDED_SPEAR"
  | "BOW"
  | "SHIELD"
  | "CATALYST"
  | "QUIVER";

export type BeamSize =
  | "NONE"
  | "SMALLEST"
  | "SMALL"
  | "MEDIUM"
  | "LARGE"
  | "VERYLARGE"
  | "LARGEST";

export type IdolType =
  | "IDOL_1x1_ETERRA"
  | "IDOL_1x1_LAGON"
  | "IDOL_2x1"
  | "IDOL_1x2"
  | "IDOL_3x1"
  | "IDOL_1x3"
  | "IDOL_4x1"
  | "IDOL_1x4"
  | "IDOL_2x2"
  | "IDOL_ALTAR";
