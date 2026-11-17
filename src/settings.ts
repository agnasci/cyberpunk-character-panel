import { KEYBINDING_TOGGLE, MODULE_ID, SETTINGS } from "./constants";
import { DEFAULT_ACCENT, normalizeHex } from "./domain/palette";

export type DockPosition = "bottom" | "top";

export interface PanelSettings {
  enabled: boolean;
  followControlled: boolean;
  scale: number;
  dock: DockPosition;
  collapsed: boolean;
  animateMonitor: boolean;
  accent: string;
  accentOverride: string | null;
  worldAccent: string;
  compact: boolean;
  showFavorites: boolean;
  showBpm: boolean;
}

export function registerSettings(onChange: () => void, onToggle: () => void): void {
  const client = (key: string, data: Record<string, unknown>) =>
    game.settings.register(MODULE_ID, key, {
      name: `CCP.Settings.${key}.Name`,
      hint: `CCP.Settings.${key}.Hint`,
      scope: "client",
      config: true,
      onChange,
      ...data,
    });
  client(SETTINGS.enabled, { type: Boolean, default: true });
  client(SETTINGS.followControlled, { type: Boolean, default: false });
  client(SETTINGS.scale, {
    type: Number,
    range: { min: 0.7, max: 1.4, step: 0.05 },
    default: 1,
  });
  client(SETTINGS.dock, {
    type: String,
    choices: {
      bottom: "CCP.Settings.dock.Bottom",
      top: "CCP.Settings.dock.Top",
    },
    default: "bottom",
  });
  client(SETTINGS.animateMonitor, { type: Boolean, default: true });
  const { ColorField } = foundry.data.fields;
  client(SETTINGS.accent, {
    type: new ColorField({ nullable: true, blank: true, required: false, initial: null }),
    default: null,
  });
  game.settings.register(MODULE_ID, SETTINGS.defaultAccent, {
    name: "CCP.Settings.defaultAccent.Name",
    hint: "CCP.Settings.defaultAccent.Hint",
    scope: "world",
    config: true,
    onChange,
    type: new ColorField({ required: true, blank: false, initial: DEFAULT_ACCENT }),
    default: DEFAULT_ACCENT,
  });
  client(SETTINGS.compact, { type: Boolean, default: false });
  client(SETTINGS.showFavorites, { type: Boolean, default: true });
  client(SETTINGS.showBpm, { type: Boolean, default: true });
  game.settings.register(MODULE_ID, SETTINGS.collapsed, {
    scope: "client",
    config: false,
    type: Boolean,
    default: false,
  });
  game.keybindings.register(MODULE_ID, KEYBINDING_TOGGLE, {
    name: "CCP.Keybinding.Toggle.Name",
    hint: "CCP.Keybinding.Toggle.Hint",
    editable: [{ key: "KeyC", modifiers: ["Alt"] }],
    onDown: () => {
      onToggle();
      return true;
    },
    precedence: CONST.KEYBINDING_PRECEDENCE.NORMAL,
  });
}

export function readSettings(): PanelSettings {
  const get = (key: string) => game.settings.get(MODULE_ID, key);
  const scale = Number(get(SETTINGS.scale));
  const raw = get(SETTINGS.accent);
  const accentOverride = typeof raw === "string" ? normalizeHex(raw) : null;
  const world = get(SETTINGS.defaultAccent);
  const worldAccent = (typeof world === "string" ? normalizeHex(world) : null) ?? DEFAULT_ACCENT;
  return {
    enabled: get(SETTINGS.enabled) !== false,
    followControlled: get(SETTINGS.followControlled) === true,
    scale: Number.isFinite(scale) ? scale : 1,
    dock: get(SETTINGS.dock) === "top" ? "top" : "bottom",
    collapsed: get(SETTINGS.collapsed) === true,
    animateMonitor: get(SETTINGS.animateMonitor) !== false,
    accent: accentOverride ?? worldAccent,
    accentOverride,
    worldAccent,
    compact: get(SETTINGS.compact) === true,
    showFavorites: get(SETTINGS.showFavorites) !== false,
    showBpm: get(SETTINGS.showBpm) !== false,
  };
}

export function saveCollapsed(collapsed: boolean): Promise<unknown> {
  return game.settings.set(MODULE_ID, SETTINGS.collapsed, collapsed);
}

export type PreferenceKey = "compact" | "showFavorites" | "showBpm" | "animateMonitor" | "dock";

export function savePreference(
  key: PreferenceKey,
  value: boolean | DockPosition,
): Promise<unknown> {
  return game.settings.set(MODULE_ID, SETTINGS[key], value);
}

export function saveAccent(hex: string | null): Promise<unknown> {
  return game.settings.set(MODULE_ID, SETTINGS.accent, hex);
}

export function saveWorldAccent(hex: string): Promise<unknown> {
  return game.settings.set(MODULE_ID, SETTINGS.defaultAccent, hex);
}
