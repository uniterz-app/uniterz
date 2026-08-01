/**
 * Web `lib/groupBattles/clientApi` 相当（Native）。
 */

import type {
  GroupBattlePastSquadItem,
  GroupBattlePeriod,
} from "../../../../../lib/groupBattles/types";

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
    snapshot: { status: "live" | "final" } | null;
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
  return json as { ok: true; squadId: string };
}
