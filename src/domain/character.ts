export interface Pool {
  value: number;
  max: number;
}

export interface DeathSaveSnapshot {
  value: number;
  penalty: number;
  basePenalty: number;
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
  canEdit: boolean;
}
