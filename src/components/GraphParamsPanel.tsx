import { useState } from "react";
import { type GraphSimParams, DEFAULT_GRAPH_PARAMS } from "./ObsidianGraphBackground";

interface SliderDef {
  key: keyof GraphSimParams;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SLIDERS: SliderDef[] = [
  { key: "parallaxScrollK", label: "Parallax", min: -1, max: 0, step: 0.01 },
  { key: "driftAmplitude", label: "Drift Amplitude", min: 0, max: 30, step: 0.5 },
  { key: "driftSpeed", label: "Drift Speed", min: 0, max: 2, step: 0.01 },
  { key: "breatheAmount", label: "Breathe Amount", min: 0, max: 1, step: 0.01 },
  { key: "breatheSpeed", label: "Breathe Speed", min: 0, max: 3, step: 0.01 },
  { key: "cursorRadius", label: "Cursor Radius", min: 0, max: 600, step: 10 },
  { key: "cursorPush", label: "Cursor Push", min: 0, max: 120, step: 1 },
  { key: "cursorSwirl", label: "Cursor Swirl", min: -2, max: 2, step: 0.05 },
  { key: "cursorEase", label: "Cursor Ease", min: 0.5, max: 20, step: 0.1 },
  { key: "glowBoost", label: "Glow Boost", min: 0, max: 8, step: 0.1 },
  { key: "pulseRate", label: "Pulse Rate (/s)", min: 0, max: 20, step: 0.1 },
  { key: "cursorPulseRate", label: "Cursor Pulses (/s)", min: 0, max: 30, step: 0.5 },
  { key: "pulseSpeed", label: "Pulse Speed", min: 10, max: 400, step: 5 },
  { key: "nodeAlpha", label: "Node Alpha", min: 0, max: 1, step: 0.01 },
  { key: "linkAlpha", label: "Link Alpha", min: 0, max: 1, step: 0.01 },
  { key: "linkWidth", label: "Link Width", min: 0.1, max: 5, step: 0.1 },
];

interface Props {
  params: GraphSimParams;
  onChange: (p: GraphSimParams) => void;
  onRemount: () => void;
  homeUrl: string;
}

export default function GraphParamsPanel({ params, onChange, onRemount, homeUrl }: Props) {
  const [open, setOpen] = useState(true);

  function handleChange(key: keyof GraphSimParams, value: number) {
    onChange({ ...params, [key]: value });
  }

  function handleReset() {
    onChange(DEFAULT_GRAPH_PARAMS);
  }

  return (
    <div style={{
      position: "fixed",
      top: "1rem",
      left: "1rem",
      zIndex: 10,
      background: "rgba(27,27,30,0.85)",
      border: "1px solid rgba(130,145,170,0.2)",
      borderRadius: "8px",
      padding: open ? "0.75rem" : "0.4rem 0.75rem",
      color: "rgb(130,145,170)",
      fontFamily: "monospace",
      fontSize: "11px",
      maxHeight: "90vh",
      overflowY: "auto",
      minWidth: "220px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: open ? "0.5rem" : 0 }}>
        <strong style={{ fontSize: "12px" }}>Graph Params</strong>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {open && (
            <>
              <button onClick={handleReset} style={{ background: "none", border: "1px solid rgba(130,145,170,0.3)", borderRadius: "4px", color: "inherit", cursor: "pointer", fontSize: "10px", padding: "1px 6px" }}>
                reset
              </button>
              <button onClick={onRemount} style={{ background: "none", border: "1px solid rgba(130,145,170,0.3)", borderRadius: "4px", color: "inherit", cursor: "pointer", fontSize: "10px", padding: "1px 6px" }}>
                remount
              </button>
            </>
          )}
          <button onClick={() => setOpen(o => !o)} style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", fontSize: "14px" }}>
            {open ? "−" : "+"}
          </button>
        </div>
      </div>
      {open && SLIDERS.map(({ key, label, min, max, step }) => (
        <div key={key} style={{ marginBottom: "0.4rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>{label}</span>
            <span>{params[key]}</span>
          </div>
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={params[key] as number}
            onChange={e => handleChange(key, parseFloat(e.target.value))}
            style={{ width: "100%", accentColor: "rgb(130,145,170)" }}
          />
        </div>
      ))}
      <div style={{ marginTop: "0.5rem" }}>
        <a href={homeUrl} style={{ display: "inline-block", background: "none", border: "1px solid rgba(130,145,170,0.3)", borderRadius: "4px", color: "inherit", cursor: "pointer", fontSize: "10px", padding: "1px 6px", textDecoration: "none" }}>
          ← exit
        </a>
      </div>
    </div>
  );
}
