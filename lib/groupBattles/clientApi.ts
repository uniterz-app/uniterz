/**
 * グループバトル Web API クライアント。
 * 未認証・大会なしのときは null を返し、UI はモックへフォールバック可能。
 */

import type { GroupBattleMyPayout } from "./myPayoutTypes";
import type { GroupBattleEntryProfile } from "./entryProfileTypes";
import type {
  GroupBattleJoinRequestApiItem,
  GroupBattlePastSquadItem,
  GroupBattlePeriod,
} from "./types";
import {
  groupBattleBootstrapCacheKey,
  invalidateGroupBattleBootstrapCache,
  loadGroupBattleBootstrapCache,
} from "./bootstrapFetchCache";

export { invalidateGroupBattleBootstrapCache };

async function authHeaders(): Promise<HeadersInit> {
  // クライアント側で Firebase Auth から取得する想定。呼び出し側で上書き可。
  return { "Content-Type": "application/json" };
}

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

export async function fetchCurrentGroupBattle(opts?: GroupBattleApiOptions) {
  const res = await fetch("/api/group-battles/current", {
    headers: withAuth(await authHeaders(), opts),
    cache: "no-store",
  });
  if (!res.ok) return null;
  const json = await res.json();
  if (!json?.ok) return null;
  return json as CurrentGroupBattlePayload;
}

type CurrentGroupBattlePayload = {
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

type GroupBattleRankingsPayload = {
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

export async function fetchGroupBattleBootstrap(
  opts?: GroupBattleApiOptions & {
    period?: GroupBattlePeriod;
    label?: string | null;
    weekIndex?: number | null;
    battleId?: string | null;
  }
) {
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
      `/api/group-battles/bootstrap${q.toString() ? `?${q}` : ""}`,
      {
        headers: withAuth(await authHeaders(), opts),
        cache: "no-store",
      }
    );
    if (!res.ok) return null;
    const json = await res.json();
    if (!json?.ok) return null;
    return json as CurrentGroupBattlePayload & {
      rankings: Omit<GroupBattleRankingsPayload, "ok"> | null;
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
      joinRequests: {
        incoming: GroupBattleJoinRequestApiItem[];
        outgoing: GroupBattleJoinRequestApiItem[];
      };
    };
  });
}

export async function fetchGroupBattleRankings(
  battleId: string,
  period: GroupBattlePeriod,
  label?: string,
  opts?: GroupBattleApiOptions
) {
  const q = new URLSearchParams({ period });
  if (label) q.set("label", label);
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/rankings?${q}`,
    {
      headers: withAuth(await authHeaders(), opts),
      cache: "no-store",
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

export async function fetchPastGroupBattleSquads(opts?: GroupBattleApiOptions) {
  const res = await fetch("/api/group-battles/me/past-squads", {
    headers: withAuth(await authHeaders(), opts),
    cache: "no-store",
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

export async function reformGroupBattleSquad(
  battleId: string,
  body: {
    sourceBattleId: string;
    sourceSquadId: string;
    name?: string;
  },
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/squads/reform`,
    {
      method: "POST",
      headers: withAuth(await authHeaders(), opts),
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

export async function inviteToGroupBattleSquad(
  battleId: string,
  squadId: string,
  body: {
    targetUid: string;
    sourceBattleId?: string;
    sourceSquadId?: string;
  },
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/squads/${encodeURIComponent(squadId)}/invite`,
    {
      method: "POST",
      headers: withAuth(await authHeaders(), opts),
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

export async function fetchGroupBattleIncomingInvites(
  battleId: string,
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/invites`,
    {
      headers: withAuth(await authHeaders(), opts),
      cache: "no-store",
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

export async function acceptGroupBattleInvite(
  battleId: string,
  inviteId: string,
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/invites/${encodeURIComponent(inviteId)}/accept`,
    {
      method: "POST",
      headers: withAuth(await authHeaders(), opts),
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

export async function declineGroupBattleInvite(
  battleId: string,
  inviteId: string,
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/invites/${encodeURIComponent(inviteId)}/decline`,
    {
      method: "POST",
      headers: withAuth(await authHeaders(), opts),
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

export async function joinGroupBattleByInviteCode(
  battleId: string,
  inviteCode: string,
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/join-by-code`,
    {
      method: "POST",
      headers: withAuth(await authHeaders(), opts),
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

export async function fetchGroupBattleOpenSquads(
  battleId: string,
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/open-squads`,
    {
      headers: withAuth(await authHeaders(), opts),
      cache: "no-store",
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

export async function createGroupBattleSquad(
  battleId: string,
  body: { name: string; acceptRules: boolean },
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/squads`,
    {
      method: "POST",
      headers: withAuth(await authHeaders(), opts),
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

export async function applyToGroupBattleSquad(
  battleId: string,
  squadId: string,
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/join-requests`,
    {
      method: "POST",
      headers: withAuth(await authHeaders(), opts),
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

export async function fetchGroupBattleJoinRequests(
  battleId: string,
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/join-requests`,
    {
      headers: withAuth(await authHeaders(), opts),
      cache: "no-store",
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

export async function resolveGroupBattleJoinRequest(
  battleId: string,
  requestId: string,
  decision: "approve" | "reject",
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/join-requests/${encodeURIComponent(requestId)}/${decision}`,
    {
      method: "POST",
      headers: withAuth(await authHeaders(), opts),
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

export async function fetchGroupBattleMyPayout(
  battleId: string,
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/my-payout`,
    {
      headers: withAuth(await authHeaders(), opts),
      cache: "no-store",
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

export async function renameGroupBattleSquad(
  battleId: string,
  squadId: string,
  name: string,
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/squads/${encodeURIComponent(squadId)}`,
    {
      method: "PATCH",
      headers: withAuth(await authHeaders(), opts),
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

export async function cancelGroupBattleJoinRequest(
  battleId: string,
  requestId: string,
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/join-requests/${encodeURIComponent(requestId)}/cancel`,
    {
      method: "POST",
      headers: withAuth(await authHeaders(), opts),
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

export async function leaveGroupBattleSquad(
  battleId: string,
  squadId: string,
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/squads/${encodeURIComponent(squadId)}/leave`,
    {
      method: "POST",
      headers: withAuth(await authHeaders(), opts),
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

export async function dissolveGroupBattleSquad(
  battleId: string,
  squadId: string,
  opts?: GroupBattleApiOptions
) {
  const res = await fetch(
    `/api/group-battles/${encodeURIComponent(battleId)}/squads/${encodeURIComponent(squadId)}/dissolve`,
    {
      method: "POST",
      headers: withAuth(await authHeaders(), opts),
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
