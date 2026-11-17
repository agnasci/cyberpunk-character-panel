import { describe, expect, it } from "vitest";
import { clampInt, parseHpEntry, stepHp, stepLuck } from "../../src/domain/vital-limits";

describe("vital limits", () => {
  it("keeps HP between 0 and max", () => {
    expect(stepHp(3, -5, 35)).toBe(0);
    expect(stepHp(33, 5, 35)).toBe(35);
    expect(stepHp(20, -1, 35)).toBe(19);
  });

  it("keeps LUCK between 0 and max", () => {
    expect(stepLuck(0, -1, 6)).toBe(0);
    expect(stepLuck(6, 1, 6)).toBe(6);
    expect(stepLuck(3, 1, 6)).toBe(4);
    expect(stepLuck(8, -1, 6)).toBe(7);
    expect(stepLuck(8, 1, 6)).toBe(8);
    expect(stepHp(45, -1, 40)).toBe(44);
    expect(stepHp(45, 5, 40)).toBe(45);
    expect(stepHp(39, 5, 40)).toBe(40);
    expect(parseHpEntry("-5", 45, 40)).toBe(40);
    expect(parseHpEntry("43", 45, 40)).toBe(43);
    expect(parseHpEntry("50", 45, 40)).toBe(45);
    expect(parseHpEntry("50", 30, 40)).toBe(40);
    expect(stepLuck(0, 1, 0)).toBe(0);
  });

  it("parses absolute and relative HP entries", () => {
    expect(parseHpEntry("12", 30, 35)).toBe(12);
    expect(parseHpEntry("99", 30, 35)).toBe(35);
    expect(parseHpEntry("-7", 30, 35)).toBe(23);
    expect(parseHpEntry("−7", 30, 35)).toBe(23);
    expect(parseHpEntry("+ 4", 30, 35)).toBe(34);
    expect(parseHpEntry("abc", 30, 35)).toBeNull();
    expect(parseHpEntry("", 30, 35)).toBeNull();
    expect(parseHpEntry("3.5", 30, 35)).toBeNull();
  });

  it("clamps odd inputs", () => {
    expect(clampInt(Number.NaN, 0, 10)).toBe(0);
    expect(clampInt(4.8, 0, 10)).toBe(4);
    expect(clampInt(5, 0, -1)).toBe(0);
  });
});
