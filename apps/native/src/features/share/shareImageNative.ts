import type { RefObject } from "react";
import { type View } from "react-native";
import * as Sharing from "expo-sharing";
import { captureRef } from "react-native-view-shot";

export type ShareImageNativeResult =
  | "shared"
  | "cancelled"
  | "unsupported"
  | "failed";

function isShareCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("cancel") || msg.includes("dismiss");
}

/** file:// を確実に付ける（iOS Share が画像扱いしやすい） */
function normalizeFileUri(uri: string): string {
  const trimmed = uri.trim();
  if (!trimmed) return trimmed;
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return trimmed;
  return `file://${trimmed}`;
}

/** View を PNG ファイル URI にキャプチャ */
export async function captureViewAsPngNative(
  viewRef: RefObject<View | null>
): Promise<string> {
  const node = viewRef.current;
  if (!node) {
    throw new Error("Capture target missing");
  }

  const uri = await captureRef(node, {
    format: "png",
    quality: 1,
    result: "tmpfile",
    useRenderInContext: false,
  });

  if (!uri) {
    throw new Error("Empty capture uri");
  }

  return normalizeFileUri(uri);
}

/** SNS 共有 PNG 用の不透明背景（画面のダーク面と揃える） */
export const SHARE_CAPTURE_BG = "#05080e";

/**
 * キャプチャ済み PNG だけを OS 共有へ。
 * キャプション・ディープリンク・ダウンロード URL は付けない。
 * Android の RN Share は text/plain しか送れないため、画像は expo-sharing を使う。
 */
export async function shareImageUriNative(
  imageUri: string
): Promise<ShareImageNativeResult> {
  const fileUri = normalizeFileUri(imageUri);

  try {
    const available = await Sharing.isAvailableAsync();
    if (!available) return "unsupported";
    await Sharing.shareAsync(fileUri, {
      mimeType: "image/png",
      UTI: "public.png",
    });
    return "shared";
  } catch (error) {
    if (isShareCancelled(error)) return "cancelled";
    return "failed";
  }
}

/** キャプチャ → 画像だけの共有を一括実行 */
export async function captureAndShareImageNative(
  viewRef: RefObject<View | null>
): Promise<ShareImageNativeResult> {
  try {
    const uri = await captureViewAsPngNative(viewRef);
    return await shareImageUriNative(uri);
  } catch {
    return "failed";
  }
}
