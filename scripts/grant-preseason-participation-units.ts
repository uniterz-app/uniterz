/**
 * プレシーズン参加ボーナス 50 Unit を付与する（1 アカウント 1 回・冪等）。
 *
 * 対象（Firebase Auth の metadata で判定）:
 * - 期間中に作成されたアカウント、または
 * - 最終利用（lastRefreshTime。無ければ lastSignInTime）が期間開始以降
 * かつ users/{uid} に表示名があり、無効化されていないアカウント。
 * 開幕以降に作成されたアカウントと、審査用・テスト用（PRESEASON_BONUS_EXCLUDED_UIDS）は除外。
 *
 * lastRefreshTime は上書きされるため、開幕戦ティップオフ（JST 10/21 4:00）直後に実行する。
 * 遅れて実行すると、開幕後に初めて戻ってきた既存ユーザーも含まれる。
 *
 *   DRY_RUN=1 npx tsx scripts/grant-preseason-participation-units.ts
 *   npx tsx scripts/grant-preseason-participation-units.ts
 *
 * 認証: `.env.local` の FIREBASE_*
 */
import fs from "fs";
import path from "path";
import type { UserRecord } from "firebase-admin/auth";
import {
  PRESEASON_BONUS_EXCLUDED_UIDS,
  PRESEASON_BONUS_SEASON,
  PRESEASON_BONUS_UNITS,
  PRESEASON_BONUS_WINDOW_END_MS,
  PRESEASON_BONUS_WINDOW_START_MS,
} from "../lib/units/preseasonBonus";
import { grantPreseasonBonus } from "../lib/units/preseasonBonusServer";

const DRY_RUN = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";
const LATE_RUN_WARN_MS = 2 * 24 * 60 * 60 * 1000;

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

function parseMs(raw: string | null | undefined): number {
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : 0;
}

type Eligibility = "signup" | "active" | null;

function eligibility(user: UserRecord): Eligibility {
  if (user.disabled) return null;
  if (PRESEASON_BONUS_EXCLUDED_UIDS.has(user.uid)) return null;
  if (user.providerData.length === 0) return null;
  const createdMs = parseMs(user.metadata.creationTime);
  if (createdMs >= PRESEASON_BONUS_WINDOW_END_MS) return null;
  if (createdMs >= PRESEASON_BONUS_WINDOW_START_MS) return "signup";
  const lastActiveMs =
    parseMs(user.metadata.lastRefreshTime) ||
    parseMs(user.metadata.lastSignInTime);
  return lastActiveMs >= PRESEASON_BONUS_WINDOW_START_MS ? "active" : null;
}

async function main() {
  loadEnvLocal();
  const { getAdminAuth, getAdminDb } = await import("../lib/firebaseAdmin");
  const auth = getAdminAuth();
  const db = getAdminDb();

  console.log(`=== preseason bonus ${PRESEASON_BONUS_SEASON} (${PRESEASON_BONUS_UNITS} Unit) ===`);
  if (DRY_RUN) console.log("(DRY_RUN: no writes)");
  if (Date.now() < PRESEASON_BONUS_WINDOW_END_MS) {
    console.warn("warning: preseason has not ended yet — users active later will be missed");
  } else if (Date.now() > PRESEASON_BONUS_WINDOW_END_MS + LATE_RUN_WARN_MS) {
    console.warn("warning: running late — users who first returned after opening night are included");
  }

  const candidates: Array<{ uid: string; kind: "signup" | "active" }> = [];
  let authTotal = 0;
  let pageToken: string | undefined;
  do {
    const page = await auth.listUsers(1000, pageToken);
    for (const user of page.users) {
      authTotal += 1;
      const kind = eligibility(user);
      if (kind) candidates.push({ uid: user.uid, kind });
    }
    pageToken = page.pageToken;
  } while (pageToken);

  const profileSnaps = [];
  for (let i = 0; i < candidates.length; i += 300) {
    const refs = candidates
      .slice(i, i + 300)
      .map((c) => db.collection("users").doc(c.uid));
    profileSnaps.push(...(await db.getAll(...refs)));
  }
  const withProfile = new Set(
    profileSnaps
      .filter((s) => {
        const name = s.get("displayName");
        return s.exists && typeof name === "string" && name.trim() !== "";
      })
      .map((s) => s.id)
  );
  const targets = candidates.filter((c) => withProfile.has(c.uid));

  const signups = targets.filter((t) => t.kind === "signup").length;
  console.log(`auth users: ${authTotal}`);
  console.log(`eligible: ${targets.length} (new signups ${signups} / active existing ${targets.length - signups})`);
  console.log(`skipped (no users doc or no displayName): ${candidates.length - targets.length}`);
  console.log(`total Units: ${targets.length * PRESEASON_BONUS_UNITS}`);

  if (DRY_RUN) process.exit(0);

  let granted = 0;
  let already = 0;
  for (const { uid, kind } of targets) {
    const did = await grantPreseasonBonus(db, uid, kind);
    if (did) granted += 1;
    else already += 1;
  }

  console.log(`granted: ${granted} / already granted: ${already}`);
  console.log("=== done ===");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
