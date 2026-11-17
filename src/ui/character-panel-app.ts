import { MODULE_ID } from "../constants";
import { ALL_PARTS, type PanelPart } from "../domain/panel-parts";
import { sameSubject } from "../domain/subject";
import {
  buildActionsView,
  buildDrawerView,
  buildStatsView,
  type DrawerId,
  filterVisible,
} from "../domain/panel-views";
import { buildPanelView } from "../domain/view-model";
import { parseHpEntry, stepHp, stepLuck } from "../domain/vital-limits";
import {
  increaseDeathPenalty,
  resetDeathPenalty,
  rollDeathSave,
  rollFacedown,
  rollInterface,
  type RollModifiers,
  rollRoleAbility,
  rollSkill,
  rollStat,
  setHp,
  setLuck,
} from "../integrations/cpr/character-actions";
import { readCharacterSnapshot } from "../integrations/cpr/character-adapter";
import { readNet, readRoles, readSkills, toggleFavorite } from "../integrations/cpr/sheet-adapter";
import type { ResolvedSubject } from "../integrations/cpr/subject-resolver";
import { type PanelSettings, saveCollapsed } from "../settings";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const DIRTY_DELAY_MS = 40;
const NARROW_WIDTH = 880;
const TINY_WIDTH = 560;

function modifiersOf(event: Event): RollModifiers {
  const mouse = event as MouseEvent;
  return { ctrlKey: mouse.ctrlKey === true, metaKey: mouse.metaKey === true };
}

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
      rollStat: CharacterPanelApp.#onRollStat,
      rollFacedown: CharacterPanelApp.#onRollFacedown,
      toggleDrawer: CharacterPanelApp.#onToggleDrawer,
      rollSkill: CharacterPanelApp.#onRollSkill,
      toggleFavorite: CharacterPanelApp.#onToggleFavorite,
      rollRole: CharacterPanelApp.#onRollRole,
      rollInterface: CharacterPanelApp.#onRollInterface,
    },
  };

  static PARTS = {
    drawer: {
      template: `modules/${MODULE_ID}/templates/drawer.hbs`,
      scrollable: [".ccp-skill-cols"],
    },
    identity: { template: `modules/${MODULE_ID}/templates/identity.hbs` },
    vitals: { template: `modules/${MODULE_ID}/templates/vitals.hbs` },
    stats: { template: `modules/${MODULE_ID}/templates/stats.hbs` },
    dock: { template: `modules/${MODULE_ID}/templates/dock.hbs` },
    actions: { template: `modules/${MODULE_ID}/templates/actions.hbs` },
  };

  #resolved: ResolvedSubject | null = null;
  #settings: PanelSettings;
  #pending = new Set<PanelPart>();
  #queued = new Map<string, number>();
  #refocus: string | null = null;
  #drawer: DrawerId | null = null;
  #skillQuery = "";
  #resizer: ResizeObserver | null = null;
  #observed: HTMLElement | null = null;
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
    if (changed) {
      this.#drawer = null;
      this.#skillQuery = "";
    }
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
    const snapshot = readCharacterSnapshot(this.#resolved.actor, this.#resolved.token);
    return { hasSubject: true, ...buildPanelView(snapshot), stats: buildStatsView(snapshot.stats) };
  }

  protected override async _preparePartContext(
    partId: string,
    context: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const base = await super._preparePartContext(partId, context, options);
    const actor = this.#resolved?.actor;
    if (!actor) return base;
    if (partId === "actions") {
      const actions = buildActionsView(this.#drawer, {
        skills: readSkills(actor),
        roles: readRoles(actor),
        net: readNet(actor),
      });
      return { ...base, actions };
    }
    if (partId === "drawer") {
      const open = this.#drawer;
      const drawer = buildDrawerView(open, {
        skills: open === "skills" ? readSkills(actor) : undefined,
        roles: open === "roles" ? readRoles(actor) : undefined,
        net: open === "net" ? readNet(actor) : undefined,
      });
      const empty = !drawer.skills && !drawer.roles && !drawer.net;
      return { ...base, drawer: empty ? { ...drawer, open: null } : drawer };
    }
    return base;
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
    this.#bindSkillSearch();
    this.#observeWidth();
    if (this.#refocus) {
      const target = document.getElementById(this.#refocus);
      if (target) {
        this.#refocus = null;
        target.focus();
      }
    }
  }

  #observeWidth(): void {
    const root = this.element;
    if (!root || this.#observed === root) return;
    this.#resizer ??= new ResizeObserver(() => this.#applyWidth());
    if (this.#observed) this.#resizer.unobserve(this.#observed);
    this.#resizer.observe(root);
    this.#observed = root;
    this.#applyWidth();
  }

  #applyWidth(): void {
    const root = this.element;
    if (!root || root.classList.contains("ccp-collapsed")) return;
    const width = root.getBoundingClientRect().width / (this.#settings.scale || 1);
    if (width === 0) return;
    root.classList.toggle("ccp-narrow", width < NARROW_WIDTH);
    root.classList.toggle("ccp-tiny", width < TINY_WIDTH);
  }

  #bindSkillSearch(): void {
    const input = this.element.querySelector<HTMLInputElement>("#ccp-skill-search");
    if (!input || input.dataset.bound === "1") return;
    input.dataset.bound = "1";
    input.value = this.#skillQuery;
    input.addEventListener("input", () => {
      this.#skillQuery = input.value;
      this.#applySkillFilter();
    });
    input.addEventListener("keydown", (event) => {
      event.stopPropagation();
      if (event.key === "Escape" && input.value) {
        event.preventDefault();
        input.value = "";
        this.#skillQuery = "";
        this.#applySkillFilter();
      }
    });
    this.#applySkillFilter();
  }

  #applySkillFilter(): void {
    const drawer = this.element.querySelector<HTMLElement>(".ccp-drawer");
    if (!drawer) return;
    let shown = 0;
    for (const group of drawer.querySelectorAll<HTMLElement>(".ccp-skill-group")) {
      let groupShown = 0;
      for (const row of group.querySelectorAll<HTMLElement>(".ccp-skill")) {
        const visible = filterVisible(row.dataset.search ?? "", this.#skillQuery);
        row.hidden = !visible;
        if (visible) groupShown++;
      }
      group.hidden = groupShown === 0;
      shown += groupShown;
    }
    const empty = drawer.querySelector<HTMLElement>(".ccp-empty");
    if (empty) empty.hidden = shown > 0;
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
    if (actor) await rollDeathSave(actor, modifiersOf(event));
  }

  static async #onIncreaseDeathPenalty(this: CharacterPanelApp): Promise<void> {
    const actor = this.#actor();
    if (actor) await increaseDeathPenalty(actor);
  }

  static async #onResetDeathPenalty(this: CharacterPanelApp): Promise<void> {
    const actor = this.#actor();
    if (actor) await resetDeathPenalty(actor);
  }

  static async #onRollStat(this: CharacterPanelApp, event: Event, target: HTMLElement) {
    const actor = this.#actor();
    const stat = target.dataset.stat;
    if (actor && stat) await rollStat(actor, stat, modifiersOf(event));
  }

  static async #onRollFacedown(this: CharacterPanelApp, event: Event): Promise<void> {
    const actor = this.#actor();
    if (actor) await rollFacedown(actor, modifiersOf(event));
  }

  static async #onToggleDrawer(this: CharacterPanelApp, _event: Event, target: HTMLElement) {
    const id = target.dataset.drawer as DrawerId | undefined;
    if (!id) return;
    this.#drawer = this.#drawer === id ? null : id;
    this.#refocus = target.id;
    await this.render({ parts: ["drawer", "actions"] });
  }

  static async #onRollSkill(this: CharacterPanelApp, event: Event, target: HTMLElement) {
    const actor = this.#actor();
    const id = target.dataset.skillId;
    if (actor && id) await rollSkill(actor, id, modifiersOf(event));
  }

  static async #onToggleFavorite(this: CharacterPanelApp, _event: Event, target: HTMLElement) {
    const actor = this.#actor();
    const id = target.dataset.skillId;
    if (actor && id) await toggleFavorite(actor, id);
  }

  static async #onRollRole(this: CharacterPanelApp, event: Event, target: HTMLElement) {
    const actor = this.#actor();
    const { roleId, subtype, ability } = target.dataset;
    if (actor && roleId && subtype && ability) {
      await rollRoleAbility(actor, roleId, subtype, ability, modifiersOf(event));
    }
  }

  static async #onRollInterface(this: CharacterPanelApp, event: Event, target: HTMLElement) {
    const actor = this.#actor();
    const { ability, deckId } = target.dataset;
    if (actor && ability && deckId) await rollInterface(actor, ability, deckId, modifiersOf(event));
  }
}
