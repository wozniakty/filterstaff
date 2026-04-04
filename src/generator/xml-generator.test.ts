import { describe, it, expect } from "vitest";
import { generateFilterXml } from "./xml-generator";
import type { FilterConfig } from "../types";
import { DEFAULT_FILTER_CONFIG } from "../data/defaults";

function makeConfig(overrides: Partial<FilterConfig> = {}): FilterConfig {
  return { ...DEFAULT_FILTER_CONFIG, ...overrides };
}

describe("XML Generator", () => {
  it("generates valid XML with default config", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    expect(xml).toContain('<?xml version="1.0" encoding="utf-8"?>');
    expect(xml).toContain("<ItemFilter");
    expect(xml).toContain("</ItemFilter>");
    expect(xml).toContain("<lootFilterVersion>9</lootFilterVersion>");
  });

  it("includes hide-all catch-all rule", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    expect(xml).toContain("<type>HIDE</type>");
    expect(xml).toContain("<conditions />");
  });

  it("includes safety net for set/legendary (unique handled by LP gradient)", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    expect(xml).toContain("<rarity>SET LEGENDARY</rarity>");
    expect(xml).not.toContain("<rarity>UNIQUE SET LEGENDARY</rarity>");
  });

  it("includes idol show rule with IDOL_ALTAR", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    expect(xml).toContain("IDOL_ALTAR");
    expect(xml).toContain("IDOL_1x1_ETERRA");
    expect(xml).toContain("IDOL_2x2");
  });

  it("generates gradient rules with correct thresholds", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    expect(xml).toContain("<combinedComparsionValue>6</combinedComparsionValue>");
    expect(xml).toContain("<combinedComparsionValue>10</combinedComparsionValue>");
    expect(xml).toContain("<combinedComparsionValue>14</combinedComparsionValue>");
    expect(xml).toContain("<combinedComparsionValue>18</combinedComparsionValue>");
    expect(xml).toContain("<combinedComparsionValue>22</combinedComparsionValue>");
  });

  it("hides other classes based on player class", () => {
    const xml = generateFilterXml(makeConfig({ playerClass: "Rogue" }));
    expect(xml).toContain("Primalist Mage Sentinel Acolyte");
  });

  it("hides non-selected weapon types", () => {
    const xml = generateFilterXml(
      makeConfig({ weaponTypes: ["BOW", "QUIVER"] })
    );
    expect(xml).toContain("ONE_HANDED_SWORD");
    expect(xml).not.toContain(
      "<EquipmentType>BOW</EquipmentType>\n" +
        "            <EquipmentType>ONE_HANDED_SWORD</EquipmentType>"
    );
  });

  it("generates BD marker rules when BD affixes are set", () => {
    const xml = generateFilterXml(
      makeConfig({ buildDefiningAffixIds: [50, 100] })
    );
    // Should have beam override on BD marker rules
    const beamMatches = xml.match(/<BeamOverride>true<\/BeamOverride>/g);
    expect(beamMatches).not.toBeNull();
    expect(beamMatches!.length).toBeGreaterThan(0);
    // BD affix IDs should appear in conditions
    expect(xml).toContain("<int>50</int>");
    expect(xml).toContain("<int>100</int>");
  });

  it("generates no BD rules when BD list is empty", () => {
    const xml = generateFilterXml(
      makeConfig({ buildDefiningAffixIds: [] })
    );
    // No BD-specific beams (VERYLARGE only comes from BD T6 rescue)
    expect(xml).not.toContain("<BeamSizeOverride>VERYLARGE</BeamSizeOverride>");
    // BD marker and BD T7 rescue names should not appear
    expect(xml).not.toContain("BD marker:");
    expect(xml).not.toContain("BD T6+ rescue:");
    expect(xml).not.toContain("BD T7 rescue:");
  });

  it("generates bad affix hide rules with level gates", () => {
    const xml = generateFilterXml(makeConfig({ badAffixIds: [1, 2, 3] }));
    expect(xml).toContain("<minOnTheSameItem>3</minOnTheSameItem>");
    expect(xml).toContain("<minOnTheSameItem>2</minOnTheSameItem>");
    expect(xml).toContain("CharacterLevelCondition");
    expect(xml).toContain("<minimumLvl>40</minimumLvl>");
    expect(xml).toContain("<minimumLvl>60</minimumLvl>");
  });

  it("auto-includes other-class affixes as bad even when bad list is empty", () => {
    const xml = generateFilterXml(makeConfig({ badAffixIds: [] }));
    // Other-class affixes are auto-added to bad list, so bad-affix rules exist
    expect(xml).toContain("<minOnTheSameItem>3</minOnTheSameItem>");
    expect(xml).toContain("<minOnTheSameItem>2</minOnTheSameItem>");
  });

  it("uses advanced=false for simple presence checks", () => {
    const xml = generateFilterXml(
      makeConfig({ buildDefiningAffixIds: [50] })
    );
    expect(xml).toContain("<advanced>false</advanced>");
  });

  it("uses advanced=true for tier threshold checks", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    expect(xml).toContain("<advanced>true</advanced>");
  });

  it("generates corrupted gradient rules", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    expect(xml).toContain("OnlyCorrupted");
  });

  it("preserves game typo 'comparsion'", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    expect(xml).toContain("<comparsion>");
    expect(xml).toContain("<combinedComparsion>");
    expect(xml).not.toContain("<comparison>");
  });

  it("includes all deprecated fields", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    expect(xml).toContain("<levelDependent_deprecated>");
    expect(xml).toContain("<minLvl_deprecated>");
    expect(xml).toContain("<maxLvl_deprecated>");
  });

  it("generates nameOverride on all rules", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    // Every Rule should have a nameOverride (non-empty)
    const ruleCount = (xml.match(/<Rule>/g) || []).length;
    const nameCount = (xml.match(/<nameOverride>[^<]+<\/nameOverride>/g) || []).length;
    expect(nameCount).toBe(ruleCount);
  });

  it("generates unique LP/WW gradient tiers", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    // PotentialCondition should appear for each LP tier
    expect(xml).toContain("PotentialCondition");
    expect(xml).toContain("<MinLegendaryPotential>3</MinLegendaryPotential>");
    expect(xml).toContain("<MinLegendaryPotential>2</MinLegendaryPotential>");
    expect(xml).toContain("<MinLegendaryPotential>1</MinLegendaryPotential>");
    expect(xml).toContain("<MinWeaversWill>20</MinWeaversWill>");
    expect(xml).toContain("<MinWeaversWill>17</MinWeaversWill>");
    expect(xml).toContain("<MinWeaversWill>14</MinWeaversWill>");
  });

  it("generates unique fallback rule for 0LP uniques", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    expect(xml).toContain("Unique: fallback (all uniques)");
  });

  it("unique LP tiers sit above BD rescues in priority", () => {
    const xml = generateFilterXml(
      makeConfig({ buildDefiningAffixIds: [50] })
    );
    const uniqueOrder = xml.match(/Unique: 3\+ LP[\s\S]*?<Order>(\d+)<\/Order>/);
    const bdOrder = xml.match(/BD T6\+ rescue[\s\S]*?<Order>(\d+)<\/Order>/);
    expect(uniqueOrder).not.toBeNull();
    expect(bdOrder).not.toBeNull();
    // Higher order = higher priority (checked first)
    expect(Number(uniqueOrder![1])).toBeGreaterThan(Number(bdOrder![1]));
  });

  it("uses combinedComparsion=ANY for presence-only checks", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    // Bottom tier gradient has no threshold, should use ANY
    expect(xml).toContain("<combinedComparsion>ANY</combinedComparsion>");
    // And MORE for actual thresholds
    expect(xml).toContain("<combinedComparsion>MORE</combinedComparsion>");
  });

  it("includes custom rules sentinel markers", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    expect(xml).toContain("--- CUSTOM RULES START ---");
    expect(xml).toContain("--- CUSTOM RULES END ---");
  });

  it("sentinel rules are disabled", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    // Find sentinel rules and check isEnabled
    const startSentinel = xml.match(
      /--- CUSTOM RULES START ---[\s\S]*?<\/Rule>/
    );
    const endSentinel = xml.match(
      /--- CUSTOM RULES END ---[\s\S]*?<\/Rule>/
    );
    expect(startSentinel).not.toBeNull();
    expect(endSentinel).not.toBeNull();
    // Walk backwards from nameOverride to find the isEnabled in the same Rule
    const startRule = xml.slice(
      xml.lastIndexOf("<Rule>", xml.indexOf("--- CUSTOM RULES START ---")),
      xml.indexOf("</Rule>", xml.indexOf("--- CUSTOM RULES START ---")) + 7
    );
    expect(startRule).toContain("<isEnabled>false</isEnabled>");
  });

  it("sentinels sit above unique gradient in priority", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    const startOrder = xml.match(
      /--- CUSTOM RULES START ---[\s\S]*?<Order>(\d+)<\/Order>/
    );
    const uniqueOrder = xml.match(
      /Unique: 3\+ LP[\s\S]*?<Order>(\d+)<\/Order>/
    );
    expect(startOrder).not.toBeNull();
    expect(uniqueOrder).not.toBeNull();
    expect(Number(startOrder![1])).toBeGreaterThan(Number(uniqueOrder![1]));
  });

  it("sentinels sit above safety nets in priority", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    const startOrder = xml.match(
      /--- CUSTOM RULES START ---[\s\S]*?<Order>(\d+)<\/Order>/
    );
    const safetyOrder = xml.match(
      /Show all set[\s\S]*?<Order>(\d+)<\/Order>/
    );
    expect(startOrder).not.toBeNull();
    expect(safetyOrder).not.toBeNull();
    expect(Number(startOrder![1])).toBeGreaterThan(Number(safetyOrder![1]));
  });

  it("includes stored custom rules between sentinels with correct Order values", () => {
    const customRule = `    <Rule>
      <type>SHOW</type>
      <conditions />
      <recolor>true</recolor>
      <color>5</color>
      <isEnabled>true</isEnabled>
      <levelDependent_deprecated>false</levelDependent_deprecated>
      <minLvl_deprecated>0</minLvl_deprecated>
      <maxLvl_deprecated>0</maxLvl_deprecated>
      <emphasized>false</emphasized>
      <nameOverride>Test Custom</nameOverride>
      <SoundId>1</SoundId>
      <MapIconId>1</MapIconId>
      <BeamOverride>true</BeamOverride>
      <BeamSizeOverride>NONE</BeamSizeOverride>
      <BeamColorOverride>0</BeamColorOverride>
    </Rule>`;

    const xml = generateFilterXml(makeConfig({ customRules: [customRule] }));
    expect(xml).toContain("Test Custom");

    // Verify Order is between sentinels
    const startOrder = Number(
      xml.match(/--- CUSTOM RULES START ---[\s\S]*?<Order>(\d+)<\/Order>/)![1]
    );
    const customOrder = Number(
      xml.match(/Test Custom[\s\S]*?<Order>(\d+)<\/Order>/)![1]
    );
    const endOrder = Number(
      xml.match(/--- CUSTOM RULES END ---[\s\S]*?<Order>(\d+)<\/Order>/)![1]
    );
    expect(customOrder).toBeGreaterThan(startOrder);
    expect(customOrder).toBeLessThan(endOrder);
  });
});

describe("Config round-trip", () => {
  it("export and import produce equivalent selections", () => {
    const original = makeConfig({
      name: "TestFilter",
      playerClass: "Mage",
      weaponTypes: ["WAND", "CATALYST"],
      buildDefiningAffixIds: [50, 100, 200],
      badAffixIds: [1, 2, 3, 4],
    });

    // Simulate export (same as ExportStep's handleExportConfig)
    const exported = JSON.stringify({
      name: original.name,
      playerClass: original.playerClass,
      weaponTypes: original.weaponTypes,
      buildDefiningAffixIds: original.buildDefiningAffixIds,
      badAffixIds: original.badAffixIds,
    });

    // Simulate import (same as useFilterConfig's importConfig)
    const parsed = JSON.parse(exported);
    const imported: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      name: parsed.name ?? DEFAULT_FILTER_CONFIG.name,
      playerClass: parsed.playerClass ?? DEFAULT_FILTER_CONFIG.playerClass,
      weaponTypes: parsed.weaponTypes ?? DEFAULT_FILTER_CONFIG.weaponTypes,
      buildDefiningAffixIds: parsed.buildDefiningAffixIds ?? [],
      badAffixIds: parsed.badAffixIds ?? [],
    };

    expect(imported.name).toBe(original.name);
    expect(imported.playerClass).toBe(original.playerClass);
    expect(imported.weaponTypes).toEqual(original.weaponTypes);
    expect(imported.buildDefiningAffixIds).toEqual(
      original.buildDefiningAffixIds
    );
    expect(imported.badAffixIds).toEqual(original.badAffixIds);
  });

  it("import with missing fields falls back to defaults", () => {
    const partial = JSON.stringify({ name: "Partial" });
    const parsed = JSON.parse(partial);
    const imported: FilterConfig = {
      ...DEFAULT_FILTER_CONFIG,
      name: parsed.name ?? DEFAULT_FILTER_CONFIG.name,
      playerClass: parsed.playerClass ?? DEFAULT_FILTER_CONFIG.playerClass,
      weaponTypes: parsed.weaponTypes ?? DEFAULT_FILTER_CONFIG.weaponTypes,
      buildDefiningAffixIds: parsed.buildDefiningAffixIds ?? [],
      badAffixIds: parsed.badAffixIds ?? [],
    };

    expect(imported.name).toBe("Partial");
    expect(imported.playerClass).toBe(DEFAULT_FILTER_CONFIG.playerClass);
    expect(imported.weaponTypes).toEqual(DEFAULT_FILTER_CONFIG.weaponTypes);
    expect(imported.buildDefiningAffixIds).toEqual([]);
    expect(imported.badAffixIds).toEqual([]);
  });

  it("XML output is deterministic for same config", () => {
    const config = makeConfig({
      buildDefiningAffixIds: [50, 100],
      badAffixIds: [1, 2],
    });
    const xml1 = generateFilterXml(config);
    const xml2 = generateFilterXml(config);
    expect(xml1).toBe(xml2);
  });
});
