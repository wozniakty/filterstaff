/** A single affix from the game data */
export interface Affix {
  id: number;
  name: string;
  type: "prefix" | "suffix";
  /** 0 = normal, 2 = experimental?, 6 = champion? */
  specialType: number;
  /** Numeric class flag — 0 = all classes */
  classSpecificity: number;
  /** Numeric group/category */
  group: number;
  /** Whether this is an idol affix */
  isIdol: boolean;
  /** Tier data (8 tiers, T0-T7) */
  tiers: { minRoll: number; maxRoll: number }[];
}

/** How the user has categorized an affix */
export type AffixCategory = "build-defining" | "bad" | "unlabeled";

/** Map of affix ID to its user-assigned category */
export type AffixSelections = Record<number, AffixCategory>;
