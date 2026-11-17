import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readNet, readRoles, readSkills } from "../../src/integrations/cpr/sheet-adapter";

const labels: Record<string, string> = {
  "CPR.global.itemType.skill.perception": "Percepção",
  "CPR.global.role.netrunner.name": "Netrunner",
  "CPR.global.role.netrunner.ability.interface": "Interface",
};

function item(id: string, name: string, type: string, system: unknown): Item {
  return { id, name, type, system, parent: null };
}

function actor(): Actor {
  return {
    id: "a1",
    uuid: "Actor.a1",
    name: "Runner",
    img: "",
    type: "character",
    isOwner: true,
    isToken: false,
    statuses: new Set(),
    sheet: null,
    update: () => Promise.resolve(undefined),
    system: {
      stats: { int: { value: 7 } },
      roleInfo: { activeRole: "Netrunner", activeNetRole: "r1" },
    },
    itemTypes: {
      skill: [
        item("s1", "Perception", "skill", {
          category: "awarenessSkills",
          stat: "int",
          level: 4,
          favorite: true,
        }),
        item("s2", "Homebrew", "skill", { category: "awarenessSkills", stat: "int", level: 1 }),
      ],
      role: [
        item("r1", "Netrunner", "role", {
          rank: 4,
          mainRoleAbility: "Interface",
          hasRoll: true,
          abilities: [{ name: "Passive", rank: 1, hasRoll: false }],
        }),
      ],
      cyberdeck: [
        item("d0", "Spare", "cyberdeck", { equipped: "carried" }),
        item("d1", "Paraline", "cyberdeck", { equipped: "equipped" }),
      ],
    },
  };
}

beforeEach(() => {
  vi.stubGlobal("game", { i18n: { localize: (k: string) => labels[k] ?? k } });
  vi.stubGlobal("Handlebars", {
    helpers: {
      cprGetLocalizedlNameKey: (subject: Item | string, type: string | false) => {
        const name = typeof subject === "string" ? subject : subject.name;
        const kind = typeof subject === "string" ? type : subject.type;
        const slug = name.charAt(0).toLowerCase() + name.slice(1);
        if (kind === "skill") return `CPR.global.itemType.skill.${slug}`;
        if (kind === "role") return `CPR.global.role.${slug}.name`;
        return `CPR.global.role.netrunner.ability.${slug}`;
      },
      cprGetSkillModInfo: (name: string, _actor: Actor, info: string) =>
        info === "modTotal" ? (name === "Perception" ? 2 : 0) : name === "Homebrew",
    },
  });
});

afterEach(() => vi.unstubAllGlobals());

describe("sheet adapter", () => {
  it("reads skills with sheet totals, labels and fallbacks", () => {
    const [perception, homebrew] = readSkills(actor());
    expect(perception).toMatchObject({
      label: "Percepção",
      level: 4,
      mod: 2,
      total: 13,
      favorite: true,
      situational: false,
    });
    expect(homebrew).toMatchObject({ label: "Homebrew", total: 8, situational: true });
  });

  it("keeps only rollable role abilities", () => {
    const [role] = readRoles(actor());
    expect(role).toMatchObject({ label: "Netrunner", rank: 4, active: true });
    expect(role?.abilities).toEqual([
      { name: "Interface", label: "Interface", rank: 4, subtype: "mainRoleAbility" },
    ]);
  });

  it("finds the equipped deck and the NET role", () => {
    expect(readNet(actor())).toEqual({
      deckId: "d1",
      deckName: "Paraline",
      netRoleLabel: "Interface",
    });
  });

  it("falls back to item names without the system helpers", () => {
    vi.stubGlobal("Handlebars", undefined);
    expect(readSkills(actor())[0]).toMatchObject({ label: "Perception", mod: 0, total: 11 });
  });
});
