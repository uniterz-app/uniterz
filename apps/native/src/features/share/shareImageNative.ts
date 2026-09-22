import type { RefObject } from "react";
import { Platform, Share, type View } from "react-native";
import { captureRef } from "react-native-view-shot";
import { buildShareOutboundMessage } from "../../../../../lib/share/shareAppUrls";
import { copyTextNative } from "../leaderboards/copyTextNative";

export type ShareImageNativeResult =
  | "shared"
  | "cancelled"
  | "unsupported"
  | "failed";

export type ShareImageNativeOptions = {
  caption: string;
  /** 投稿キャプション・SNS テキストに付ける HTTPS リンク（ディープリンク） */
  linkUrl?: string;
};

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
 * キャプチャ済み PNG を OS 共有へ。
 * 文面はクリップボードにも載せ、受け取り側がメッセージを捨てたとき貼れるようにする。
 */
export async function shareImageUriNative(
  imageUri: string,
  options: ShareImageNativeOptions
): Promise<ShareImageNativeResult> {
  const message = buildShareOutboundMessage(options.caption, options.linkUrl);
  const fileUri = normalizeFileUri(imageUri);

  await copyTextNative(message);

  try {
    const payload =
      Platform.OS === "ios"
        ? { url: fileUri, message }
        : {
            message,
            url: fileUri,
            title: message.split("\n")[0]?.slice(0, 80) ?? "Uniterz",
          };

    const result = await Share.share(payload);
    if (result.action === Share.dismissedAction) return "cancelled";
    return "shared";
  } catch (error) {
    if (isShareCancelled(error)) return "cancelled";
    return "failed";
  }
}

/** キャプチャ → リンク付き共有を一括実行 */
export async function captureAndShareImageNative(
  viewRef: RefObject<View | null>,
  options: ShareImageNativeOptions
): Promise<ShareImageNativeResult> {
  try {
    const uri = await captureViewAsPngNative(viewRef);
    return await shareImageUriNative(uri, options);
  } catch {
    return "failed";
  }
}
