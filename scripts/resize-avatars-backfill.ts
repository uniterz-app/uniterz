/**
 * 既存ユーザーのアバター原寸を 384px JPEG に縮め、users.photoURL / Auth を差し替える。
 * 新規アップロードは Functions `resizeAvatarOnUpload` が同じことをする。
 * 最後にランキングスナップショット（行に photoURL を持つ）の URL も置き換える。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/resize-avatars-backfill.ts --dry-run
 *   npx tsx --tsconfig tsconfig.json scripts/resize-avatars-backfill.ts
 */
import "./_loadAdminEnv";
import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { getApps } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getStorage } from "firebase-admin/storage";
import sharp from "sharp";
import { getAdminDb } from "../lib/firebaseAdmin";

const execFileAsync = promisify(execFile);
const BUCKET = "matchpik-7dbb1.firebasestorage.app";
const AVATAR_MAX_PX = 384;
const AVATAR_SKIP_BYTES = 40_000;
const CONCURRENCY = 8;
const ORIGINAL_PATH = /^avatars\/([^/]+)\/([^/]+)$/;
/** 旧 Native ビルドが base64 文字列のまま上げた画像 */
const BASE64_IMAGE_HEAD = /^(iVBOR|\/9j\/|UklGR|R0lGO|AAAA)/;

function decodeIfBase64Text(buf: Buffer): Buffer {
  if (!BASE64_IMAGE_HEAD.test(buf.subarray(0, 8).toString("latin1"))) return buf;
  return Buffer.from(buf.toString("latin1").trim(), "base64");
}

function toJpeg(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .rotate()
    .resize(AVATAR_MAX_PX, AVATAR_MAX_PX, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();
}

/** prebuilt sharp は HEIC を読めないので、macOS の sips で JPEG にしてから縮める */
async function resizeAvatar(input: Buffer): Promise<Buffer> {
  try {
    return await toJpeg(input);
  } catch (e) {
    if (process.platform !== "darwin") throw e;
    const dir = await mkdtemp(join(tmpdir(), "avatar-"));
    try {
      const src = join(dir, "in.heic");
      const out = join(dir, "out.jpg");
      await writeFile(src, input);
      await execFileAsync("sips", ["-s", "format", "jpeg", src, "--out", out]);
      return await toJpeg(await readFile(out));
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }
}

const SNAPSHOT_COLLECTIONS = [
  "period_ranking_snapshots",
  "cumulative_ranking_snapshots",
];

function objectNameFromUrl(url: string): string | null {
  const m = /^https:\/\/firebasestorage\.googleapis\.com\/v0\/b\/([^/]+)\/o\/([^?]+)/.exec(url);
  if (!m || m[1] !== BUCKET) return null;
  try {
    return decodeURIComponent(m[2]);
  } catch {
    return null;
  }
}

function downloadUrl(name: string, token: string): string {
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(
    name
  )}?alt=media&token=${token}`;
}

function replaceUrls(value: unknown, map: Map<string, string>): { value: unknown; changed: boolean } {
  if (typeof value === "string") {
    const next = map.get(value);
    return next ? { value: next, changed: true } : { value, changed: false };
  }
  if (Array.isArray(value)) {
    let changed = false;
    const out = value.map((v) => {
      const r = replaceUrls(v, map);
      changed ||= r.changed;
      return r.value;
    });
    return changed ? { value: out, changed } : { value, changed: false };
  }
  if (value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    let changed = false;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const r = replaceUrls(v, map);
      changed ||= r.changed;
      out[k] = r.value;
    }
    return changed ? { value: out, changed } : { value, changed: false };
  }
  return { value, changed: false };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const db = getAdminDb();
  const bucket = getStorage(getApps()[0]).bucket(BUCKET);
  const auth = getAuth(getApps()[0]);

  const users = await db.collection("users").select("photoURL").get();
  const targets: { uid: string; url: string; name: string }[] = [];
  for (const d of users.docs) {
    const url = d.get("photoURL");
    if (typeof url !== "string") continue;
    const name = objectNameFromUrl(url);
    if (!name || !ORIGINAL_PATH.test(name)) continue;
    targets.push({ uid: d.id, url, name });
  }
  console.log(`users ${users.size} / storage avatars ${targets.length}`);

  const replaced = new Map<string, string>();
  let before = 0;
  let after = 0;
  let skipped = 0;
  let failed = 0;
  let cursor = 0;

  async function worker() {
    while (cursor < targets.length) {
      const t = targets[cursor++];
      try {
        const file = bucket.file(t.name);
        const [exists] = await file.exists();
        if (!exists) {
          skipped++;
          continue;
        }
        const [buf] = await file.download();
        if (buf.length <= AVATAR_SKIP_BYTES) {
          skipped++;
          continue;
        }
        let resized: Buffer;
        try {
          resized = await resizeAvatar(decodeIfBase64Text(buf));
        } catch {
          console.warn(`decode failed ${t.uid} ${t.name}`);
          failed++;
          continue;
        }
        if (resized.length >= buf.length) {
          skipped++;
          continue;
        }
        before += buf.length;
        after += resized.length;
        if (dryRun) continue;

        const base = t.name.split("/")[2].replace(/\.[^.]+$/, "");
        const thumbName = `avatars/${t.uid}/thumbs/${base}_${AVATAR_MAX_PX}.jpg`;
        const token = randomUUID();
        await bucket.file(thumbName).save(resized, {
          contentType: "image/jpeg",
          metadata: {
            cacheControl: "public, max-age=31536000",
            metadata: { firebaseStorageDownloadTokens: token, sourceObject: t.name },
          },
        });
        const thumbUrl = downloadUrl(thumbName, token);
        const ok = await db.runTransaction(async (tx) => {
          const ref = db.doc(`users/${t.uid}`);
          const snap = await tx.get(ref);
          if (snap.get("photoURL") !== t.url) return false;
          tx.update(ref, { photoURL: thumbUrl, photoOriginalURL: t.url });
          return true;
        });
        if (!ok) {
          skipped++;
          continue;
        }
        replaced.set(t.url, thumbUrl);
        await auth.updateUser(t.uid, { photoURL: thumbUrl }).catch(() => undefined);
      } catch (e) {
        failed++;
        console.warn(`failed ${t.uid}`, e instanceof Error ? e.message : e);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  const mb = (n: number) => (n / 1024 / 1024).toFixed(1);
  console.log(
    `${dryRun ? "[dry-run] " : ""}resized ${dryRun ? "(would)" : replaced.size}: ${mb(before)}MB -> ${mb(after)}MB / skipped ${skipped} / failed ${failed}`
  );
  if (dryRun || replaced.size === 0) return;

  let patched = 0;
  for (const col of SNAPSHOT_COLLECTIONS) {
    const snaps = await db.collection(col).get();
    for (const d of snaps.docs) {
      const r = replaceUrls(d.data(), replaced);
      if (!r.changed) continue;
      await d.ref.set(r.value as Record<string, unknown>);
      patched++;
    }
  }
  console.log(`ranking snapshots patched: ${patched}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
