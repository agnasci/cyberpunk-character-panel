import { describe, expect, it } from "vitest";
import { checkSystemCompatibility } from "../../src/compatibility";

describe("checkSystemCompatibility", () => {
  it("accepts the tested system version", () => {
    expect(checkSystemCompatibility({ id: "cyberpunk-red-core", version: "v0.92.4" })).toEqual({
      status: "supported",
    });
  });

  it("flags another version as untested", () => {
    expect(checkSystemCompatibility({ id: "cyberpunk-red-core", version: "v0.93.0" })).toEqual({
      status: "untested-version",
      tested: "v0.92.4",
      found: "v0.93.0",
    });
  });

  it("rejects another system", () => {
    expect(checkSystemCompatibility({ id: "dnd5e", version: "4.0.0" })).toEqual({
      status: "wrong-system",
      found: "dnd5e",
    });
  });
});
