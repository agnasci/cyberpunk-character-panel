import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildActionsView, buildDrawerView } from "../../src/domain/panel-views";
import {
  buildLedgerViews,
  ledgerReason,
  parseLedgerAmount,
  planLedgerChange,
} from "../../src/domain/quick-sheet";
import {
  applyLedgerChange,
  readEffects,
  readLedgers,
  readStatuses,
} from "../../src/integrations/cpr/quick-sheet-adapter";

describe("ledger rules", () => {
  it("adds, subtracts and sets like the sheet", () => {
    expect(planLedgerChange("wealth", "add", 100, 50)).toMatchObject({ delta: 50, next: 150 });
    expect(planLedgerChange("wealth", "add", 100, -20)).toMatchObject({ delta: -20, next: 80 });
    expect(planLedgerChange("wealth", "subtract", 100, 30)).toMatchObject({ delta: -30, next: 70 });
    expect(planLedgerChange("wealth", "subtract", 100, -30)).toMatchObject({ delta: -30 });
    expect(planLedgerChange("reputation", "set", 2, 5)).toMatchObject({ delta: 3, next: 5 });
  });

  it("warns with the system message when going below zero", () => {
    expect(planLedgerChange("improvementPoints", "subtract", 5, 10).warningKey).toBe(
      "CPR.messages.warningNotEnoughIp",
    );
    expect(planLedgerChange("wealth", "subtract", 5, 5).warningKey).toBeNull();
  });

  it("parses whole amounts only", () => {
    expect(parseLedgerAmount(" 250 ")).toBe(250);
    expect(parseLedgerAmount("-3")).toBe(-3);
    expect(parseLedgerAmount("2.5")).toBeNull();
    expect(parseLedgerAmount("")).toBeNull();
  });

  it("signs the reason with the user name like the sheet", () => {
    expect(ledgerReason(" Fixer job ", "Runner")).toBe("Fixer job - Runner");
  });

  it("orders ledgers and labels them with system keys", () => {
    const views = buildLedgerViews([
      { prop: "reputation", value: 2 },
      { prop: "wealth", value: 900 },
    ]);
    expect(views.map((v) => [v.prop, v.unit])).toEqual([
      ["wealth", "eb"],
      ["reputation", ""],
    ]);
    expect(views[0]?.labelKey).toBe("CPR.characterSheet.rightPane.eurobucks.eurobucks");
  });
});

describe("quick sheet drawers", () => {
  it("offers the sheet drawer only with ledgers and always offers health", () => {
    const none = buildActionsView("sheet", { skills: [], roles: [], net: null, ledgers: [] });
    expect(none).toMatchObject({ open: null, hasSheet: false });
    const health = buildActionsView("health", { skills: [], roles: [], net: null, ledgers: [] });
    expect(health.open).toBe("health");
  });

  it("builds the health drawer with location keys and drug availability", () => {
    const view = buildDrawerView("health", {
      injuries: [{ id: "i", name: "Broken Arm", location: "body", deathSaveIncrease: false }],
      drugs: [
        { id: "d1", name: "Speedheal", img: "", amount: 0 },
        { id: "d2", name: "Black Lace", img: "", amount: 2 },
      ],
    });
    expect(view.health?.injuries[0]?.locationKey).toBe("CPR.global.location.body");
    expect(view.health?.drugs.map((d) => d.usable)).toEqual([false, true]);
    expect(view.health?.statuses).toEqual([]);
  });
});

describe("quick sheet adapter", () => {
  const calls: unknown[][] = [];
  const effect = (name: string, extra: Record<string, unknown> = {}) => ({
    uuid: `Actor.a1.ActiveEffect.${name}`,
    name,
    img: "icons/e.svg",
    disabled: false,
    parent: { uuid: "Actor.a1", name: "Runner" },
    update: () => Promise.resolve(),
    ...extra,
  });
  const actor = {
    uuid: "Actor.a1",
    isOwner: true,
    statuses: new Set(["prone"]),
    itemTypes: {},
    system: { wealth: { value: 900 }, reputation: { value: 2 } },
    allApplicableEffects: () => [
      effect("Zeta"),
      effect("Alpha", { parent: { uuid: "Actor.a1.Item.x", name: "Kiroshi" } }),
      effect("Prone", { statuses: new Set(["prone"]) }),
    ],
    deltaLedgerProperty: (...args: unknown[]) => calls.push(["delta", ...args]),
    setLedgerProperty: (...args: unknown[]) => calls.push(["set", ...args]),
  } as unknown as Actor;

  beforeEach(() => {
    calls.length = 0;
    vi.stubGlobal("game", { user: { name: "Runner" }, i18n: { localize: (k: string) => k } });
    vi.stubGlobal("CONFIG", {
      statusEffects: [
        { id: "prone", name: "EFFECT.StatusProne", img: "icons/prone.svg" },
        { id: "stun", name: "EFFECT.StatusStunned", img: "icons/stun.svg" },
      ],
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it("reads only the ledgers the actor has", () => {
    expect(readLedgers(actor)).toEqual([
      { prop: "wealth", value: 900 },
      { prop: "reputation", value: 2 },
    ]);
  });

  it("lists effects by name with their item source, leaving status effects out", () => {
    expect(readEffects(actor).map((e) => [e.name, e.source])).toEqual([
      ["Alpha", "Kiroshi"],
      ["Zeta", null],
    ]);
  });

  it("marks active token statuses", () => {
    expect(readStatuses(actor).map((s) => [s.id, s.active])).toEqual([
      ["prone", true],
      ["stun", false],
    ]);
  });

  it("writes through the system ledger methods with a signed reason", async () => {
    await applyLedgerChange(actor, planLedgerChange("wealth", "subtract", 900, 100), "Rent");
    await applyLedgerChange(actor, planLedgerChange("reputation", "set", 2, 4), "");
    expect(calls).toEqual([
      ["delta", "wealth", -100, "Rent - Runner"],
      ["set", "reputation", 4, " - Runner"],
    ]);
  });
});
