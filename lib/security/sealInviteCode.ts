/**
 * スクワッド招待コードのサーバ側封印。Firestore に平文を置かない。
 * 鍵: INVITE_CODE_SECRET があればそれ、なければ INTERNAL_JOB_SECRET。
 */
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "crypto";

function sealKey(): Buffer | null {
  const raw =
    process.env.INVITE_CODE_SECRET?.trim() ||
    process.env.INTERNAL_JOB_SECRET?.trim() ||
    "";
  if (!raw) return null;
  return createHash("sha256").update(raw).digest();
}

export function sealInviteCode(plain: string): string | null {
  const key = sealKey();
  const text = plain.trim();
  if (!key || !text) return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const enc = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${enc.toString("base64url")}`;
}

export function openInviteCode(sealed: unknown): string | null {
  if (typeof sealed !== "string" || !sealed.startsWith("v1.")) return null;
  const key = sealKey();
  if (!key) return null;
  const parts = sealed.split(".");
  if (parts.length !== 4) return null;
  try {
    const iv = Buffer.from(parts[1]!, "base64url");
    const tag = Buffer.from(parts[2]!, "base64url");
    const enc = Buffer.from(parts[3]!, "base64url");
    const decipher = createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    const out = Buffer.concat([decipher.update(enc), decipher.final()]);
    const text = out.toString("utf8").trim();
    return text || null;
  } catch {
    return null;
  }
}
