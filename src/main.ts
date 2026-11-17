import { checkSystemCompatibility } from "./compatibility";
import { MODULE_ID } from "./constants";
import {
  partsForActorChange,
  partsForEffectChange,
  partsForItemChange,
  partsForTokenChange,
} from "./domain/panel-parts";
import { resolveSubject } from "./integrations/cpr/subject-resolver";
import { readSettings, registerSettings } from "./settings";
import { CharacterPanelApp } from "./ui/character-panel-app";

const SUBJECT_DELAY_MS = 50;

let app: CharacterPanelApp | null = null;

const refreshSubject = foundry.utils.debounce(() => {
  if (!app) return;
  void app.setSubject(resolveSubject(readSettings().followControlled));
}, SUBJECT_DELAY_MS);

function changedKeys(changes: Record<string, unknown>): string[] {
  return Object.keys(foundry.utils.flattenObject(changes));
}

function effectOwner(effect: ActiveEffect): Actor | null {
  const parent = effect.parent as Partial<Actor> | null;
  return parent && typeof parent.uuid === "string" ? (parent as Actor) : null;
}

Hooks.once("init", () => {
  registerSettings(
    () => {
      if (!app) return;
      void app.applySettings(readSettings()).then(() => refreshSubject());
    },
    () => void app?.toggleCollapsed(),
  );
});

Hooks.once("ready", () => {
  const result = checkSystemCompatibility(game.system);
  if (result.status === "wrong-system") {
    console.warn(`${MODULE_ID} | ${game.i18n.localize("CCP.Compat.WrongSystem")}`);
    return;
  }
  if (result.status === "untested-version") {
    console.warn(
      `${MODULE_ID} | ${game.i18n.format("CCP.Compat.UntestedVersion", {
        tested: result.tested,
        found: result.found,
      })}`,
    );
  }
  app = new CharacterPanelApp(readSettings());
  refreshSubject();

  Hooks.on("canvasReady", () => refreshSubject());
  Hooks.on("controlToken", () => refreshSubject());
  Hooks.on("createToken", () => refreshSubject());
  Hooks.on("deleteToken", () => refreshSubject());
  Hooks.on("deleteActor", () => refreshSubject());
  Hooks.on("updateUser", (user, changes) => {
    if (user.id === game.user.id && "character" in changes) refreshSubject();
  });
  Hooks.on("updateActor", (actor, changes) => {
    if ("ownership" in changes) refreshSubject();
    if (app?.isSubjectActor(actor)) app.markDirty(partsForActorChange(changedKeys(changes)));
  });
  Hooks.on("updateToken", (token, changes) => {
    if (app?.isSubjectToken(token.id)) app.markDirty(partsForTokenChange(changedKeys(changes)));
  });
  const onItem = (item: Item) => {
    if (app?.isSubjectActor(item.parent)) app.markDirty(partsForItemChange(item.type));
  };
  Hooks.on("createItem", onItem);
  Hooks.on("updateItem", onItem);
  Hooks.on("deleteItem", onItem);
  const onEffect = (effect: ActiveEffect) => {
    if (app?.isSubjectActor(effectOwner(effect))) app.markDirty(partsForEffectChange());
  };
  Hooks.on("createActiveEffect", onEffect);
  Hooks.on("updateActiveEffect", onEffect);
  Hooks.on("deleteActiveEffect", onEffect);
});
