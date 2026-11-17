export interface SubjectCandidate {
  actorUuid: string;
  tokenId: string | null;
  actorType: string;
  isOwner: boolean;
}

export type SubjectReason = "assigned" | "controlled" | "gm-selection";

export interface ChosenSubject {
  actorUuid: string;
  tokenId: string | null;
  reason: SubjectReason;
}

export interface SubjectInput {
  isGM: boolean;
  followControlled: boolean;
  supportedTypes: readonly string[];
  controlled: readonly SubjectCandidate[];
  assigned: SubjectCandidate | null;
}

function usable(candidate: SubjectCandidate | null | undefined, types: readonly string[]) {
  return !!candidate && candidate.isOwner && types.includes(candidate.actorType);
}

export function chooseSubject(input: SubjectInput): ChosenSubject | null {
  const owned = input.controlled.filter((c) => usable(c, input.supportedTypes));
  const lastControlled = owned[owned.length - 1];
  const fromControlled = (reason: SubjectReason): ChosenSubject | null =>
    lastControlled
      ? { actorUuid: lastControlled.actorUuid, tokenId: lastControlled.tokenId, reason }
      : null;
  const fromAssigned = (): ChosenSubject | null =>
    input.assigned && usable(input.assigned, input.supportedTypes)
      ? { actorUuid: input.assigned.actorUuid, tokenId: input.assigned.tokenId, reason: "assigned" }
      : null;

  if (input.isGM) return fromControlled("gm-selection") ?? fromAssigned();
  if (input.followControlled) return fromControlled("controlled") ?? fromAssigned();
  return fromAssigned();
}

export function sameSubject(a: ChosenSubject | null, b: ChosenSubject | null): boolean {
  if (!a || !b) return a === b;
  return a.actorUuid === b.actorUuid && a.tokenId === b.tokenId;
}
