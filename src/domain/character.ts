import type { StatEntry } from "./sheet-lists";

export interface Pool {
  value: number;
  max: number;
}

export interface DeathSaveSnapshot {
  value: number;
  penalty: number;
  basePenalty: number;
}

export interface ArmorSnapshot {
  head: Pool | null;
  body: Pool | null;
  shield: Pool | null;
}

export interface CharacterSnapshot {
  actorUuid: string;
  actorType: string;
  name: string;
  img: string;
  aliasHtml: string;
  role: { name: string; rank: number } | null;
  hp: Pool | null;
  woundState: string | null;
  dead: boolean;
  humanity: Pool | null;
  luck: Pool | null;
  deathSave: DeathSaveSnapshot | null;
  armor: ArmorSnapshot;
  stats: StatEntry[];
  canEdit: boolean;
}
