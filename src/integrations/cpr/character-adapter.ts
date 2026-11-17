import type { CharacterSnapshot, DeathSaveSnapshot, Pool } from "../../domain/character";

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
    canEdit: actor.isOwner,
  };
}
