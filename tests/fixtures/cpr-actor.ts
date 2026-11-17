interface FixtureOptions {
  type?: string;
  name?: string;
  hp?: { value: number; max: number } | null;
  woundState?: string;
  alias?: string;
  activeRole?: string;
  roles?: Array<{ name: string; rank: number }>;
  statuses?: string[];
  isOwner?: boolean;
  humanity?: { value: number; max: number };
  luck?: { value: number; max: number };
  deathSave?: { value: number; penalty: number; basePenalty: number } | null;
}

export function fakeActor(options: FixtureOptions = {}): Actor {
  const roles = (options.roles ?? [{ name: "Netrunner", rank: 4 }]).map((r, i) => ({
    id: `role${i}`,
    name: r.name,
    type: "role",
    system: { rank: r.rank },
    parent: null,
  }));
  const deathSave =
    options.deathSave === null
      ? {}
      : { deathSave: options.deathSave ?? { value: 0, penalty: 0, basePenalty: 0 } };
  return {
    id: "a1",
    uuid: "Actor.a1",
    name: options.name ?? "Seorin Kwon",
    img: "icons/portrait.webp",
    type: options.type ?? "character",
    isOwner: options.isOwner ?? true,
    isToken: false,
    statuses: new Set(options.statuses ?? []),
    itemTypes: { role: roles },
    sheet: null,
    update: () => Promise.resolve(undefined),
    system: {
      information: { alias: options.alias ?? "" },
      roleInfo: { activeRole: options.activeRole ?? roles[0]?.name ?? "", activeNetRole: "" },
      stats: { luck: options.luck ?? { value: 4, max: 6 } },
      derivedStats: {
        currentWoundState: options.woundState ?? "notWounded",
        humanity: options.humanity ?? { value: 32, max: 40 },
        ...deathSave,
        ...(options.hp === null ? {} : { hp: options.hp ?? { value: 35, max: 35 } }),
      },
    },
  };
}

export function fakeToken(name: string, actorLink: boolean): TokenDocument {
  return { id: "t1", name, actorLink, actor: null };
}
