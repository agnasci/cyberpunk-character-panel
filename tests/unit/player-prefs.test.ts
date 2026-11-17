import { describe, expect, it } from "vitest";
import { prefsToApply, prefsToSeed } from "../../src/domain/player-prefs";

const keys = ["compact", "accent", "dock"];

describe("prefsToApply", () => {
  it("returns only the stored values that differ from this browser", () => {
    expect(
      prefsToApply(
        { compact: true, accent: "#ff2fd0", dock: "bottom", other: 1 },
        { compact: false, accent: "#ff2fd0", dock: "bottom" },
        keys,
      ),
    ).toEqual({ compact: true });
  });

  it("treats a missing and a null accent as the same", () => {
    expect(prefsToApply({ accent: null }, { accent: undefined }, keys)).toEqual({});
    expect(prefsToApply({ accent: null }, { accent: "#00ff00" }, keys)).toEqual({ accent: null });
  });

  it("does nothing without stored preferences", () => {
    expect(prefsToApply(undefined, { compact: true }, keys)).toEqual({});
  });
});

describe("prefsToSeed", () => {
  it("copies this browser's values for keys the player never stored", () => {
    expect(
      prefsToSeed({ compact: true }, { compact: false, accent: null, dock: "top" }, keys),
    ).toEqual({ accent: null, dock: "top" });
    expect(prefsToSeed(null, { compact: false, accent: "#fff", dock: "top" }, keys)).toEqual({
      compact: false,
      accent: "#fff",
      dock: "top",
    });
  });
});
