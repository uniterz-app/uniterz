/** iOS のインストール版と App Store 公開版の比較。 */

function versionParts(raw: string): number[] {
  return raw
    .trim()
    .replace(/^v/i, "")
    .split(/[^0-9]+/)
    .filter((part) => part.length > 0)
    .map((part) => Number.parseInt(part, 10))
    .filter((n) => Number.isFinite(n));
}

/** store の方が新しければ true。読めない版は false。 */
export function isStoreVersionNewer(
  installed: string | null | undefined,
  store: string | null | undefined
): boolean {
  if (!installed?.trim() || !store?.trim()) return false;
  const local = versionParts(installed);
  const remote = versionParts(store);
  if (local.length === 0 || remote.length === 0) return false;
  const len = Math.max(local.length, remote.length);
  for (let i = 0; i < len; i += 1) {
    const a = local[i] ?? 0;
    const b = remote[i] ?? 0;
    if (a === b) continue;
    return b > a;
  }
  return false;
}

type ItunesLookupResponse = {
  results?: Array<{ version?: string }>;
};

/** Apple の公開 lookup。失敗時は null（モーダルは出さない）。 */
export async function fetchIosAppStoreVersion(appId: string): Promise<string | null> {
  const id = appId.trim();
  if (!/^\d+$/.test(id)) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `https://itunes.apple.com/lookup?id=${id}`,
      { signal: controller.signal }
    );
    if (!res.ok) return null;
    const json = (await res.json()) as ItunesLookupResponse;
    const version = json.results?.[0]?.version?.trim();
    return version || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}
