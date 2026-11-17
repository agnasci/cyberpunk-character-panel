import type { CharacterSnapshot } from "./character";
import { plainText } from "./plain-text";
import { type VitalState, vitalState } from "./vital-state";

export interface IdentityView {
  name: string;
  img: string;
  alias: string;
  role: { name: string; rank: number } | null;
}

export interface VitalsView {
  state: VitalState;
  stateLabelKey: string;
  hp: { value: number; max: number; percent: number } | null;
}

export interface PanelView {
  identity: IdentityView;
  vitals: VitalsView;
  canEdit: boolean;
}

const STATE_LABELS: Record<VitalState, string> = {
  notWounded: "CPR.global.woundState.notWounded",
  lightlyWounded: "CPR.global.woundState.lightlyWounded",
  seriouslyWounded: "CPR.global.woundState.seriouslyWounded",
  mortallyWounded: "CPR.global.woundState.mortallyWounded",
  dead: "CCP.Vital.Dead",
  unknown: "CCP.Vital.Unknown",
};

export function hpPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((Math.min(Math.max(value, 0), max) / max) * 100);
}

export function buildPanelView(snapshot: CharacterSnapshot): PanelView {
  const state = vitalState(snapshot.woundState, snapshot.dead);
  return {
    identity: {
      name: snapshot.name,
      img: snapshot.img,
      alias: plainText(snapshot.aliasHtml),
      role: snapshot.role,
    },
    vitals: {
      state,
      stateLabelKey: STATE_LABELS[state],
      hp: snapshot.hp
        ? { ...snapshot.hp, percent: hpPercent(snapshot.hp.value, snapshot.hp.max) }
        : null,
    },
    canEdit: snapshot.canEdit,
  };
}
