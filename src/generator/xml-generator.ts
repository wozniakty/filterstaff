import type {
  FilterConfig,
  GradientTier,
  BeamSize,
  EquipmentType,
  IdolType,
} from "../types";
import { OTHER_CLASSES } from "../data/classes";
import { ALL_IDOL_TYPES } from "../data/equipment-types";
import { ALL_WEAPON_TYPES } from "../data/equipment-types";
import { HIDE_LEVEL_GATES, TOTAL_TIER_HIDE_GATES } from "../data/defaults";
import { Sound, MapIcon } from "../data/styling";
import affixData from "../data/affixes.json";

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

function corruptionConditionXml(indent: string): string {
  return `${indent}<Condition i:type="CorruptionCondition">
${indent}  <Corruption>OnlyCorrupted</Corruption>
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
      <isEnabled>true</isEnabled>
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

function generateLayer0HideAll(order: number): string {
  return ruleXml({
    type: "HIDE",
    conditions: "",
    order,
  });
}

function generateLayer1Gradient(
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
        order: startOrder + 1 + (tiers.length - 1 - i),
      })
    );
  });

  return rules;
}

function generateLayer2BdMarkers(
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
        order: startOrder + 1 + (tiers.length - 1 - i),
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
        order: startOrder + 1 + (tiers.length - 1 - i),
      })
    );
  });

  return rules;
}

function generateLayer3BadAffixHides(
  config: FilterConfig,
  startOrder: number
): string[] {
  const rules: string[] = [];
  let order = startOrder;

  // Hide other classes (always)
  rules.push(
    ruleXml({
      type: "HIDE",
      conditions: classConditionXml(
        OTHER_CLASSES[config.playerClass],
        "        "
      ),
      order: order++,
    })
  );

  // Hide wrong weapon types (always)
  const weaponsToHide = ALL_WEAPON_TYPES.filter(
    (w) => !config.weaponTypes.includes(w)
  );
  if (weaponsToHide.length > 0) {
    rules.push(
      ruleXml({
        type: "HIDE",
        conditions: subTypeConditionXml(weaponsToHide, "        "),
        order: order++,
      })
    );
  }

  // Hide normal rarity (always)
  rules.push(
    ruleXml({
      type: "HIDE",
      conditions: rarityConditionXml(["NORMAL"], "        "),
      order: order++,
    })
  );

  // Progressive bad affix hides (only if bad affixes are defined)
  if (config.badAffixIds.length > 0) {
    // Hide 3+ bad affixes (always)
    rules.push(
      ruleXml({
        type: "HIDE",
        conditions: affixConditionXml(
          {
            affixIds: config.badAffixIds,
            minOnTheSameItem: 3,
          },
          "        "
        ),
        order: order++,
      })
    );

    // Hide 2+ bad affixes (level 20+)
    rules.push(
      ruleXml({
        type: "HIDE",
        conditions: [
          affixConditionXml(
            {
              affixIds: config.badAffixIds,
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
        order: order++,
      })
    );

    // Hide 1+ bad at T5+ (level 40+)
    rules.push(
      ruleXml({
        type: "HIDE",
        conditions: [
          affixConditionXml(
            {
              affixIds: config.badAffixIds,
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
        order: order++,
      })
    );
  }

  return rules;
}

function generateLayer3TotalTierHides(
  allAffixIds: number[],
  startOrder: number
): string[] {
  const rules: string[] = [];
  let order = startOrder;

  // Progressive total-tier hides — stricter gates checked first (higher priority)
  // Iterate in reverse so the highest level/threshold rule gets the lowest order number.
  for (let i = TOTAL_TIER_HIDE_GATES.length - 1; i >= 0; i--) {
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
        order: order++,
      })
    );
  }

  return rules;
}

function generateLayer4SafetyNetsAndRescues(
  config: FilterConfig,
  allAffixIds: number[],
  startOrder: number
): string[] {
  const rules: string[] = [];
  let order = startOrder;
  const tiers = config.gradient.tiers;

  // BD T6+ rescue (5 rules, one per gradient tier)
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
          order: order++,
        })
      );
    }

    // BD T7 rescue (5 rules, one per gradient tier)
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
          mapIconId: config.bdT7Style.mapIconId,
          beamOverride: true,
          beamSize: config.bdT7Style.beamSize,
          beamColor: config.bdT7Style.beamColor,
          soundId: config.bdT7Style.soundId,
          order: order++,
        })
      );
    }
  }

  // Show all idols — keep game defaults for styling
  rules.push(
    ruleXml({
      type: "SHOW",
      conditions: subTypeConditionXml(ALL_IDOL_TYPES, "        "),
      soundId: Sound.DEFAULT,
      mapIconId: MapIcon.DEFAULT,
      beamOverride: false,
      order: order++,
    })
  );

  // Show unique/set/legendary (absolute top safety net)
  // Uses DEFAULT to preserve game's native styling
  rules.push(
    ruleXml({
      type: "SHOW",
      conditions: rarityConditionXml(
        ["UNIQUE", "SET", "LEGENDARY"],
        "        "
      ),
      soundId: Sound.DEFAULT,
      mapIconId: MapIcon.DEFAULT,
      beamOverride: false,
      order: order++,
    })
  );

  return rules;
}

// ─── Main Generator ─────────────────────────────────────────────────────────

export function generateFilterXml(config: FilterConfig): string {
  const allAffixIds = getAllAffixIds();
  const tiers = config.gradient.tiers;

  // Build all rules, tracking order.
  // Order 0 = highest priority (top), highest order = lowest priority (bottom).
  // We build bottom-up: Layer 0 gets the highest order number.

  let nextOrder = 0;

  // Layer 4: Safety nets & rescues (highest priority = lowest order numbers)
  const layer4Rules = generateLayer4SafetyNetsAndRescues(
    config,
    allAffixIds,
    nextOrder
  );
  nextOrder += layer4Rules.length;

  // Layer 3b: Progressive total-tier hides (highest priority among Layer 3).
  // Sits above corrupted gradient so low-tier corrupted items (uncraftable)
  // get hidden rather than uselessly colored.
  const layer3bRules = generateLayer3TotalTierHides(allAffixIds, nextOrder);
  nextOrder += layer3bRules.length;

  // Corrupted gradient: decent corrupted items get gradient coloring.
  // Below total-tier hides (junk corrupted hidden) but above bad-affix hides
  // (bad affix composition is irrelevant on uncraftable items).
  const corruptedRules = generateCorruptedGradient(tiers, allAffixIds, config.bottomTierColor, nextOrder);
  nextOrder += corruptedRules.length;

  // Layer 3a: Class/weapon/rarity/bad-affix hides (below corrupted gradient)
  const layer3aRules = generateLayer3BadAffixHides(config, nextOrder);
  nextOrder += layer3aRules.length;

  // Layer 2: BD markers
  const layer2Rules = generateLayer2BdMarkers(
    tiers,
    allAffixIds,
    config.buildDefiningAffixIds,
    config,
    nextOrder
  );
  nextOrder += layer2Rules.length;

  // Layer 1: Quality gradient
  const layer1Rules = generateLayer1Gradient(tiers, allAffixIds, config.bottomTierColor, nextOrder);
  nextOrder += layer1Rules.length;

  // Layer 0: Hide all (lowest priority = highest order number)
  const layer0Rule = generateLayer0HideAll(nextOrder);

  // Combine all rules. XML order doesn't matter (Order field determines priority),
  // but we write them bottom-to-top for readability matching the Bow Rogue style.
  const allRules = [
    layer0Rule,
    ...layer1Rules,
    ...layer2Rules,
    ...layer3aRules,
    ...corruptedRules,
    ...layer3bRules,
    ...layer4Rules,
  ];

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
