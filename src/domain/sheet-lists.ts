export const STAT_ORDER = [
  "int",
  "ref",
  "dex",
  "tech",
  "cool",
  "will",
  "move",
  "body",
  "luck",
  "emp",
] as const;

export const SKILL_CATEGORY_ORDER = [
  "awarenessSkills",
  "bodySkills",
  "controlSkills",
  "educationSkills",
  "fightingSkills",
  "performanceSkills",
  "rangedweaponSkills",
  "socialSkills",
  "techniqueSkills",
] as const;

const CATEGORY_LABEL_KEYS: Readonly<Record<string, string>> = {
  rangedweaponSkills: "CPR.global.skillCategories.rangedWeaponSkills",
};

export interface StatEntry {
  key: string;
  value: number;
  max: number | null;
}

export interface SkillEntry {
  id: string;
  name: string;
  label: string;
  category: string;
  stat: string;
  level: number;
  mod: number;
  total: number;
  favorite: boolean;
  situational: boolean;
}

export interface SkillGroup {
  category: string;
  labelKey: string;
  skills: SkillEntry[];
}

export interface AbilityEntry {
  name: string;
  label: string;
  rank: number;
  subtype: "mainRoleAbility" | "subRoleAbility";
}

export interface RoleEntry {
  id: string;
  name: string;
  label: string;
  rank: number;
  active: boolean;
  abilities: AbilityEntry[];
}

export interface NetEntry {
  deckId: string;
  deckName: string;
  netRoleLabel: string | null;
}

export function categoryLabelKey(category: string): string {
  return CATEGORY_LABEL_KEYS[category] ?? `CPR.global.skillCategories.${category}`;
}

export function searchKey(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

const byLabel = (a: { label: string }, b: { label: string }) =>
  a.label.localeCompare(b.label, undefined, { sensitivity: "base" });

export function groupSkills(skills: readonly SkillEntry[]): SkillGroup[] {
  const known = new Set<string>(SKILL_CATEGORY_ORDER);
  const extra = [...new Set(skills.map((s) => s.category).filter((c) => !known.has(c)))].sort();
  return [...SKILL_CATEGORY_ORDER, ...extra]
    .map((category) => ({
      category,
      labelKey: categoryLabelKey(category),
      skills: skills.filter((s) => s.category === category).sort(byLabel),
    }))
    .filter((group) => group.skills.length > 0);
}

export function favoriteSkills(skills: readonly SkillEntry[]): SkillEntry[] {
  return skills.filter((s) => s.favorite).sort(byLabel);
}

export function skillTotal(statValue: number, level: number, mod: number): number {
  return statValue + level + mod;
}

export function orderStats(stats: readonly StatEntry[]): StatEntry[] {
  const index = (key: string) => {
    const i = (STAT_ORDER as readonly string[]).indexOf(key);
    return i === -1 ? STAT_ORDER.length : i;
  };
  return [...stats].sort((a, b) => index(a.key) - index(b.key));
}

export function sortAbilities(abilities: readonly AbilityEntry[]): AbilityEntry[] {
  const main = abilities.filter((a) => a.subtype === "mainRoleAbility");
  const subs = abilities.filter((a) => a.subtype === "subRoleAbility").sort(byLabel);
  return [...main, ...subs];
}
