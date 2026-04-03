import { createHmac, randomInt } from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateInviteCode(length = 8): string {
  let s = "";
  for (let i = 0; i < length; i++) {
    s += ALPHABET[randomInt(ALPHABET.length)];
  }
  return s;
}

function inviteSecret(): string {
  const s = process.env.COMMUNITY_INVITE_SECRET?.trim();
  if (s) return s;
  const pid = process.env.FIREBASE_PROJECT_ID ?? "";
  if (process.env.NODE_ENV !== "production") {
    return `${pid}_community_invite_dev`;
  }
  throw new Error("COMMUNITY_INVITE_SECRET is required in production");
}

export function hashInviteCode(normalizedCode: string): string {
  return createHmac("sha256", inviteSecret())
    .update(normalizedCode, "utf8")
    .digest("hex");
}

export function normalizeInviteCode(raw: string): string {
  return String(raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}
