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
import { alignOffset } from "../domain/placement";
import { buildPanelView } from "../domain/view-model";
import { clampInt, parseHpEntry, stepHp, stepLuck } from "../domain/vital-limits";
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
import {
  applyLedgerChange,
  openEffect,
  openItem,
  openLedger,
  readDrugs,
  readEffects,
  readInjuries,
  readLedgers,
  readStatuses,
  toggleEffect,
  toggleStatus,
  useDrug,
} from "../integrations/cpr/quick-sheet-adapter";
import { readNet, readRoles, readSkills, toggleFavorite } from "../integrations/cpr/sheet-adapter";
import {
  isLedgerMode,
  isLedgerProp,
  parseLedgerAmount,
  planLedgerChange,
} from "../domain/quick-sheet";
import type { ResolvedSubject } from "../integrations/cpr/subject-resolver";
import { buildPalette, normalizeHex, paletteVariables } from "../domain/palette";
import { buildStyleView, styleNote } from "../domain/style-view";
import {
  type PanelSettings,
  type PreferenceKey,
  saveAccent,
  saveCollapsed,
  savePreference,
  saveWorldAccent,
} from "../settings";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

const DIRTY_DELAY_MS = 40;
const NARROW_WIDTH = 760;
const TINY_WIDTH = 520;

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
      setLuck: CharacterPanelApp.#onSetLuck,
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
      changeLedger: CharacterPanelApp.#onChangeLedger,
      openLedger: CharacterPanelApp.#onOpenLedger,
      openItem: CharacterPanelApp.#onOpenItem,
      useDrug: CharacterPanelApp.#onUseDrug,
      toggleEffect: CharacterPanelApp.#onToggleEffect,
      openEffect: CharacterPanelApp.#onOpenEffect,
      toggleStatus: CharacterPanelApp.#onToggleStatus,
      previewAccent: CharacterPanelApp.#onPreviewAccent,
      saveAccent: CharacterPanelApp.#onSaveAccent,
      resetAccent: CharacterPanelApp.#onResetAccent,
      saveWorldAccent: CharacterPanelApp.#onSaveWorldAccent,
      togglePref: CharacterPanelApp.#onTogglePref,
      setDock: CharacterPanelApp.#onSetDock,
    },
  };

  static PARTS = {
    drawer: {
      template: `modules/${MODULE_ID}/templates/drawer.hbs`,
      scrollable: [".ccp-skill-cols", ".ccp-health"],
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
  #favScroll = 0;
  #preview: string | null = null;
  #resizer: ResizeObserver | null = null;
  #observed: HTMLElement | null = null;
  #observedParent: HTMLElement | null = null;
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
      this.#favScroll = 0;
    }
    if (!this.#settings.enabled) return;
    if (!this.rendered) await this.render(true);
    else if (changed) await this.render({ parts: [...ALL_PARTS] });
  }

  markDirty(parts: readonly PanelPart[]): void {
    if (parts.length === 0) return;
    for (const part of parts) this.#pending.add(part);
    if (this.#drawer === "health" && this.#pending.has("vitals")) this.#pending.add("drawer");
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
    if (partId === "dock") return { ...base, styleOpen: this.#drawer === "style" };
    if (partId === "actions") {
      const actions = buildActionsView(this.#drawer, {
        skills: readSkills(actor),
        roles: readRoles(actor),
        net: readNet(actor),
        ledgers: readLedgers(actor),
      });
      return { ...base, actions };
    }
    if (partId === "drawer") {
      const open = this.#drawer;
      const drawer = buildDrawerView(open, {
        skills: open === "skills" ? readSkills(actor) : undefined,
        roles: open === "roles" ? readRoles(actor) : undefined,
        net: open === "net" ? readNet(actor) : undefined,
        ledgers: open === "sheet" ? readLedgers(actor) : undefined,
        injuries: open === "health" ? readInjuries(actor) : undefined,
        drugs: open === "health" ? readDrugs(actor) : undefined,
        effects: open === "health" ? readEffects(actor) : undefined,
        statuses: open === "health" ? readStatuses(actor) : undefined,
        style: open === "style" ? this.#styleView() : undefined,
      });
      const empty =
        !drawer.skills &&
        !drawer.roles &&
        !drawer.net &&
        !drawer.ledgers &&
        !drawer.health &&
        !drawer.style;
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
    this.#bindFavorites();
    this.#bindStyleEditor();
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
    const parent = root?.parentElement ?? null;
    if (!root || (this.#observed === root && this.#observedParent === parent)) return;
    this.#resizer ??= new ResizeObserver(() => this.#applyWidth());
    this.#resizer.disconnect();
    this.#resizer.observe(root);
    if (parent) this.#resizer.observe(parent);
    this.#observed = root;
    this.#observedParent = parent;
    this.#applyWidth();
  }

  #applyWidth(): void {
    const root = this.element;
    if (!root) return;
    this.#applyPlacement(root);
    if (root.classList.contains("ccp-collapsed")) return;
    const width = root.getBoundingClientRect().width / (this.#settings.scale || 1);
    if (width === 0) return;
    root.classList.toggle("ccp-narrow", width < NARROW_WIDTH);
    root.classList.toggle("ccp-tiny", width < TINY_WIDTH);
  }

  #applyPlacement(root: HTMLElement): void {
    const parent = root.parentElement;
    if (!parent) return;
    const area = parent.getBoundingClientRect();
    const width = root.getBoundingClientRect().width;
    if (width === 0) return;
    const hotbar = document.getElementById("hotbar")?.getBoundingClientRect();
    const shift = alignOffset({
      areaLeft: area.left,
      areaWidth: area.width,
      panelWidth: width,
      targetLeft: hotbar && hotbar.width > 0 ? hotbar.left : null,
    });
    root.style.setProperty("--ccp-shift", `${shift / (this.#settings.scale || 1)}px`);
  }

  #styleView() {
    return buildStyleView({
      accent: this.#settings.accent,
      preview: this.#preview,
      accentOverride: this.#settings.accentOverride,
      worldAccent: this.#settings.worldAccent,
      isGM: game.user.isGM,
      compact: this.#settings.compact,
      showFavorites: this.#settings.showFavorites,
      showBpm: this.#settings.showBpm,
      animateMonitor: this.#settings.animateMonitor,
      dock: this.#settings.dock,
    });
  }

  #applyPalette(hex: string): void {
    const root = this.element;
    if (!root) return;
    for (const [name, value] of Object.entries(paletteVariables(buildPalette(hex)))) {
      root.style.setProperty(name, value);
    }
  }

  #setPreview(hex: string | null, rerender: boolean): void {
    this.#preview = hex;
    this.#applyPalette(hex ?? this.#settings.accent);
    if (rerender) void this.render({ parts: ["drawer"] });
    else this.#updateStyleNote(hex ?? this.#settings.accent);
  }

  #updateStyleNote(hex: string): void {
    const drawer = this.element.querySelector<HTMLElement>(".ccp-style");
    if (!drawer) return;
    const note = styleNote(hex);
    const contrast = drawer.querySelector<HTMLElement>(".ccp-style-contrast");
    if (contrast) {
      contrast.textContent = game.i18n.format("CCP.Style.Contrast", {
        ratio: note.inkContrast.toFixed(1),
      });
    }
    const conflict = drawer.querySelector<HTMLElement>(".ccp-style-conflict");
    if (conflict) {
      conflict.hidden = note.conflictKeys.length === 0;
      conflict.textContent = game.i18n.format("CCP.Style.Conflict", {
        states: note.conflictKeys.map((k) => game.i18n.localize(k)).join(", "),
      });
    }
    const hexInput = drawer.querySelector<HTMLInputElement>("#ccp-accent-hex");
    if (hexInput && document.activeElement !== hexInput) hexInput.value = hex;
    for (const swatch of drawer.querySelectorAll<HTMLElement>(".ccp-swatch")) {
      swatch.setAttribute("aria-pressed", String(swatch.dataset.hex === hex));
    }
    drawer
      .querySelector<HTMLElement>(".ccp-style-save")
      ?.toggleAttribute("data-dirty", hex !== this.#settings.accent);
  }

  #bindStyleEditor(): void {
    if (this.element.querySelector(".ccp-style")) {
      this.#updateStyleNote(this.#preview ?? this.#settings.accent);
    }
    const picker = this.element.querySelector<HTMLInputElement>("#ccp-accent-picker");
    if (picker && picker.dataset.bound !== "1") {
      picker.dataset.bound = "1";
      picker.addEventListener("input", () => this.#setPreview(normalizeHex(picker.value), false));
    }
    const hex = this.element.querySelector<HTMLInputElement>("#ccp-accent-hex");
    if (hex && hex.dataset.bound !== "1") {
      hex.dataset.bound = "1";
      hex.addEventListener("keydown", (event) => event.stopPropagation());
      hex.addEventListener("change", () => {
        const value = normalizeHex(hex.value);
        if (value) this.#setPreview(value, true);
        else hex.value = this.#preview ?? this.#settings.accent;
      });
    }
  }

  #bindFavorites(): void {
    const strip = this.element.querySelector<HTMLElement>(".ccp-favs");
    if (!strip || strip.dataset.bound === "1") return;
    strip.dataset.bound = "1";
    const update = () => {
      const max = strip.scrollWidth - strip.clientWidth;
      strip.classList.toggle("ccp-more-left", strip.scrollLeft > 1);
      strip.classList.toggle("ccp-more-right", strip.scrollLeft < max - 1);
    };
    strip.scrollTo({ left: this.#favScroll, behavior: "instant" });
    strip.addEventListener("scroll", () => {
      this.#favScroll = strip.scrollLeft;
      update();
    });
    strip.addEventListener(
      "wheel",
      (event) => {
        if (strip.scrollWidth <= strip.clientWidth) return;
        const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
        if (delta === 0) return;
        event.preventDefault();
        strip.scrollBy({ left: delta });
      },
      { passive: false },
    );
    new ResizeObserver(update).observe(strip);
    update();
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
    root.classList.toggle("ccp-compact", this.#settings.compact);
    root.classList.toggle("ccp-no-favs", !this.#settings.showFavorites);
    root.classList.toggle("ccp-no-bpm", !this.#settings.showBpm);
    this.#applyPalette(this.#preview ?? this.#settings.accent);
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

  static async #onSetLuck(this: CharacterPanelApp, _event: Event, target: HTMLElement) {
    const actor = this.#actor();
    const luck = actor ? readCharacterSnapshot(actor, null).luck : null;
    if (!actor || !luck) return;
    const value = clampInt(Number(target.dataset.value), 0, luck.max);
    this.#refocus = target.id;
    await this.#queue(
      `luck:${actor.uuid}`,
      luck.value,
      () => value,
      (next) => setLuck(actor, next),
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
    if (this.#drawer !== "style" && this.#preview !== null) {
      this.#preview = null;
      this.#applyPalette(this.#settings.accent);
    }
    this.#refocus = target.id;
    await this.render({ parts: ["drawer", "actions", "dock"] });
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

  static async #onChangeLedger(this: CharacterPanelApp, _event: Event, target: HTMLElement) {
    const actor = this.#actor();
    const { prop, mode } = target.dataset;
    if (!actor || !prop || !mode || !isLedgerProp(prop) || !isLedgerMode(mode)) return;
    const card = target.closest<HTMLElement>(".ccp-ledger");
    const amountInput = card?.querySelector<HTMLInputElement>(".ccp-ledger-amount");
    const reasonInput = card?.querySelector<HTMLInputElement>(".ccp-ledger-reason");
    const amount = parseLedgerAmount(amountInput?.value ?? "");
    if (amount === null) {
      ui.notifications.error(game.i18n.localize("CCP.Ledger.InvalidAmount"));
      amountInput?.focus();
      return;
    }
    const current = readLedgers(actor).find((l) => l.prop === prop)?.value;
    if (current === undefined) return;
    const change = planLedgerChange(prop, mode, current, amount);
    if (change.warningKey) ui.notifications.warn(game.i18n.localize(change.warningKey));
    this.#refocus = target.id;
    await applyLedgerChange(actor, change, reasonInput?.value ?? "");
  }

  static async #onOpenLedger(this: CharacterPanelApp, _event: Event, target: HTMLElement) {
    const actor = this.#resolved?.actor;
    const prop = target.dataset.prop;
    if (actor && prop && isLedgerProp(prop)) await openLedger(actor, prop);
  }

  static #onOpenItem(this: CharacterPanelApp, _event: Event, target: HTMLElement): void {
    const actor = this.#resolved?.actor;
    const { itemType, itemId } = target.dataset;
    if (actor && itemType && itemId) openItem(actor, itemType, itemId);
  }

  static async #onUseDrug(this: CharacterPanelApp, _event: Event, target: HTMLElement) {
    const actor = this.#actor();
    const id = target.dataset.itemId;
    if (actor && id) await useDrug(actor, id);
  }

  static async #onToggleEffect(this: CharacterPanelApp, _event: Event, target: HTMLElement) {
    const actor = this.#actor();
    const uuid = target.dataset.effectUuid;
    if (actor && uuid) await toggleEffect(actor, uuid);
  }

  static #onOpenEffect(this: CharacterPanelApp, _event: Event, target: HTMLElement): void {
    const actor = this.#resolved?.actor;
    const uuid = target.dataset.effectUuid;
    if (actor && uuid) openEffect(actor, uuid);
  }

  static async #onToggleStatus(this: CharacterPanelApp, _event: Event, target: HTMLElement) {
    const actor = this.#actor();
    const id = target.dataset.statusId;
    if (actor && id) await toggleStatus(actor, id);
  }

  static #onPreviewAccent(this: CharacterPanelApp, _event: Event, target: HTMLElement): void {
    const hex = normalizeHex(target.dataset.hex ?? "");
    if (hex) this.#setPreview(hex, true);
  }

  static async #onSaveAccent(this: CharacterPanelApp): Promise<void> {
    const hex = this.#preview ?? this.#settings.accent;
    this.#preview = null;
    this.#refocus = "ccp-style-save";
    await saveAccent(hex === this.#settings.worldAccent ? null : hex);
  }

  static async #onResetAccent(this: CharacterPanelApp): Promise<void> {
    this.#preview = null;
    this.#refocus = "ccp-style-reset";
    await saveAccent(null);
  }

  static async #onSaveWorldAccent(this: CharacterPanelApp): Promise<void> {
    if (!game.user.isGM) return;
    const hex = this.#preview ?? this.#settings.accent;
    this.#preview = null;
    this.#refocus = "ccp-style-world";
    await saveWorldAccent(hex);
    if (this.#settings.accentOverride === hex) await saveAccent(null);
  }

  static async #onTogglePref(this: CharacterPanelApp, _event: Event, target: HTMLElement) {
    const key = target.dataset.pref as PreferenceKey | undefined;
    if (!key || key === "dock") return;
    this.#refocus = target.id;
    await savePreference(key, !this.#settings[key]);
  }

  static async #onSetDock(this: CharacterPanelApp, _event: Event, target: HTMLElement) {
    const dock = target.dataset.dock === "top" ? "top" : "bottom";
    this.#refocus = target.id;
    if (dock !== this.#settings.dock) await savePreference("dock", dock);
  }
}
