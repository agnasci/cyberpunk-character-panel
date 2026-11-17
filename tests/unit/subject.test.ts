import { describe, expect, it } from "vitest";
import { chooseSubject, sameSubject, type SubjectCandidate } from "../../src/domain/subject";

const types = ["character", "mook"];
const cand = (uuid: string, extra: Partial<SubjectCandidate> = {}): SubjectCandidate => ({
  actorUuid: uuid,
  tokenId: null,
  actorType: "character",
  isOwner: true,
  ...extra,
});
const base = {
  isGM: false,
  followControlled: false,
  supportedTypes: types,
  controlled: [],
  assigned: null,
};

describe("chooseSubject", () => {
  it("shows the assigned character to a player", () => {
    expect(chooseSubject({ ...base, assigned: cand("A", { tokenId: "t1" }) })).toEqual({
      actorUuid: "A",
      tokenId: "t1",
      reason: "assigned",
    });
  });

  it("ignores controlled tokens for a player unless following is on", () => {
    const input = { ...base, assigned: cand("A"), controlled: [cand("B", { tokenId: "tb" })] };
    expect(chooseSubject(input)?.actorUuid).toBe("A");
    expect(chooseSubject({ ...input, followControlled: true })).toEqual({
      actorUuid: "B",
      tokenId: "tb",
      reason: "controlled",
    });
  });

  it("uses the last owned supported controlled token", () => {
    const controlled = [
      cand("B"),
      cand("C", { isOwner: false }),
      cand("D", { actorType: "blackIce" }),
    ];
    expect(chooseSubject({ ...base, followControlled: true, controlled })?.actorUuid).toBe("B");
  });

  it("falls back to the assigned character when nothing usable is controlled", () => {
    const input = {
      ...base,
      followControlled: true,
      assigned: cand("A"),
      controlled: [cand("X", { isOwner: false })],
    };
    expect(chooseSubject(input)?.reason).toBe("assigned");
  });

  it("gives the GM the selection, then the assigned character, then nothing", () => {
    const gm = { ...base, isGM: true };
    expect(chooseSubject({ ...gm, controlled: [cand("M", { actorType: "mook" })] })?.reason).toBe(
      "gm-selection",
    );
    expect(chooseSubject({ ...gm, assigned: cand("A") })?.reason).toBe("assigned");
    expect(chooseSubject(gm)).toBeNull();
  });

  it("refuses an assigned actor the user does not own or of another type", () => {
    expect(chooseSubject({ ...base, assigned: cand("A", { isOwner: false }) })).toBeNull();
    expect(chooseSubject({ ...base, assigned: cand("A", { actorType: "container" }) })).toBeNull();
  });
});

describe("sameSubject", () => {
  it("compares actor and token", () => {
    const a = { actorUuid: "A", tokenId: "t", reason: "assigned" as const };
    expect(sameSubject(a, { ...a, reason: "controlled" })).toBe(true);
    expect(sameSubject(a, { ...a, tokenId: null })).toBe(false);
    expect(sameSubject(null, null)).toBe(true);
    expect(sameSubject(a, null)).toBe(false);
  });
});
