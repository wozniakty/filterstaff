import { useState } from "react";
import { useFilterConfig } from "./hooks/useFilterConfig";
import { ClassWeaponStep } from "./components/ClassWeaponStep";
import { AffixPicker } from "./components/AffixPicker";
import { CustomRulesStep } from "./components/CustomRulesStep";
import { ExportStep } from "./components/ExportStep";

type Step = "class" | "affixes" | "custom" | "export";

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
    setCustomRules,
    clearCustomRules,
    resetConfig,
  } = useFilterConfig();

  const handleResetConfig = () => {
    resetConfig();
    setStep("class");
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "2rem" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Last Epoch Filter Generator</h1>

      <nav style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        {(
          [
            ["class", "1. Class & Weapons"],
            ["affixes", "2. Affixes"],
            ["custom", "3. Custom Rules"],
            ["export", "4. Export"],
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
            playerClass={config.playerClass}
            buildDefiningIds={config.buildDefiningAffixIds}
            badIds={config.badAffixIds}
            getCategory={getAffixCategory}
            onCycle={cycleAffixCategory}
            onSetCategory={setAffixCategory}
            onSetCategoryBulk={setAffixCategoryBulk}
          />
        )}
        {step === "custom" && (
          <CustomRulesStep
            customRules={config.customRules}
            onSetCustomRules={setCustomRules}
            onClearCustomRules={clearCustomRules}
          />
        )}
        {step === "export" && (
          <ExportStep config={config} onImportConfig={importConfig} onResetConfig={handleResetConfig} />
        )}
      </div>
    </div>
  );
}
