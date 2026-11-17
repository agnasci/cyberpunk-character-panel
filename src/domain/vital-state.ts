export type VitalState =
  "notWounded" | "lightlyWounded" | "seriouslyWounded" | "mortallyWounded" | "dead" | "unknown";

const SYSTEM_STATES: readonly string[] = [
  "notWounded",
  "lightlyWounded",
  "seriouslyWounded",
  "mortallyWounded",
];

export function vitalState(woundState: string | null, dead: boolean): VitalState {
  if (dead) return "dead";
  if (woundState === "invalidState") return "notWounded";
  if (woundState && SYSTEM_STATES.includes(woundState)) return woundState as VitalState;
  return "unknown";
}
