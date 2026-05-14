import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";

/** Web `public/logo/uniterz-logo.glb` と同じパス（Next オリジン） */
export function getRankingsLogoGlbRemoteUrl(): string | null {
  const base = getUniterzApiBaseUrl();
  return base ? `${base}/logo/uniterz-logo.glb` : null;
}

let cachedUri: string | null = null;
let cachedBuffer: ArrayBuffer | null = null;
let inflightUri: string | null = null;
let inflightPromise: Promise<ArrayBuffer | null> | null = null;

async function fetchGlb(uri: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(uri);
    if (!res.ok) return null;
    return await res.arrayBuffer();
  } catch {
    return null;
  }
}

/**
 * ランキングを開く前に GLB を先読みする。`App` やタブ切り替えで呼ぶと初回表示が速くなる。
 */
export function prefetchRankingsLogoGlb(): void {
  const uri = getRankingsLogoGlbRemoteUrl();
  if (!uri) return;
  if (cachedUri === uri && cachedBuffer) return;
  if (inflightUri === uri && inflightPromise) return;

  inflightUri = uri;
  inflightPromise = (async () => {
    const buf = await fetchGlb(uri);
    if (buf) {
      cachedUri = uri;
      cachedBuffer = buf;
    }
    inflightUri = null;
    inflightPromise = null;
    return buf;
  })();
}

/**
 * キャッシュまたは進行中の取得を待ち、GLB の ArrayBuffer を返す。
 */
export async function loadRankingsLogoGlbBuffer(uri: string): Promise<ArrayBuffer | null> {
  if (cachedUri === uri && cachedBuffer) return cachedBuffer;
  if (inflightUri === uri && inflightPromise) {
    return inflightPromise;
  }
  const buf = await fetchGlb(uri);
  if (buf) {
    cachedUri = uri;
    cachedBuffer = buf;
  }
  return buf;
}
