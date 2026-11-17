export type PanelPart = "drawer" | "identity" | "vitals" | "stats" | "dock" | "actions";

export const ALL_PARTS: readonly PanelPart[] = [
  "drawer",
  "identity",
  "vitals",
  "stats",
  "dock",
  "actions",
];

const RULES: ReadonlyArray<[RegExp, readonly PanelPart[]]> = [
  [/^name$/, ["identity"]],
  [/^img$/, ["identity"]],
  [/^system\.information\./, ["identity"]],
  [/^system\.roleInfo\./, ["identity", "drawer"]],
  [/^system\.derivedStats\./, ["vitals"]],
  [/^system\.externalData\./, ["vitals"]],
  [/^system\.stats\.luck\./, ["vitals"]],
  [/^system\.stats\./, ["stats", "drawer"]],
  [/^system\.(wealth|improvementPoints|reputation)\./, ["drawer"]],
];

const ITEM_PARTS: Readonly<Record<string, readonly PanelPart[]>> = {
  role: ["identity", "drawer", "actions"],
  skill: ["drawer", "actions"],
  cyberdeck: ["drawer", "actions"],
  criticalInjury: ["vitals", "drawer"],
  drug: ["drawer"],
  armor: ["vitals"],
};

function ordered(parts: Iterable<PanelPart>): PanelPart[] {
  const set = new Set(parts);
  return ALL_PARTS.filter((p) => set.has(p));
}

export function partsForActorChange(changedKeys: readonly string[]): PanelPart[] {
  const parts: PanelPart[] = [];
  for (const key of changedKeys) {
    for (const [pattern, targets] of RULES) if (pattern.test(key)) parts.push(...targets);
  }
  return ordered(parts);
}

export function partsForItemChange(itemType: string): PanelPart[] {
  return ordered(ITEM_PARTS[itemType] ?? []);
}

export function partsForTokenChange(changedKeys: readonly string[]): PanelPart[] {
  return changedKeys.some((k) => k === "name" || k.startsWith("texture.")) ? ["identity"] : [];
}

export function partsForEffectChange(): PanelPart[] {
  return ordered(["vitals", "stats", "drawer"]);
}
