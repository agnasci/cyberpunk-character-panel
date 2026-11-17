import type {
  ArmorSnapshot,
  CharacterSnapshot,
  DeathSaveSnapshot,
  Pool,
} from "../../domain/character";
import { orderStats, type StatEntry } from "../../domain/sheet-lists";

type Bag = Record<string, unknown>;

function bag(value: unknown): Bag | null {
  return value !== null && typeof value === "object" ? (value as Bag) : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readPool(source: unknown): Pool | null {
  const pool = bag(source);
  const value = num(pool?.value);
  const max = num(pool?.max);
  return value === null || max === null ? null : { value, max };
}

function readDeathSave(derived: Bag | null): DeathSaveSnapshot | null {
  const ds = bag(derived?.deathSave);
  const value = num(ds?.value);
  if (value === null) return null;
  return { value, penalty: num(ds?.penalty) ?? 0, basePenalty: num(ds?.basePenalty) ?? 0 };
}

function readArmor(system: Bag | null): ArmorSnapshot {
  const external = bag(system?.externalData);
  const pool = (key: string) => {
    const p = readPool(external?.[key]);
    return p && p.max > 0 ? p : null;
  };
  return {
    head: pool("currentArmorHead"),
    body: pool("currentArmorBody"),
    shield: pool("currentArmorShield"),
  };
}

function readStats(system: Bag | null): StatEntry[] {
  const stats = bag(system?.stats);
  if (!stats) return [];
  const entries: StatEntry[] = [];
  for (const [key, raw] of Object.entries(stats)) {
    const value = num(bag(raw)?.value);
    if (value !== null) entries.push({ key, value, max: num(bag(raw)?.max) });
  }
  return orderStats(entries);
}

function readRole(actor: Actor, system: Bag | null): CharacterSnapshot["role"] {
  const roles = actor.itemTypes.role ?? [];
  const activeName = str(bag(system?.roleInfo)?.activeRole);
  const role = roles.find((r) => r.name === activeName) ?? roles[0];
  if (!role) return null;
  return { name: role.name, rank: num(bag(role.system)?.rank) ?? 0 };
}

export function readCharacterSnapshot(
  actor: Actor,
  token: TokenDocument | null,
): CharacterSnapshot {
  const system = bag(actor.system);
  const derived = bag(system?.derivedStats);
  return {
    actorUuid: actor.uuid,
    actorType: actor.type,
    name: token && !token.actorLink ? token.name : actor.name,
    img: actor.img,
    aliasHtml: str(bag(system?.information)?.alias) ?? "",
    role: readRole(actor, system),
    hp: readPool(derived?.hp),
    woundState: str(derived?.currentWoundState),
    dead: actor.statuses.has("dead"),
    humanity: readPool(derived?.humanity),
    luck: readPool(bag(system?.stats)?.luck),
    deathSave: readDeathSave(derived),
    armor: readArmor(system),
    stats: readStats(system),
    canEdit: actor.isOwner,
  };
}
