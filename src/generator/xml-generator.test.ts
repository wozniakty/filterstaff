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

  it("includes safety net for unique/set/legendary", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    expect(xml).toContain("UNIQUE SET LEGENDARY");
    expect(xml).not.toContain("UNIQUE SET LEGENDARY EXALTED");
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
    // No BD-specific beam sizes (LARGE/VERYLARGE/LARGEST only come from BD rules)
    expect(xml).not.toContain("<BeamSizeOverride>LARGE</BeamSizeOverride>");
    expect(xml).not.toContain("<BeamSizeOverride>VERYLARGE</BeamSizeOverride>");
    expect(xml).not.toContain("<BeamSizeOverride>LARGEST</BeamSizeOverride>");
  });

  it("generates bad affix hide rules with level gates", () => {
    const xml = generateFilterXml(makeConfig({ badAffixIds: [1, 2, 3] }));
    expect(xml).toContain("<minOnTheSameItem>3</minOnTheSameItem>");
    expect(xml).toContain("<minOnTheSameItem>2</minOnTheSameItem>");
    expect(xml).toContain("CharacterLevelCondition");
    expect(xml).toContain("<minimumLvl>40</minimumLvl>");
    expect(xml).toContain("<minimumLvl>60</minimumLvl>");
  });

  it("generates no bad affix rules when bad list is empty", () => {
    const xml = generateFilterXml(makeConfig({ badAffixIds: [] }));
    expect(xml).not.toContain("CharacterLevelCondition");
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

  it("uses combinedComparsion=ANY for presence-only checks", () => {
    const xml = generateFilterXml(DEFAULT_FILTER_CONFIG);
    // Bottom tier gradient has no threshold, should use ANY
    expect(xml).toContain("<combinedComparsion>ANY</combinedComparsion>");
    // And MORE for actual thresholds
    expect(xml).toContain("<combinedComparsion>MORE</combinedComparsion>");
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
