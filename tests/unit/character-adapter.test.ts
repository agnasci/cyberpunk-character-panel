import { describe, expect, it } from "vitest";
import { readCharacterSnapshot } from "../../src/integrations/cpr/character-adapter";
import { fakeActor, fakeToken } from "../fixtures/cpr-actor";

describe("readCharacterSnapshot", () => {
  it("reads identity, HP and wound state from the sheet", () => {
    const snap = readCharacterSnapshot(
      fakeActor({
        alias: "<p>Glasswire</p>",
        hp: { value: 12, max: 35 },
        woundState: "seriouslyWounded",
      }),
      null,
    );
    expect(snap).toMatchObject({
      actorUuid: "Actor.a1",
      actorType: "character",
      name: "Seorin Kwon",
      aliasHtml: "<p>Glasswire</p>",
      role: { name: "Netrunner", rank: 4 },
      hp: { value: 12, max: 35 },
      woundState: "seriouslyWounded",
      dead: false,
      canEdit: true,
    });
  });

  it("uses the active role by name and falls back to the first role", () => {
    const roles = [
      { name: "Medtech", rank: 2 },
      { name: "Solo", rank: 5 },
    ];
    expect(readCharacterSnapshot(fakeActor({ roles, activeRole: "Solo" }), null).role).toEqual({
      name: "Solo",
      rank: 5,
    });
    expect(readCharacterSnapshot(fakeActor({ roles, activeRole: "" }), null).role?.name).toBe(
      "Medtech",
    );
    expect(readCharacterSnapshot(fakeActor({ roles: [] }), null).role).toBeNull();
  });

  it("uses the token name only for unlinked tokens", () => {
    const actor = fakeActor({ type: "mook" });
    expect(readCharacterSnapshot(actor, fakeToken("Ganger 2", false)).name).toBe("Ganger 2");
    expect(readCharacterSnapshot(actor, fakeToken("Other", true)).name).toBe("Seorin Kwon");
  });

  it("reports the dead status and missing HP", () => {
    const snap = readCharacterSnapshot(fakeActor({ statuses: ["dead"], hp: null }), null);
    expect(snap.dead).toBe(true);
    expect(snap.hp).toBeNull();
  });
});

describe("readCharacterSnapshot pools", () => {
  it("reads humanity, LUCK and death save", () => {
    const snap = readCharacterSnapshot(
      fakeActor({
        humanity: { value: -3, max: 40 },
        luck: { value: 2, max: 6 },
        deathSave: { value: 3, penalty: 2, basePenalty: 1 },
      }),
      null,
    );
    expect(snap.humanity).toEqual({ value: -3, max: 40 });
    expect(snap.luck).toEqual({ value: 2, max: 6 });
    expect(snap.deathSave).toEqual({ value: 3, penalty: 2, basePenalty: 1 });
  });

  it("keeps death save null when the sheet has none", () => {
    expect(readCharacterSnapshot(fakeActor({ deathSave: null }), null).deathSave).toBeNull();
  });
});
