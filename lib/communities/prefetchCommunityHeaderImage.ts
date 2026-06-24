/** グループヘッダー画像の先読み（一覧→詳細の表示遅延を抑える） */
const prefetched = new Set<string>();

export function prefetchCommunityHeaderImage(url: string | null | undefined): void {
  if (!url || prefetched.has(url)) return;
  prefetched.add(url);
  if (typeof window === "undefined") return;
  const img = new Image();
  img.decoding = "async";
  img.src = url;
}

export function prefetchCommunityHeaderImages(
  urls: Array<string | null | undefined>
): void {
  for (const url of urls) prefetchCommunityHeaderImage(url);
}
