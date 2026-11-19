import { MODULE_ID } from "../constants";
import {
  isRegion,
  parseSlot,
  slotsIn,
  type SlotError,
  type SlotRegion,
  type SlotSpec,
} from "../domain/slots";

export interface PanelSubject {
  actor: Actor;
  token: TokenDocument | null;
  reason: string;
}

export interface PanelPalette {
  accent: string;
  accentStrong: string;
  accentSoft: string;
  accentLine: string;
  accentInk: string;
  variables: Record<string, string>;
}

export interface SlotContext {
  region: SlotRegion;
  subject: PanelSubject | null;
  palette: PanelPalette;
  container: HTMLElement;
}

export type SlotRender = (context: SlotContext) => unknown;
export type SlotAction = (action: string, event: Event, context: SlotContext) => unknown;
export type Slot = SlotSpec<SlotRender, SlotAction>;

export interface SlotEnvironment {
  subject: PanelSubject | null;
  palette: PanelPalette;
}

function report(slotId: string, error: unknown): void {
  console.error(`${MODULE_ID} | slot ${slotId}`, error);
}

function fill(wrapper: HTMLElement, result: unknown): void {
  if (result instanceof Node) wrapper.append(result);
  else if (typeof result === "string") wrapper.innerHTML = result;
}

export class SlotHost {
  #slots = new Map<string, Slot>();

  register(value: unknown): { ok: true; slot: Slot } | { ok: false; error: SlotError } {
    const parsed = parseSlot<SlotRender, SlotAction>(value);
    if (parsed.ok) this.#slots.set(parsed.slot.id, parsed.slot);
    return parsed;
  }

  unregister(id: string): Slot | null {
    const slot = this.#slots.get(id) ?? null;
    this.#slots.delete(id);
    return slot;
  }

  get(id: string): Slot | null {
    return this.#slots.get(id) ?? null;
  }

  list(region: SlotRegion): Slot[] {
    return slotsIn(this.#slots.values(), region);
  }

  mount(root: HTMLElement, environment: SlotEnvironment): void {
    for (const container of root.querySelectorAll<HTMLElement>("[data-ccp-slot-region]")) {
      if (container.dataset.mounted === "1") continue;
      container.dataset.mounted = "1";
      const region = container.dataset.ccpSlotRegion;
      if (!isRegion(region)) continue;
      const slots =
        region === "drawer"
          ? [this.get(container.dataset.slotId ?? "")].filter((slot): slot is Slot => !!slot)
          : this.list(region);
      container.replaceChildren();
      for (const slot of slots) {
        const wrapper = document.createElement("div");
        wrapper.className = `ccp-slot ccp-slot-${slot.id}`;
        wrapper.dataset.slotId = slot.id;
        container.append(wrapper);
        try {
          fill(wrapper, slot.render({ region, container: wrapper, ...environment }));
        } catch (error) {
          report(slot.id, error);
        }
      }
      container.hidden = slots.length === 0;
    }
    this.#bindActions(root, environment);
  }

  #bindActions(root: HTMLElement, environment: SlotEnvironment): void {
    const bound = root as HTMLElement & { ccpSlotEnvironment?: SlotEnvironment };
    const first = bound.ccpSlotEnvironment === undefined;
    bound.ccpSlotEnvironment = environment;
    if (!first) return;
    root.addEventListener("click", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest<HTMLElement>("[data-slot-action]");
      const wrapper = button?.closest<HTMLElement>(".ccp-slot");
      const slot = wrapper ? this.get(wrapper.dataset.slotId ?? "") : null;
      const region = wrapper?.parentElement?.dataset.ccpSlotRegion;
      if (!button || !wrapper || !slot?.onAction || !isRegion(region)) return;
      event.preventDefault();
      event.stopPropagation();
      const context = { region, container: wrapper, ...(bound.ccpSlotEnvironment ?? environment) };
      try {
        void Promise.resolve(slot.onAction(button.dataset.slotAction ?? "", event, context)).catch(
          (error: unknown) => report(slot.id, error),
        );
      } catch (error) {
        report(slot.id, error);
      }
    });
  }
}
