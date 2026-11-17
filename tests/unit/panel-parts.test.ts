import { describe, expect, it } from "vitest";
import {
  partsForActorChange,
  partsForEffectChange,
  partsForItemChange,
  partsForTokenChange,
} from "../../src/domain/panel-parts";

describe("partsForActorChange", () => {
  it("maps HP and death save changes to the vitals part only", () => {
    expect(partsForActorChange(["system.derivedStats.hp.value", "_id"])).toEqual(["vitals"]);
  });

  it("maps name, image and alias to identity, and roles also to the drawer", () => {
    expect(partsForActorChange(["name"])).toEqual(["identity"]);
    expect(partsForActorChange(["system.information.alias"])).toEqual(["identity"]);
    expect(partsForActorChange(["system.roleInfo.activeRole", "img"])).toEqual([
      "drawer",
      "identity",
    ]);
  });

  it("returns nothing for data the panel does not show yet", () => {
    expect(partsForActorChange(["system.lifestyle.value", "_stats.modifiedTime"])).toEqual([]);
    expect(partsForActorChange(["system.wealth.value"])).toEqual(["drawer"]);
  });

  it("keeps a stable order without duplicates", () => {
    expect(
      partsForActorChange([
        "system.derivedStats.hp.value",
        "name",
        "system.derivedStats.humanity.value",
      ]),
    ).toEqual(["identity", "vitals"]);
  });

  it("maps STATs to the grid and skill totals, LUCK also to vitals, armor to vitals", () => {
    expect(partsForActorChange(["system.stats.ref.value"])).toEqual(["drawer", "stats"]);
    expect(partsForActorChange(["system.stats.luck.value"])).toEqual(["drawer", "vitals", "stats"]);
    expect(partsForActorChange(["system.externalData.currentArmorBody.value"])).toEqual(["vitals"]);
  });
});

describe("other document changes", () => {
  it("maps item types to the parts that show them", () => {
    expect(partsForItemChange("role")).toEqual(["drawer", "identity", "actions"]);
    expect(partsForItemChange("skill")).toEqual(["drawer", "actions"]);
    expect(partsForItemChange("cyberdeck")).toEqual(["drawer", "actions"]);
    expect(partsForItemChange("criticalInjury")).toEqual(["drawer", "vitals"]);
    expect(partsForItemChange("drug")).toEqual(["drawer"]);
    expect(partsForItemChange("weapon")).toEqual([]);
  });

  it("re-renders identity for token name or image", () => {
    expect(partsForTokenChange(["texture.src"])).toEqual(["identity"]);
    expect(partsForTokenChange(["x", "y"])).toEqual([]);
  });

  it("re-renders everything modifiers can touch for effects", () => {
    expect(partsForEffectChange()).toEqual(["drawer", "vitals", "stats"]);
  });
});
