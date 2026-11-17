export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(Math.trunc(value), min), Math.max(min, max));
}

export function poolCeiling(current: number, max: number): number {
  return Math.max(max, Number.isFinite(current) ? Math.trunc(current) : max);
}

export function stepHp(current: number, delta: number, max: number): number {
  return clampInt(current + delta, 0, poolCeiling(current, max));
}

export function stepLuck(current: number, delta: number, max: number): number {
  return clampInt(current + delta, 0, poolCeiling(current, max));
}

export function parseHpEntry(text: string, current: number, max: number): number | null {
  const trimmed = text.trim().replace(/−/g, "-");
  const match = /^([+-])?\s*(\d+)$/.exec(trimmed);
  if (!match) return null;
  const amount = Number(match[2]);
  if (match[1] === "+") return stepHp(current, amount, max);
  if (match[1] === "-") return stepHp(current, -amount, max);
  return clampInt(amount, 0, poolCeiling(current, max));
}
