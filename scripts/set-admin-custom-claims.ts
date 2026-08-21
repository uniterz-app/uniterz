/**
 * 管理者 Custom Claim を許可リスト UID に付与する。
 *
 *   npx tsx scripts/set-admin-custom-claims.ts
 *
 * `.env.local` の FIREBASE_* を読む（dotenv 非依存）。
 */
import { existsSync, readFileSync } from "fs";
import { resolve } from "path";

function loadEnvFile(filePath: string): void {
  if (!existsSync(filePath)) return;
  const text = readFileSync(filePath, "utf8");
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

import { getAdminAuth } from "../lib/firebaseAdmin";
import {
  ADMIN_CLAIM,
  ADMIN_UID_ALLOWLIST,
} from "../lib/admin/adminAllowlist";
import { ensureAdminCustomClaims } from "../lib/admin/ensureAdminCustomClaims";

async function main() {
  const auth = getAdminAuth();
  for (const uid of ADMIN_UID_ALLOWLIST) {
    const result = await ensureAdminCustomClaims(auth, uid);
    console.log(
      `${uid}: admin=${result.admin} refreshed=${result.refreshed} claim=${ADMIN_CLAIM}`
    );
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
