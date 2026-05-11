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
  { key: "alphaDecay", label: "Alpha Decay", min: 0, max: 0.1, step: 0.001 },
  { key: "velocityDecay", label: "Velocity Decay", min: 0, max: 1, step: 0.01 },
  { key: "ambientJitter", label: "Ambient Jitter", min: 0, max: 2, step: 0.01 },
  { key: "ambientAlphaFloor", label: "Ambient Alpha Floor", min: 0, max: 0.2, step: 0.001 },
  { key: "cursorRadius", label: "Cursor Radius", min: 0, max: 600, step: 10 },
  { key: "cursorImpulseStrength", label: "Cursor Impulse", min: 0, max: 2, step: 0.01 },
  { key: "cursorImpulseAlphaFloor", label: "Cursor Alpha Floor", min: 0, max: 1, step: 0.01 },
  { key: "cursorReheatAlphaThreshold", label: "Reheat Threshold", min: 0, max: 2, step: 0.01 },
  { key: "cursorReheatAlphaTarget", label: "Reheat Target", min: 0, max: 2, step: 0.01 },
  { key: "cursorRippleSettleMs", label: "Ripple Settle (ms)", min: 500, max: 10000, step: 100 },
  { key: "nodeAlpha", label: "Node Alpha", min: 0, max: 1, step: 0.01 },
  { key: "linkAlpha", label: "Link Alpha", min: 0, max: 1, step: 0.01 },
  { key: "linkWidth", label: "Link Width", min: 0.1, max: 5, step: 0.1 },
];

interface Props {
  params: GraphSimParams;
  onChange: (p: GraphSimParams) => void;
  onRemount: () => void;
}

export default function GraphParamsPanel({ params, onChange, onRemount }: Props) {
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
    </div>
  );
}
