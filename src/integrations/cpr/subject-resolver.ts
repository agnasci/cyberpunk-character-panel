import { SUPPORTED_ACTOR_TYPES } from "../../constants";
import { type ChosenSubject, chooseSubject, type SubjectCandidate } from "../../domain/subject";

export interface ResolvedSubject {
  subject: ChosenSubject;
  actor: Actor;
  token: TokenDocument | null;
}

interface ControlledCandidate {
  candidate: SubjectCandidate;
  actor: Actor;
  token: TokenDocument;
}

function fromToken(token: Token): ControlledCandidate | null {
  const actor = token.actor;
  if (!actor) return null;
  return {
    candidate: {
      actorUuid: actor.uuid,
      tokenId: token.id,
      actorType: actor.type,
      isOwner: actor.isOwner,
    },
    actor,
    token: token.document,
  };
}

function linkedTokenOf(actor: Actor): Token | null {
  const tokens = (canvas?.tokens?.placeables ?? []).filter(
    (t) => t.document.actorLink && t.actor?.id === actor.id,
  );
  return tokens.length === 1 ? (tokens[0] ?? null) : null;
}

export function resolveSubject(followControlled: boolean): ResolvedSubject | null {
  const controlled = (canvas?.tokens?.controlled ?? [])
    .map(fromToken)
    .filter((c): c is ControlledCandidate => c !== null);
  const character = game.user.character;
  const assignedToken = character ? linkedTokenOf(character) : null;
  const subject = chooseSubject({
    isGM: game.user.isGM,
    followControlled,
    supportedTypes: SUPPORTED_ACTOR_TYPES,
    controlled: controlled.map((c) => c.candidate),
    assigned: character
      ? {
          actorUuid: character.uuid,
          tokenId: assignedToken?.id ?? null,
          actorType: character.type,
          isOwner: character.isOwner,
        }
      : null,
  });
  if (!subject) return null;
  if (subject.reason === "assigned" && character) {
    return { subject, actor: character, token: assignedToken?.document ?? null };
  }
  const picked = controlled.find(
    (c) => c.candidate.actorUuid === subject.actorUuid && c.candidate.tokenId === subject.tokenId,
  );
  return picked ? { subject, actor: picked.actor, token: picked.token } : null;
}
