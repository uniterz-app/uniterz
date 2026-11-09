/**
 * Pro 導線の集計（`proFunnelUsers` / `proFunnelDaily` + users の plan）。
 *
 *   npx tsx --tsconfig tsconfig.json scripts/pro-funnel-stats.ts [--days 14]
 */
import "./_loadAdminEnv";
import { getAdminDb } from "../lib/firebaseAdmin";
import {
  PRO_FUNNEL_EVENTS,
  proFunnelDayKey,
  type ProFunnelEvent,
} from "../lib/billing/proFunnelEvents";

type EventEntry = { first?: number; last?: number; n?: number; src?: Record<string, number> };

const DAY_MS = 86_400_000;

function argNum(name: string, fallback: number): number {
  const i = process.argv.indexOf(name);
  const v = i >= 0 ? Number(process.argv[i + 1]) : NaN;
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

async function main() {
  const db = getAdminDb();
  const days = argNum("--days", 14);
  const now = Date.now();

  const usersSnap = await db.collection("proFunnelUsers").get();
  const rows = usersSnap.docs.map((d) => ({
    uid: d.id,
    ev: d.data() as Partial<Record<ProFunnelEvent, EventEntry>>,
  }));

  console.log(`users with any event: ${rows.length}`);
  console.log("event                  users   total");
  for (const e of PRO_FUNNEL_EVENTS) {
    const hit = rows.filter((r) => r.ev[e]?.first);
    const total = hit.reduce((s, r) => s + (r.ev[e]?.n ?? 0), 0);
    console.log(`${e.padEnd(22)} ${String(hit.length).padStart(5)} ${String(total).padStart(7)}`);
  }

  const srcTotals = (e: ProFunnelEvent) => {
    const m = new Map<string, number>();
    for (const r of rows) {
      for (const [k, n] of Object.entries(r.ev[e]?.src ?? {})) m.set(k, (m.get(k) ?? 0) + n);
    }
    return Object.fromEntries([...m.entries()].sort((a, b) => b[1] - a[1]));
  };
  console.log("subscribe_view by source", srcTotals("subscribe_view"));
  console.log("purchase_tap by source", srcTotals("purchase_tap"));
  console.log("purchase_done by source", srcTotals("purchase_done"));

  const uids = rows.map((r) => r.uid);
  const userDocs = new Map<string, FirebaseFirestore.DocumentData>();
  for (let i = 0; i < uids.length; i += 300) {
    const refs = uids.slice(i, i + 300).map((u) => db.doc(`users/${u}`));
    if (refs.length === 0) continue;
    const snaps = await db.getAll(...refs, {
      fieldMask: ["plan", "proUntil", "planStartDate", "trialEndAt", "planType"],
    });
    for (const s of snaps) if (s.exists) userDocs.set(s.id, s.data()!);
  }

  const funnel = (shown: ProFunnelEvent, tap: ProFunnelEvent) => {
    const seen = rows.filter((r) => r.ev[shown]?.first);
    let tapped = 0, viewed = 0, startedPro = 0, startedTrial = 0, proNow = 0;
    for (const r of seen) {
      const first = r.ev[shown]!.first!;
      if (r.ev[tap]?.first) tapped++;
      if ((r.ev.subscribe_view?.last ?? 0) >= first) viewed++;
      const u = userDocs.get(r.uid);
      if (!u) continue;
      const until = u.proUntil?.toMillis?.() ?? null;
      const isPro = u.plan === "pro" && (until == null || until >= now);
      if (isPro) proNow++;
      const start = u.planStartDate?.toMillis?.() ?? 0;
      if (start >= first) {
        startedPro++;
        if (u.trialEndAt?.toMillis?.()) startedTrial++;
      }
    }
    console.log(
      `${shown}: shown ${seen.length} → tap ${tapped} → subscribe screen ${viewed} → Pro started after shown ${startedPro} (trial ${startedTrial}) / Pro now ${proNow}`
    );
  };
  console.log("funnel");
  funnel("skin_modal_shown", "skin_modal_tap");
  funnel("insight_teaser_shown", "insight_teaser_tap");

  console.log(`daily (last ${days} days, JST)`);
  const keys = Array.from({ length: days }, (_, i) => proFunnelDayKey(now - (days - 1 - i) * DAY_MS));
  const snaps = await db.getAll(...keys.map((k) => db.doc(`proFunnelDaily/${k}`)));
  for (const s of snaps) {
    if (!s.exists) continue;
    const d = s.data()!;
    const parts = PRO_FUNNEL_EVENTS.filter((e) => d[e]).map((e) => `${e}=${d[e]}`);
    console.log(`  ${s.id} ${parts.join(" ")}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
