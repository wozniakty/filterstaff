import type { FilterConfig, GradientTier } from "../types";

/**
 * Default 5-tier gradient from FEATURE_DESIGN.md.
 * Exact colors TBD through playtesting — using a warm ramp for now.
 */
export const DEFAULT_GRADIENT_TIERS: GradientTier[] = [
  { threshold: 6, color: 12 },  // > 6 total tiers  → BLUE
  { threshold: 10, color: 3 },  // > 10 total tiers → YELLOW
  { threshold: 14, color: 11 }, // > 14 total tiers → PURPLE
  { threshold: 18, color: 9 },  // > 18 total tiers → MAGENTA
  { threshold: 22, color: 8 },  // > 22 total tiers → PINK (top tier, hilarious but bright)
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
    mapIconId: 7,    // EXALTED icon
    beamSize: "LARGE",
    beamColor: 4,    // YELLOW beam
    soundId: 0,      // No sound for lower tiers
    topTierSoundId: 2, // SHING for top 2 tiers
    topTierCount: 2,   // How many top tiers get the sound
  },
  bdT6Style: {
    mapIconId: 7,    // EXALTED icon
    beamSize: "VERYLARGE",
    beamColor: 7,    // ORANGE beam
    soundId: 9,      // INSPIRATION - any exalted BD needs attention
  },
  bdT7Style: {
    mapIconId: 7,    // EXALTED icon
    beamSize: "LARGEST",
    beamColor: 10,   // RED beam
    soundId: 6,      // BEGIN - exciting!
  },
  bottomTierColor: 1, // GRAY — "has an affix but below gradient threshold"
  corruptedColor: 14, // TURQUOISE
  filterIcon: 4,
  filterIconColor: 10,
};

/**
 * Hide rule level gates from FEATURE_DESIGN.md.
 * These define when progressive hide rules kick in.
 */
export const HIDE_LEVEL_GATES = {
  /** Hide 3+ bad affixes — always active */
  threeBadAffixes: 0,
  /** Hide 2+ bad affixes — level 40+ */
  twoBadAffixes: 40,
  /** Hide 1+ bad at T5+ — level 60+ */
  oneBadHighTier: 60,
  /** Hide low total tiers — level 50+ */
  lowTotalTiers: 50,
} as const;
