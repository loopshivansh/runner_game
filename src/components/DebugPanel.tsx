"use client";

import { useEffect, useState } from "react";
import type { Runner3D } from "@/game/engine3d";

/**
 * Dev-only live tuning panel (enabled with ?debug=1). Adjust camera, environment,
 * character, products and banners in real time, then "Copy values" to bake the
 * good numbers into engine3d's `tune` defaults.
 */

type Ctrl = { key: string; min: number; max: number; step: number };
type Group = { group: string; label: string; ctrls: Ctrl[] };

const SCHEMA: Group[] = [
  {
    group: "camera",
    label: "Camera",
    ctrls: [
      { key: "x", min: -12, max: 12, step: 0.1 },
      { key: "y", min: 0, max: 18, step: 0.1 },
      { key: "z", min: 0, max: 24, step: 0.1 },
      { key: "lookX", min: -12, max: 12, step: 0.1 },
      { key: "lookY", min: -4, max: 10, step: 0.1 },
      { key: "lookZ", min: -40, max: 12, step: 0.5 },
      { key: "fov", min: 30, max: 95, step: 1 },
    ],
  },
  {
    group: "env",
    label: "Environment (rebuilds)",
    ctrls: [
      { key: "targetWidth", min: 4, max: 90, step: 0.5 },
      { key: "sideX", min: 0, max: 45, step: 0.5 },
      { key: "offX", min: -35, max: 35, step: 0.5 },
      { key: "offY", min: -12, max: 25, step: 0.5 },
      { key: "offZ", min: -45, max: 45, step: 0.5 },
      { key: "rotDeg", min: 0, max: 360, step: 5 },
      { key: "cityScale", min: 4, max: 60, step: 0.5 },
      { key: "tileGap", min: -20, max: 40, step: 0.5 },
      { key: "buildLeft", min: -10, max: 20, step: 0.5 },
      { key: "buildRight", min: -10, max: 20, step: 0.5 },
    ],
  },
  {
    group: "char",
    label: "Character",
    ctrls: [
      { key: "scale", min: 0.3, max: 3, step: 0.05 },
      { key: "offY", min: -2, max: 5, step: 0.05 },
      { key: "offZ", min: -8, max: 8, step: 0.1 },
    ],
  },
  {
    group: "product",
    label: "Products",
    ctrls: [
      { key: "size", min: 0.3, max: 3.5, step: 0.05 },
      { key: "y", min: 0, max: 4, step: 0.05 },
    ],
  },
  {
    group: "banner",
    label: "Banners",
    ctrls: [
      { key: "width", min: 1, max: 16, step: 0.2 },
      { key: "y", min: 0, max: 12, step: 0.1 },
      { key: "x", min: 2, max: 16, step: 0.25 },
      { key: "angle", min: 0, max: 90, step: 5 },
      { key: "gapMin", min: 2, max: 30, step: 0.5 },
      { key: "gapMax", min: 2, max: 40, step: 0.5 },
    ],
  },
  {
    group: "road",
    label: "Road",
    ctrls: [{ key: "width", min: 2, max: 20, step: 0.5 }],
  },
  {
    group: "base",
    label: "Brown base",
    ctrls: [
      { key: "x", min: 2, max: 20, step: 0.5 },
      { key: "width", min: 1, max: 24, step: 0.5 },
      { key: "height", min: 0, max: 6, step: 0.1 },
    ],
  },
  {
    group: "fog",
    label: "Fog",
    ctrls: [
      { key: "near", min: 0, max: 140, step: 1 },
      { key: "far", min: 20, max: 320, step: 2 },
    ],
  },
];

export default function DebugPanel({ engine }: { engine: Runner3D }) {
  const tune = engine.getTune() as unknown as Record<string, Record<string, number>>;
  const [, force] = useState(0);
  const [open, setOpen] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (window as unknown as { __engine: Runner3D }).__engine = engine;
  }, [engine]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={panelBtn}
        className="font-mono"
      >
        ⚙ tune
      </button>
    );
  }

  return (
    <div style={panel} className="font-mono text-[11px]">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <strong style={{ fontSize: 12 }}>Scene Tuner</strong>
        <button
          onClick={() => {
            const json = JSON.stringify(engine.getTune(), null, 2);
            navigator.clipboard?.writeText(json).catch(() => {});
            console.log("[tune]", json);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          style={smallBtn}
        >
          {copied ? "copied ✓" : "copy values"}
        </button>
        <button onClick={() => setOpen(false)} style={{ ...smallBtn, marginLeft: "auto" }}>
          ×
        </button>
      </div>
      {SCHEMA.map((g) => (
        <div key={g.group} style={{ marginBottom: 10 }}>
          <div style={{ opacity: 0.6, margin: "6px 0 3px" }}>{g.label}</div>
          {g.ctrls.map((c) => {
            const val = tune[g.group]?.[c.key] ?? 0;
            return (
              <div key={c.key} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <label style={{ width: 74, opacity: 0.8 }}>{c.key}</label>
                <input
                  type="range"
                  min={c.min}
                  max={c.max}
                  step={c.step}
                  value={val}
                  onChange={(e) => {
                    engine.setTune(`${g.group}.${c.key}`, Number(e.target.value));
                    force((n) => n + 1);
                  }}
                  style={{ flex: 1 }}
                />
                <input
                  type="number"
                  value={val}
                  step={c.step}
                  onChange={(e) => {
                    engine.setTune(`${g.group}.${c.key}`, Number(e.target.value));
                    force((n) => n + 1);
                  }}
                  style={numInput}
                />
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

const panel: React.CSSProperties = {
  position: "fixed",
  top: 8,
  right: 8,
  width: 280,
  maxHeight: "94vh",
  overflowY: "auto",
  background: "rgba(12,12,16,0.94)",
  color: "#eee",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 10,
  padding: 12,
  zIndex: 9999,
  backdropFilter: "blur(6px)",
};
const panelBtn: React.CSSProperties = {
  position: "fixed",
  top: 8,
  right: 8,
  zIndex: 9999,
  background: "rgba(12,12,16,0.9)",
  color: "#eee",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: 8,
  padding: "6px 10px",
  fontSize: 12,
  cursor: "pointer",
};
const smallBtn: React.CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  padding: "3px 8px",
  cursor: "pointer",
  fontSize: 11,
};
const numInput: React.CSSProperties = {
  width: 52,
  background: "rgba(0,0,0,0.4)",
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 4,
  padding: "1px 4px",
  fontSize: 11,
};
