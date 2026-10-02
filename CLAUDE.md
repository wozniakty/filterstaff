# FilterStaff — Last Epoch Loot Filter Generator

Client-side React+TypeScript+Vite app that generates Last Epoch loot filter XML files.

Live at: https://wozniakty.github.io/filterstaff/

## Commands

- `npm run dev` — dev server with HMR
- `npm run build` — production build (`tsc -b && vite build`)
- `npm test` — vitest
- `npx tsc -b` — type check (matches CI strictness, catches unused imports that `--noEmit` misses)

## Critical Filter Engine Constraints

These are non-negotiable properties of Last Epoch's filter engine that drove every structural decision:

1. **First-match-wins, full override** — first matching rule owns the item completely. No cascading, no inheritance. Higher `Order` number = checked first
2. **Every rule must be self-contained** — must set ALL visual properties (color, beam, icon, sound). Can't split across rules.
3. **SHOW without recolor blocks lower rules** — doesn't pass through. Safety nets at top intentionally prevent recoloring.
4. **Every layer must independently produce correct gradient color** — Layers 2 and 4 duplicate the 5-tier gradient because if they match, Layer 1 never fires. This looks redundant but is structurally required.
5. **Hide rules block everything below** — rescues MUST sit above hides in priority.

## XML Schema Gotchas

- `Order`: higher number = higher priority (checked first) **on import**. Order 0 is the bottom of the list, checked last. In the generator, the base hide-all gets Order 0 (lowest priority) and safety nets get the HIGHEST Order numbers (highest priority, checked first). **However, when the game saves/exports a filter (both on-disk and clipboard), it inverts the Order numbering: Order 0 becomes the highest-priority rule.** The xml-parser handles both directions by comparing the sentinel Order values to detect which convention is in use.
- `comparsion` not "comparison" — game's typo, must preserve exactly
- `combinedComparsion` not "combinedComparison" — same
- `BeamOverride=false` means "use game default beam," NOT "no beam." To suppress beams: `BeamOverride=true` + `BeamSizeOverride=NONE`.
- Beam colors are a DIFFERENT index set from item recolors. See `src/data/styling.ts` for all enums.
- `advanced=false` on AffixCondition when no tier thresholds are set (cleaner in-game UI)
- `combinedComparsion=ANY` for presence-only checks, `MORE` for tier sum thresholds
- `lootFilterVersion` should be `9` (current as of v1.4.1)
- `IDOL_ALTAR` is a valid EquipmentType

## Design Decisions

- **Idol affixes excluded** from BD/Bad selection and the ALL affix list (different tier structure, blanket-shown by SubType rule)
- **Exalted NOT in safety net** — flows through gradient/BD rules for proper visual treatment
- **Corrupted items** get gradient coloring above hides — game's purple border already marks them as corrupted
- **Styling values use enums** (`ItemColor`, `Sound`, `MapIcon`, `BeamColor` in `styling.ts`). Raw integers only at the XML serialization boundary in `ruleXml()`.

## Affix Data

949 affixes merged from AssetRipper game extraction + Playwright scrape of lastepoch.tunklab.com. Equipment affixes are 100% covered. ~123 idol affixes missing (not needed since idols are blanket-shown). Scraper scripts in `scripts/` (gitignored).