import { describe, expect, it } from "vitest";
import type { CharacterSnapshot } from "../../src/domain/character";
import { buildPanelView, hpPercent } from "../../src/domain/view-model";
import { plainText } from "../../src/domain/plain-text";
import { vitalState } from "../../src/domain/vital-state";

const snap = (extra: Partial<CharacterSnapshot> = {}): CharacterSnapshot => ({
  actorUuid: "Actor.a",
  actorType: "character",
  name: "Seorin Kwon",
  img: "icons/x.webp",
  aliasHtml: "<p>Glass&amp;wire</p>",
  role: { name: "Netrunner", rank: 4 },
  hp: { value: 35, max: 35 },
  woundState: "notWounded",
  dead: false,
  canEdit: true,
  ...extra,
});

describe("vitalState", () => {
  it("passes through the system wound states", () => {
    expect(vitalState("seriouslyWounded", false)).toBe("seriouslyWounded");
    expect(vitalState("mortallyWounded", false)).toBe("mortallyWounded");
  });

  it("uses the dead status over any wound state", () => {
    expect(vitalState("mortallyWounded", true)).toBe("dead");
  });

  it("treats HP above maximum as not wounded and missing data as unknown", () => {
    expect(vitalState("invalidState", false)).toBe("notWounded");
    expect(vitalState(null, false)).toBe("unknown");
    expect(vitalState("dead", false)).toBe("unknown");
  });
});

describe("buildPanelView", () => {
  it("builds identity with a plain-text alias", () => {
    const view = buildPanelView(snap());
    expect(view.identity).toEqual({
      name: "Seorin Kwon",
      img: "icons/x.webp",
      alias: "Glass&wire",
      role: { name: "Netrunner", rank: 4 },
    });
  });

  it("builds vitals with percent and the system label key", () => {
    const view = buildPanelView(
      snap({ hp: { value: 12, max: 35 }, woundState: "seriouslyWounded" }),
    );
    expect(view.vitals).toEqual({
      state: "seriouslyWounded",
      stateLabelKey: "CPR.global.woundState.seriouslyWounded",
      hp: { value: 12, max: 35, percent: 34 },
    });
  });

  it("labels the dead state with the module key", () => {
    expect(buildPanelView(snap({ dead: true })).vitals.stateLabelKey).toBe("CCP.Vital.Dead");
  });

  it("keeps HP null when unavailable", () => {
    expect(buildPanelView(snap({ hp: null, woundState: null })).vitals).toEqual({
      state: "unknown",
      stateLabelKey: "CCP.Vital.Unknown",
      hp: null,
    });
  });
});

describe("helpers", () => {
  it("clamps HP percent", () => {
    expect(hpPercent(50, 40)).toBe(100);
    expect(hpPercent(-3, 40)).toBe(0);
    expect(hpPercent(5, 0)).toBe(0);
  });

  it("strips markup from HTML fields", () => {
    expect(plainText("<p>A <em>b</em></p>&nbsp;")).toBe("A b");
    expect(plainText("<p>Glass<b>wire</b></p><p>Two</p>")).toBe("Glasswire Two");
    expect(plainText("one<br>two")).toBe("one two");
    expect(plainText(null)).toBe("");
  });
});
