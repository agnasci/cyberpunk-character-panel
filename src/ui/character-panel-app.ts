import { MODULE_ID } from "../constants";
import { ALL_PARTS, type PanelPart } from "../domain/panel-parts";
import { sameSubject } from "../domain/subject";
import { buildPanelView } from "../domain/view-model";
import { parseHpEntry, stepHp, stepLuck } from "../domain/vital-limits";
import {
  increaseDeathPenalty,
  resetDeathPenalty,
  rollDeathSave,
  setHp,
  setLuck,
} from "../integrations/cpr/character-actions";
import { readCharacterSnapshot } from "../integrations/cpr/character-adapter";
import type { ResolvedSubject } from "../integrations/cpr/subject-resolver";
import { type PanelSettings, saveCollapsed } from "../settings";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const DIRTY_DELAY_MS = 40;

export class CharacterPanelApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static override DEFAULT_OPTIONS = {
    id: "ccp-panel",
    tag: "aside",
    classes: ["ccp-panel"],
    window: { frame: false, positioned: false },
    actions: {
      openSheet: CharacterPanelApp.#onOpenSheet,
      toggleCollapse: CharacterPanelApp.#onToggleCollapse,
      stepHp: CharacterPanelApp.#onStepHp,
      editHp: CharacterPanelApp.#onEditHp,
      adjustLuck: CharacterPanelApp.#onAdjustLuck,
      rollDeathSave: CharacterPanelApp.#onRollDeathSave,
      increaseDeathPenalty: CharacterPanelApp.#onIncreaseDeathPenalty,
      resetDeathPenalty: CharacterPanelApp.#onResetDeathPenalty,
    },
  };

  static PARTS = {
    identity: { template: `modules/${MODULE_ID}/templates/identity.hbs` },
    vitals: { template: `modules/${MODULE_ID}/templates/vitals.hbs` },
    dock: { template: `modules/${MODULE_ID}/templates/dock.hbs` },
  };

  #resolved: ResolvedSubject | null = null;
  #settings: PanelSettings;
  #pending = new Set<PanelPart>();
  #queued = new Map<string, number>();
  #refocus: string | null = null;
  #flush = foundry.utils.debounce(() => void this.#renderPending(), DIRTY_DELAY_MS);

  constructor(settings: PanelSettings) {
    super();
    this.#settings = settings;
    document.addEventListener("visibilitychange", () => this.#applyMotion());
  }

  get subject(): ResolvedSubject | null {
    return this.#resolved;
  }

  isSubjectActor(actor: Actor | null | undefined): boolean {
    return !!actor && !!this.#resolved && actor.uuid === this.#resolved.actor.uuid;
  }

  isSubjectToken(tokenId: string): boolean {
    return !!this.#resolved?.token && this.#resolved.token.id === tokenId;
  }

  async applySettings(settings: PanelSettings): Promise<void> {
    this.#settings = settings;
    if (!settings.enabled) {
      if (this.rendered) await this.close({ animate: false });
      return;
    }
    await this.render(!this.rendered ? true : { parts: [...ALL_PARTS] });
  }

  async setSubject(resolved: ResolvedSubject | null): Promise<void> {
    const changed =
      !sameSubject(this.#resolved?.subject ?? null, resolved?.subject ?? null) ||
      this.#resolved?.actor !== resolved?.actor;
    this.#resolved = resolved;
    if (!this.#settings.enabled) return;
    if (!this.rendered) await this.render(true);
    else if (changed) await this.render({ parts: [...ALL_PARTS] });
  }

  markDirty(parts: readonly PanelPart[]): void {
    if (parts.length === 0) return;
    for (const part of parts) this.#pending.add(part);
    this.#flush();
  }

  async toggleCollapsed(): Promise<void> {
    const collapsed = !this.#settings.collapsed;
    this.#settings = { ...this.#settings, collapsed };
    this.#applyRootState(this.#resolved !== null);
    await saveCollapsed(collapsed);
  }

  async #renderPending(): Promise<void> {
    const parts = ALL_PARTS.filter((p) => this.#pending.has(p));
    this.#pending.clear();
    if (parts.length === 0 || !this.rendered) return;
    await this.render({ parts });
  }

  protected override async _prepareContext(): Promise<Record<string, unknown>> {
    if (!this.#resolved) return { hasSubject: false };
    const view = buildPanelView(readCharacterSnapshot(this.#resolved.actor, this.#resolved.token));
    return { hasSubject: true, ...view };
  }

  protected override _syncPartState(
    partId: string,
    newElement: HTMLElement,
    priorElement: HTMLElement,
    state: Record<string, unknown>,
  ): void {
    super._syncPartState(partId, newElement, priorElement, state);
    if (partId !== "vitals") return;
    const prior = priorElement.querySelector<HTMLElement>(".ccp-monitor");
    const next = newElement.querySelector<HTMLElement>(".ccp-monitor");
    if (prior && next && prior.dataset.state === next.dataset.state) {
      next.replaceWith(prior);
    }
  }

  protected override _insertElement(element: HTMLElement): void {
    document.getElementById(element.id)?.remove();
    this.#place(element);
  }

  protected override _onRender(
    context: Record<string, unknown>,
    options: Record<string, unknown>,
  ): void {
    super._onRender(context, options);
    this.#place(this.element);
    const vitals = context.vitals as { state?: string } | undefined;
    if (vitals?.state) this.element.dataset.vital = vitals.state;
    this.#applyRootState(context.hasSubject === true);
    if (this.#refocus) {
      const target = document.getElementById(this.#refocus);
      if (target) {
        this.#refocus = null;
        target.focus();
      }
    }
  }

  #place(element: HTMLElement): void {
    const target = document.getElementById(this.#settings.dock === "top" ? "ui-top" : "ui-bottom");
    if (!target) {
      if (!element.isConnected) document.body.append(element);
      return;
    }
    if (element.parentElement !== target) target.prepend(element);
  }

  #applyRootState(hasSubject: boolean): void {
    const root = this.element;
    if (!root) return;
    root.hidden = !hasSubject;
    root.classList.toggle("ccp-collapsed", this.#settings.collapsed);
    root.classList.toggle("ccp-dock-top", this.#settings.dock === "top");
    root.style.setProperty("--ccp-scale", String(this.#settings.scale));
    this.#applyMotion();
    const toggle = root.querySelector<HTMLElement>("[data-action='toggleCollapse']");
    if (toggle) {
      const key = this.#settings.collapsed ? "CCP.Panel.Expand" : "CCP.Panel.Collapse";
      toggle.setAttribute("aria-label", game.i18n.localize(key));
      toggle.setAttribute("aria-expanded", String(!this.#settings.collapsed));
      toggle.dataset.tooltip = game.i18n.localize(key);
    }
  }

  #applyMotion(): void {
    const root = this.element;
    if (!root) return;
    root.classList.toggle("ccp-still", !this.#settings.animateMonitor);
    root.classList.toggle("ccp-paused", document.hidden);
  }

  #actor(): Actor | null {
    const actor = this.#resolved?.actor ?? null;
    return actor?.isOwner ? actor : null;
  }

  #openHpEntry(button: HTMLElement): void {
    const actor = this.#actor();
    const hp = actor ? readCharacterSnapshot(actor, null).hp : null;
    if (!actor || !hp) return;
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "numeric";
    input.id = "ccp-hp-input";
    input.className = "ccp-hp-input";
    input.value = String(hp.value);
    input.setAttribute("aria-label", button.getAttribute("aria-label") ?? "");
    let done = false;
    const finish = async (commit: boolean, refocus: boolean) => {
      if (done) return;
      done = true;
      if (refocus) this.#refocus = button.id;
      const next = commit ? parseHpEntry(input.value, hp.value, hp.max) : null;
      const changed = next !== null && next !== hp.value && (await setHp(actor, next));
      if (!changed) await this.render({ parts: ["vitals"] });
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") void finish(true, true);
      else if (event.key === "Escape") void finish(false, true);
      else return;
      event.preventDefault();
      event.stopPropagation();
    });
    input.addEventListener("blur", () => void finish(true, false));
    button.replaceWith(input);
    input.focus();
    input.select();
  }

  static #onOpenSheet(this: CharacterPanelApp): void {
    this.#resolved?.actor.sheet?.render(true);
  }

  static async #onToggleCollapse(this: CharacterPanelApp): Promise<void> {
    await this.toggleCollapsed();
  }

  async #queue(
    key: string,
    current: number,
    next: (base: number) => number,
    write: (value: number) => Promise<unknown>,
  ): Promise<void> {
    const value = next(this.#queued.get(key) ?? current);
    this.#queued.set(key, value);
    try {
      await write(value);
    } finally {
      if (this.#queued.get(key) === value) this.#queued.delete(key);
    }
  }

  static async #onStepHp(this: CharacterPanelApp, _event: Event, target: HTMLElement) {
    const actor = this.#actor();
    const hp = actor ? readCharacterSnapshot(actor, null).hp : null;
    if (!actor || !hp) return;
    const delta = Number(target.dataset.delta);
    await this.#queue(
      `hp:${actor.uuid}`,
      hp.value,
      (base) => stepHp(base, delta, hp.max),
      (value) => setHp(actor, value),
    );
  }

  static #onEditHp(this: CharacterPanelApp, _event: Event, target: HTMLElement): void {
    this.#openHpEntry(target);
  }

  static async #onAdjustLuck(this: CharacterPanelApp, _event: Event, target: HTMLElement) {
    const actor = this.#actor();
    const luck = actor ? readCharacterSnapshot(actor, null).luck : null;
    if (!actor || !luck) return;
    const delta = Number(target.dataset.delta);
    await this.#queue(
      `luck:${actor.uuid}`,
      luck.value,
      (base) => stepLuck(base, delta, luck.max),
      (value) => setLuck(actor, value),
    );
  }

  static async #onRollDeathSave(this: CharacterPanelApp, event: Event): Promise<void> {
    const actor = this.#actor();
    const mouse = event as MouseEvent;
    if (actor) await rollDeathSave(actor, { ctrlKey: mouse.ctrlKey, metaKey: mouse.metaKey });
  }

  static async #onIncreaseDeathPenalty(this: CharacterPanelApp): Promise<void> {
    const actor = this.#actor();
    if (actor) await increaseDeathPenalty(actor);
  }

  static async #onResetDeathPenalty(this: CharacterPanelApp): Promise<void> {
    const actor = this.#actor();
    if (actor) await resetDeathPenalty(actor);
  }
}
