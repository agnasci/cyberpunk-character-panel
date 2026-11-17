import { describe, expect, it } from "vitest";
import {
  ACCENT_PRESETS,
  buildPalette,
  contrast,
  DEFAULT_ACCENT,
  hexToRgb,
  hslToRgb,
  MIN_TEXT_CONTRAST,
  normalizeHex,
  paletteVariables,
  rgbToHsl,
  semanticConflicts,
} from "../../src/domain/palette";

describe("palette", () => {
  it("normalizes hex input", () => {
    expect(normalizeHex("22D3EE")).toBe("#22d3ee");
    expect(normalizeHex(" #fa0 ")).toBe("#ffaa00");
    expect(normalizeHex("blue")).toBeNull();
  });

  it("falls back to the default accent", () => {
    expect(buildPalette("nope").accent).toBe(DEFAULT_ACCENT);
    expect(buildPalette(null).accent).toBe(DEFAULT_ACCENT);
  });

  it("matches the WCAG contrast reference values", () => {
    expect(contrast([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(contrast([255, 255, 255], [255, 255, 255])).toBeCloseTo(1, 5);
  });

  it("round-trips HSL", () => {
    const rgb = hexToRgb("#9b6bff");
    expect(rgb).not.toBeNull();
    if (!rgb) return;
    const [h, s, l] = rgbToHsl(rgb);
    expect(hslToRgb(h, s, l)).toEqual(rgb);
  });

  it("keeps ink and strong text readable for every preset and odd colors", () => {
    for (const hex of [...ACCENT_PRESETS.map((p) => p.hex), "#1a237e", "#000000", "#ffffff"]) {
      const palette = buildPalette(hex);
      expect(palette.inkContrast, hex).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
      expect(palette.strongContrast, hex).toBeGreaterThanOrEqual(MIN_TEXT_CONTRAST);
    }
  });

  it("flags accents too close to wound colors and swaps the healthy vital color", () => {
    expect(semanticConflicts([255, 59, 92])).toContain("mortallyWounded");
    expect(semanticConflicts([242, 201, 76])).toContain("lightlyWounded");
    expect(semanticConflicts([34, 211, 238])).toEqual([]);
    expect(semanticConflicts([200, 190, 190])).toEqual([]);
    const red = buildPalette("#ff2a4f");
    expect(red.vitalOk).toBe("ok");
    expect(paletteVariables(red)["--ccp-vital-ok"]).toBe("var(--ccp-ok)");
    expect(paletteVariables(buildPalette(DEFAULT_ACCENT))["--ccp-vital-ok"]).toBe(
      "var(--ccp-accent)",
    );
  });
});
