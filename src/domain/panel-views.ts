import type { StyleView } from "./style-view";
import {
  buildLedgerViews,
  type DrugEntry,
  type EffectEntry,
  type InjuryEntry,
  injuryLocationKey,
  type LedgerEntry,
  type LedgerView,
  type StatusEntry,
} from "./quick-sheet";
import {
  favoriteSkills,
  groupSkills,
  type NetEntry,
  type RoleEntry,
  type SkillEntry,
  type SkillGroup,
  searchKey,
  type StatEntry,
} from "./sheet-lists";

export type DrawerId = "skills" | "roles" | "net" | "sheet" | "health" | "style";

type Searchable<T> = T & { search: string };

export interface HealthView {
  injuries: Searchable<InjuryEntry & { locationKey: string }>[];
  drugs: Searchable<DrugEntry & { usable: boolean }>[];
  effects: Searchable<EffectEntry>[];
  statuses: Searchable<StatusEntry>[];
}

export const INTERFACE_ABILITIES = [
  "scanner",
  "backdoor",
  "cloak",
  "control",
  "eyedee",
  "pathfinder",
  "slide",
  "virus",
  "zap",
] as const;

export interface StatView extends StatEntry {
  labelKey: string;
  tooltipKey: string;
}

export interface SkillView extends SkillEntry {
  search: string;
  statLabelKey: string;
}

export interface InterfaceView {
  key: string;
  labelKey: string;
}

export interface DrawerView {
  open: DrawerId | null;
  skills: (Omit<SkillGroup, "skills"> & { skills: SkillView[] })[] | null;
  roles: RoleEntry[] | null;
  net: (NetEntry & { abilities: InterfaceView[] }) | null;
  ledgers: LedgerView[] | null;
  health: HealthView | null;
  style: StyleView | null;
}

export interface ActionsView {
  open: DrawerId | null;
  hasSkills: boolean;
  hasRoles: boolean;
  hasNet: boolean;
  hasSheet: boolean;
  favorites: SkillEntry[];
}

export function statLabelKey(key: string): string {
  return `CPR.global.stats.${key}`;
}

export function buildStatsView(stats: readonly StatEntry[]): StatView[] {
  return stats.map((stat) => ({
    ...stat,
    labelKey: statLabelKey(stat.key),
    tooltipKey: `CPR.global.stats.${stat.key}ToolTip`,
  }));
}

export function rollableRoles(roles: readonly RoleEntry[]): RoleEntry[] {
  return roles.filter((role) => role.abilities.length > 0);
}

export function interfaceAbilities(): InterfaceView[] {
  return [
    ...INTERFACE_ABILITIES.map((key) => ({
      key,
      labelKey: `CPR.global.role.netrunner.interfaceAbility.${key}`,
    })),
    { key: "defense", labelKey: "CPR.global.generic.defense" },
    { key: "speed", labelKey: "CPR.global.generic.speed" },
  ];
}

export function buildDrawerView(
  open: DrawerId | null,
  source: {
    skills?: readonly SkillEntry[] | undefined;
    roles?: readonly RoleEntry[] | undefined;
    net?: NetEntry | null | undefined;
    ledgers?: readonly LedgerEntry[] | undefined;
    injuries?: readonly InjuryEntry[] | undefined;
    drugs?: readonly DrugEntry[] | undefined;
    effects?: readonly EffectEntry[] | undefined;
    statuses?: readonly StatusEntry[] | undefined;
    style?: StyleView | undefined;
  },
): DrawerView {
  const skills =
    open === "skills" && source.skills
      ? groupSkills(source.skills).map((group) => ({
          ...group,
          skills: group.skills.map((skill) => ({
            ...skill,
            search: searchKey(skill.label),
            statLabelKey: statLabelKey(skill.stat),
          })),
        }))
      : null;
  const roles = open === "roles" && source.roles ? rollableRoles(source.roles) : null;
  const net =
    open === "net" && source.net ? { ...source.net, abilities: interfaceAbilities() } : null;
  const ledgers =
    open === "sheet" && source.ledgers && source.ledgers.length > 0
      ? buildLedgerViews(source.ledgers)
      : null;
  const health =
    open === "health"
      ? {
          injuries: (source.injuries ?? []).map((i) => ({
            ...i,
            locationKey: injuryLocationKey(i.location),
            search: searchKey(i.name),
          })),
          drugs: (source.drugs ?? []).map((d) => ({
            ...d,
            usable: d.amount > 0,
            search: searchKey(d.name),
          })),
          effects: (source.effects ?? []).map((e) => ({
            ...e,
            search: searchKey(`${e.name} ${e.source ?? ""}`),
          })),
          statuses: (source.statuses ?? []).map((s) => ({ ...s, search: searchKey(s.name) })),
        }
      : null;
  const style = open === "style" ? (source.style ?? null) : null;
  return { open, skills, roles, net, ledgers, health, style };
}

export function buildActionsView(
  open: DrawerId | null,
  source: {
    skills: readonly SkillEntry[];
    roles: readonly RoleEntry[];
    net: NetEntry | null;
    ledgers: readonly LedgerEntry[];
  },
): ActionsView {
  const hasSkills = source.skills.length > 0;
  const hasRoles = rollableRoles(source.roles).length > 0;
  const hasNet = source.net !== null;
  const hasSheet = source.ledgers.length > 0;
  const available: Record<DrawerId, boolean> = {
    skills: hasSkills,
    roles: hasRoles,
    net: hasNet,
    sheet: hasSheet,
    health: true,
    style: true,
  };
  return {
    open: open && available[open] ? open : null,
    hasSkills,
    hasRoles,
    hasNet,
    hasSheet,
    favorites: favoriteSkills(source.skills),
  };
}

export function filterVisible(search: string, query: string): boolean {
  const q = searchKey(query);
  return q === "" || search.includes(q);
}
