export type LedgerProp = "wealth" | "improvementPoints" | "reputation";
export type LedgerMode = "add" | "subtract" | "set";

export interface LedgerEntry {
  prop: LedgerProp;
  value: number;
}

export interface LedgerView extends LedgerEntry {
  labelKey: string;
  unit: string;
}

export interface InjuryEntry {
  id: string;
  name: string;
  location: string;
  deathSaveIncrease: boolean;
}

export interface DrugEntry {
  id: string;
  name: string;
  img: string;
  amount: number;
}

export interface EffectEntry {
  uuid: string;
  name: string;
  img: string;
  source: string | null;
  disabled: boolean;
}

export interface StatusEntry {
  id: string;
  name: string;
  img: string;
  active: boolean;
}

export interface LedgerChange {
  prop: LedgerProp;
  mode: LedgerMode;
  delta: number;
  next: number;
  warningKey: string | null;
}

const LEDGER_ORDER: readonly LedgerProp[] = ["wealth", "improvementPoints", "reputation"];

const LEDGER_LABELS: Readonly<Record<LedgerProp, string>> = {
  wealth: "CPR.characterSheet.rightPane.eurobucks.eurobucks",
  improvementPoints: "CPR.characterSheet.leftPane.improvementPointsShort",
  reputation: "CPR.characterSheet.bottomPane.reputation",
};

const LEDGER_UNITS: Readonly<Record<LedgerProp, string>> = {
  wealth: "eb",
  improvementPoints: "IP",
  reputation: "",
};

const NOT_ENOUGH: Readonly<Record<LedgerProp, string>> = {
  wealth: "CPR.messages.warningNotEnoughEb",
  improvementPoints: "CPR.messages.warningNotEnoughIp",
  reputation: "CPR.messages.warningNotEnoughReputation",
};

export function isLedgerProp(value: string): value is LedgerProp {
  return (LEDGER_ORDER as readonly string[]).includes(value);
}

export function isLedgerMode(value: string): value is LedgerMode {
  return value === "add" || value === "subtract" || value === "set";
}

export function buildLedgerViews(entries: readonly LedgerEntry[]): LedgerView[] {
  return LEDGER_ORDER.flatMap((prop) => {
    const entry = entries.find((e) => e.prop === prop);
    return entry ? [{ ...entry, labelKey: LEDGER_LABELS[prop], unit: LEDGER_UNITS[prop] }] : [];
  });
}

export function parseLedgerAmount(text: string): number | null {
  const trimmed = text.trim();
  if (!/^-?\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}

export function planLedgerChange(
  prop: LedgerProp,
  mode: LedgerMode,
  current: number,
  amount: number,
): LedgerChange {
  if (mode === "set") {
    return { prop, mode, delta: amount - current, next: amount, warningKey: null };
  }
  const size = Math.abs(amount);
  const delta = mode === "add" ? amount : -size;
  const next = current + delta;
  return {
    prop,
    mode,
    delta,
    next,
    warningKey: mode === "subtract" && next < 0 ? NOT_ENOUGH[prop] : null,
  };
}

export function ledgerReason(reason: string, userName: string): string {
  return `${reason.trim()} - ${userName}`;
}

export function injuryLocationKey(location: string): string {
  return `CPR.global.location.${location}`;
}

export function sortByName<T extends { name: string }>(items: readonly T[]): T[] {
  return [...items].sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
  );
}
