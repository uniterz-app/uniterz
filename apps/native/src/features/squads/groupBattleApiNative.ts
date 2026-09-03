/**
 * Web `lib/groupBattles/clientApi` 相当（Native）。
 */

import type { GroupBattleMyPayout } from "../../../../../lib/groupBattles/myPayoutTypes";
import type { GroupBattleEntryProfile } from "../../../../../lib/groupBattles/entryProfileTypes";
import type {
  GroupBattleJoinRequestApiItem,
  GroupBattlePastSquadItem,
  GroupBattlePeriod,
} from "../../../../../lib/groupBattles/types";
import {
  groupBattleBootstrapCacheKey,
  invalidateGroupBattleBootstrapCache,
  loadGroupBattleBootstrapCache,
} from "../../../../../lib/groupBattles/bootstrapFetchCache";

export { invalidateGroupBattleBootstrapCache };

const API_BASE =
  process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? null;

export type GroupBattleApiOptions = {
  idToken?: string | null;
};

function withAuth(
  headers: HeadersInit,
  opts?: GroupBattleApiOptions
): HeadersInit {
  if (!opts?.idToken) return headers;
  return {
    ...headers,
    Authorization: `Bearer ${opts.idToken}`,
  };
}

export async function fetchCurrentGroupBattleNative(
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) return null;
  const res = await fetch(`${API_BASE}/api/group-battles/current`, {
    headers: withAuth({ "Content-Type": "application/json" }, opts),
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.ok) return null;
  return json as {
    ok: true;
    battle: {
      id: string;
      name?: string;
      phase: string;
      weeklyLabels: string[];
      monthlyRange: { label: string };
      recruitEndAtMs?: number;
      battleStartAtMs?: number;
      battleEndAtMs?: number;
    } | null;
    membership: { squadId: string; role: string } | null;
    mySquad: {
      id: string;
      name: string;
      memberUids: string[];
      memberCount: number;
      status: string;
      ownerUid?: string;
      inviteCode?: string | null;
      members?: GroupBattleEntryProfile[];
    } | null;
  };
}

export async function fetchGroupBattleBootstrapNative(
  opts?: GroupBattleApiOptions & {
    period?: GroupBattlePeriod;
    label?: string | null;
    weekIndex?: number | null;
    battleId?: string | null;
  }
) {
  if (!API_BASE) return null;
  const cacheKey = groupBattleBootstrapCacheKey({
    battleId: opts?.battleId,
    period: opts?.period,
    label: opts?.label,
    weekIndex: opts?.weekIndex,
  });

  return loadGroupBattleBootstrapCache(cacheKey, async () => {
    const q = new URLSearchParams();
    if (opts?.period) q.set("period", opts.period);
    if (opts?.label) q.set("label", opts.label);
    if (opts?.weekIndex) q.set("week", String(opts.weekIndex));
    if (opts?.battleId) q.set("battleId", opts.battleId);
    const res = await fetch(
      `${API_BASE}/api/group-battles/bootstrap${q.toString() ? `?${q}` : ""}`,
      {
        headers: withAuth({ "Content-Type": "application/json" }, opts),
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.ok) return null;
    return json as Awaited<ReturnType<typeof fetchCurrentGroupBattleNative>> & {
      rankings: Awaited<ReturnType<typeof fetchGroupBattleRankingsNative>>;
      openSquads: Array<{
        id: string;
        name: string;
        memberCount: number;
        openSlots: number;
        status: string;
        memberUids: string[];
      }>;
      pastSquads: GroupBattlePastSquadItem[];
      invites: Array<{
        id: string;
        squadId: string;
        squadName: string;
        fromUid: string;
        fromDisplayName: string;
        openSlots: number;
        members: Array<{
          uid: string;
          displayName: string;
          handle: string | null;
          plan?: "free" | "pro";
          photoURL?: string | null;
        }>;
      }>;
      joinRequests: {
        incoming: GroupBattleJoinRequestApiItem[];
        outgoing: GroupBattleJoinRequestApiItem[];
      };
    };
  });
}

export async function fetchGroupBattleRankingsNative(
  battleId: string,
  period: GroupBattlePeriod,
  label?: string,
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) return null;
  const q = new URLSearchParams({ period });
  if (label) q.set("label", label);
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/rankings?${q}`,
    {
      headers: withAuth({ "Content-Type": "application/json" }, opts),
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.ok) return null;
  return json as {
    ok: true;
    battleId: string;
    period: GroupBattlePeriod;
    label: string;
    snapshot: {
      status: "live" | "final";
      builtAtMs?: number;
      rows: Array<{
        rank: number;
        squadId: string;
        name: string;
        groupScore: number;
        memberCount: number;
        memberScores: Array<{
          uid: string;
          points: number;
          displayName?: string;
          handle?: string | null;
          photoURL?: string | null;
          plan?: "free" | "pro";
        }>;
        prevRank: number | null;
        scoreGapToAbove: number | null;
      }>;
    } | null;
  };
}

export async function fetchPastGroupBattleSquadsNative(
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) return null;
  const res = await fetch(`${API_BASE}/api/group-battles/me/past-squads`, {
    headers: withAuth({ "Content-Type": "application/json" }, opts),
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.ok) return null;
  return json as {
    ok: true;
    pastSquads: GroupBattlePastSquadItem[];
    limit: number;
  };
}

export async function reformGroupBattleSquadNative(
  battleId: string,
  body: {
    sourceBattleId: string;
    sourceSquadId: string;
    name?: string;
  },
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) {
    return { ok: false as const, error: "no_api_base", status: 0 };
  }
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/squads/reform`,
    {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }, opts),
      body: JSON.stringify(body),
    }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    return {
      ok: false as const,
      error: String(json?.error ?? "failed"),
      status: res.status,
    };
  }
  return json as {
    ok: true;
    squadId: string;
    inviteCode: string;
    invited: string[];
    skipped: Array<{ uid: string; reason: string }>;
  };
}

export async function inviteToGroupBattleSquadNative(
  battleId: string,
  squadId: string,
  body: {
    targetUid: string;
    sourceBattleId?: string;
    sourceSquadId?: string;
  },
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) {
    return { ok: false as const, error: "no_api_base", status: 0 };
  }
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/squads/${encodeURIComponent(squadId)}/invite`,
    {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }, opts),
      body: JSON.stringify(body),
    }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    return {
      ok: false as const,
      error: String(json?.error ?? "failed"),
      status: res.status,
    };
  }
  return json as { ok: true; inviteId: string };
}

export async function fetchGroupBattleIncomingInvitesNative(
  battleId: string,
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) return null;
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/invites`,
    {
      headers: withAuth({ "Content-Type": "application/json" }, opts),
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.ok) return null;
  return json as {
    ok: true;
    invites: Array<{
      id: string;
      squadId: string;
      squadName: string;
      fromUid: string;
      fromDisplayName: string;
      status: string;
      source: string;
      createdAtMs: number;
      openSlots: number;
      members: Array<{
        uid: string;
        displayName: string;
        handle: string | null;
        plan?: "free" | "pro";
        photoURL?: string | null;
      }>;
    }>;
  };
}

export async function acceptGroupBattleInviteNative(
  battleId: string,
  inviteId: string,
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) {
    return { ok: false as const, error: "no_api_base", status: 0 };
  }
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/invites/${encodeURIComponent(inviteId)}/accept`,
    {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }, opts),
    }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    return {
      ok: false as const,
      error: String(json?.error ?? "failed"),
      status: res.status,
    };
  }
  invalidateGroupBattleBootstrapCache();
  return json as { ok: true; decision: "accepted" };
}

export async function declineGroupBattleInviteNative(
  battleId: string,
  inviteId: string,
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) {
    return { ok: false as const, error: "no_api_base", status: 0 };
  }
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/invites/${encodeURIComponent(inviteId)}/decline`,
    {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }, opts),
    }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    return {
      ok: false as const,
      error: String(json?.error ?? "failed"),
      status: res.status,
    };
  }
  return json as { ok: true; decision: "declined" };
}

export async function joinGroupBattleByInviteCodeNative(
  battleId: string,
  inviteCode: string,
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) {
    return { ok: false as const, error: "no_api_base", status: 0 };
  }
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/join-by-code`,
    {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }, opts),
      body: JSON.stringify({ inviteCode }),
    }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    return {
      ok: false as const,
      error: String(json?.error ?? "failed"),
      status: res.status,
    };
  }
  invalidateGroupBattleBootstrapCache();
  return json as {
    ok: true;
    squadId: string;
    name: string;
    memberUids: string[];
    memberCount: number;
    status: string;
  };
}

export async function fetchGroupBattleOpenSquadsNative(
  battleId: string,
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) return null;
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/open-squads`,
    {
      headers: withAuth({ "Content-Type": "application/json" }, opts),
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.ok) return null;
  return json as {
    ok: true;
    squads: Array<{
      id: string;
      name: string;
      memberCount: number;
      openSlots: number;
      status: string;
      memberUids: string[];
    }>;
  };
}

export async function createGroupBattleSquadNative(
  battleId: string,
  body: { name: string; acceptRules: boolean },
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) {
    return { ok: false as const, error: "no_api_base", status: 0 };
  }
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/squads`,
    {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }, opts),
      body: JSON.stringify(body),
    }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    return {
      ok: false as const,
      error: String(json?.error ?? "failed"),
      status: res.status,
    };
  }
  invalidateGroupBattleBootstrapCache();
  return json as { ok: true; squadId: string; inviteCode: string };
}

export async function applyToGroupBattleSquadNative(
  battleId: string,
  squadId: string,
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) {
    return { ok: false as const, error: "no_api_base", status: 0 };
  }
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/join-requests`,
    {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }, opts),
      body: JSON.stringify({ squadId }),
    }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    return {
      ok: false as const,
      error: String(json?.error ?? "failed"),
      status: res.status,
    };
  }
  invalidateGroupBattleBootstrapCache();
  return json as { ok: true; requestId: string };
}

export async function fetchGroupBattleJoinRequestsNative(
  battleId: string,
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) return null;
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/join-requests`,
    {
      headers: withAuth({ "Content-Type": "application/json" }, opts),
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.ok) return null;
  return json as {
    ok: true;
    incoming: GroupBattleJoinRequestApiItem[];
    outgoing: GroupBattleJoinRequestApiItem[];
  };
}

export async function resolveGroupBattleJoinRequestNative(
  battleId: string,
  requestId: string,
  decision: "approve" | "reject",
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) {
    return { ok: false as const, error: "no_api_base", status: 0 };
  }
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/join-requests/${encodeURIComponent(requestId)}/${decision}`,
    {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }, opts),
    }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    return {
      ok: false as const,
      error: String(json?.error ?? "failed"),
      status: res.status,
    };
  }
  invalidateGroupBattleBootstrapCache();
  return json as { ok: true };
}

export async function fetchGroupBattleMyPayoutNative(
  battleId: string,
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) return null;
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/my-payout`,
    {
      headers: withAuth({ "Content-Type": "application/json" }, opts),
    }
  );
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.ok) return null;
  return json as {
    ok: true;
    payout: GroupBattleMyPayout;
  };
}

export async function renameGroupBattleSquadNative(
  battleId: string,
  squadId: string,
  name: string,
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) {
    return { ok: false as const, error: "no_api_base", status: 0 };
  }
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/squads/${encodeURIComponent(squadId)}`,
    {
      method: "PATCH",
      headers: withAuth({ "Content-Type": "application/json" }, opts),
      body: JSON.stringify({ name }),
    }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    return {
      ok: false as const,
      error: String(json?.error ?? "failed"),
      status: res.status,
    };
  }
  return json as { ok: true; squadId: string; name: string };
}

export async function cancelGroupBattleJoinRequestNative(
  battleId: string,
  requestId: string,
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) {
    return { ok: false as const, error: "no_api_base", status: 0 };
  }
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/join-requests/${encodeURIComponent(requestId)}/cancel`,
    {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }, opts),
    }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    return {
      ok: false as const,
      error: String(json?.error ?? "failed"),
      status: res.status,
    };
  }
  invalidateGroupBattleBootstrapCache();
  return json as { ok: true };
}

export async function leaveGroupBattleSquadNative(
  battleId: string,
  squadId: string,
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) {
    return { ok: false as const, error: "no_api_base", status: 0 };
  }
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/squads/${encodeURIComponent(squadId)}/leave`,
    {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }, opts),
    }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    return {
      ok: false as const,
      error: String(json?.error ?? "failed"),
      status: res.status,
    };
  }
  invalidateGroupBattleBootstrapCache();
  return json as { ok: true };
}

export async function dissolveGroupBattleSquadNative(
  battleId: string,
  squadId: string,
  opts?: GroupBattleApiOptions
) {
  if (!API_BASE) {
    return { ok: false as const, error: "no_api_base", status: 0 };
  }
  const res = await fetch(
    `${API_BASE}/api/group-battles/${encodeURIComponent(battleId)}/squads/${encodeURIComponent(squadId)}/dissolve`,
    {
      method: "POST",
      headers: withAuth({ "Content-Type": "application/json" }, opts),
    }
  );
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.ok) {
    return {
      ok: false as const,
      error: String(json?.error ?? "failed"),
      status: res.status,
    };
  }
  invalidateGroupBattleBootstrapCache();
  return json as { ok: true };
}
