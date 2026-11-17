import { KEYBINDING_TOGGLE, MODULE_ID, PLAYER_PREF_KEYS, PREFS_FLAG, SETTINGS } from "./constants";
import { DEFAULT_ACCENT, normalizeHex } from "./domain/palette";
import { type PrefValues, prefsToApply, prefsToSeed } from "./domain/player-prefs";

let restoring = false;
let pendingWrites = 0;

async function writeFlag(key: string, value: unknown): Promise<void> {
  pendingWrites++;
  try {
    await game.user.setFlag(MODULE_ID, key, value);
  } finally {
    pendingWrites--;
  }
}

export function hasPendingPrefWrites(): boolean {
  return pendingWrites > 0;
}

function storedPrefs(): PrefValues | null {
  const raw = game.user.getFlag(MODULE_ID, PREFS_FLAG);
  return raw && typeof raw === "object" ? (raw as PrefValues) : null;
}

function currentPrefs(): PrefValues {
  const values: PrefValues = {};
  for (const key of PLAYER_PREF_KEYS) values[key] = game.settings.get(MODULE_ID, key);
  return values;
}

function storePlayerPref(key: string, value: unknown): void {
  if (restoring) return;
  void writeFlag(`${PREFS_FLAG}.${key}`, value ?? null);
}

export async function restorePlayerPrefs(): Promise<void> {
  const stored = storedPrefs();
  const apply = prefsToApply(stored, currentPrefs(), PLAYER_PREF_KEYS);
  restoring = true;
  try {
    for (const [key, value] of Object.entries(apply)) {
      await game.settings.set(MODULE_ID, key, value);
    }
  } finally {
    restoring = false;
  }
  const seed = prefsToSeed(stored, currentPrefs(), PLAYER_PREF_KEYS);
  if (Object.keys(seed).length > 0) {
    await writeFlag(PREFS_FLAG, { ...(stored ?? {}), ...seed });
  }
}

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
      onChange: (value: unknown) => {
        storePlayerPref(key, value);
        onChange();
      },
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
    onChange: (value: unknown) => storePlayerPref(SETTINGS.collapsed, value),
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
