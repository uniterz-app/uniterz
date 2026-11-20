import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";

async function main() {
  const db = getAdminDb();
  const id = process.argv[2];
  const d = (await db.collection("gameProInsights").doc(id).get()).data();
  const n = d?.proInsightNarrative;
  console.log("HEADS:\n" + n?.previewHeads?.ja + "\nHEADS EN:\n" + n?.previewHeads?.en);
  console.log("NAMES:", JSON.stringify(n?.previewNames));
  console.log("PREVIEW:\n" + n?.preview?.ja);
  for (const s of n?.sections ?? []) {
    console.log(`\n[${s.kind}]`);
    for (const it of s.items ?? []) {
      console.log("- " + it.body?.ja + (it.template ? `  (template=${it.template})` : ""));
      for (const ev of it.evidence ?? []) console.log("    · " + ev.ja);
    }
  }
  const ctx = d?.proInsightFacts?.sections?.CONTEXT ?? [];
  console.log("\nCONTEXT hints:");
  for (const f of ctx) console.log("  " + f.hintEn);
}

main().then(() => process.exit(0));
