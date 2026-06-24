import { Image } from "react-native";

/** グループヘッダー画像の先読み（一覧→詳細の表示遅延を抑える） */
const prefetched = new Set<string>();

export function prefetchCommunityHeaderImageNative(url: string | null | undefined): void {
  if (!url || prefetched.has(url)) return;
  prefetched.add(url);
  void Image.prefetch(url);
}

export function prefetchCommunityHeaderImagesNative(
  urls: Array<string | null | undefined>
): void {
  for (const url of urls) prefetchCommunityHeaderImageNative(url);
}
