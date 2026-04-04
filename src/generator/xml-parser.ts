export const CUSTOM_RULES_START_LABEL = "--- CUSTOM RULES START ---";
export const CUSTOM_RULES_END_LABEL = "--- CUSTOM RULES END ---";

const RULE_REGEX = /<Rule>[\s\S]*?<\/Rule>/g;
const ORDER_REGEX = /<Order>(\d+)<\/Order>/;
const NAME_OVERRIDE_REGEX = /<nameOverride>([\s\S]*?)<\/nameOverride>/;

/**
 * Extract custom rules from filter XML by finding rules whose Order falls
 * strictly between the START and END sentinel rules. Returns raw rule XML
 * strings with the <Order> tag stripped, sorted by original Order ascending.
 *
 * Cannot rely on document order — the game may serialize rules in any order.
 */
export function extractCustomRules(xmlString: string): string[] {
  const blocks = xmlString.match(RULE_REGEX);
  if (!blocks) return [];

  let startOrder: number | null = null;
  let endOrder: number | null = null;

  interface ParsedRule {
    xml: string;
    order: number;
  }

  const allRules: ParsedRule[] = [];

  for (const block of blocks) {
    const nameMatch = block.match(NAME_OVERRIDE_REGEX);
    const orderMatch = block.match(ORDER_REGEX);
    const name = nameMatch?.[1] ?? "";
    const order = orderMatch ? Number(orderMatch[1]) : -1;

    if (name === CUSTOM_RULES_START_LABEL) {
      startOrder = order;
    } else if (name === CUSTOM_RULES_END_LABEL) {
      endOrder = order;
    } else {
      allRules.push({ xml: block, order });
    }
  }

  if (startOrder === null || endOrder === null) return [];

  const lo = Math.min(startOrder, endOrder);
  const hi = Math.max(startOrder, endOrder);
  // Sort so lowest-priority (closest to start sentinel) comes first in the array,
  // matching the order our generator expects when assigning increasing Order values.
  const ascending = startOrder < endOrder;

  return allRules
    .filter((r) => r.order > lo && r.order < hi)
    .sort((a, b) => ascending ? a.order - b.order : b.order - a.order)
    .map((r) => r.xml.replace(ORDER_REGEX, "").replace(/\n\s*\n/, "\n"));
}

/**
 * Insert an <Order> tag into a raw rule XML string (that had its Order stripped).
 * Places it just before the closing </Rule> tag.
 */
export function injectOrderIntoRule(ruleXml: string, order: number): string {
  return ruleXml.replace(
    "</Rule>",
    `      <Order>${order}</Order>\n    </Rule>`
  );
}

/** Lightweight summary of a custom rule extracted from raw XML via regex. */
export interface CustomRuleSummary {
  type: "SHOW" | "HIDE";
  name: string;
  enabled: boolean;
  conditionTypes: string[];
  affixCount: number;
  equipmentTypes: string[];
}

/** Extract a display-friendly summary from a raw rule XML string. */
export function summarizeRule(ruleXml: string): CustomRuleSummary {
  const type = (ruleXml.match(/<type>(SHOW|HIDE)<\/type>/)?.[1] ?? "SHOW") as "SHOW" | "HIDE";
  const nameMatch = ruleXml.match(/<nameOverride>([\s\S]*?)<\/nameOverride>/);
  const name = nameMatch?.[1] || "";
  const enabled = !ruleXml.includes("<isEnabled>false</isEnabled>");
  const conditionTypes = [...ruleXml.matchAll(/i:type="(\w+)"/g)].map((m) => m[1]);
  const affixCount = (ruleXml.match(/<int>\d+<\/int>/g) || []).length;
  const equipmentTypes = [...ruleXml.matchAll(/<EquipmentType>(\w+)<\/EquipmentType>/g)].map((m) => m[1]);

  return { type, name, enabled, conditionTypes, affixCount, equipmentTypes };
}
