import { useState, useMemo } from "react";
import type { Affix, AffixCategory } from "../types";
import affixData from "../data/affixes.json";
import categoryData from "../data/affix-categories.json";

interface Props {
  buildDefiningIds: number[];
  badIds: number[];
  getCategory: (id: number) => AffixCategory;
  onCycle: (id: number) => void;
  onSetCategory: (id: number, cat: AffixCategory) => void;
  onSetCategoryBulk: (ids: number[], cat: AffixCategory) => void;
}

const CATEGORY_COLORS: Record<AffixCategory, string> = {
  "build-defining": "var(--bd-color)",
  bad: "var(--bad-color)",
  unlabeled: "transparent",
};

const CATEGORY_LABELS: Record<AffixCategory, string> = {
  "build-defining": "BD",
  bad: "BAD",
  unlabeled: "",
};

interface CategoryGroup {
  name: string;
  section: string;
  subCategory: string;
  affixes: Affix[];
}

function buildCategoryGroups(allAffixes: Affix[]): CategoryGroup[] {
  const affixMap = new Map(allAffixes.map((a) => [a.id, a]));
  const categorized = new Set<number>();

  const idolSections = new Set(["IDOLS"]);

  const groups: CategoryGroup[] = (
    categoryData as { name: string; ids: number[] }[]
  )
    .filter((cat) => {
      const section = cat.name.split(" - ")[0] || cat.name;
      return !idolSections.has(section);
    })
    .map((cat) => {
      const parts = cat.name.split(" - ");
      const section = parts[0] || cat.name;
      const subCategory = parts[1] || cat.name;
      const affixes = cat.ids
        .map((id) => affixMap.get(id))
        .filter(Boolean) as Affix[];
      cat.ids.forEach((id) => categorized.add(id));
      return { name: cat.name, section, subCategory, affixes };
    });

  // Add uncategorized non-idol affixes
  const uncategorized = allAffixes.filter(
    (a) => !a.isIdol && !categorized.has(a.id)
  );
  if (uncategorized.length > 0) {
    groups.push({
      name: "OTHER - UNCATEGORIZED",
      section: "OTHER",
      subCategory: "UNCATEGORIZED",
      affixes: uncategorized,
    });
  }

  return groups;
}

export function AffixPicker({
  buildDefiningIds,
  badIds,
  getCategory,
  onCycle,
  onSetCategory,
  onSetCategoryBulk,
}: Props) {
  const [search, setSearch] = useState("");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(
    new Set()
  );

  const allAffixes = affixData as Affix[];
  const groups = useMemo(() => buildCategoryGroups(allAffixes), [allAffixes]);

  const filteredGroups = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return groups;
    return groups
      .map((g) => ({
        ...g,
        affixes: g.affixes.filter((a) => a.name.toLowerCase().includes(term)),
      }))
      .filter((g) => g.affixes.length > 0);
  }, [groups, search]);

  const totalFiltered = filteredGroups.reduce(
    (sum, g) => sum + g.affixes.length,
    0
  );

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  // Group the category groups by section
  const sections = useMemo(() => {
    const map = new Map<string, CategoryGroup[]>();
    for (const g of filteredGroups) {
      const list = map.get(g.section) || [];
      list.push(g);
      map.set(g.section, list);
    }
    return map;
  }, [filteredGroups]);

  return (
    <div style={{ display: "flex", gap: "1.5rem", minHeight: 500 }}>
      {/* Left: Browse & Search */}
      <div style={{ flex: 1 }}>
        <input
          type="text"
          placeholder="Search affixes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem 0.75rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            color: "var(--text-primary)",
            fontSize: "0.9rem",
            marginBottom: "0.5rem",
          }}
        />

        <div
          style={{
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            marginBottom: "0.75rem",
          }}
        >
          {totalFiltered} affixes shown. Click to cycle: unlabeled → BD → Bad →
          unlabeled
        </div>

        <div
          style={{
            maxHeight: 600,
            overflowY: "auto",
            border: "1px solid var(--border)",
            borderRadius: 4,
          }}
        >
          {[...sections.entries()].map(([section, catGroups]) => {
            const isCollapsed = collapsedSections.has(section);
            const sectionCount = catGroups.reduce(
              (s, g) => s + g.affixes.length,
              0
            );
            return (
              <div key={section}>
                {/* Section header */}
                <div
                  onClick={() => toggleSection(section)}
                  style={{
                    padding: "0.5rem 0.75rem",
                    background: "var(--bg-primary)",
                    fontWeight: 700,
                    fontSize: "0.8rem",
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--border)",
                    cursor: "pointer",
                    position: "sticky",
                    top: 0,
                    zIndex: 2,
                    display: "flex",
                    justifyContent: "space-between",
                    userSelect: "none",
                  }}
                >
                  <span>
                    {isCollapsed ? "▸" : "▾"} {section}
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {sectionCount}
                  </span>
                </div>
                {!isCollapsed &&
                  catGroups.map((group) => (
                    <div key={group.name}>
                      {/* Sub-category header */}
                      <div
                        style={{
                          padding: "0.35rem 0.75rem 0.35rem 1.25rem",
                          background: "var(--bg-secondary)",
                          fontWeight: 600,
                          fontSize: "0.78rem",
                          borderBottom: "1px solid var(--border)",
                          color: "var(--text-secondary)",
                          position: "sticky",
                          top: 28,
                          zIndex: 1,
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <span style={{ flex: 1 }}>
                          {group.subCategory} ({group.affixes.length})
                        </span>
                        <button
                          onClick={() =>
                            onSetCategoryBulk(
                              group.affixes.map((a) => a.id),
                              "build-defining"
                            )
                          }
                          style={{
                            background: "var(--bg-primary)",
                            color: "var(--bd-color)",
                            border: "1px solid var(--bd-color)40",
                            borderRadius: 3,
                            padding: "1px 8px",
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title="Mark all as Build-Defining"
                        >
                          All BD
                        </button>
                        <button
                          onClick={() =>
                            onSetCategoryBulk(
                              group.affixes.map((a) => a.id),
                              "bad"
                            )
                          }
                          style={{
                            background: "var(--bg-primary)",
                            color: "var(--bad-color)",
                            border: "1px solid var(--bad-color)40",
                            borderRadius: 3,
                            padding: "1px 8px",
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title="Mark all as Bad"
                        >
                          All BAD
                        </button>
                        <button
                          onClick={() =>
                            onSetCategoryBulk(
                              group.affixes.map((a) => a.id),
                              "unlabeled"
                            )
                          }
                          style={{
                            background: "var(--bg-primary)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border)",
                            borderRadius: 3,
                            padding: "1px 8px",
                            fontSize: "0.6rem",
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                          title="Clear all"
                        >
                          Clear
                        </button>
                      </div>
                      {group.affixes.map((affix) => {
                        const cat = getCategory(affix.id);
                        return (
                          <AffixRow
                            key={affix.id}
                            affix={affix}
                            category={cat}
                            onCycle={() => onCycle(affix.id)}
                            onSetCategory={(c) =>
                              onSetCategory(affix.id, c)
                            }
                          />
                        );
                      })}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Selected Lists */}
      <div style={{ width: 280, flexShrink: 0 }}>
        <SelectedList
          title="Build-Defining"
          color="var(--bd-color)"
          ids={buildDefiningIds}
          affixes={allAffixes}
          onRemove={(id) => onSetCategory(id, "unlabeled")}
        />
        <div style={{ height: "1.5rem" }} />
        <SelectedList
          title="Bad"
          color="var(--bad-color)"
          ids={badIds}
          affixes={allAffixes}
          onRemove={(id) => onSetCategory(id, "unlabeled")}
        />
      </div>
    </div>
  );
}

function AffixRow({
  affix,
  category,
  onCycle,
  onSetCategory,
}: {
  affix: Affix;
  category: AffixCategory;
  onCycle: () => void;
  onSetCategory: (c: AffixCategory) => void;
}) {
  return (
    <div
      onClick={onCycle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.3rem 0.75rem 0.3rem 1.5rem",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        cursor: "pointer",
        background:
          category !== "unlabeled"
            ? `${CATEGORY_COLORS[category]}18`
            : "transparent",
        borderLeft: `3px solid ${CATEGORY_COLORS[category] || "transparent"}`,
      }}
      title={`ID: ${affix.id} | ${affix.type} | Click to cycle category`}
    >
      <span style={{ flex: 1, fontSize: "0.85rem" }}>{affix.name}</span>
      <span
        style={{
          fontSize: "0.7rem",
          color: "var(--text-secondary)",
          minWidth: 30,
          textAlign: "right",
        }}
      >
        {affix.type === "prefix" ? "P" : "S"}
      </span>
      {category !== "unlabeled" && (
        <span
          style={{
            fontSize: "0.65rem",
            fontWeight: 700,
            color: CATEGORY_COLORS[category],
            minWidth: 28,
            textAlign: "center",
          }}
        >
          {CATEGORY_LABELS[category]}
        </span>
      )}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSetCategory(
            category === "build-defining" ? "unlabeled" : "build-defining"
          );
        }}
        style={{
          background:
            category === "build-defining"
              ? "var(--bd-color)"
              : "var(--bg-secondary)",
          color:
            category === "build-defining" ? "#000" : "var(--text-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 3,
          padding: "1px 6px",
          fontSize: "0.65rem",
          cursor: "pointer",
        }}
        title="Toggle Build-Defining"
      >
        BD
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSetCategory(category === "bad" ? "unlabeled" : "bad");
        }}
        style={{
          background:
            category === "bad" ? "var(--bad-color)" : "var(--bg-secondary)",
          color: category === "bad" ? "#fff" : "var(--text-secondary)",
          border: "1px solid var(--border)",
          borderRadius: 3,
          padding: "1px 6px",
          fontSize: "0.65rem",
          cursor: "pointer",
        }}
        title="Toggle Bad"
      >
        BAD
      </button>
    </div>
  );
}

function SelectedList({
  title,
  color,
  ids,
  affixes,
  onRemove,
}: {
  title: string;
  color: string;
  ids: number[];
  affixes: Affix[];
  onRemove: (id: number) => void;
}) {
  const items = ids
    .map((id) => affixes.find((a) => a.id === id))
    .filter(Boolean) as Affix[];

  return (
    <div>
      <h4 style={{ color, marginBottom: "0.5rem" }}>
        {title} ({items.length})
      </h4>
      <div
        style={{
          border: `1px solid ${color}40`,
          borderRadius: 4,
          maxHeight: 280,
          overflowY: "auto",
        }}
      >
        {items.length === 0 ? (
          <div
            style={{
              padding: "1rem",
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: "0.8rem",
            }}
          >
            None selected
          </div>
        ) : (
          items.map((affix) => (
            <div
              key={affix.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.25rem 0.5rem",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                fontSize: "0.8rem",
              }}
            >
              <span style={{ flex: 1 }}>{affix.name}</span>
              <button
                onClick={() => onRemove(affix.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-secondary)",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  padding: "0 4px",
                }}
                title="Remove"
              >
                x
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
