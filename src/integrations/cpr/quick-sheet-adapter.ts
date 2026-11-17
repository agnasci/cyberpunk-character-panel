import {
  type DrugEntry,
  type EffectEntry,
  type InjuryEntry,
  type LedgerChange,
  type LedgerEntry,
  type LedgerProp,
  ledgerReason,
  sortByName,
  type StatusEntry,
} from "../../domain/quick-sheet";

type Bag = Record<string, unknown>;

interface CprLedgerActor {
  deltaLedgerProperty?: (prop: string, delta: number, reason: string) => unknown;
  setLedgerProperty?: (prop: string, value: number, reason: string) => unknown;
  allApplicableEffects?: () => Iterable<EffectDocument>;
  toggleStatusEffect?: (id: string) => Promise<unknown>;
}

interface EffectDocument {
  uuid: string;
  name: string;
  img?: string;
  icon?: string;
  disabled: boolean;
  parent: unknown;
  update(data: Record<string, unknown>): Promise<unknown>;
  sheet?: { render(force: boolean): unknown } | null;
}

interface StatusConfig {
  id?: string;
  name?: string;
  label?: string;
  img?: string;
  icon?: string;
}

const LEDGER_PROPS: readonly LedgerProp[] = ["wealth", "improvementPoints", "reputation"];

function bag(value: unknown): Bag | null {
  return value !== null && typeof value === "object" ? (value as Bag) : null;
}

function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function cpr(actor: Actor): CprLedgerActor {
  return actor as unknown as CprLedgerActor;
}

export function readLedgers(actor: Actor): LedgerEntry[] {
  const system = bag(actor.system);
  return LEDGER_PROPS.flatMap((prop) => {
    const value = num(bag(system?.[prop])?.value);
    return value === null ? [] : [{ prop, value }];
  });
}

export function readInjuries(actor: Actor): InjuryEntry[] {
  return sortByName(
    (actor.itemTypes.criticalInjury ?? []).map((item) => {
      const system = bag(item.system);
      return {
        id: item.id,
        name: item.name,
        location: typeof system?.location === "string" ? system.location : "body",
        deathSaveIncrease: system?.deathSaveIncrease === true,
      };
    }),
  );
}

export function readDrugs(actor: Actor): DrugEntry[] {
  return sortByName(
    (actor.itemTypes.drug ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      img: (item as Item & { img?: string }).img ?? "",
      amount: num(bag(item.system)?.amount) ?? 0,
    })),
  );
}

function effectDocuments(actor: Actor): EffectDocument[] {
  const all = cpr(actor).allApplicableEffects;
  return typeof all === "function" ? Array.from(all.call(actor)) : [];
}

export function readEffects(actor: Actor): EffectEntry[] {
  return sortByName(
    effectDocuments(actor)
      .filter((effect) => !(effect as { statuses?: Set<string> }).statuses?.size)
      .map((effect) => {
        const parent = effect.parent as { name?: string; uuid?: string } | null;
        return {
          uuid: effect.uuid,
          name: effect.name,
          img: effect.img ?? effect.icon ?? "",
          source: parent && parent.uuid !== actor.uuid ? (parent.name ?? null) : null,
          disabled: effect.disabled,
        };
      }),
  );
}

export function readStatuses(actor: Actor): StatusEntry[] {
  const config = (globalThis as { CONFIG?: { statusEffects?: StatusConfig[] } }).CONFIG
    ?.statusEffects;
  return (config ?? []).flatMap((status) => {
    if (!status.id) return [];
    const label = status.name ?? status.label ?? status.id;
    return [
      {
        id: status.id,
        name: game.i18n.localize(label),
        img: status.img ?? status.icon ?? "",
        active: actor.statuses.has(status.id),
      },
    ];
  });
}

export async function applyLedgerChange(actor: Actor, change: LedgerChange, reason: string) {
  const methods = cpr(actor);
  if (!actor.isOwner) return false;
  const text = ledgerReason(reason, game.user.name);
  if (change.mode === "set") {
    if (typeof methods.setLedgerProperty !== "function") return false;
    await methods.setLedgerProperty.call(actor, change.prop, change.next, text);
    return true;
  }
  if (typeof methods.deltaLedgerProperty !== "function") return false;
  await methods.deltaLedgerProperty.call(actor, change.prop, change.delta, text);
  return true;
}

export async function openLedger(actor: Actor, prop: LedgerProp): Promise<boolean> {
  const sheet = actor.sheet as { showLedger?: (prop: string) => Promise<unknown> } | null;
  if (typeof sheet?.showLedger !== "function") return false;
  await sheet.showLedger(prop);
  return true;
}

function ownedItem(actor: Actor, type: string, id: string) {
  return (actor.itemTypes[type] ?? []).find((item) => item.id === id) ?? null;
}

export function openItem(actor: Actor, type: string, id: string): boolean {
  const item = ownedItem(actor, type, id) as
    (Item & { sheet?: { render(f: boolean): unknown } }) | null;
  if (!item?.sheet) return false;
  item.sheet.render(true);
  return true;
}

export async function useDrug(actor: Actor, id: string): Promise<boolean> {
  const drug = ownedItem(actor, "drug", id) as (Item & { snort?: () => Promise<unknown> }) | null;
  if (!actor.isOwner || typeof drug?.snort !== "function") return false;
  await drug.snort();
  return true;
}

export async function toggleEffect(actor: Actor, uuid: string): Promise<boolean> {
  const effect = effectDocuments(actor).find((e) => e.uuid === uuid);
  if (!actor.isOwner || !effect) return false;
  await effect.update({ disabled: !effect.disabled });
  return true;
}

export function openEffect(actor: Actor, uuid: string): boolean {
  const effect = effectDocuments(actor).find((e) => e.uuid === uuid);
  if (!effect?.sheet) return false;
  effect.sheet.render(true);
  return true;
}

export async function toggleStatus(actor: Actor, id: string): Promise<boolean> {
  const toggle = cpr(actor).toggleStatusEffect;
  if (!actor.isOwner || typeof toggle !== "function") return false;
  await toggle.call(actor, id);
  return true;
}
