import { KEYBINDING_TOGGLE, MODULE_ID, SETTINGS } from "./constants";

export type DockPosition = "bottom" | "top";

export interface PanelSettings {
  enabled: boolean;
  followControlled: boolean;
  scale: number;
  dock: DockPosition;
  collapsed: boolean;
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
  return {
    enabled: get(SETTINGS.enabled) !== false,
    followControlled: get(SETTINGS.followControlled) === true,
    scale: Number.isFinite(scale) ? scale : 1,
    dock: get(SETTINGS.dock) === "top" ? "top" : "bottom",
    collapsed: get(SETTINGS.collapsed) === true,
  };
}

export function saveCollapsed(collapsed: boolean): Promise<unknown> {
  return game.settings.set(MODULE_ID, SETTINGS.collapsed, collapsed);
}
