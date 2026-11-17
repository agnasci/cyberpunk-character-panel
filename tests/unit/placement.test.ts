import { describe, expect, it } from "vitest";
import { alignOffset } from "../../src/domain/placement";

describe("alignOffset", () => {
  it("lines the panel up with the hotbar's left edge", () => {
    expect(alignOffset({ areaLeft: 220, areaWidth: 1288, panelWidth: 900, targetLeft: 220 })).toBe(
      0,
    );
    expect(alignOffset({ areaLeft: 220, areaWidth: 1288, panelWidth: 620, targetLeft: 400 })).toBe(
      180,
    );
  });

  it("stays inside the column", () => {
    expect(alignOffset({ areaLeft: 220, areaWidth: 1000, panelWidth: 900, targetLeft: 600 })).toBe(
      100,
    );
    expect(alignOffset({ areaLeft: 220, areaWidth: 1000, panelWidth: 900, targetLeft: 10 })).toBe(
      0,
    );
  });

  it("centers in the column when there is no hotbar", () => {
    expect(alignOffset({ areaLeft: 220, areaWidth: 1000, panelWidth: 600, targetLeft: null })).toBe(
      200,
    );
  });
});
