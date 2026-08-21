/**
 * シークレット比較（長さ不一致でも timingSafeEqual を使う）
 */
import { timingSafeEqual } from "crypto";

export function timingSafeEqualString(
  provided: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (typeof provided !== "string" || typeof expected !== "string") {
    return false;
  }
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    const len = Math.max(a.length, b.length, 1);
    const padA = Buffer.alloc(len);
    const padB = Buffer.alloc(len);
    a.copy(padA);
    b.copy(padB);
    timingSafeEqual(padA, padB);
    return false;
  }
  return timingSafeEqual(a, b);
}
