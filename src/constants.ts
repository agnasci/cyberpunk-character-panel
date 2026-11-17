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
} as const;

export const KEYBINDING_TOGGLE = "togglePanel";
