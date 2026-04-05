import { useMemo, useState, useRef } from "react";
import type { FilterConfig } from "../types";
import { generateFilterXml } from "../generator/xml-generator";

interface Props {
  config: FilterConfig;
  onImportConfig: (config: FilterConfig) => void;
  onResetConfig: () => void;
}

export function ExportStep({ config, onImportConfig, onResetConfig }: Props) {
  const xml = useMemo(() => generateFilterXml(config), [config]);
  const [copied, setCopied] = useState(false);
  const [copiedConfig, setCopiedConfig] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const ruleCount = (xml.match(/<Rule>/g) || []).length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(xml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.name}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportConfig = () => {
    const json = JSON.stringify(
      {
        name: config.name,
        playerClass: config.playerClass,
        weaponTypes: config.weaponTypes,
        buildDefiningAffixIds: config.buildDefiningAffixIds,
        badAffixIds: config.badAffixIds,
        customRules: config.customRules,
      },
      null,
      2
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${config.name}-config.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyConfig = async () => {
    const json = JSON.stringify(
      {
        name: config.name,
        playerClass: config.playerClass,
        weaponTypes: config.weaponTypes,
        buildDefiningAffixIds: config.buildDefiningAffixIds,
        badAffixIds: config.badAffixIds,
        customRules: config.customRules,
      },
      null,
      2
    );
    await navigator.clipboard.writeText(json);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  const handleImportConfig = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (!parsed.name || !parsed.playerClass) {
          throw new Error("Missing required fields (name, playerClass)");
        }
        onImportConfig(parsed);
        setImportError(null);
      } catch (err) {
        setImportError(
          `Invalid config file: ${err instanceof Error ? err.message : "parse error"}`
        );
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveAndReset = () => {
    handleExportConfig();
    setShowResetConfirm(false);
    onResetConfig();
  };

  const handleResetWithoutSaving = () => {
    setShowResetConfirm(false);
    onResetConfig();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Summary */}
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <Stat label="Rules" value={`${ruleCount} / 200`} />
        <Stat label="Class" value={config.playerClass} />
        <Stat
          label="Build-Defining"
          value={config.buildDefiningAffixIds.length}
        />
        <Stat label="Bad" value={config.badAffixIds.length} />
        <Stat label="Weapons" value={config.weaponTypes.length} />
        <Stat label="Custom" value={config.customRules.length} />
      </div>

      {/* Filter XML Export */}
      <section>
        <h3 style={{ marginBottom: "0.5rem" }}>Filter XML</h3>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button onClick={handleDownload} style={btnPrimary}>
            Download {config.name}.xml
          </button>
          <button
            onClick={handleCopy}
            style={copied ? btnSuccess : btnSecondary}
          >
            {copied ? "Copied!" : "Copy XML"}
          </button>
        </div>
      </section>

      {/* Save/Load Config */}
      <section>
        <h3 style={{ marginBottom: "0.5rem" }}>Save / Load Configuration</h3>
        <p
          style={{
            fontSize: "0.8rem",
            color: "var(--text-secondary)",
            marginBottom: "0.5rem",
          }}
        >
          Export your affix selections to transfer between devices or share with
          others.
        </p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button onClick={handleExportConfig} style={btnSecondary}>
            Save Config
          </button>
          <button
            onClick={handleCopyConfig}
            style={copiedConfig ? btnSuccess : btnSecondary}
          >
            {copiedConfig ? "Copied!" : "Copy Config"}
          </button>
          <label style={{ ...btnSecondary, cursor: "pointer" }}>
            Load Config
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImportConfig}
              style={{ display: "none" }}
            />
          </label>
        </div>
        {importError && (
          <div
            style={{
              marginTop: "0.5rem",
              color: "var(--bad-color)",
              fontSize: "0.8rem",
            }}
          >
            {importError}
          </div>
        )}
        <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border)", paddingTop: "1rem" }}>
          <button
            onClick={() => setShowResetConfirm(true)}
            style={btnDanger}
          >
            New Filter
          </button>
          {showResetConfirm && (
            <div
              style={{
                marginTop: "0.75rem",
                padding: "1rem",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: 6,
              }}
            >
              <p style={{ marginBottom: "0.75rem", fontWeight: 600 }}>
                Start a new filter? This will clear all current selections.
              </p>
              <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                <button onClick={handleSaveAndReset} style={btnSecondary}>
                  Save & Reset
                </button>
                <button onClick={handleResetWithoutSaving} style={btnDanger}>
                  Reset without saving
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  style={btnSecondary}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* XML Preview */}
      <section>
        <h3 style={{ marginBottom: "0.5rem" }}>XML Preview</h3>
        <pre
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: 4,
            padding: "1rem",
            maxHeight: 500,
            overflowY: "auto",
            fontSize: "0.75rem",
            lineHeight: 1.4,
            whiteSpace: "pre-wrap",
            wordBreak: "break-all",
          }}
        >
          {xml}
        </pre>
      </section>
    </div>
  );
}

const btnBase: React.CSSProperties = {
  padding: "0.75rem 2rem",
  border: "none",
  borderRadius: 6,
  fontSize: "1rem",
  fontWeight: 600,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
};

const btnPrimary: React.CSSProperties = {
  ...btnBase,
  background: "var(--accent)",
  color: "#000",
};

const btnSecondary: React.CSSProperties = {
  ...btnBase,
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
  border: "1px solid var(--border)",
};

const btnSuccess: React.CSSProperties = {
  ...btnBase,
  background: "#4caf50",
  color: "#fff",
};

const btnDanger: React.CSSProperties = {
  ...btnBase,
  background: "#c62828",
  color: "#fff",
};

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.25rem", fontWeight: 600 }}>{value}</div>
    </div>
  );
}
