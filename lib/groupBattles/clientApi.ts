/**
 * グループバトル Web API クライアント。
 * 未認証・大会なしのときは null を返し、UI はモックへフォールバック可能。
 */

import type {
  GroupBattlePastSquadItem,
  GroupBattlePeriod,
} from "./types";

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
  return json as {
    ok: true;
    battle: {
      id: string;
      phase: string;
      weeklyLabels: string[];
      monthlyRange: { label: string };
    } | null;
    membership: { squadId: string; role: string } | null;
    mySquad: {
      id: string;
      name: string;
      memberUids: string[];
      memberCount: number;
      status: string;
    } | null;
  };
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
      rows: Array<{
        rank: number;
        squadId: string;
        name: string;
        groupScore: number;
        memberCount: number;
        memberScores: Array<{ uid: string; points: number }>;
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
  return json as { ok: true; squadId: string };
}
