/**
 * 商品交換申請用の商品スクショを Storage に上げる。
 * パス: redemption_products/{uid}/{fileId}
 */
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export const REDEMPTION_PRODUCT_IMAGE_MAX_BYTES = 8 * 1024 * 1024;

export function redemptionProductImageStoragePath(
  uid: string,
  fileId: string
): string {
  return `redemption_products/${uid}/${fileId}`;
}

export async function uploadRedemptionProductImage(opts: {
  storage: import("firebase/storage").FirebaseStorage;
  uid: string;
  data: Blob | Uint8Array | ArrayBuffer;
  contentType: string;
  fileId?: string;
}): Promise<string> {
  const fileId =
    opts.fileId ??
    `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const contentType = opts.contentType.startsWith("image/")
    ? opts.contentType
    : "image/jpeg";
  const fileRef = ref(
    opts.storage,
    redemptionProductImageStoragePath(opts.uid, fileId)
  );
  const body =
    opts.data instanceof ArrayBuffer
      ? new Uint8Array(opts.data)
      : opts.data;
  await uploadBytes(fileRef, body, { contentType });
  return getDownloadURL(fileRef);
}
