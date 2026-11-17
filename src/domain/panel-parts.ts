export type PanelPart = "identity" | "vitals" | "dock";

export const ALL_PARTS: readonly PanelPart[] = ["identity", "vitals", "dock"];

const RULES: ReadonlyArray<[RegExp, PanelPart]> = [
  [/^name$/, "identity"],
  [/^img$/, "identity"],
  [/^system\.information\./, "identity"],
  [/^system\.roleInfo\./, "identity"],
  [/^system\.derivedStats\./, "vitals"],
];

export function partsForActorChange(changedKeys: readonly string[]): PanelPart[] {
  const parts = new Set<PanelPart>();
  for (const key of changedKeys) {
    for (const [pattern, part] of RULES) if (pattern.test(key)) parts.add(part);
  }
  return ALL_PARTS.filter((p) => parts.has(p));
}

export function partsForItemChange(itemType: string): PanelPart[] {
  return itemType === "role" ? ["identity"] : [];
}

export function partsForTokenChange(changedKeys: readonly string[]): PanelPart[] {
  return changedKeys.some((k) => k === "name" || k.startsWith("texture.")) ? ["identity"] : [];
}

export function partsForEffectChange(): PanelPart[] {
  return ["vitals"];
}
