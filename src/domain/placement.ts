export interface AlignInput {
  areaLeft: number;
  areaWidth: number;
  panelWidth: number;
  targetLeft: number | null;
}

export function alignOffset(input: AlignInput): number {
  const room = Math.max(0, input.areaWidth - input.panelWidth);
  const wanted = input.targetLeft === null ? room / 2 : input.targetLeft - input.areaLeft;
  return Math.round(Math.min(room, Math.max(0, wanted)));
}
