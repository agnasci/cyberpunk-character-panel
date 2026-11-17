export type PrefValues = Record<string, unknown>;

export function prefsToApply(
  stored: PrefValues | null | undefined,
  current: PrefValues,
  keys: readonly string[],
): PrefValues {
  const result: PrefValues = {};
  if (!stored) return result;
  for (const key of keys) {
    if (!(key in stored)) continue;
    const value = stored[key] ?? null;
    if (value !== (current[key] ?? null)) result[key] = value;
  }
  return result;
}

export function prefsToSeed(
  stored: PrefValues | null | undefined,
  current: PrefValues,
  keys: readonly string[],
): PrefValues {
  const result: PrefValues = {};
  for (const key of keys) {
    if (stored && key in stored) continue;
    result[key] = current[key] ?? null;
  }
  return result;
}
