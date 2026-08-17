/** master_badges カタログ API クライアント */

export type MasterBadgeDto = {
  id: string;
  title: string;
  description: string;
  icon?: string;
  participantCount?: number;
};

export async function fetchMasterBadgesShared(opts?: {
  apiBaseUrl?: string | null;
  signal?: AbortSignal;
}): Promise<MasterBadgeDto[]> {
  const base = (opts?.apiBaseUrl ?? "").replace(/\/$/, "");
  const res = await fetch(`${base}/api/master-badges`, {
    method: "GET",
    cache: "default",
    signal: opts?.signal,
  });
  const json = (await res.json().catch(() => null)) as {
    ok?: boolean;
    badges?: MasterBadgeDto[];
    error?: string;
  } | null;
  if (!res.ok || !json?.ok) {
    throw new Error(json?.error ?? `master_badges_http_${res.status}`);
  }
  return json.badges ?? [];
}
