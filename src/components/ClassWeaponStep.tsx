import type { PlayerClass, EquipmentType } from "../types";
import { ALL_CLASSES } from "../data/classes";
import { ALL_WEAPON_TYPES, WEAPON_TYPE_LABELS } from "../data/equipment-types";

interface Props {
  name: string;
  playerClass: PlayerClass;
  weaponTypes: EquipmentType[];
  onNameChange: (name: string) => void;
  onClassChange: (cls: PlayerClass) => void;
  onWeaponToggle: (wt: EquipmentType) => void;
}

export function ClassWeaponStep({
  name,
  playerClass,
  weaponTypes,
  onNameChange,
  onClassChange,
  onWeaponToggle,
}: Props) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Filter Name */}
      <section>
        <h3 style={{ marginBottom: "0.5rem" }}>Filter Name</h3>
        <input
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          style={{
            padding: "0.5rem 0.75rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            color: "var(--text-primary)",
            fontSize: "1rem",
            width: 300,
          }}
        />
      </section>

      {/* Class Selection */}
      <section>
        <h3 style={{ marginBottom: "0.5rem" }}>Class</h3>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {ALL_CLASSES.map((cls) => (
            <button
              key={cls}
              onClick={() => onClassChange(cls)}
              style={{
                padding: "0.5rem 1.25rem",
                background:
                  playerClass === cls ? "var(--accent)" : "var(--bg-secondary)",
                color: playerClass === cls ? "#000" : "var(--text-primary)",
                border: `1px solid ${playerClass === cls ? "var(--accent)" : "var(--border)"}`,
                borderRadius: 4,
                cursor: "pointer",
                fontSize: "0.9rem",
              }}
            >
              {cls}
            </button>
          ))}
        </div>
      </section>

      {/* Weapon Types */}
      <section>
        <h3 style={{ marginBottom: "0.5rem" }}>
          Weapon Types You Use{" "}
          <span style={{ color: "var(--text-secondary)", fontWeight: "normal", fontSize: "0.85rem" }}>
            (everything unchecked gets hidden)
          </span>
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "0.25rem",
          }}
        >
          {ALL_WEAPON_TYPES.map((wt) => (
            <label
              key={wt}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.35rem 0.5rem",
                borderRadius: 4,
                cursor: "pointer",
                background: weaponTypes.includes(wt)
                  ? "rgba(79, 195, 247, 0.1)"
                  : "transparent",
              }}
            >
              <input
                type="checkbox"
                checked={weaponTypes.includes(wt)}
                onChange={() => onWeaponToggle(wt)}
                style={{ accentColor: "var(--accent)" }}
              />
              {WEAPON_TYPE_LABELS[wt]}
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
