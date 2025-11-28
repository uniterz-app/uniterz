// functions/src/onGameFinal.ts

import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { settleTicket, judgeLeg, type GameDoc, type PostLeg } from "./utils/settle";
import { applyPostToUserStats } from "./updateUserStats";

const db = () => getFirestore();

/** games/{gameId} 更新 → 紐づく posts を判定・反映 */
export const onGameFinal = onDocumentWritten(
  {
    document: "games/{gameId}",
    region: "asia-northeast1",
  },
  async (event) => {
    const before = event.data?.before?.data() as any | undefined;
    const after  = event.data?.after?.data()  as any | undefined;
    if (!after) return;

    const gameId = event.params.gameId as string;

    const becameFinal = !before?.final && !!after.final;
    const scoreChanged =
      before?.homeScore !== after?.homeScore ||
      before?.awayScore !== after?.awayScore;
    if (!becameFinal && !scoreChanged) return;

    const toName = (v: any) => (typeof v === "string" ? v : (v?.name ?? ""));

    const game: GameDoc = {
      id: gameId,
      league: String(after.league ?? ""),
      home: toName(after.home),
      away: toName(after.away),
      final: !!after.final,
      homeScore: after.homeScore ?? null,
      awayScore: after.awayScore ?? null,
    };

    if (!game.final) return;

    const postsCol = db().collection("posts");
    const [snapNested, snapRoot] = await Promise.all([
      postsCol.where("game.gameId", "==", gameId).get(),
      postsCol.where("gameId", "==", gameId).get(),
    ]);

    const postDocs = new Map<string, FirebaseFirestore.QueryDocumentSnapshot>();
    for (const d of snapNested.docs) postDocs.set(d.id, d);
    for (const d of snapRoot.docs)  postDocs.set(d.id, d);

    if (postDocs.size === 0) {
      await db().doc(`games/${gameId}`)
        .set({ resultComputedAt: FieldValue.serverTimestamp() }, { merge: true });
      return;
    }

    const now = Timestamp.now();
    const batch = db().batch();
    const tasks: Promise<any>[] = [];

    for (const doc of postDocs.values()) {
      const p = doc.data() as any;
      if (p.settledAt) continue;

      const legs: PostLeg[] = (p.legs || []).map((l: any) => ({
        optionId: l.optionId ?? undefined,
        kind: l.kind,
        label: String(l.label ?? ""),
        odds: Number(l.odds),
        pct: Number(l.pct),
      }));

      const pctSum = legs.reduce((a, b) => a + (isFinite(b.pct) ? b.pct : 0), 0);
      if (pctSum > 1.5) {
        for (const l of legs) l.pct = l.pct / pctSum;
      }

      const { settlement, resultUnits: ruRaw } = settleTicket(game, legs);
      const outcomes = legs.map((leg) => judgeLeg(game, leg));

      let usedOdds = 0;

      const hitLegs = legs
        .map((leg, idx) => ({ leg, outcome: outcomes[idx] }))
        .filter((x) => x.outcome === "hit");

      if (hitLegs.length === 1) {
        usedOdds = Number(hitLegs[0].leg.odds) || 0;
      } else if (hitLegs.length > 1) {
        let sumPct = 0;
        for (const h of hitLegs) if (isFinite(h.leg.pct)) sumPct += h.leg.pct;
        if (sumPct > 0) {
          usedOdds = hitLegs.reduce(
            (acc, h) =>
              acc +
              ((isFinite(h.leg.pct) ? h.leg.pct : 0) / sumPct) *
                h.leg.odds,
            0
          );
        } else {
          usedOdds =
            hitLegs.reduce((acc, h) => acc + h.leg.odds, 0) /
            hitLegs.length;
        }
      }

      const legsWithOutcome = (p.legs || []).map((orig: any, i: number) => {
        const outcome = outcomes[i] ?? "void";
        return { ...orig, outcome };
      });

      const finalScorePayload = {
        home: game.homeScore,
        away: game.awayScore,
      };

      const resultUnits = Math.round(ruRaw * 100) / 100;

      batch.update(doc.ref, {
        settlement,
        resultUnits,
        settledAt: now,
        legs: legsWithOutcome,
        "game.status": "final",
        "game.finalScore": finalScorePayload,
      });

      tasks.push(
        applyPostToUserStats({
          uid: p.authorUid,
          postId: doc.id,
          createdAt: p.createdAt as Timestamp,
          settlement: settlement as any,
          resultUnits,
          usedOdds: Number(usedOdds),
          league: game.league,
        })
      );
    }

    await batch.commit();
    await Promise.all(tasks);

    await db().doc(`games/${gameId}`).set(
      {
        "game.status": "final",
        "game.finalScore": {
          home: game.homeScore,
          away: game.awayScore,
        },
        resultComputedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    try {
      const homeTeamId = after?.home?.teamId;
      const awayTeamId = after?.away?.teamId;

      if (homeTeamId && awayTeamId) {
        const homeScore = after.homeScore;
        const awayScore = after.awayScore;

        let homeResult: "w" | "d" | "l" = "d";
        let awayResult: "w" | "d" | "l" = "d";

        if (homeScore > awayScore) {
          homeResult = "w";
          awayResult = "l";
        } else if (homeScore < awayScore) {
          homeResult = "l";
          awayResult = "w";
        }

        const updateRecord = async (
          teamId: string,
          result: "w" | "d" | "l"
        ) => {
          const teamRef = db().doc(`teams/${teamId}`);
          const snap = await teamRef.get();
          const data = snap.data() || {};

          const prev = data.record || { w: 0, d: 0, l: 0 };
          const next = {
            ...prev,
            [result]: (prev[result] || 0) + 1,
          };

          await teamRef.set({ record: next }, { merge: true });
        };

        await Promise.all([
          updateRecord(homeTeamId, homeResult),
          updateRecord(awayTeamId, awayResult),
        ]);
      }
    } catch (e) {
      console.error("team record update failed", e);
    }
  }
);
