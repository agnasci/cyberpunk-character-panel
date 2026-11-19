import { describe, expect, it } from "vitest";
import { parseSlot, partsForRegions, slotsIn } from "../../src/domain/slots";

const render = () => null;

describe("slots da API v1 (D12)", () => {
  it("aceita definição válida com padrões", () => {
    const result = parseSlot({ id: "cck-quick", region: "quick", render });
    expect(result).toMatchObject({
      ok: true,
      slot: { id: "cck-quick", region: "quick", order: 0, label: null, onAction: null },
    });
  });

  it("recusa id, região, render, rótulo e ícone inválidos", () => {
    expect(parseSlot(null)).toEqual({ ok: false, error: "not-object" });
    expect(parseSlot({ id: "Com Espaço", region: "quick", render })).toMatchObject({
      error: "bad-id",
    });
    expect(parseSlot({ id: "a", region: "topo", render })).toMatchObject({ error: "bad-region" });
    expect(parseSlot({ id: "a", region: "quick" })).toMatchObject({ error: "no-render" });
    expect(parseSlot({ id: "a", region: "drawer", render })).toMatchObject({ error: "bad-label" });
    expect(parseSlot({ id: "a", region: "quick", render, icon: 'fa"><script>' })).toMatchObject({
      error: "bad-icon",
    });
  });

  it("gaveta exige rótulo e guarda ícone e ação", () => {
    const onAction = () => undefined;
    const result = parseSlot({
      id: "cck-drawer",
      region: "drawer",
      render,
      onAction,
      label: " Combate ",
      icon: "fa-solid fa-gun",
    });
    expect(result.ok && result.slot).toMatchObject({
      label: "Combate",
      icon: "fa-solid fa-gun",
      onAction,
    });
  });

  it("ordena por ordem e depois por id, só da região pedida", () => {
    const slots = [
      { id: "b", region: "quick" as const, order: 1 },
      { id: "a", region: "quick" as const, order: 1 },
      { id: "c", region: "quick" as const, order: 0 },
      { id: "d", region: "bar-end" as const, order: 0 },
    ];
    expect(slotsIn(slots, "quick").map((slot) => slot.id)).toEqual(["c", "a", "b"]);
  });

  it("região → partes do painel a renderizar", () => {
    expect(partsForRegions(["quick"])).toEqual(["dock"]);
    expect(partsForRegions(["drawer", "bar-end"])).toEqual(["actions", "drawer"]);
    expect(partsForRegions(["nada"])).toEqual([]);
    expect(partsForRegions(undefined).sort()).toEqual(["actions", "dock", "drawer"]);
  });
});
