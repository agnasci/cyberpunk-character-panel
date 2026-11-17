import { describe, expect, it } from "vitest";
import {
  buildActionsView,
  buildDrawerView,
  buildStatsView,
  filterVisible,
  interfaceAbilities,
} from "../../src/domain/panel-views";
import type { RoleEntry, SkillEntry } from "../../src/domain/sheet-lists";

const skills: SkillEntry[] = [
  {
    id: "s1",
    name: "Perception",
    label: "Percepção",
    category: "awarenessSkills",
    stat: "int",
    level: 4,
    mod: 1,
    total: 13,
    favorite: true,
    situational: false,
  },
];
const roles: RoleEntry[] = [
  { id: "r1", name: "Medtech", label: "Medtech", rank: 4, active: true, abilities: [] },
  {
    id: "r2",
    name: "Netrunner",
    label: "Netrunner",
    rank: 2,
    active: false,
    abilities: [{ name: "Interface", label: "Interface", rank: 2, subtype: "mainRoleAbility" }],
  },
];
const net = { deckId: "d1", deckName: "Deck", netRoleLabel: "Interface" };

describe("panel views", () => {
  it("labels STATs with system keys", () => {
    expect(buildStatsView([{ key: "ref", value: 8, max: null }])[0]).toMatchObject({
      labelKey: "CPR.global.stats.ref",
      tooltipKey: "CPR.global.stats.refToolTip",
    });
  });

  it("only offers drawers that have content", () => {
    const actions = buildActionsView("net", { skills, roles, net: null, ledgers: [] });
    expect(actions).toMatchObject({ open: null, hasSkills: true, hasRoles: true, hasNet: false });
    expect(actions.favorites.map((s) => s.id)).toEqual(["s1"]);
  });

  it("fills only the open drawer and hides roles without rollable abilities", () => {
    expect(buildDrawerView(null, { skills })).toEqual({
      open: null,
      skills: null,
      roles: null,
      net: null,
      ledgers: null,
      health: null,
      style: null,
    });
    expect(buildDrawerView("roles", { roles }).roles?.map((r) => r.id)).toEqual(["r2"]);
    expect(buildDrawerView("skills", { skills }).skills?.[0]?.skills[0]).toMatchObject({
      search: "percepcao",
      statLabelKey: "CPR.global.stats.int",
    });
  });

  it("lists the nine interface abilities plus defense and speed", () => {
    const keys = buildDrawerView("net", { net }).net?.abilities.map((a) => a.key);
    expect(keys).toHaveLength(11);
    expect(keys?.slice(-2)).toEqual(["defense", "speed"]);
    expect(interfaceAbilities()[0]?.labelKey).toBe(
      "CPR.global.role.netrunner.interfaceAbility.scanner",
    );
  });

  it("adds search keys to health entries", () => {
    const health = buildDrawerView("health", {
      injuries: [{ id: "i1", name: "Braço Quebrado", location: "body", deathSaveIncrease: false }],
      drugs: [{ id: "d1", name: "Blue Glass", img: "", amount: 1 }],
      effects: [{ uuid: "e1", name: "Atordoado", img: "", source: "Flashbang", disabled: false }],
      statuses: [{ id: "prone", name: "Caído", img: "", active: false }],
    }).health;
    expect(health?.injuries[0]?.search).toBe("braco quebrado");
    expect(health?.drugs[0]?.search).toBe("blue glass");
    expect(health?.effects[0]?.search).toBe("atordoado flashbang");
    expect(health?.statuses[0]?.search).toBe("caido");
  });

  it("filters search text", () => {
    expect(filterVisible("percepcao", "PERC")).toBe(true);
    expect(filterVisible("percepcao", "stealth")).toBe(false);
    expect(filterVisible("percepcao", "  ")).toBe(true);
  });
});
