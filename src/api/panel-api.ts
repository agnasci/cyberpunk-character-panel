import { MODULE_ID } from "../constants";
import { API_VERSION, isAttentionSource, isRegion } from "../domain/slots";
import type { CharacterPanelApp } from "../ui/character-panel-app";
import type { PanelPalette, PanelSubject, SlotHost } from "../ui/slot-host";

export interface PanelApi {
  readonly version: typeof API_VERSION;
  getSubject(): PanelSubject | null;
  registerSlot(definition: unknown): boolean;
  unregisterSlot(id: string): void;
  requestRender(regions?: readonly string[]): void;
  getPalette(): PanelPalette | null;
  setAttention(source: string, active: boolean): boolean;
}

export function createPanelApi(app: () => CharacterPanelApp | null, slots: SlotHost): PanelApi {
  const rerender = (regions?: readonly unknown[]) => void app()?.requestRender(regions);
  return Object.freeze({
    version: API_VERSION,
    getSubject: () => app()?.subjectView() ?? null,
    registerSlot(definition: unknown): boolean {
      const result = slots.register(definition);
      if (!result.ok) {
        console.warn(`${MODULE_ID} | registerSlot: ${result.error}`);
        return false;
      }
      rerender([result.slot.region]);
      return true;
    },
    unregisterSlot(id: string): void {
      const removed = slots.unregister(id);
      if (removed) rerender([removed.region]);
    },
    requestRender(regions?: readonly string[]): void {
      rerender(regions?.filter(isRegion));
    },
    getPalette: () => app()?.palette() ?? null,
    setAttention(source: string, active: boolean): boolean {
      if (!isAttentionSource(source)) {
        console.warn(`${MODULE_ID} | setAttention: bad-source`);
        return false;
      }
      app()?.setAttention(source, active === true);
      return true;
    },
  });
}
