/**
 * 端末ローカル画像（file:// / ph:// 等）を Firebase Storage へアップロードする。
 * RN の firebase/storage に Uint8Array を渡すと base64 文字列のまま保存されて画像として壊れるため、
 * XHR で Blob を取得して uploadBytes に渡す。
 */
import { uploadBytes, type StorageReference } from "firebase/storage";

function readLocalBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error("image read failed"));
    xhr.responseType = "blob";
    xhr.open("GET", uri, true);
    xhr.send(null);
  });
}

/** サーバーの `resizeAvatarOnUpload` と同じ辺長。HEIC はサーバーで縮められないので端末で JPEG にする */
const AVATAR_MAX_PX = 384;

/**
 * アバターを 384px JPEG に縮めてからアップロードする。
 * expo-image-manipulator が無い旧バイナリ（OTA 適用時）は原寸のまま上げ、サーバー側の縮小に任せる。
 */
export async function uploadAvatarImageNative(
  fileRef: StorageReference,
  asset: { uri: string; width?: number; height?: number; mimeType?: string | null }
): Promise<number> {
  let uri = asset.uri;
  let contentType = asset.mimeType ?? undefined;
  try {
    const { ImageManipulator, SaveFormat } = await import("expo-image-manipulator");
    const w = asset.width ?? 0;
    const h = asset.height ?? 0;
    const ctx = ImageManipulator.manipulate(asset.uri);
    if (w <= 0 || h <= 0 || Math.max(w, h) > AVATAR_MAX_PX) {
      ctx.resize(h > w ? { height: AVATAR_MAX_PX } : { width: AVATAR_MAX_PX });
    }
    const image = await ctx.renderAsync();
    const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
    uri = saved.uri;
    contentType = "image/jpeg";
  } catch {
    /* 縮小できなければ原寸 */
  }
  return uploadLocalImageNative(fileRef, uri, { contentType });
}

/** アップロードしたバイト数を返す */
export async function uploadLocalImageNative(
  fileRef: StorageReference,
  uri: string,
  opts?: { contentType?: string; maxBytes?: number; tooLargeMessage?: string }
): Promise<number> {
  const blob = await readLocalBlob(uri);
  try {
    if (!blob || blob.size === 0) throw new Error("empty image");
    if (opts?.maxBytes != null && blob.size > opts.maxBytes) {
      throw new Error(opts.tooLargeMessage ?? "image too large");
    }
    const contentType =
      opts?.contentType && opts.contentType.startsWith("image/")
        ? opts.contentType
        : blob.type && blob.type.startsWith("image/")
          ? blob.type
          : "image/jpeg";
    await uploadBytes(fileRef, blob, { contentType });
    return blob.size;
  } finally {
    (blob as Blob & { close?: () => void }).close?.();
  }
}
