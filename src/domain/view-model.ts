import { buildMonitor, type MonitorView } from "./biomonitor";
import type { ArmorSnapshot, CharacterSnapshot, DeathSaveSnapshot, Pool } from "./character";
import { plainText } from "./plain-text";
import { type VitalState, vitalState } from "./vital-state";

export interface IdentityView {
  name: string;
  img: string;
  alias: string;
  role: { name: string; rank: number } | null;
}

export interface PoolView extends Pool {
  percent: number;
  arc: number;
}

export interface LuckPip {
  on: boolean;
  target: number;
}

export interface LuckView extends Pool {
  canSpend: boolean;
  canRecover: boolean;
  pips: LuckPip[] | null;
}

export interface VitalsView {
  state: VitalState;
  stateLabelKey: string;
  monitor: MonitorView;
  hp: PoolView | null;
  humanity: Pool | null;
  luck: LuckView | null;
  deathSave: DeathSaveSnapshot | null;
  deathSaveShown: boolean;
  armor: ArmorSnapshot | null;
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

export const HP_ARC = 75;
export const MAX_LUCK_PIPS = 12;

export function hpPercent(value: number, max: number): number {
  if (max <= 0) return 0;
  return Math.round((Math.min(Math.max(value, 0), max) / max) * 100);
}

export function hpArc(percent: number): number {
  return Math.round(percent * HP_ARC) / 100;
}

export function luckPips(luck: Pool): LuckPip[] | null {
  if (luck.max <= 0 || luck.max > MAX_LUCK_PIPS || luck.value > luck.max) return null;
  return Array.from({ length: luck.max }, (_, i) => ({
    on: i < luck.value,
    target: i === 0 && luck.value === 1 ? 0 : i + 1,
  }));
}

export function deathSaveShown(state: VitalState, deathSave: DeathSaveSnapshot | null): boolean {
  return deathSave !== null && state === "mortallyWounded";
}

function hpView(hp: Pool): PoolView {
  const percent = hpPercent(hp.value, hp.max);
  return { ...hp, percent, arc: hpArc(percent) };
}

function hasArmor(armor: ArmorSnapshot): boolean {
  return armor.head !== null || armor.body !== null || armor.shield !== null;
}

export function buildPanelView(snapshot: CharacterSnapshot): PanelView {
  const state = vitalState(snapshot.woundState, snapshot.dead);
  const luck = snapshot.luck;
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
      monitor: buildMonitor(state),
      hp: snapshot.hp ? hpView(snapshot.hp) : null,
      humanity: snapshot.actorType === "character" ? snapshot.humanity : null,
      luck: luck
        ? {
            ...luck,
            canSpend: luck.value > 0,
            canRecover: luck.value < luck.max,
            pips: luckPips(luck),
          }
        : null,
      deathSave: snapshot.deathSave,
      deathSaveShown: deathSaveShown(state, snapshot.deathSave),
      armor: hasArmor(snapshot.armor) ? snapshot.armor : null,
    },
    canEdit: snapshot.canEdit,
  };
}
