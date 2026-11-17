declare global {
  const Hooks: {
    once(hook: "init" | "ready", fn: () => void): number;
  };

  const game: {
    system: { id: string; version: string };
    i18n: {
      localize(key: string): string;
      format(key: string, data?: Record<string, string>): string;
    };
  };
}

export {};
