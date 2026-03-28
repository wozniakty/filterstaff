import type { FilterConfig, GradientTier } from "../types";
import { ItemColor, Sound, MapIcon, BeamColor } from "./styling";

/**
 * Default 5-tier gradient.
 * BLUE → YELLOW → PURPLE → MAGENTA → PINK
 */
export const DEFAULT_GRADIENT_TIERS: GradientTier[] = [
  { threshold: 6, color: ItemColor.BLUE },
  { threshold: 10, color: ItemColor.YELLOW },
  { threshold: 14, color: ItemColor.PURPLE },
  { threshold: 18, color: ItemColor.MAGENTA },
  { threshold: 22, color: ItemColor.PINK },
];

/** Default filter configuration */
export const DEFAULT_FILTER_CONFIG: FilterConfig = {
  name: "MyFilter",
  playerClass: "Rogue",
  weaponTypes: ["BOW", "QUIVER"],
  buildDefiningAffixIds: [],
  badAffixIds: [],
  gradient: {
    tiers: DEFAULT_GRADIENT_TIERS,
  },
  bdMarkerStyle: {
    mapIconId: MapIcon.NONE,
    beamSize: "LARGE",
    beamColor: BeamColor.YELLOW,
    soundId: Sound.NONE,
    topTierSoundId: Sound.SHING,
    topTierCount: 2,
  },
  bdT6Style: {
    mapIconId: MapIcon.EXALTED,
    beamSize: "VERYLARGE",
    beamColor: BeamColor.ORANGE,
    soundId: Sound.INSPIRATION,
  },
  bdT7Style: {
    mapIconId: MapIcon.EXALTED,
    beamSize: "LARGEST",
    beamColor: BeamColor.RED,
    soundId: Sound.BEGIN,
  },
  bottomTierColor: ItemColor.GRAY,
  corruptedColor: ItemColor.TURQUOISE,
  filterIcon: 4,
  filterIconColor: 10,
};

/**
 * Hide rule level gates.
 * These define when progressive hide rules kick in.
 */
export const HIDE_LEVEL_GATES = {
  /** Hide 3+ bad affixes — always active */
  threeBadAffixes: 0,
  /** Hide 2+ bad affixes — level 40+ */
  twoBadAffixes: 40,
  /** Hide 1+ bad at T5+ — level 60+ */
  oneBadHighTier: 60,
} as const;

/**
 * Progressive total-tier hide thresholds.
 * At each level gate, items with combined affix tiers below the threshold are hidden.
 * Ramps from 6 at level 35 up to 16 at level 85 (+2 tiers per 10 levels).
 */
export const TOTAL_TIER_HIDE_GATES: readonly { level: number; minTiers: number }[] = [
  { level: 35, minTiers: 6 },
  { level: 45, minTiers: 8 },
  { level: 55, minTiers: 10 },
  { level: 65, minTiers: 12 },
  { level: 75, minTiers: 14 },
  { level: 85, minTiers: 16 },
] as const;
