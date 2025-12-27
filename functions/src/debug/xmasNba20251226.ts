// functions/src/debug/xmasNba20251226.ts
import { onRequest } from "firebase-functions/v2/https";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export const xmasNba20251226 = onRequest(
  { region: "asia-northeast1" },
  async (_req, res) => {
    const date = "2025-12-26";

    const snap = await db
      .collection("user_stats_v2_daily")
      .where("date", "==", date)
      .get();

    const qualified: { uid: string; wins: number }[] = [];

    for (const doc of snap.docs) {
      const data = doc.data();
      const nba = data.leagues?.nba;

      if (!nba) continue;

      if (nba.posts === 5 && nba.wins >= 4) {
        qualified.push({
          uid: doc.id.split("_")[0],
          wins: nba.wins,
        });
      }
    }

    console.log(
      "XMAS NBA 2025 qualified users:",
      qualified
    );

    res.json({
      date,
      count: qualified.length,
      users: qualified,
    });
  }
);
