import { useMemo, useState } from "react";
import type { FilterConfig } from "../types";
import { generateFilterXml } from "../generator/xml-generator";

interface Props {
  config: FilterConfig;
}

export function ExportStep({ config }: Props) {
  const xml = useMemo(() => generateFilterXml(config), [config]);
  const [copied, setCopied] = useState(false);

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

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Summary */}
      <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
        <Stat label="Rules" value={`${ruleCount} / 200`} />
        <Stat label="Class" value={config.playerClass} />
        <Stat label="Build-Defining" value={config.buildDefiningAffixIds.length} />
        <Stat label="Bad" value={config.badAffixIds.length} />
        <Stat label="Weapons" value={config.weaponTypes.length} />
      </div>

      {/* Download */}
      <div>
        <button
          onClick={handleDownload}
          style={{
            padding: "0.75rem 2rem",
            background: "var(--accent)",
            color: "#000",
            border: "none",
            borderRadius: 6,
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Download {config.name}.xml
        </button>
        <button
          onClick={handleCopy}
          style={{
            padding: "0.75rem 2rem",
            background: copied ? "#4caf50" : "var(--bg-secondary)",
            color: copied ? "#fff" : "var(--text-primary)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
            marginLeft: "0.75rem",
          }}
        >
          {copied ? "Copied!" : "Copy to Clipboard"}
        </button>
      </div>

      {/* XML Preview */}
      <div>
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
      </div>
    </div>
  );
}

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
