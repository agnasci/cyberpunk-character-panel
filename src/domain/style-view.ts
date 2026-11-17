import { ACCENT_PRESETS, buildPalette, normalizeHex, type SemanticState } from "./palette";

export interface StyleInput {
  accent: string;
  preview: string | null;
  accentOverride: string | null;
  worldAccent: string;
  isGM: boolean;
  compact: boolean;
  showFavorites: boolean;
  showBpm: boolean;
  animateMonitor: boolean;
  dock: "bottom" | "top";
}

export interface StyleNote {
  inkContrast: number;
  conflictKeys: string[];
}

export interface StyleView extends StyleNote {
  accent: string;
  dirty: boolean;
  isOverride: boolean;
  isGM: boolean;
  worldAccent: string;
  presets: { id: string; hex: string; labelKey: string; pressed: boolean }[];
  prefs: { key: string; labelKey: string; on: boolean }[];
  dock: "bottom" | "top";
}

const STATE_KEYS: Readonly<Record<SemanticState, string>> = {
  lightlyWounded: "CPR.global.woundState.lightlyWounded",
  seriouslyWounded: "CPR.global.woundState.seriouslyWounded",
  mortallyWounded: "CPR.global.woundState.mortallyWounded",
};

export function styleNote(hex: string): StyleNote {
  const palette = buildPalette(hex);
  return {
    inkContrast: palette.inkContrast,
    conflictKeys: palette.conflicts.map((state) => STATE_KEYS[state]),
  };
}

export function buildStyleView(input: StyleInput): StyleView {
  const accent = normalizeHex(input.preview ?? "") ?? input.accent;
  return {
    accent,
    dirty: input.preview !== null && accent !== input.accent,
    isOverride: input.accentOverride !== null,
    isGM: input.isGM,
    worldAccent: input.worldAccent,
    ...styleNote(accent),
    presets: ACCENT_PRESETS.map((preset) => ({
      id: preset.id,
      hex: preset.hex,
      labelKey: `CCP.Style.Preset.${preset.id}`,
      pressed: preset.hex === accent,
    })),
    prefs: [
      { key: "compact", labelKey: "CCP.Settings.compact.Name", on: input.compact },
      {
        key: "showFavorites",
        labelKey: "CCP.Settings.showFavorites.Name",
        on: input.showFavorites,
      },
      { key: "showBpm", labelKey: "CCP.Settings.showBpm.Name", on: input.showBpm },
      {
        key: "animateMonitor",
        labelKey: "CCP.Settings.animateMonitor.Name",
        on: input.animateMonitor,
      },
    ],
    dock: input.dock,
  };
}
