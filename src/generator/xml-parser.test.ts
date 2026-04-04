import { describe, it, expect } from "vitest";
import { extractCustomRules, injectOrderIntoRule } from "./xml-parser";
import { generateFilterXml } from "./xml-generator";
import { DEFAULT_FILTER_CONFIG } from "../data/defaults";
import type { FilterConfig } from "../types";

function makeConfig(overrides: Partial<FilterConfig> = {}): FilterConfig {
  return { ...DEFAULT_FILTER_CONFIG, ...overrides };
}

describe("injectOrderIntoRule", () => {
  it("inserts Order tag before closing Rule tag", () => {
    const raw = `    <Rule>
      <type>SHOW</type>
      <conditions />
    </Rule>`;
    const result = injectOrderIntoRule(raw, 42);
    expect(result).toContain("<Order>42</Order>");
    expect(result).toContain("</Rule>");
    // Order should come before </Rule>
    const orderIdx = result.indexOf("<Order>42</Order>");
    const closeIdx = result.indexOf("</Rule>");
    expect(orderIdx).toBeLessThan(closeIdx);
  });
});

describe("extractCustomRules", () => {
  it("returns empty array when no sentinels present", () => {
    const xml = `<ItemFilter><rules><Rule><Order>0</Order></Rule></rules></ItemFilter>`;
    expect(extractCustomRules(xml)).toEqual([]);
  });

  it("returns empty array when sentinels present but no custom rules between them", () => {
    const xml = generateFilterXml(makeConfig());
    const rules = extractCustomRules(xml);
    expect(rules).toEqual([]);
  });

  it("extracts a single custom rule between sentinels", () => {
    // Generate XML, then inject a custom rule between sentinels
    const xml = generateFilterXml(makeConfig());
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
      <nameOverride>My Custom Rule</nameOverride>
      <SoundId>1</SoundId>
      <MapIconId>1</MapIconId>
      <BeamOverride>true</BeamOverride>
      <BeamSizeOverride>NONE</BeamSizeOverride>
      <BeamColorOverride>0</BeamColorOverride>
      <Order>ORDER_PLACEHOLDER</Order>
    </Rule>`;

    // Find the START sentinel's Order and inject a custom rule with Order = start + 1
    const startMatch = xml.match(
      /--- CUSTOM RULES START ---[\s\S]*?<Order>(\d+)<\/Order>/
    );
    const endMatch = xml.match(
      /--- CUSTOM RULES END ---[\s\S]*?<Order>(\d+)<\/Order>/
    );
    expect(startMatch).not.toBeNull();
    expect(endMatch).not.toBeNull();

    const startOrder = Number(startMatch![1]);
    const injectedOrder = startOrder + 1;
    const newEndOrder = Number(endMatch![1]) + 1;

    // Replace END sentinel order to make room
    let modifiedXml = xml.replace(
      endMatch![0],
      endMatch![0].replace(
        `<Order>${endMatch![1]}</Order>`,
        `<Order>${newEndOrder}</Order>`
      )
    );
    // Also bump all rules above the end sentinel
    // Simpler: just insert the custom rule XML right after the START sentinel rule
    const startRuleEnd = modifiedXml.indexOf(
      "</Rule>",
      modifiedXml.indexOf("--- CUSTOM RULES START ---")
    );
    const ruleWithOrder = customRule.replace(
      "ORDER_PLACEHOLDER",
      String(injectedOrder)
    );
    modifiedXml =
      modifiedXml.slice(0, startRuleEnd + 7) +
      "\n" +
      ruleWithOrder +
      modifiedXml.slice(startRuleEnd + 7);

    const extracted = extractCustomRules(modifiedXml);
    expect(extracted).toHaveLength(1);
    expect(extracted[0]).toContain("My Custom Rule");
    expect(extracted[0]).not.toContain("<Order>");
  });

  it("preserves relative order of multiple custom rules", () => {
    // Generate with 3 custom rules — they get sequential Order values
    const customRules = [1, 2, 3].map(
      (n) => `    <Rule>
      <type>SHOW</type>
      <conditions />
      <recolor>false</recolor>
      <color>0</color>
      <isEnabled>true</isEnabled>
      <levelDependent_deprecated>false</levelDependent_deprecated>
      <minLvl_deprecated>0</minLvl_deprecated>
      <maxLvl_deprecated>0</maxLvl_deprecated>
      <emphasized>false</emphasized>
      <nameOverride>Custom ${n}</nameOverride>
      <SoundId>1</SoundId>
      <MapIconId>1</MapIconId>
      <BeamOverride>true</BeamOverride>
      <BeamSizeOverride>NONE</BeamSizeOverride>
      <BeamColorOverride>0</BeamColorOverride>
    </Rule>`
    );

    const xml = generateFilterXml(makeConfig({ customRules }));

    // Now shuffle the Rule blocks in the XML to simulate game reordering document order
    // Extract all <Rule>...</Rule> blocks, reverse them, rejoin
    const ruleBlocks = xml.match(/<Rule>[\s\S]*?<\/Rule>/g)!;
    const reversed = [...ruleBlocks].reverse();
    let shuffledXml = xml;
    for (let i = 0; i < ruleBlocks.length; i++) {
      shuffledXml = shuffledXml.replace(ruleBlocks[i], `__PLACEHOLDER_${i}__`);
    }
    for (let i = 0; i < ruleBlocks.length; i++) {
      shuffledXml = shuffledXml.replace(`__PLACEHOLDER_${i}__`, reversed[i]);
    }

    const extracted = extractCustomRules(shuffledXml);
    expect(extracted).toHaveLength(3);
    // Should be sorted by original Order ascending regardless of document order
    expect(extracted[0]).toContain("Custom 1");
    expect(extracted[1]).toContain("Custom 2");
    expect(extracted[2]).toContain("Custom 3");
  });

  it("round-trips custom rules through generate → extract", () => {
    // First generate with no custom rules and extract a "fake" custom rule
    const fakeRule = `    <Rule>
      <type>SHOW</type>
      <conditions />
      <recolor>true</recolor>
      <color>7</color>
      <isEnabled>true</isEnabled>
      <levelDependent_deprecated>false</levelDependent_deprecated>
      <minLvl_deprecated>0</minLvl_deprecated>
      <maxLvl_deprecated>0</maxLvl_deprecated>
      <emphasized>true</emphasized>
      <nameOverride>My Saved Rule</nameOverride>
      <SoundId>3</SoundId>
      <MapIconId>2</MapIconId>
      <BeamOverride>true</BeamOverride>
      <BeamSizeOverride>LARGE</BeamSizeOverride>
      <BeamColorOverride>5</BeamColorOverride>
    </Rule>`;

    // Generate with the custom rule stored in config
    const config = makeConfig({ customRules: [fakeRule] });
    const xml = generateFilterXml(config);

    // Extract it back
    const extracted = extractCustomRules(xml);
    expect(extracted).toHaveLength(1);
    expect(extracted[0]).toContain("My Saved Rule");
    expect(extracted[0]).toContain("<color>7</color>");
    expect(extracted[0]).not.toContain("<Order>");

    // Generate again with the extracted rule and verify determinism
    const config2 = makeConfig({ customRules: extracted });
    const xml2 = generateFilterXml(config2);
    const extracted2 = extractCustomRules(xml2);
    expect(extracted2).toEqual(extracted);
  });

  it("multi-rule round-trip preserves order: generate → extract → generate → extract", () => {
    const names = ["Alpha", "Bravo", "Charlie", "Delta"];
    const customRules = names.map(
      (name) => `    <Rule>
      <type>SHOW</type>
      <conditions />
      <recolor>false</recolor>
      <color>0</color>
      <isEnabled>true</isEnabled>
      <levelDependent_deprecated>false</levelDependent_deprecated>
      <minLvl_deprecated>0</minLvl_deprecated>
      <maxLvl_deprecated>0</maxLvl_deprecated>
      <emphasized>false</emphasized>
      <nameOverride>${name}</nameOverride>
      <SoundId>1</SoundId>
      <MapIconId>1</MapIconId>
      <BeamOverride>true</BeamOverride>
      <BeamSizeOverride>NONE</BeamSizeOverride>
      <BeamColorOverride>0</BeamColorOverride>
    </Rule>`
    );

    // Generate XML with 4 custom rules
    const xml = generateFilterXml(makeConfig({ customRules }));
    // Extract them back
    const extracted = extractCustomRules(xml);
    expect(extracted).toHaveLength(4);

    // Verify order matches input
    const extractedNames = extracted.map(
      (r) => r.match(/<nameOverride>(.*?)<\/nameOverride>/)![1]
    );
    expect(extractedNames).toEqual(names);
  });

  it("double round-trip: generate → extract → generate → extract → generate → extract", () => {
    const names = ["Alpha", "Bravo", "Charlie", "Delta"];
    const customRules = names.map(
      (name) => `    <Rule>
      <type>SHOW</type>
      <conditions />
      <recolor>false</recolor>
      <color>0</color>
      <isEnabled>true</isEnabled>
      <levelDependent_deprecated>false</levelDependent_deprecated>
      <minLvl_deprecated>0</minLvl_deprecated>
      <maxLvl_deprecated>0</maxLvl_deprecated>
      <emphasized>false</emphasized>
      <nameOverride>${name}</nameOverride>
      <SoundId>1</SoundId>
      <MapIconId>1</MapIconId>
      <BeamOverride>true</BeamOverride>
      <BeamSizeOverride>NONE</BeamSizeOverride>
      <BeamColorOverride>0</BeamColorOverride>
    </Rule>`
    );

    // Round-trip 1
    const xml1 = generateFilterXml(makeConfig({ customRules }));
    const extracted1 = extractCustomRules(xml1);

    // Round-trip 2
    const xml2 = generateFilterXml(makeConfig({ customRules: extracted1 }));
    const extracted2 = extractCustomRules(xml2);

    // Round-trip 3
    const xml3 = generateFilterXml(makeConfig({ customRules: extracted2 }));
    const extracted3 = extractCustomRules(xml3);

    const getName = (r: string) =>
      r.match(/<nameOverride>(.*?)<\/nameOverride>/)![1];

    expect(extracted1.map(getName)).toEqual(names);
    expect(extracted2.map(getName)).toEqual(names);
    expect(extracted3.map(getName)).toEqual(names);
  });
});
