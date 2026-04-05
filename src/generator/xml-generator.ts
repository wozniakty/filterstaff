import type {
  FilterConfig,
  GradientTier,
  UniqueLpTier,
  BeamSize,
  EquipmentType,
  IdolType,
} from "../types";
import { OTHER_CLASSES } from "../data/classes";
import { ALL_IDOL_TYPES } from "../data/equipment-types";
import { ALL_WEAPON_TYPES } from "../data/equipment-types";
import { HIDE_LEVEL_GATES, TOTAL_TIER_HIDE_GATES } from "../data/defaults";
import { Sound, MapIcon, ItemColor, BeamColor } from "../data/styling";
import affixData from "../data/affixes.json";
import categoryData from "../data/affix-categories.json";
import type { PlayerClass } from "../types";
import { injectOrderIntoRule, CUSTOM_RULES_START_LABEL, CUSTOM_RULES_END_LABEL } from "./xml-parser";

// ─── Helpers ────────────────────────────────────────────────────────────────

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** All known affix IDs (non-idol) for the ALL list */
function getAllAffixIds(): number[] {
  return affixData
    .filter((a: { isIdol: boolean }) => !a.isIdol)
    .map((a: { id: number }) => a.id);
}

/** Affix IDs from class-specific categories that don't match the player's class */
function getOtherClassAffixIds(playerClass: PlayerClass): number[] {
  const classUpper = playerClass.toUpperCase();
  const ids: number[] = [];
  for (const cat of categoryData as { name: string; ids: number[] }[]) {
    if (
      cat.name.startsWith("CLASS SPECIFIC - ") &&
      !cat.name.endsWith(classUpper)
    ) {
      ids.push(...cat.ids);
    }
  }
  return ids;
}

// ─── Rule XML Building Blocks ───────────────────────────────────────────────

function affixListXml(ids: number[], indent: string): string {
  return ids.map((id) => `${indent}<int>${id}</int>`).join("\n");
}

interface AffixConditionOpts {
  affixIds: number[];
  comparsion?: string;
  comparsionValue?: number;
  minOnTheSameItem?: number;
  combinedComparsion?: string;
  combinedComparsionValue?: number;
  advanced?: boolean;
}

function affixConditionXml(opts: AffixConditionOpts, indent: string): string {
  const {
    affixIds,
    comparsion = "ANY",
    comparsionValue = 0,
    minOnTheSameItem = 1,
    combinedComparsionValue = 0,
    combinedComparsion = combinedComparsionValue > 0 ? "MORE" : "ANY",
    advanced = combinedComparsionValue > 0 || comparsionValue > 0,
  } = opts;

  return `${indent}<Condition i:type="AffixCondition">
${indent}  <affixes>
${affixListXml(affixIds, indent + "    ")}
${indent}  </affixes>
${indent}  <comparsion>${comparsion}</comparsion>
${indent}  <comparsionValue>${comparsionValue}</comparsionValue>
${indent}  <minOnTheSameItem>${minOnTheSameItem}</minOnTheSameItem>
${indent}  <combinedComparsion>${combinedComparsion}</combinedComparsion>
${indent}  <combinedComparsionValue>${combinedComparsionValue}</combinedComparsionValue>
${indent}  <advanced>${advanced}</advanced>
${indent}</Condition>`;
}

function rarityConditionXml(
  rarities: string[],
  indent: string
): string {
  return `${indent}<Condition i:type="RarityCondition">
${indent}  <rarity>${rarities.join(" ")}</rarity>
${indent}</Condition>`;
}

function classConditionXml(classes: string[], indent: string): string {
  return `${indent}<Condition i:type="ClassCondition">
${indent}  <req>${classes.join(" ")}</req>
${indent}</Condition>`;
}

function subTypeConditionXml(
  types: (EquipmentType | IdolType)[],
  indent: string
): string {
  const typeElements = types
    .map((t) => `${indent}    <EquipmentType>${t}</EquipmentType>`)
    .join("\n");
  return `${indent}<Condition i:type="SubTypeCondition">
${indent}  <type>
${typeElements}
${indent}  </type>
${indent}  <subTypes />
${indent}</Condition>`;
}

function potentialConditionXml(
  minLp: number,
  minWw: number,
  indent: string
): string {
  return `${indent}<Condition i:type="PotentialCondition">
${indent}  <MinLegendaryPotential>${minLp}</MinLegendaryPotential>
${indent}  <MaxLegendaryPotential i:nil="true" />
${indent}  <MinWeaversWill>${minWw}</MinWeaversWill>
${indent}  <MaxWeaversWill i:nil="true" />
${indent}  <MinWeaversTouch i:nil="true" />
${indent}  <MaxWeaversTouch i:nil="true" />
${indent}  <MinForgingPotential i:nil="true" />
${indent}  <MaxForgingPotential i:nil="true" />
${indent}</Condition>`;
}

function corruptionConditionXml(indent: string): string {
  return `${indent}<Condition i:type="CorruptionCondition">
${indent}  <Corruption>OnlyCorrupted</Corruption>
${indent}</Condition>`;
}

function uncorruptedConditionXml(indent: string): string {
  return `${indent}<Condition i:type="CorruptionCondition">
${indent}  <Corruption>OnlyUncorrupted</Corruption>
${indent}</Condition>`;
}

interface AffixCountConditionOpts {
  minPrefixes?: number | null;
  maxPrefixes?: number | null;
  minSuffixes?: number | null;
  maxSuffixes?: number | null;
}

function affixCountConditionXml(
  opts: AffixCountConditionOpts,
  indent: string
): string {
  const tag = (name: string, v: number | null | undefined) =>
    v != null
      ? `${indent}  <${name}>${v}</${name}>`
      : `${indent}  <${name} i:nil="true" />`;

  return `${indent}<Condition i:type="AffixCountCondition">
${tag("minPrefixes", opts.minPrefixes)}
${tag("maxPrefixes", opts.maxPrefixes)}
${tag("minSuffixes", opts.minSuffixes)}
${tag("maxSuffixes", opts.maxSuffixes)}
${indent}  <sealedType>Any</sealedType>
${indent}</Condition>`;
}

function characterLevelConditionXml(
  minLvl: number,
  maxLvl: number,
  indent: string
): string {
  return `${indent}<Condition i:type="CharacterLevelCondition">
${indent}  <minimumLvl>${minLvl}</minimumLvl>
${indent}  <maximumLvl>${maxLvl}</maximumLvl>
${indent}</Condition>`;
}

interface RuleOpts {
  type: "SHOW" | "HIDE";
  conditions: string;
  recolor?: boolean;
  color?: number;
  emphasized?: boolean;
  nameOverride?: string;
  soundId?: number;
  mapIconId?: number;
  beamOverride?: boolean;
  beamSize?: BeamSize;
  beamColor?: number;
  isEnabled?: boolean;
  order: number;
}

function ruleXml(opts: RuleOpts): string {
  const {
    type,
    conditions,
    recolor = false,
    color = 0,
    emphasized = false,
    nameOverride = "",
    soundId = 1,
    mapIconId = 1,
    beamOverride = true,
    beamSize = "NONE",
    beamColor = 0,
    isEnabled = true,
    order,
  } = opts;

  const nameTag = nameOverride
    ? `<nameOverride>${xmlEscape(nameOverride)}</nameOverride>`
    : "<nameOverride />";

  const conditionsBlock = conditions
    ? `<conditions>\n${conditions}\n      </conditions>`
    : "<conditions />";

  return `    <Rule>
      <type>${type}</type>
      ${conditionsBlock}
      <recolor>${recolor}</recolor>
      <color>${color}</color>
      <isEnabled>${isEnabled}</isEnabled>
      <levelDependent_deprecated>false</levelDependent_deprecated>
      <minLvl_deprecated>0</minLvl_deprecated>
      <maxLvl_deprecated>0</maxLvl_deprecated>
      <emphasized>${emphasized}</emphasized>
      ${nameTag}
      <SoundId>${soundId}</SoundId>
      <MapIconId>${mapIconId}</MapIconId>
      <BeamOverride>${beamOverride}</BeamOverride>
      <BeamSizeOverride>${beamSize}</BeamSizeOverride>
      <BeamColorOverride>${beamColor}</BeamColorOverride>
      <Order>${order}</Order>
    </Rule>`;
}

// ─── Layer Generators ───────────────────────────────────────────────────────

function generateHideAll(order: number): string {
  return ruleXml({
    type: "HIDE",
    conditions: "",
    nameOverride: "Hide All (catch-all)",
    order,
  });
}

function generateGradient(
  tiers: GradientTier[],
  allAffixIds: number[],
  bottomTierColor: number,
  startOrder: number
): string[] {
  const rules: string[] = [];

  // Bottom tier: any good affix present, no tier sum requirement
  // This catches items with your affixes that haven't hit the minimum gradient threshold
  rules.push(
    ruleXml({
      type: "SHOW",
      conditions: affixConditionXml(
        {
          affixIds: allAffixIds,
          minOnTheSameItem: 1,
        },
        "        "
      ),
      recolor: true,
      color: bottomTierColor,
      nameOverride: "Gradient: bottom tier (any affix)",
      order: startOrder,
    })
  );

  // Gradient tiers with escalating thresholds
  tiers.forEach((tier, i) => {
    rules.push(
      ruleXml({
        type: "SHOW",
        conditions: affixConditionXml(
          {
            affixIds: allAffixIds,
            comparsion: "ANY",
            comparsionValue: 0,
            combinedComparsion: "MORE",
            combinedComparsionValue: tier.threshold,
          },
          "        "
        ),
        recolor: true,
        color: tier.color,
        nameOverride: `Gradient: tier ${i + 1} (sum>${tier.threshold})`,
        order: startOrder + 1 + i,
      })
    );
  });

  return rules;
}

function generateBdMarkers(
  tiers: GradientTier[],
  allAffixIds: number[],
  bdAffixIds: number[],
  config: FilterConfig,
  startOrder: number
): string[] {
  if (bdAffixIds.length === 0) return [];

  const rules: string[] = [];

  // Bottom tier: BD affix present, no tier sum requirement
  rules.push(
    ruleXml({
      type: "SHOW",
      conditions: affixConditionXml(
        {
          affixIds: bdAffixIds,
          minOnTheSameItem: 1,
        },
        "        "
      ),
      recolor: true,
      color: config.bottomTierColor,
      mapIconId: config.bdMarkerStyle.mapIconId,
      beamOverride: true,
      beamSize: config.bdMarkerStyle.beamSize,
      beamColor: config.bdMarkerStyle.beamColor,
      nameOverride: "BD marker: bottom tier (any BD affix)",
      order: startOrder,
    })
  );

  // Tiered BD markers with escalating thresholds
  tiers.forEach((tier, i) => {
    const conditions = [
      affixConditionXml(
        {
          affixIds: allAffixIds,
          comparsion: "ANY",
          comparsionValue: 0,
          combinedComparsion: "MORE",
          combinedComparsionValue: tier.threshold,
        },
        "        "
      ),
      affixConditionXml(
        {
          affixIds: bdAffixIds,
          minOnTheSameItem: 1,
        },
        "        "
      ),
    ].join("\n");

    // Top N tiers get the topTierSound
    const isTopTier = i >= tiers.length - config.bdMarkerStyle.topTierCount;
    const soundId = isTopTier
      ? config.bdMarkerStyle.topTierSoundId
      : config.bdMarkerStyle.soundId;

    rules.push(
      ruleXml({
        type: "SHOW",
        conditions,
        recolor: true,
        color: tier.color,
        soundId,
        mapIconId: config.bdMarkerStyle.mapIconId,
        beamOverride: true,
        beamSize: config.bdMarkerStyle.beamSize,
        beamColor: config.bdMarkerStyle.beamColor,
        nameOverride: `BD marker: tier ${i + 1} (sum>${tier.threshold})`,
        order: startOrder + 1 + i,
      })
    );
  });

  return rules;
}

function generateCorruptedGradient(
  tiers: GradientTier[],
  allAffixIds: number[],
  bottomTierColor: number,
  startOrder: number
): string[] {
  const rules: string[] = [];

  // Bottom tier: corrupted with any affix present
  rules.push(
    ruleXml({
      type: "SHOW",
      conditions: [
        corruptionConditionXml("        "),
        affixConditionXml(
          { affixIds: allAffixIds, minOnTheSameItem: 1 },
          "        "
        ),
      ].join("\n"),
      recolor: true,
      color: bottomTierColor,
      nameOverride: "Corrupted: bottom tier (any affix)",
      order: startOrder,
    })
  );

  // Tiered corrupted gradient
  tiers.forEach((tier, i) => {
    rules.push(
      ruleXml({
        type: "SHOW",
        conditions: [
          corruptionConditionXml("        "),
          affixConditionXml(
            {
              affixIds: allAffixIds,
              comparsion: "ANY",
              comparsionValue: 0,
              combinedComparsion: "MORE",
              combinedComparsionValue: tier.threshold,
            },
            "        "
          ),
        ].join("\n"),
        recolor: true,
        color: tier.color,
        nameOverride: `Corrupted: tier ${i + 1} (sum>${tier.threshold})`,
        order: startOrder + 1 + i,
      })
    );
  });

  return rules;
}

function generateHideOtherClasses(
  config: FilterConfig,
  order: number
): string {
  return ruleXml({
    type: "HIDE",
    conditions: classConditionXml(
      OTHER_CLASSES[config.playerClass],
      "        "
    ),
    nameOverride: "Hide other classes",
    order,
  });
}

function generateHideNormals(order: number): string {
  return ruleXml({
    type: "HIDE",
    conditions: rarityConditionXml(["NORMAL"], "        "),
    nameOverride: "Hide normal rarity",
    order,
  });
}

function generateBadAffixHides(
  badAffixIds: number[],
  startOrder: number
): string[] {
  if (badAffixIds.length === 0) return [];

  const rules: string[] = [];
  let order = startOrder;

  // Hide 3+ bad affixes (always)
  rules.push(
    ruleXml({
      type: "HIDE",
      conditions: affixConditionXml(
        {
          affixIds: badAffixIds,
          minOnTheSameItem: 3,
        },
        "        "
      ),
      nameOverride: "Hide 3+ bad affixes",
      order: order++,
    })
  );

  // Hide 2+ bad affixes (level gate)
  rules.push(
    ruleXml({
      type: "HIDE",
      conditions: [
        affixConditionXml(
          {
            affixIds: badAffixIds,
            minOnTheSameItem: 2,
          },
          "        "
        ),
        characterLevelConditionXml(
          HIDE_LEVEL_GATES.twoBadAffixes,
          100,
          "        "
        ),
      ].join("\n"),
      nameOverride: `Hide 2+ bad affixes (lvl ${HIDE_LEVEL_GATES.twoBadAffixes}+)`,
      order: order++,
    })
  );

  // Hide 1+ bad at T5+ (level gate)
  rules.push(
    ruleXml({
      type: "HIDE",
      conditions: [
        affixConditionXml(
          {
            affixIds: badAffixIds,
            comparsion: "MORE",
            comparsionValue: 4,
            minOnTheSameItem: 1,
          },
          "        "
        ),
        characterLevelConditionXml(
          HIDE_LEVEL_GATES.oneBadHighTier,
          100,
          "        "
        ),
      ].join("\n"),
      nameOverride: `Hide 1+ bad T5+ affix (lvl ${HIDE_LEVEL_GATES.oneBadHighTier}+)`,
      order: order++,
    })
  );

  return rules;
}

function generateTotalTierHides(
  allAffixIds: number[],
  startOrder: number
): string[] {
  const rules: string[] = [];
  let order = startOrder;

  // Progressive total-tier hides — stricter gates need higher priority (higher Order).
  // Gates array is sorted by ascending level/threshold, so iterating forward gives
  // the strictest gate (highest level) the highest Order number.
  for (let i = 0; i < TOTAL_TIER_HIDE_GATES.length; i++) {
    const gate = TOTAL_TIER_HIDE_GATES[i];
    rules.push(
      ruleXml({
        type: "HIDE",
        conditions: [
          affixConditionXml(
            {
              affixIds: allAffixIds,
              combinedComparsion: "LESS_OR_EQUAL",
              combinedComparsionValue: gate.minTiers,
            },
            "        "
          ),
          characterLevelConditionXml(gate.level, 100, "        "),
        ].join("\n"),
        nameOverride: `Hide total tiers <=${gate.minTiers} (lvl ${gate.level}+)`,
        order: order++,
      })
    );
  }

  return rules;
}

function generateShowT8(allAffixIds: number[], order: number): string {
  return ruleXml({
    type: "SHOW",
    conditions: affixConditionXml(
      {
        affixIds: allAffixIds,
        comparsion: "MORE",
        comparsionValue: 7,
        minOnTheSameItem: 1,
        combinedComparsion: "ANY",
        combinedComparsionValue: 7,
      },
      "        "
    ),
    recolor: true,
    color: ItemColor.RED,
    emphasized: true,
    soundId: Sound.COMET,
    mapIconId: MapIcon.LEGENDARY,
    beamOverride: true,
    beamSize: "LARGEST",
    beamColor: BeamColor.RED,
    nameOverride: "T8 affix",
    order,
  });
}

function generateShowSetLegendary(order: number): string {
  return ruleXml({
    type: "SHOW",
    conditions: rarityConditionXml(["SET", "LEGENDARY"], "        "),
    soundId: Sound.DEFAULT,
    mapIconId: MapIcon.DEFAULT,
    beamOverride: false,
    nameOverride: "Show all set & legendary",
    order,
  });
}

function generateShowIdols(order: number): string {
  return ruleXml({
    type: "SHOW",
    conditions: subTypeConditionXml(ALL_IDOL_TYPES, "        "),
    soundId: Sound.DEFAULT,
    mapIconId: MapIcon.DEFAULT,
    beamOverride: false,
    nameOverride: "Show all idols",
    order,
  });
}

function generateHideWrongWeapons(
  config: FilterConfig,
  order: number
): string[] {
  const weaponsToHide = ALL_WEAPON_TYPES.filter(
    (w) => !config.weaponTypes.includes(w)
  );
  if (weaponsToHide.length === 0) return [];
  return [
    ruleXml({
      type: "HIDE",
      conditions: subTypeConditionXml(weaponsToHide, "        "),
      nameOverride: "Hide wrong weapon types",
      order,
    }),
  ];
}

function generateHavocCandidates(
  config: FilterConfig,
  allAffixIds: number[],
  startOrder: number
): string[] {

  const rules: string[] = [];
  let order = startOrder;

  // Shared condition: any affix at T7 (comparsionValue 6 = tier > 6 = T7+)
  const t7Condition = affixConditionXml(
    {
      affixIds: allAffixIds,
      comparsion: "MORE",
      comparsionValue: 6,
      minOnTheSameItem: 1,
    },
    "        "
  );

  const havocRuleOpts = {
    type: "SHOW" as const,
    recolor: true,
    color: config.havoc.color,
    emphasized: config.havoc.emphasized,
    soundId: config.havoc.style.soundId,
    mapIconId: config.havoc.style.mapIconId,
    beamOverride: true,
    beamSize: config.havoc.style.beamSize,
    beamColor: config.havoc.style.beamColor,
  };

  // Rule 1: T7 + BD affix present (any tier) + uncorrupted
  if (config.buildDefiningAffixIds.length > 0) {
    rules.push(
      ruleXml({
        ...havocRuleOpts,
        conditions: [
          t7Condition,
          affixConditionXml(
            {
              affixIds: config.buildDefiningAffixIds,
              minOnTheSameItem: 1,
            },
            "        "
          ),
          uncorruptedConditionXml("        "),
        ].join("\n"),
        nameOverride: "Havoc candidate: T7 + BD affix",
        order: order++,
      })
    );
  }

  // Rule 2: T7 + open prefix slot + uncorrupted
  rules.push(
    ruleXml({
      ...havocRuleOpts,
      conditions: [
        t7Condition,
        affixCountConditionXml({ maxPrefixes: 1 }, "        "),
        uncorruptedConditionXml("        "),
      ].join("\n"),
      nameOverride: "Havoc candidate: T7 + open prefix",
      order: order++,
    })
  );

  // Rule 3: T7 + open suffix slot + uncorrupted
  rules.push(
    ruleXml({
      ...havocRuleOpts,
      conditions: [
        t7Condition,
        affixCountConditionXml({ maxSuffixes: 1 }, "        "),
        uncorruptedConditionXml("        "),
      ].join("\n"),
      nameOverride: "Havoc candidate: T7 + open suffix",
      order: order++,
    })
  );

  return rules;
}

function generateBdRescues(
  config: FilterConfig,
  allAffixIds: number[],
  startOrder: number
): string[] {
  const rules: string[] = [];
  const tiers = config.gradient.tiers;
  const goodAffixIds = allAffixIds.filter(id => !config.badAffixIds.includes(id));
  let order = startOrder;

  // BD T6+ rescue (one rule per gradient tier)
  if (config.buildDefiningAffixIds.length > 0) {
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      rules.push(
        ruleXml({
          type: "SHOW",
          conditions: [
            affixConditionXml(
              {
                affixIds: allAffixIds,
                comparsion: "ANY",
                comparsionValue: 0,
                combinedComparsion: "MORE",
                combinedComparsionValue: tier.threshold,
              },
              "        "
            ),
            affixConditionXml(
              {
                affixIds: config.buildDefiningAffixIds,
                comparsion: "MORE",
                comparsionValue: 5,
                minOnTheSameItem: 1,
              },
              "        "
            ),
          ].join("\n"),
          recolor: true,
          color: tier.color,
          soundId: config.bdT6Style.soundId,
          mapIconId: config.bdT6Style.mapIconId,
          beamOverride: true,
          beamSize: config.bdT6Style.beamSize,
          beamColor: config.bdT6Style.beamColor,
          nameOverride: `BD T6+ rescue: tier ${i + 1} (sum>${tier.threshold})`,
          order: order++,
        })
      );
    }
  }

  // Good T7 rescue — any non-bad affix at T7 (one rule per gradient tier)
  if (goodAffixIds.length > 0) {
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      rules.push(
        ruleXml({
          type: "SHOW",
          conditions: [
            affixConditionXml(
              {
                affixIds: allAffixIds,
                comparsion: "ANY",
                comparsionValue: 0,
                combinedComparsion: "MORE",
                combinedComparsionValue: tier.threshold,
              },
              "        "
            ),
            affixConditionXml(
              {
                affixIds: goodAffixIds,
                comparsion: "MORE",
                comparsionValue: 6,
                minOnTheSameItem: 1,
              },
              "        "
            ),
          ].join("\n"),
          recolor: true,
          color: tier.color,
          mapIconId: config.bdT7Style.mapIconId,
          beamOverride: true,
          beamSize: config.bdT7Style.beamSize,
          beamColor: config.bdT7Style.beamColor,
          soundId: config.bdT7Style.soundId,
          nameOverride: `Good T7 rescue: tier ${i + 1} (sum>${tier.threshold})`,
          order: order++,
        })
      );
    }
  }

  // BD T7 rescue — emphasized (one rule per gradient tier)
  if (config.buildDefiningAffixIds.length > 0) {
    for (let i = 0; i < tiers.length; i++) {
      const tier = tiers[i];
      rules.push(
        ruleXml({
          type: "SHOW",
          conditions: [
            affixConditionXml(
              {
                affixIds: allAffixIds,
                comparsion: "ANY",
                comparsionValue: 0,
                combinedComparsion: "MORE",
                combinedComparsionValue: tier.threshold,
              },
              "        "
            ),
            affixConditionXml(
              {
                affixIds: config.buildDefiningAffixIds,
                comparsion: "MORE",
                comparsionValue: 6,
                minOnTheSameItem: 1,
              },
              "        "
            ),
          ].join("\n"),
          recolor: true,
          color: tier.color,
          emphasized: true,
          mapIconId: config.bdT7Style.mapIconId,
          beamOverride: true,
          beamSize: config.bdT7Style.beamSize,
          beamColor: config.bdT7Style.beamColor,
          soundId: config.bdT7Style.soundId,
          nameOverride: `BD T7 rescue: tier ${i + 1} (sum>${tier.threshold})`,
          order: order++,
        })
      );
    }
  }

  return rules;
}

// ─── Main Generator ─────────────────────────────────────────────────────────

function generateUniqueGradient(
  tiers: UniqueLpTier[],
  startOrder: number
): string[] {
  const rules: string[] = [];

  // Fallback first (lowest Order = lowest priority, checked last)
  rules.push(
    ruleXml({
      type: "SHOW",
      conditions: rarityConditionXml(["UNIQUE"], "        "),
      soundId: Sound.DEFAULT,
      mapIconId: MapIcon.DEFAULT,
      beamOverride: false,
      nameOverride: "Unique: fallback (all uniques)",
      order: startOrder,
    })
  );

  // Tiers are provided highest-LP-first. Higher LP needs higher Order (higher
  // priority) so a 3LP item is claimed by the 3LP rule before the 1LP rule.
  // Reverse iteration: last tier (lowest LP) gets startOrder+1, first tier
  // (highest LP) gets startOrder+tiers.length.
  for (let i = tiers.length - 1; i >= 0; i--) {
    const tier = tiers[i];
    rules.push(
      ruleXml({
        type: "SHOW",
        conditions: [
          rarityConditionXml(["UNIQUE"], "        "),
          potentialConditionXml(tier.minLp, tier.minWw, "        "),
        ].join("\n"),
        emphasized: tier.emphasized,
        soundId: tier.soundId,
        mapIconId: tier.mapIconId,
        beamOverride: true,
        beamSize: tier.beamSize,
        beamColor: tier.beamColor,
        nameOverride: `Unique: ${tier.minLp}+ LP / ${tier.minWw}+ WW`,
        order: startOrder + tiers.length - i,
      })
    );
  }

  return rules;
}

export function generateFilterXml(config: FilterConfig): string {
  const allAffixIds = getAllAffixIds();
  const tiers = config.gradient.tiers;

  // Effective bad affix list: user selections + other-class affixes
  const otherClassIds = getOtherClassAffixIds(config.playerClass);
  const effectiveBadIds = [
    ...new Set([...config.badAffixIds, ...otherClassIds]),
  ];

  // Priority stack: higher Order number = higher priority (checked first by
  // the game engine). Order 0 is the bottom of the list, checked last.
  // Rules are listed here from LOWEST priority (Order 0) to HIGHEST.
  // An item is claimed by the FIRST matching rule; no subsequent rules apply.
  const allRules: string[] = [];
  let nextOrder = 0;

  // ── Hide all (catch-all, lowest priority) ──
  allRules.push(generateHideAll(nextOrder++));

  // ── Basic quality gradient ──
  const gradientRules = generateGradient(tiers, allAffixIds, config.bottomTierColor, nextOrder);
  nextOrder += gradientRules.length;
  allRules.push(...gradientRules);

  // ── BD markers (gradient with beam/icon for BD affixes) ──
  const bdMarkerRules = generateBdMarkers(
    tiers, allAffixIds, config.buildDefiningAffixIds, config, nextOrder
  );
  nextOrder += bdMarkerRules.length;
  allRules.push(...bdMarkerRules);

  // ── Hide other classes ──
  allRules.push(generateHideOtherClasses(config, nextOrder++));

  // ── Hide normals ──
  allRules.push(generateHideNormals(nextOrder++));

  // ── Hide bad affixes ──
  const badAffixHides = generateBadAffixHides(effectiveBadIds, nextOrder);
  nextOrder += badAffixHides.length;
  allRules.push(...badAffixHides);

  // ── Corrupted gradient ──
  const corruptedRules = generateCorruptedGradient(tiers, allAffixIds, config.bottomTierColor, nextOrder);
  nextOrder += corruptedRules.length;
  allRules.push(...corruptedRules);

  // ── Hide low total tiers at higher levels ──
  const totalTierHides = generateTotalTierHides(allAffixIds, nextOrder);
  nextOrder += totalTierHides.length;
  allRules.push(...totalTierHides);

  // ── Havoc candidates (above hides, below BD rescues) ──
  const havocRules = generateHavocCandidates(config, allAffixIds, nextOrder);
  nextOrder += havocRules.length;
  allRules.push(...havocRules);

  // ── BD T6+/T7 rescues + Good T7 rescue ──
  const bdRescueRules = generateBdRescues(config, allAffixIds, nextOrder);
  nextOrder += bdRescueRules.length;
  allRules.push(...bdRescueRules);

  // ── Hide wrong weapon types ──
  const weaponHides = generateHideWrongWeapons(config, nextOrder);
  nextOrder += weaponHides.length;
  allRules.push(...weaponHides);

  // ── Unique LP/WW gradient ──
  const uniqueRules = generateUniqueGradient(config.uniqueLpTiers, nextOrder);
  nextOrder += uniqueRules.length;
  allRules.push(...uniqueRules);

  // ── Show all idols ──
  allRules.push(generateShowIdols(nextOrder++));

  // ── Hide other-class idols (above show-all-idols so it takes priority) ──
  allRules.push(
    ruleXml({
      type: "HIDE",
      conditions: [
        subTypeConditionXml(ALL_IDOL_TYPES, "        "),
        classConditionXml(OTHER_CLASSES[config.playerClass], "        "),
      ].join("\n"),
      nameOverride: "Hide other-class idols",
      order: nextOrder++,
    })
  );

  // ── Show set & legendary ──
  allRules.push(generateShowSetLegendary(nextOrder++));

  // ── Show T8 affix items ──
  allRules.push(generateShowT8(allAffixIds, nextOrder++));

  // ── Custom rules zone (highest priority — user intent wins) ──
  allRules.push(
    ruleXml({
      type: "SHOW",
      conditions: "",
      nameOverride: CUSTOM_RULES_START_LABEL,
      isEnabled: false,
      order: nextOrder++,
    })
  );
  for (const rawRule of config.customRules) {
    allRules.push(injectOrderIntoRule(rawRule, nextOrder++));
  }
  allRules.push(
    ruleXml({
      type: "SHOW",
      conditions: "",
      nameOverride: CUSTOM_RULES_END_LABEL,
      isEnabled: false,
      order: nextOrder++,
    })
  );

  return `<?xml version="1.0" encoding="utf-8"?>
<ItemFilter xmlns:i="http://www.w3.org/2001/XMLSchema-instance">
  <name>${xmlEscape(config.name)}</name>
  <filterIcon>${config.filterIcon}</filterIcon>
  <filterIconColor>${config.filterIconColor}</filterIconColor>
  <description />
  <lastModifiedInVersion>1.4.1</lastModifiedInVersion>
  <lootFilterVersion>9</lootFilterVersion>
  <rules>
${allRules.join("\n")}
  </rules>
</ItemFilter>`;
}
