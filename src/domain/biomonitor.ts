import type { VitalState } from "./vital-state";

export interface MonitorProfile {
  bpm: number;
  beats: number;
  amplitude: number;
  jitter: number;
  fibrillation: boolean;
}

export interface MonitorView {
  state: VitalState;
  bpm: number;
  periodSeconds: number;
  path: string;
  flatline: boolean;
  flatLabelKey: string | null;
}

export const MONITOR_WIDTH = 240;
export const MONITOR_BASELINE = 28;
const FLAT_PERIOD_SECONDS = 2.4;

const FLAT_LABELS: Partial<Record<VitalState, string>> = {
  dead: "CCP.Vital.NoPulse",
  unknown: "CCP.Vital.NoSignal",
};

const PROFILES: Record<VitalState, MonitorProfile> = {
  notWounded: { bpm: 72, beats: 3, amplitude: 1, jitter: 0, fibrillation: false },
  lightlyWounded: { bpm: 96, beats: 4, amplitude: 0.85, jitter: 0.04, fibrillation: false },
  seriouslyWounded: { bpm: 128, beats: 5, amplitude: 0.7, jitter: 0.16, fibrillation: false },
  mortallyWounded: { bpm: 164, beats: 7, amplitude: 0.45, jitter: 0.3, fibrillation: true },
  dead: { bpm: 0, beats: 0, amplitude: 0, jitter: 0, fibrillation: false },
  unknown: { bpm: 0, beats: 0, amplitude: 0, jitter: 0, fibrillation: false },
};

export function monitorProfile(state: VitalState): MonitorProfile {
  return PROFILES[state];
}

function seeded(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function waveformPath(profile: MonitorProfile): string {
  const mid = MONITOR_BASELINE;
  if (profile.beats === 0) return `M0 ${mid} H${MONITOR_WIDTH}`;
  const rnd = seeded(7 + profile.beats);
  const span = MONITOR_WIDTH / profile.beats;
  const points: [number, number][] = [[0, mid]];
  for (let i = 0; i < profile.beats; i++) {
    const start = i * span;
    const shift = (rnd() - 0.5) * profile.jitter * span;
    const amp = profile.amplitude * (1 - rnd() * profile.jitter);
    const x = (f: number) => Math.max(0, Math.min(MONITOR_WIDTH, start + f * span + shift));
    if (profile.fibrillation) {
      for (let k = 0; k <= 10; k++) {
        points.push([x(k / 10), mid + Math.sin(k * 1.9 + i) * 7 * amp + (rnd() - 0.5) * 6]);
      }
      continue;
    }
    points.push(
      [x(0.18), mid],
      [x(0.24), mid - 3 * amp],
      [x(0.3), mid],
      [x(0.38), mid],
      [x(0.41), mid + 4 * amp],
      [x(0.45), mid - 22 * amp],
      [x(0.49), mid + 12 * amp],
      [x(0.52), mid],
      [x(0.64), mid],
      [x(0.72), mid - 6 * amp],
      [x(0.8), mid],
    );
  }
  points.push([MONITOR_WIDTH, mid]);
  return `M${points.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(" L")}`;
}

export function buildMonitor(state: VitalState): MonitorView {
  const profile = monitorProfile(state);
  const periodSeconds =
    profile.bpm > 0
      ? Math.round(((profile.beats * 60) / profile.bpm) * 100) / 100
      : FLAT_PERIOD_SECONDS;
  return {
    state,
    bpm: profile.bpm,
    periodSeconds,
    path: waveformPath(profile),
    flatline: profile.beats === 0,
    flatLabelKey: FLAT_LABELS[state] ?? null,
  };
}
