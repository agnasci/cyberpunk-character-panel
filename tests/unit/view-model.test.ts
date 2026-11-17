import { describe, expect, it } from "vitest";
import type { CharacterSnapshot } from "../../src/domain/character";
import {
  buildPanelView,
  deathSaveShown,
  hpArc,
  hpPercent,
  luckPips,
} from "../../src/domain/view-model";
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
  humanity: { value: 32, max: 40 },
  luck: { value: 4, max: 6 },
  deathSave: { value: 1, penalty: 1, basePenalty: 0 },
  armor: { head: { value: 11, max: 11 }, body: { value: 9, max: 11 }, shield: null },
  stats: [{ key: "ref", value: 8, max: null }],
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

  it("builds vitals with percent, the system label key and the monitor", () => {
    const view = buildPanelView(
      snap({ hp: { value: 12, max: 35 }, woundState: "seriouslyWounded" }),
    );
    expect(view.vitals).toMatchObject({
      state: "seriouslyWounded",
      stateLabelKey: "CPR.global.woundState.seriouslyWounded",
      hp: { value: 12, max: 35, percent: 34, arc: 25.5 },
      monitor: { state: "seriouslyWounded", bpm: 128, flatline: false },
    });
  });

  it("labels the dead state with the module key and flatlines", () => {
    const vitals = buildPanelView(snap({ dead: true })).vitals;
    expect(vitals.stateLabelKey).toBe("CCP.Vital.Dead");
    expect(vitals.monitor.flatline).toBe(true);
  });

  it("keeps HP null when unavailable", () => {
    expect(buildPanelView(snap({ hp: null, woundState: null })).vitals).toMatchObject({
      state: "unknown",
      stateLabelKey: "CCP.Vital.Unknown",
      hp: null,
    });
  });

  it("shows humanity only for characters, like the native sheets", () => {
    expect(buildPanelView(snap()).vitals.humanity).toEqual({ value: 32, max: 40 });
    expect(buildPanelView(snap({ actorType: "mook" })).vitals.humanity).toBeNull();
  });

  it("keeps LUCK buttons sane for empty and overfilled pools", () => {
    expect(buildPanelView(snap({ luck: { value: 0, max: 0 } })).vitals.luck).toMatchObject({
      canSpend: false,
      canRecover: false,
      pips: null,
    });
    expect(buildPanelView(snap({ luck: { value: 8, max: 6 } })).vitals.luck).toMatchObject({
      canSpend: true,
      canRecover: false,
      pips: null,
    });
  });

  it("flags which LUCK buttons can act", () => {
    expect(buildPanelView(snap({ luck: { value: 0, max: 6 } })).vitals.luck).toMatchObject({
      canSpend: false,
      canRecover: true,
    });
    expect(buildPanelView(snap({ luck: { value: 6, max: 6 } })).vitals.luck).toMatchObject({
      canSpend: true,
      canRecover: false,
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

describe("armor", () => {
  it("shows tracked armor and hides it when nothing is tracked", () => {
    expect(buildPanelView(snap()).vitals.armor).toMatchObject({ head: { value: 11, max: 11 } });
    expect(
      buildPanelView(snap({ armor: { head: null, body: null, shield: null } })).vitals.armor,
    ).toBeNull();
  });
});

describe("vital readouts", () => {
  it("maps HP percent onto the 270-degree ring arc", () => {
    expect(hpArc(100)).toBe(75);
    expect(hpArc(34)).toBe(25.5);
    expect(hpArc(0)).toBe(0);
    expect(buildPanelView(snap({ hp: { value: 20, max: 40 } })).vitals.hp?.arc).toBe(37.5);
  });

  it("turns LUCK into pips and falls back to numbers for large pools", () => {
    expect(luckPips({ value: 2, max: 4 })).toEqual([
      { on: true, target: 1 },
      { on: true, target: 2 },
      { on: false, target: 3 },
      { on: false, target: 4 },
    ]);
    expect(luckPips({ value: 0, max: 2 })?.map((p) => p.target)).toEqual([1, 2]);
    expect(luckPips({ value: 1, max: 3 })?.map((p) => p.target)).toEqual([0, 2, 3]);
    expect(luckPips({ value: 0, max: 0 })).toBeNull();
    expect(luckPips({ value: 13, max: 13 })).toBeNull();
    expect(luckPips({ value: 8, max: 6 })).toBeNull();
    expect(luckPips({ value: 0, max: 1 })).toEqual([{ on: false, target: 1 }]);
    expect(luckPips({ value: 1, max: 1 })).toEqual([{ on: true, target: 0 }]);
    expect(luckPips({ value: 12, max: 12 })).toHaveLength(12);
    expect(buildPanelView(snap()).vitals.luck?.pips).toHaveLength(6);
  });

  it("shows the Death Save chip only while mortally wounded", () => {
    const calm = { value: 0, penalty: 0, basePenalty: 0 };
    expect(deathSaveShown("notWounded", calm)).toBe(false);
    expect(deathSaveShown("lightlyWounded", calm)).toBe(false);
    expect(deathSaveShown("seriouslyWounded", calm)).toBe(false);
    expect(deathSaveShown("seriouslyWounded", { value: 2, penalty: 1, basePenalty: 1 })).toBe(
      false,
    );
    expect(deathSaveShown("mortallyWounded", calm)).toBe(true);
    expect(deathSaveShown("dead", calm)).toBe(false);
    expect(deathSaveShown("mortallyWounded", null)).toBe(false);
  });
});
