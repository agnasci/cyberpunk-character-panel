declare class FoundryApplicationV2 {
  constructor(options?: Record<string, unknown>);
  static DEFAULT_OPTIONS: Record<string, unknown>;
  readonly element: HTMLElement;
  readonly rendered: boolean;
  render(options?: boolean | Record<string, unknown>): Promise<this>;
  close(options?: Record<string, unknown>): Promise<this>;
  protected _prepareContext(options: Record<string, unknown>): Promise<Record<string, unknown>>;
  protected _onRender(context: Record<string, unknown>, options: Record<string, unknown>): void;
  protected _insertElement(element: HTMLElement): void;
  protected _preparePartContext(
    partId: string,
    context: Record<string, unknown>,
    options: Record<string, unknown>,
  ): Promise<Record<string, unknown>>;
  protected _syncPartState(
    partId: string,
    newElement: HTMLElement,
    priorElement: HTMLElement,
    state: Record<string, unknown>,
  ): void;
}

type FoundryApplicationClass = abstract new (
  options?: Record<string, unknown>,
) => FoundryApplicationV2;

interface FoundryItem {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly system: unknown;
  readonly parent: FoundryActor | null;
}

interface FoundryActor {
  readonly id: string;
  readonly uuid: string;
  readonly name: string;
  readonly img: string;
  readonly type: string;
  readonly isOwner: boolean;
  readonly isToken: boolean;
  readonly system: unknown;
  readonly statuses: Set<string>;
  readonly itemTypes: Record<string, FoundryItem[] | undefined>;
  readonly sheet: { render(force: boolean): unknown } | null;
  update(data: Record<string, unknown>): Promise<unknown>;
}

interface FoundryTokenDocument {
  readonly id: string;
  readonly name: string;
  readonly actorLink: boolean;
  readonly actor: FoundryActor | null;
}

interface FoundryToken {
  readonly id: string;
  readonly actor: FoundryActor | null;
  readonly document: FoundryTokenDocument;
}

interface FoundryUser {
  readonly id: string;
  readonly name: string;
  readonly isGM: boolean;
  readonly character: FoundryActor | null;
}

interface FoundryActiveEffect {
  readonly parent: unknown;
}

type ChangeHook<T> = (document: T, changes: Record<string, unknown>) => void;

declare global {
  type Actor = FoundryActor;
  type Item = FoundryItem;
  type Token = FoundryToken;
  type TokenDocument = FoundryTokenDocument;
  type ActiveEffect = FoundryActiveEffect;

  const Hooks: {
    once(hook: "init" | "ready", fn: () => void): number;
    on(hook: "canvasReady", fn: () => void): number;
    on(hook: "controlToken", fn: (token: FoundryToken, controlled: boolean) => void): number;
    on(hook: "updateUser", fn: ChangeHook<FoundryUser>): number;
    on(hook: "updateActor", fn: ChangeHook<FoundryActor>): number;
    on(hook: "deleteActor", fn: (actor: FoundryActor) => void): number;
    on(hook: "updateToken", fn: ChangeHook<FoundryTokenDocument>): number;
    on(hook: "createToken" | "deleteToken", fn: (token: FoundryTokenDocument) => void): number;
    on(hook: "createItem" | "deleteItem", fn: (item: FoundryItem) => void): number;
    on(hook: "updateItem", fn: ChangeHook<FoundryItem>): number;
    on(
      hook: "createActiveEffect" | "deleteActiveEffect" | "updateActiveEffect",
      fn: (effect: FoundryActiveEffect) => void,
    ): number;
  };

  const game: {
    system: { id: string; version: string };
    user: FoundryUser;
    i18n: {
      localize(key: string): string;
      format(key: string, data?: Record<string, string>): string;
    };
    settings: {
      register(namespace: string, key: string, data: Record<string, unknown>): void;
      get(namespace: string, key: string): unknown;
      set(namespace: string, key: string, value: unknown): Promise<unknown>;
    };
    keybindings: {
      register(namespace: string, action: string, data: Record<string, unknown>): void;
    };
    modules: { get(id: string): { api?: unknown } | undefined };
  };

  const canvas:
    | {
        readonly tokens: {
          readonly controlled: readonly FoundryToken[];
          readonly placeables: readonly FoundryToken[];
        } | null;
      }
    | undefined;

  const foundry: {
    utils: {
      debounce<T extends (...args: never[]) => void>(fn: T, delay: number): T;
      flattenObject(obj: Record<string, unknown>): Record<string, unknown>;
    };
    applications: {
      api: {
        ApplicationV2: typeof FoundryApplicationV2;
        HandlebarsApplicationMixin<T extends FoundryApplicationClass>(base: T): T;
      };
    };
  };

  const CONST: { KEYBINDING_PRECEDENCE: { NORMAL: number } };
}

export {};
