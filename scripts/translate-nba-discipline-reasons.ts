/**
 * 罰金・出場停止の理由を 9 言語に訳して `nbaDisciplineFines.reasonI18n` に書く（未訳のみ）。
 *
 *   npx tsx scripts/translate-nba-discipline-reasons.ts          # 未訳を埋める
 *   npx tsx scripts/translate-nba-discipline-reasons.ts --dry    # 件数だけ
 *   npx tsx scripts/translate-nba-discipline-reasons.ts --force  # 訳済みもキャッシュ無視で訳し直す
 *
 * 認証: `.env.local` の FIREBASE_* と OPENAI_API_KEY
 */
import fs from "fs";
import path from "path";

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
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

async function main() {
  loadEnvLocal();
  const { getAdminDb } = await import("../lib/firebaseAdmin");
  const { NBA_DISCIPLINE_FINES_COLLECTION } = await import(
    "../lib/nba/discipline/nbaDisciplineSnapshot"
  );
  const { translateDisciplineReasons } = await import(
    "../lib/nba/discipline/translateDisciplineReason"
  );
  const db = getAdminDb();
  const snap = await db.collection(NBA_DISCIPLINE_FINES_COLLECTION).get();
  const force = process.argv.includes("--force");
  const todo = snap.docs.filter((d) => {
    const reason = String(d.get("reason") ?? "").trim();
    return reason && d.get("kind") !== "rescind" && (force || !d.get("reasonI18n"));
  });
  const reasons = todo.map((d) => String(d.get("reason")).trim());
  console.log(`docs ${snap.size}, targets ${todo.length}, unique ${new Set(reasons).size}`);
  if (process.argv.includes("--dry") || todo.length === 0) return;

  const i18n = await translateDisciplineReasons(db, reasons, { ignoreCache: force });
  let written = 0;
  for (const d of todo) {
    const hit = i18n.get(String(d.get("reason")).trim());
    if (!hit) continue;
    await d.ref.update({ reasonI18n: hit });
    written++;
  }
  console.log(`written ${written}, missing ${todo.length - written}`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
