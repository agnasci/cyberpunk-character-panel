import type { PanelPart } from "./panel-parts";

export const API_VERSION = 1;
export const SLOT_REGIONS = ["bar-end", "quick", "drawer"] as const;
export type SlotRegion = (typeof SLOT_REGIONS)[number];

const SLOT_ID = /^[a-z0-9][a-z0-9-]{0,47}$/;
const ICON = /^[a-z0-9][a-z0-9 -]{0,63}$/;
const LABEL_MAX = 40;
export const DEFAULT_SLOT_ICON = "fa-solid fa-puzzle-piece";

export type SlotError =
  "not-object" | "bad-id" | "bad-region" | "no-render" | "bad-label" | "bad-icon";

export interface SlotSpec<Render, Action> {
  id: string;
  region: SlotRegion;
  order: number;
  label: string | null;
  icon: string;
  render: Render;
  onAction: Action | null;
}

export type SlotParse<Render, Action> =
  { ok: true; slot: SlotSpec<Render, Action> } | { ok: false; error: SlotError };

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;
}

export function isRegion(value: unknown): value is SlotRegion {
  return (SLOT_REGIONS as readonly unknown[]).includes(value);
}

export function parseSlot<Render, Action>(value: unknown): SlotParse<Render, Action> {
  const data = record(value);
  if (!data) return { ok: false, error: "not-object" };
  if (typeof data.id !== "string" || !SLOT_ID.test(data.id)) return { ok: false, error: "bad-id" };
  if (!isRegion(data.region)) return { ok: false, error: "bad-region" };
  if (typeof data.render !== "function") return { ok: false, error: "no-render" };
  const label = typeof data.label === "string" ? data.label.trim() : "";
  if (label.length > LABEL_MAX || (data.region === "drawer" && label.length === 0)) {
    return { ok: false, error: "bad-label" };
  }
  if (data.icon !== undefined && (typeof data.icon !== "string" || !ICON.test(data.icon))) {
    return { ok: false, error: "bad-icon" };
  }
  const order = typeof data.order === "number" && Number.isFinite(data.order) ? data.order : 0;
  return {
    ok: true,
    slot: {
      id: data.id,
      region: data.region,
      order,
      label: label.length > 0 ? label : null,
      icon: typeof data.icon === "string" ? data.icon : DEFAULT_SLOT_ICON,
      render: data.render as Render,
      onAction: typeof data.onAction === "function" ? (data.onAction as Action) : null,
    },
  };
}

export function slotsIn<T extends { region: SlotRegion; order: number; id: string }>(
  slots: Iterable<T>,
  region: SlotRegion,
): T[] {
  return [...slots]
    .filter((slot) => slot.region === region)
    .sort((a, b) => a.order - b.order || a.id.localeCompare(b.id));
}

const REGION_PARTS: Readonly<Record<SlotRegion, readonly PanelPart[]>> = {
  "bar-end": ["actions"],
  quick: ["dock"],
  drawer: ["actions", "drawer"],
};

export function partsForRegions(regions: readonly unknown[] | undefined): PanelPart[] {
  const wanted = regions === undefined ? SLOT_REGIONS : regions.filter(isRegion);
  const parts = new Set<PanelPart>();
  for (const region of wanted) for (const part of REGION_PARTS[region]) parts.add(part);
  return [...parts];
}
