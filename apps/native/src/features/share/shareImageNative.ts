import type { RefObject } from "react";
import { Platform, Share, type View } from "react-native";
import { captureRef } from "react-native-view-shot";

export type ShareImageNativeResult =
  | "shared"
  | "cancelled"
  | "unsupported"
  | "failed";

export type ShareImageNativeOptions = {
  caption: string;
  /** 投稿キャプション・SNS テキストに付ける HTTPS リンク */
  linkUrl?: string;
};

function isShareCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const msg = error.message.toLowerCase();
  return msg.includes("cancel") || msg.includes("dismiss");
}

function buildShareMessage({ caption, linkUrl }: ShareImageNativeOptions): string {
  if (!linkUrl) return caption;
  if (caption.includes(linkUrl)) return caption;
  return `${caption}\n${linkUrl}`;
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
  });

  if (!uri) {
    throw new Error("Empty capture uri");
  }

  return uri;
}

/** キャプチャ済み PNG + リンク付きテキストを OS 共有シートへ */
export async function shareImageUriNative(
  imageUri: string,
  options: ShareImageNativeOptions
): Promise<ShareImageNativeResult> {
  const message = buildShareMessage(options);

  try {
    const payload =
      Platform.OS === "ios"
        ? { message, url: imageUri }
        : {
            message,
            url: imageUri,
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
