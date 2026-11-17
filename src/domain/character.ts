export interface CharacterSnapshot {
  actorUuid: string;
  actorType: string;
  name: string;
  img: string;
  aliasHtml: string;
  role: { name: string; rank: number } | null;
  hp: { value: number; max: number } | null;
  woundState: string | null;
  dead: boolean;
  canEdit: boolean;
}
