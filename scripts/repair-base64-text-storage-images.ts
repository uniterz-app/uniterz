/**
 * Native の旧アップロード（Uint8Array → uploadBytes）で base64 文字列のまま保存された画像を、
 * デコードしたバイナリで同じパスに上書きして直す。ダウンロードトークンは引き継ぐので既存 URL はそのまま有効。
 *
 *   DRY_RUN=1 npx tsx scripts/repair-base64-text-storage-images.ts
 *   npx tsx scripts/repair-base64-text-storage-images.ts
 *
 * 認証: `.env.local` の FIREBASE_*
 */
import fs from "fs";
import path from "path";

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const PREFIXES = [
  "avatars/",
  "contact_screenshots/",
  "redemption_products/",
  "community_headers/",
];
const BASE64_IMAGE_HEAD = /^(iVBOR|\/9j\/|UklGR|R0lGO|AAAA)/;

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const text = fs.readFileSync(envPath, "utf8");
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = val;
  }
}

function sniffContentType(buf: Buffer): string | null {
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") {
    return "image/webp";
  }
  if (buf.subarray(0, 3).toString("latin1") === "GIF") return "image/gif";
  if (buf.subarray(4, 8).toString("latin1") === "ftyp") return "image/heic";
  return null;
}

async function main() {
  loadEnvLocal();
  await import("../lib/firebaseAdmin").then((m) => m.getAdminDb());
  const { getStorage } = await import("firebase-admin/storage");
  const bucket = getStorage().bucket(
    process.env.FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  );

  console.log("=== repair base64-text storage images ===");
  if (DRY_RUN) console.log("(DRY_RUN: no writes)");

  let repaired = 0;
  let skipped = 0;
  for (const prefix of PREFIXES) {
    const [files] = await bucket.getFiles({ prefix });
    for (const file of files) {
      const [head] = await file.download({ start: 0, end: 7 });
      if (!BASE64_IMAGE_HEAD.test(head.toString("latin1"))) continue;

      const [raw] = await file.download();
      const decoded = Buffer.from(raw.toString("latin1").trim(), "base64");
      const contentType = sniffContentType(decoded);
      if (!contentType) {
        console.warn(`skip (not an image after decode): ${file.name}`);
        skipped += 1;
        continue;
      }
      console.log(`${file.name}  ${raw.length} → ${decoded.length} bytes  ${contentType}`);
      if (!DRY_RUN) {
        const [meta] = await file.getMetadata();
        await file.save(decoded, {
          resumable: false,
          metadata: {
            contentType,
            cacheControl: meta.cacheControl,
            metadata: meta.metadata,
          },
        });
      }
      repaired += 1;
    }
  }

  console.log(`${DRY_RUN ? "would repair" : "repaired"}: ${repaired} / skipped: ${skipped}`);
  console.log("=== done ===");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
