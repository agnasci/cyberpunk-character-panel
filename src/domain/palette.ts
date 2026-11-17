export type Rgb = readonly [number, number, number];
export type SemanticState = "lightlyWounded" | "seriouslyWounded" | "mortallyWounded";

export const DEFAULT_ACCENT = "#22d3ee";
export const PANEL_BACKGROUND = "#0b0d13";
export const MIN_TEXT_CONTRAST = 4.5;
const CONFLICT_HUE_DISTANCE = 16;
const CONFLICT_MIN_SATURATION = 0.35;

export const ACCENT_PRESETS: readonly { id: string; hex: string }[] = [
  { id: "cyan", hex: "#22d3ee" },
  { id: "magenta", hex: "#ff2fd0" },
  { id: "yellow", hex: "#f7e01d" },
  { id: "red", hex: "#ff2a4f" },
  { id: "acid", hex: "#9dff3a" },
  { id: "orange", hex: "#ff8a1f" },
  { id: "violet", hex: "#9b6bff" },
  { id: "ice", hex: "#dff6ff" },
];

const SEMANTIC: Readonly<Record<SemanticState, string>> = {
  lightlyWounded: "#f2c94c",
  seriouslyWounded: "#ff8a3d",
  mortallyWounded: "#ff3b5c",
};

export interface Palette {
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentLine: string;
  accentInk: string;
  inkContrast: number;
  strongContrast: number;
  conflicts: SemanticState[];
  vitalOk: "accent" | "ok";
}

export function normalizeHex(input: string): string | null {
  const trimmed = input.trim().replace(/^#/, "");
  const full = /^[0-9a-f]{3}$/i.test(trimmed)
    ? trimmed
        .split("")
        .map((c) => c + c)
        .join("")
    : trimmed;
  return /^[0-9a-f]{6}$/i.test(full) ? `#${full.toLowerCase()}` : null;
}

export function hexToRgb(hex: string): Rgb | null {
  const normalized = normalizeHex(hex);
  if (!normalized) return null;
  const n = Number.parseInt(normalized.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function channel(c: number): number {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
}

export function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a: Rgb, b: Rgb): number {
  const x = luminance(a);
  const y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

export function rgbToHsl([r, g, b]: Rgb): [number, number, number] {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h * 60, s, l];
}

export function hslToRgb(h: number, s: number, l: number): Rgb {
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
}

export function rgbToHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function hueDistance(a: number, b: number): number {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
}

export function semanticConflicts(accent: Rgb): SemanticState[] {
  const [h, s] = rgbToHsl(accent);
  if (s < CONFLICT_MIN_SATURATION) return [];
  return (Object.keys(SEMANTIC) as SemanticState[]).filter((state) => {
    const rgb = hexToRgb(SEMANTIC[state]);
    return rgb !== null && hueDistance(h, rgbToHsl(rgb)[0]) < CONFLICT_HUE_DISTANCE;
  });
}

function readableStrong(accent: Rgb, background: Rgb): Rgb {
  const [h, s, l] = rgbToHsl(accent);
  let lightness = Math.min(0.88, l + 0.18);
  let rgb = hslToRgb(h, s, lightness);
  while (contrast(rgb, background) < MIN_TEXT_CONTRAST && lightness < 0.97) {
    lightness = Math.min(0.97, lightness + 0.04);
    rgb = hslToRgb(h, s, lightness);
  }
  return rgb;
}

export function buildPalette(input: string | null | undefined): Palette {
  const accentHex = normalizeHex(input ?? "") ?? DEFAULT_ACCENT;
  const accent = hexToRgb(accentHex) ?? [34, 211, 238];
  const background = hexToRgb(PANEL_BACKGROUND) ?? [11, 13, 19];
  const dark: Rgb = [5, 7, 11];
  const light: Rgb = [255, 255, 255];
  const darkInk = contrast(accent, dark);
  const lightInk = contrast(accent, light);
  const strong = readableStrong(accent, background);
  const conflicts = semanticConflicts(accent);
  const triplet = accent.join(" ");
  return {
    accent: accentHex,
    accentStrong: rgbToHex(strong),
    accentSoft: `rgb(${triplet} / 0.16)`,
    accentLine: `rgb(${triplet} / 0.45)`,
    accentInk: darkInk >= lightInk ? rgbToHex(dark) : rgbToHex(light),
    inkContrast: Math.round(Math.max(darkInk, lightInk) * 10) / 10,
    strongContrast: Math.round(contrast(strong, background) * 10) / 10,
    conflicts,
    vitalOk: conflicts.length > 0 ? "ok" : "accent",
  };
}

export function paletteVariables(palette: Palette): Record<string, string> {
  return {
    "--ccp-accent": palette.accent,
    "--ccp-accent-strong": palette.accentStrong,
    "--ccp-accent-soft": palette.accentSoft,
    "--ccp-accent-line": palette.accentLine,
    "--ccp-accent-ink": palette.accentInk,
    "--ccp-vital-ok": palette.vitalOk === "ok" ? "var(--ccp-ok)" : "var(--ccp-accent)",
  };
}
