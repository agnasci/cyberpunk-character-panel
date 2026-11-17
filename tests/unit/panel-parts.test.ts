import { describe, expect, it } from "vitest";
import {
  partsForActorChange,
  partsForItemChange,
  partsForTokenChange,
} from "../../src/domain/panel-parts";

describe("partsForActorChange", () => {
  it("maps HP and death save changes to the vitals part only", () => {
    expect(partsForActorChange(["system.derivedStats.hp.value", "_id"])).toEqual(["vitals"]);
  });

  it("maps name, image, alias and role to identity", () => {
    expect(partsForActorChange(["name"])).toEqual(["identity"]);
    expect(partsForActorChange(["system.information.alias"])).toEqual(["identity"]);
    expect(partsForActorChange(["system.roleInfo.activeRole", "img"])).toEqual(["identity"]);
  });

  it("returns nothing for data the panel does not show yet", () => {
    expect(partsForActorChange(["system.wealth.value", "_stats.modifiedTime"])).toEqual([]);
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
});

describe("other document changes", () => {
  it("re-renders identity for role items and token name or image", () => {
    expect(partsForItemChange("role")).toEqual(["identity"]);
    expect(partsForItemChange("skill")).toEqual([]);
    expect(partsForTokenChange(["texture.src"])).toEqual(["identity"]);
    expect(partsForTokenChange(["x", "y"])).toEqual([]);
  });
});
