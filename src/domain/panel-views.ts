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

export type DrawerId = "skills" | "roles" | "net";

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
}

export interface ActionsView {
  open: DrawerId | null;
  hasSkills: boolean;
  hasRoles: boolean;
  hasNet: boolean;
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
  return { open, skills, roles, net };
}

export function buildActionsView(
  open: DrawerId | null,
  source: { skills: readonly SkillEntry[]; roles: readonly RoleEntry[]; net: NetEntry | null },
): ActionsView {
  const hasSkills = source.skills.length > 0;
  const hasRoles = rollableRoles(source.roles).length > 0;
  const hasNet = source.net !== null;
  const available: Record<DrawerId, boolean> = { skills: hasSkills, roles: hasRoles, net: hasNet };
  return {
    open: open && available[open] ? open : null,
    hasSkills,
    hasRoles,
    hasNet,
    favorites: favoriteSkills(source.skills),
  };
}

export function filterVisible(search: string, query: string): boolean {
  const q = searchKey(query);
  return q === "" || search.includes(q);
}
