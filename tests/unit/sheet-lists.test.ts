import { describe, expect, it } from "vitest";
import {
  categoryLabelKey,
  favoriteSkills,
  groupSkills,
  orderStats,
  searchKey,
  type SkillEntry,
  skillTotal,
  sortAbilities,
} from "../../src/domain/sheet-lists";

const skill = (extra: Partial<SkillEntry>): SkillEntry => ({
  id: "s",
  name: "Skill",
  label: "Skill",
  category: "awarenessSkills",
  stat: "int",
  level: 2,
  mod: 0,
  total: 10,
  favorite: false,
  situational: false,
  ...extra,
});

describe("skills", () => {
  it("groups by the system category order and sorts by label", () => {
    const groups = groupSkills([
      skill({ id: "a", label: "Persuasão", category: "socialSkills" }),
      skill({ id: "b", label: "Percepção", category: "awarenessSkills" }),
      skill({ id: "c", label: "Concentração", category: "awarenessSkills" }),
      skill({ id: "d", label: "Custom", category: "homebrew" }),
    ]);
    expect(groups.map((g) => g.category)).toEqual(["awarenessSkills", "socialSkills", "homebrew"]);
    expect(groups[0]?.skills.map((s) => s.id)).toEqual(["c", "b"]);
  });

  it("uses the system label keys, including the ranged weapon key", () => {
    expect(categoryLabelKey("bodySkills")).toBe("CPR.global.skillCategories.bodySkills");
    expect(categoryLabelKey("rangedweaponSkills")).toBe(
      "CPR.global.skillCategories.rangedWeaponSkills",
    );
  });

  it("lists favorites in label order", () => {
    const favs = favoriteSkills([
      skill({ id: "x", label: "Stealth", favorite: true }),
      skill({ id: "y", label: "Athletics", favorite: true }),
      skill({ id: "z", label: "Brawling" }),
    ]);
    expect(favs.map((s) => s.id)).toEqual(["y", "x"]);
  });

  it("adds STAT, level and modifiers like the sheet", () => {
    expect(skillTotal(8, 6, -2)).toBe(12);
  });

  it("normalizes search text without accents or case", () => {
    expect(searchKey("  Percepção ")).toBe("percepcao");
  });
});

describe("stats and abilities", () => {
  it("orders STATs like the system stat list", () => {
    const keys = orderStats([
      { key: "emp", value: 5, max: 6 },
      { key: "luck", value: 4, max: 6 },
      { key: "int", value: 7, max: null },
      { key: "odd", value: 1, max: null },
    ]).map((s) => s.key);
    expect(keys).toEqual(["int", "luck", "emp", "odd"]);
  });

  it("keeps the main ability first and sorts sub-abilities", () => {
    const sorted = sortAbilities([
      { name: "b", label: "Zeta", rank: 1, subtype: "subRoleAbility" },
      { name: "a", label: "Alpha", rank: 2, subtype: "subRoleAbility" },
      { name: "m", label: "Main", rank: 4, subtype: "mainRoleAbility" },
    ]);
    expect(sorted.map((a) => a.name)).toEqual(["m", "a", "b"]);
  });
});
