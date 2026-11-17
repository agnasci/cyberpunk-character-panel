import { describe, expect, it } from "vitest";
import {
  buildMonitor,
  MONITOR_WIDTH,
  waveformPath,
  monitorProfile,
} from "../../src/domain/biomonitor";
import type { VitalState } from "../../src/domain/vital-state";

const STATES: VitalState[] = [
  "notWounded",
  "lightlyWounded",
  "seriouslyWounded",
  "mortallyWounded",
  "dead",
  "unknown",
];

describe("biomonitor", () => {
  it("speeds up as wounds get worse", () => {
    const bpm = STATES.slice(0, 4).map((s) => buildMonitor(s).bpm);
    expect(bpm).toEqual([...bpm].sort((a, b) => a - b));
    expect(new Set(bpm).size).toBe(4);
  });

  it("draws a flat line without pulse for dead and unknown", () => {
    for (const s of ["dead", "unknown"] as const) {
      const view = buildMonitor(s);
      expect(view.flatline).toBe(true);
      expect(view.bpm).toBe(0);
      expect(view.flatLabelKey).toBe(s === "dead" ? "CCP.Vital.NoPulse" : "CCP.Vital.NoSignal");
      expect(view.path).toBe(`M0 28 H${MONITOR_WIDTH}`);
    }
  });

  it("is deterministic and stays inside the view box", () => {
    for (const s of STATES) {
      const path = waveformPath(monitorProfile(s));
      expect(path).toBe(waveformPath(monitorProfile(s)));
      const xs = [...path.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)].map((m) => Number(m[1]));
      for (const x of xs) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(MONITOR_WIDTH);
      }
    }
  });

  it("derives the sweep period from beats and BPM", () => {
    expect(buildMonitor("notWounded").periodSeconds).toBe(2.5);
    expect(buildMonitor("dead").periodSeconds).toBe(2.4);
  });
});
