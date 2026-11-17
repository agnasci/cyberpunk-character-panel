import type { CharacterSnapshot } from "../../domain/character";

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

function readHp(system: Bag | null): CharacterSnapshot["hp"] {
  const hp = bag(bag(system?.derivedStats)?.hp);
  const value = num(hp?.value);
  const max = num(hp?.max);
  return value === null || max === null ? null : { value, max };
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
  return {
    actorUuid: actor.uuid,
    actorType: actor.type,
    name: token && !token.actorLink ? token.name : actor.name,
    img: actor.img,
    aliasHtml: str(bag(system?.information)?.alias) ?? "",
    role: readRole(actor, system),
    hp: readHp(system),
    woundState: str(bag(system?.derivedStats)?.currentWoundState),
    dead: actor.statuses.has("dead"),
    canEdit: actor.isOwner,
  };
}
