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
