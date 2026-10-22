/**
 * アバター写真をアップロード時に 384px JPEG へ縮小して users.photoURL を差し替える。
 * 端末は原寸（最大数 MB）を上げてくるので、一覧の小さいアバターでも原寸を展開させないため。
 * 元ファイルは残し（users.photoOriginalURL）、縮小版は `avatars/{uid}/thumbs/` に置く。
 */
import { randomUUID } from "node:crypto";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import { onObjectFinalized } from "firebase-functions/v2/storage";
import sharp from "sharp";
import { adminApp, db } from "../firebase";

const AVATAR_BUCKET = "matchpik-7dbb1.firebasestorage.app";
/** プロフィールの大きいアバターでも粗くならない辺長 */
const AVATAR_MAX_PX = 384;
/** これ以下ならそのまま（縮める意味がない） */
const AVATAR_SKIP_BYTES = 40_000;
/** クライアントが users.photoURL を書くまで待つ */
const PHOTO_URL_WAIT_TRIES = 12;
const PHOTO_URL_WAIT_MS = 5_000;

const ORIGINAL_PATH = /^avatars\/([^/]+)\/([^/]+)$/;
/** 2026-10-09 修正前の Native ビルドは画像を base64 文字列のまま上げてくる */
const BASE64_IMAGE_HEAD = /^(iVBOR|\/9j\/|UklGR|R0lGO|AAAA)/;

function decodeIfBase64Text(buf: Buffer): Buffer {
  if (!BASE64_IMAGE_HEAD.test(buf.subarray(0, 8).toString("latin1"))) return buf;
  return Buffer.from(buf.toString("latin1").trim(), "base64");
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function downloadUrl(bucket: string, name: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(
    name
  )}?alt=media&token=${token}`;
}

export const resizeAvatarOnUpload = onObjectFinalized(
  {
    bucket: AVATAR_BUCKET,
    region: "asia-northeast1",
    memory: "512MiB",
    timeoutSeconds: 120,
  },
  async (event) => {
    const name = event.data.name ?? "";
    const match = ORIGINAL_PATH.exec(name);
    if (!match) return;
    const [, uid, file] = match;
    if (!(event.data.contentType ?? "").startsWith("image/")) return;
    if (Number(event.data.size ?? 0) <= AVATAR_SKIP_BYTES) return;

    const bucket = getStorage(adminApp).bucket(event.data.bucket);
    const [original] = await bucket.file(name).download();

    let resized: Buffer;
    try {
      resized = await sharp(decodeIfBase64Text(original))
        .rotate()
        .resize(AVATAR_MAX_PX, AVATAR_MAX_PX, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer();
    } catch (err) {
      /* HEIC 等 sharp が読めない形式は原寸のまま */
      console.warn("[resizeAvatarOnUpload] decode failed", name, err);
      return;
    }
    if (resized.length >= original.length) return;

    const thumbName = `avatars/${uid}/thumbs/${file.replace(/\.[^.]+$/, "")}_${AVATAR_MAX_PX}.jpg`;
    const token = randomUUID();
    await bucket.file(thumbName).save(resized, {
      contentType: "image/jpeg",
      metadata: {
        cacheControl: "public, max-age=31536000",
        metadata: { firebaseStorageDownloadTokens: token, sourceObject: name },
      },
    });
    const thumbUrl = downloadUrl(bucket.name, thumbName, token);

    /** photoURL は端末がアップロード後に書くので、この写真を指すまで待ってから差し替える */
    const marker = encodeURIComponent(name);
    const userRef = db.doc(`users/${uid}`);
    for (let i = 0; i < PHOTO_URL_WAIT_TRIES; i++) {
      const replaced = await db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const current = snap.get("photoURL");
        if (typeof current !== "string" || !current.includes(marker)) return false;
        tx.update(userRef, { photoURL: thumbUrl, photoOriginalURL: current });
        return true;
      });
      if (replaced) {
        await getAuth(adminApp)
          .updateUser(uid, { photoURL: thumbUrl })
          .catch(() => undefined);
        console.log("[resizeAvatarOnUpload] replaced", {
          uid,
          from: original.length,
          to: resized.length,
        });
        return;
      }
      await sleep(PHOTO_URL_WAIT_MS);
    }
    console.log("[resizeAvatarOnUpload] photoURL not pointing to upload; thumb kept", {
      uid,
      name,
    });
  }
);
