import { checkSystemCompatibility } from "./compatibility";
import { MODULE_ID } from "./constants";

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
  console.info(`${MODULE_ID} | ready`);
});
