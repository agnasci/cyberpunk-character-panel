export const MODULE_ID = "cyberpunk-character-panel";
export const SYSTEM_ID = "cyberpunk-red-core";
export const TESTED_SYSTEM_VERSION = "v0.92.4";

export const SUPPORTED_ACTOR_TYPES: readonly string[] = ["character", "mook"];

export const SETTINGS = {
  enabled: "enabled",
  followControlled: "followControlled",
  scale: "scale",
  dock: "dock",
  collapsed: "collapsed",
  animateMonitor: "animateMonitor",
  accent: "accent",
  defaultAccent: "defaultAccent",
  compact: "compact",
  showFavorites: "showFavorites",
  showBpm: "showBpm",
} as const;

export const KEYBINDING_TOGGLE = "togglePanel";

export const PREFS_FLAG = "prefs";

export const PLAYER_PREF_KEYS: readonly string[] = [
  SETTINGS.enabled,
  SETTINGS.followControlled,
  SETTINGS.scale,
  SETTINGS.dock,
  SETTINGS.collapsed,
  SETTINGS.animateMonitor,
  SETTINGS.accent,
  SETTINGS.compact,
  SETTINGS.showFavorites,
  SETTINGS.showBpm,
];
