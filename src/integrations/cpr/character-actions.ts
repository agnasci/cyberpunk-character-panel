import { clampInt } from "../../domain/vital-limits";
import { readCharacterSnapshot } from "./character-adapter";

interface CprSheet {
  _onRoll(event: Record<string, unknown>): Promise<unknown>;
}

interface CprActorMethods {
  increaseDeathPenalty?: () => unknown;
  resetDeathPenalty?: () => unknown;
}

export interface RollModifiers {
  ctrlKey: boolean;
  metaKey: boolean;
}

function editable(actor: Actor): boolean {
  return actor.isOwner;
}

export async function setHp(actor: Actor, value: number): Promise<boolean> {
  const hp = readCharacterSnapshot(actor, null).hp;
  if (!editable(actor) || !hp) return false;
  const next = clampInt(value, 0, hp.max);
  await actor.update({ "system.derivedStats.hp.value": next });
  return true;
}

export async function setLuck(actor: Actor, value: number): Promise<boolean> {
  const luck = readCharacterSnapshot(actor, null).luck;
  if (!editable(actor) || !luck) return false;
  const next = clampInt(value, 0, luck.max);
  await actor.update({ "system.stats.luck.value": next });
  return true;
}

export async function increaseDeathPenalty(actor: Actor): Promise<boolean> {
  const methods = actor as unknown as CprActorMethods;
  if (!editable(actor) || typeof methods.increaseDeathPenalty !== "function") return false;
  await methods.increaseDeathPenalty();
  return true;
}

export async function resetDeathPenalty(actor: Actor): Promise<boolean> {
  const methods = actor as unknown as CprActorMethods;
  if (!editable(actor) || typeof methods.resetDeathPenalty !== "function") return false;
  await methods.resetDeathPenalty();
  return true;
}

export async function rollDeathSave(actor: Actor, modifiers: RollModifiers): Promise<boolean> {
  return rollFromSheet(
    actor,
    {
      rollType: "deathsave",
      rollTitle: game.i18n.localize("CPR.characterSheet.leftPane.deathSave.title"),
    },
    modifiers,
  );
}

export function rollStat(actor: Actor, stat: string, modifiers: RollModifiers) {
  return rollFromSheet(actor, { rollType: "stat", rollTitle: stat }, modifiers);
}

export function rollFacedown(actor: Actor, modifiers: RollModifiers) {
  return rollFromSheet(
    actor,
    {
      rollType: "facedown",
      rollTitle: game.i18n.localize("CPR.characterSheet.bottomPane.fight.facedown"),
    },
    modifiers,
  );
}

export function rollSkill(actor: Actor, skillId: string, modifiers: RollModifiers) {
  const skill = (actor.itemTypes.skill ?? []).find((item) => item.id === skillId);
  if (!skill) return Promise.resolve(false);
  return rollFromSheet(
    actor,
    { rollType: "skill", rollTitle: skill.name, itemId: skill.id },
    modifiers,
  );
}

export function rollRoleAbility(
  actor: Actor,
  roleId: string,
  subtype: string,
  ability: string,
  modifiers: RollModifiers,
) {
  if (!(actor.itemTypes.role ?? []).some((role) => role.id === roleId)) {
    return Promise.resolve(false);
  }
  return rollFromSheet(
    actor,
    { rollType: "roleAbility", rollSubtype: subtype, rollTitle: ability, itemId: roleId },
    modifiers,
  );
}

export function rollInterface(
  actor: Actor,
  ability: string,
  deckId: string,
  modifiers: RollModifiers,
) {
  return rollFromSheet(
    actor,
    { rollType: "interfaceAbility", interfaceAbility: ability, cyberdeckId: deckId },
    modifiers,
  );
}

export function buildRollEvent(
  dataset: Readonly<Record<string, string>>,
  modifiers: RollModifiers,
): Record<string, unknown> {
  const target = document.createElement("a");
  Object.assign(target.dataset, dataset);
  return {
    currentTarget: target,
    target,
    type: "click",
    ctrlKey: modifiers.ctrlKey,
    metaKey: modifiers.metaKey,
    preventDefault: () => undefined,
    stopPropagation: () => undefined,
  };
}

async function rollFromSheet(
  actor: Actor,
  dataset: Record<string, string>,
  modifiers: RollModifiers,
): Promise<boolean> {
  const sheet = actor.sheet as Partial<CprSheet> | null;
  if (!editable(actor) || typeof sheet?._onRoll !== "function") return false;
  await sheet._onRoll(buildRollEvent(dataset, modifiers));
  return true;
}
