import { useState } from "react";
import { useFilterConfig } from "./hooks/useFilterConfig";
import { ClassWeaponStep } from "./components/ClassWeaponStep";
import { AffixPicker } from "./components/AffixPicker";
import { ExportStep } from "./components/ExportStep";

type Step = "class" | "affixes" | "export";

export default function App() {
  const [step, setStep] = useState<Step>("class");
  const {
    config,
    setName,
    setPlayerClass,
    toggleWeaponType,
    getAffixCategory,
    cycleAffixCategory,
    setAffixCategory,
    setAffixCategoryBulk,
    importConfig,
  } = useFilterConfig();

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Last Epoch Filter Generator</h1>

      <nav style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        {(
          [
            ["class", "1. Class & Weapons"],
            ["affixes", "2. Affixes"],
            ["export", "3. Export"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setStep(key)}
            style={{
              padding: "0.5rem 1rem",
              background: step === key ? "var(--accent)" : "var(--bg-card)",
              color: step === key ? "#000" : "var(--text-primary)",
              border: `1px solid ${step === key ? "var(--accent)" : "var(--border)"}`,
              borderRadius: 6,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </nav>

      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: 8,
          padding: "2rem",
          border: "1px solid var(--border)",
        }}
      >
        {step === "class" && (
          <ClassWeaponStep
            name={config.name}
            playerClass={config.playerClass}
            weaponTypes={config.weaponTypes}
            onNameChange={setName}
            onClassChange={setPlayerClass}
            onWeaponToggle={toggleWeaponType}
          />
        )}
        {step === "affixes" && (
          <AffixPicker
            buildDefiningIds={config.buildDefiningAffixIds}
            badIds={config.badAffixIds}
            getCategory={getAffixCategory}
            onCycle={cycleAffixCategory}
            onSetCategory={setAffixCategory}
            onSetCategoryBulk={setAffixCategoryBulk}
          />
        )}
        {step === "export" && <ExportStep config={config} onImportConfig={importConfig} />}
      </div>
    </div>
  );
}
