import { describe, expect, it } from "vitest";
import { buildStyleView, styleNote } from "../../src/domain/style-view";

const input = {
  accent: "#22d3ee",
  preview: null,
  accentOverride: null,
  worldAccent: "#22d3ee",
  isGM: false,
  compact: false,
  showFavorites: true,
  showBpm: false,
  animateMonitor: true,
  dock: "bottom" as const,
};

describe("style view", () => {
  it("marks the current preset and reports the saved state", () => {
    const view = buildStyleView(input);
    expect(view.presets.find((p) => p.pressed)?.id).toBe("cyan");
    expect(view).toMatchObject({ dirty: false, isOverride: false, dock: "bottom" });
    expect(view.prefs.map((p) => [p.key, p.on])).toEqual([
      ["compact", false],
      ["showFavorites", true],
      ["showBpm", false],
      ["animateMonitor", true],
    ]);
  });

  it("shows a valid preview as unsaved and ignores an invalid one", () => {
    expect(buildStyleView({ ...input, preview: "#ff2fd0" })).toMatchObject({
      accent: "#ff2fd0",
      dirty: true,
    });
    expect(buildStyleView({ ...input, preview: "zz" })).toMatchObject({
      accent: "#22d3ee",
      dirty: false,
    });
  });

  it("names wound states that the accent could be confused with", () => {
    expect(styleNote("#ff2a4f").conflictKeys).toContain("CPR.global.woundState.mortallyWounded");
    expect(styleNote("#22d3ee").conflictKeys).toEqual([]);
  });
});
