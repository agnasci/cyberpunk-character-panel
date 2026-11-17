import {
  type AbilityEntry,
  type NetEntry,
  type RoleEntry,
  type SkillEntry,
  skillTotal,
  sortAbilities,
} from "../../domain/sheet-lists";

type Bag = Record<string, unknown>;
type Helper = (...args: unknown[]) => unknown;

function bag(value: unknown): Bag | null {
  return value !== null && typeof value === "object" ? (value as Bag) : null;
}

function num(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function helper(name: string): Helper | null {
  const helpers = (globalThis as { Handlebars?: { helpers?: Record<string, unknown> } }).Handlebars
    ?.helpers;
  const fn = helpers?.[name];
  return typeof fn === "function" ? (fn as Helper) : null;
}

export function localizedName(subject: Item | string, type?: string): string {
  const fallback = typeof subject === "string" ? subject : subject.name;
  const keyHelper = helper("cprGetLocalizedlNameKey");
  if (!keyHelper) return fallback;
  try {
    const key = keyHelper(subject, type ?? false);
    if (typeof key !== "string" || key === "") return fallback;
    const label = game.i18n.localize(key);
    return label === key ? fallback : label;
  } catch {
    return fallback;
  }
}

function skillMod(actor: Actor, skillName: string, info: "modTotal" | "hasSituational") {
  const modHelper = helper("cprGetSkillModInfo");
  if (!modHelper) return info === "modTotal" ? 0 : false;
  try {
    return modHelper(skillName, actor, info, { hash: {} });
  } catch {
    return info === "modTotal" ? 0 : false;
  }
}

export function readSkills(actor: Actor): SkillEntry[] {
  const stats = bag(bag(actor.system)?.stats);
  return (actor.itemTypes.skill ?? []).map((skill) => {
    const system = bag(skill.system);
    const stat = str(system?.stat);
    const level = num(system?.level);
    const mod = num(skillMod(actor, skill.name, "modTotal"));
    return {
      id: skill.id,
      name: skill.name,
      label: localizedName(skill),
      category: str(system?.category),
      stat,
      level,
      mod,
      total: skillTotal(num(bag(stats?.[stat])?.value), level, mod),
      favorite: system?.favorite === true,
      situational: skillMod(actor, skill.name, "hasSituational") === true,
    };
  });
}

export function readRoles(actor: Actor): RoleEntry[] {
  const activeName = str(bag(bag(actor.system)?.roleInfo)?.activeRole);
  return (actor.itemTypes.role ?? []).map((role) => {
    const system = bag(role.system);
    const rank = num(system?.rank);
    const abilities: AbilityEntry[] = [];
    const main = str(system?.mainRoleAbility);
    if (main && system?.hasRoll === true) {
      abilities.push({
        name: main,
        label: localizedName(main, "roleAbility"),
        rank,
        subtype: "mainRoleAbility",
      });
    }
    const subs = Array.isArray(system?.abilities) ? system.abilities : [];
    for (const raw of subs) {
      const ability = bag(raw);
      const name = str(ability?.name);
      if (!name || ability?.hasRoll !== true) continue;
      abilities.push({
        name,
        label: localizedName(name, "roleAbility"),
        rank: num(ability?.rank),
        subtype: "subRoleAbility",
      });
    }
    return {
      id: role.id,
      name: role.name,
      label: localizedName(role),
      rank,
      active: role.name === activeName,
      abilities: sortAbilities(abilities),
    };
  });
}

export function readNet(actor: Actor): NetEntry | null {
  const deck = (actor.itemTypes.cyberdeck ?? []).find(
    (item) => bag(item.system)?.equipped === "equipped",
  );
  if (!deck) return null;
  const netRoleId = str(bag(bag(actor.system)?.roleInfo)?.activeNetRole);
  const netRole = (actor.itemTypes.role ?? []).find((role) => role.id === netRoleId);
  const ability = netRole ? str(bag(netRole.system)?.mainRoleAbility) : "";
  return {
    deckId: deck.id,
    deckName: deck.name,
    netRoleLabel: ability ? localizedName(ability, "roleAbility") : null,
  };
}

export async function toggleFavorite(actor: Actor, itemId: string): Promise<boolean> {
  if (!actor.isOwner) return false;
  const item = (actor.itemTypes.skill ?? []).find((skill) => skill.id === itemId) as
    (Item & { toggleFavorite?: () => unknown }) | undefined;
  if (typeof item?.toggleFavorite !== "function") return false;
  await item.toggleFavorite();
  return true;
}
