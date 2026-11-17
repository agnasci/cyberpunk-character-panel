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
}

export function fakeActor(options: FixtureOptions = {}): Actor {
  const roles = (options.roles ?? [{ name: "Netrunner", rank: 4 }]).map((r, i) => ({
    id: `role${i}`,
    name: r.name,
    type: "role",
    system: { rank: r.rank },
    parent: null,
  }));
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
    system: {
      information: { alias: options.alias ?? "" },
      roleInfo: { activeRole: options.activeRole ?? roles[0]?.name ?? "", activeNetRole: "" },
      derivedStats: {
        currentWoundState: options.woundState ?? "notWounded",
        ...(options.hp === null ? {} : { hp: options.hp ?? { value: 35, max: 35 } }),
      },
    },
  };
}

export function fakeToken(name: string, actorLink: boolean): TokenDocument {
  return { id: "t1", name, actorLink, actor: null };
}
