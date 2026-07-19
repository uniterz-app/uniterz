/**
 * npx tsx scripts/insert-master-badges-2025-12.ts
 *
 * 2025年12月 月次Top3バッジ（5指標）を master_badges に一括登録
 * ※ icon URL は後から手動で差し替える前提
 */

import adminPkg from "firebase-admin";
const admin = adminPkg;

import fs from "fs";

// ---- service-account.json をロード ----
const serviceAccount = JSON.parse(
  fs.readFileSync("service-account.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

type MasterBadgeInput = {
  badgeId: string;
  title: string;
  description: string;
  type: "monthly";
  metric: string;
  rank: 1 | 2 | 3;
  yearMonth: string;
};

const BADGES: MasterBadgeInput[] = [
  // ===== WIN RATE =====
  {
    badgeId: "monthly_2025_12_win_rate_rank1",
    title: "WIN RATE 1位（2025年12月）",
    description:
      "2025年12月 勝率ランキング1位。\nもっとも勝ち続けた、12月の予想王。",
    type: "monthly",
    metric: "win_rate",
    rank: 1,
    yearMonth: "2025-12",
  },
  {
    badgeId: "monthly_2025_12_win_rate_rank2",
    title: "WIN RATE 2位（2025年12月）",
    description:
      "2025年12月 勝率ランキング2位。\n安定感抜群のトップクラス予想家。",
    type: "monthly",
    metric: "win_rate",
    rank: 2,
    yearMonth: "2025-12",
  },
  {
    badgeId: "monthly_2025_12_win_rate_rank3",
    title: "WIN RATE 3位（2025年12月）",
    description:
      "2025年12月 勝率ランキング3位。\n高い勝率を誇った、実力派予想家。",
    type: "monthly",
    metric: "win_rate",
    rank: 3,
    yearMonth: "2025-12",
  },

  // ===== SCORE MARGIN ACCURACY =====
  {
    badgeId: "monthly_2025_12_score_margin_accuracy_rank1",
    title: "スコア精度 1位（2025年12月）",
    description:
      "2025年12月 スコア精度ランキング1位。\n点差まで読み切った、精度の支配者。",
    type: "monthly",
    metric: "score_margin_accuracy",
    rank: 1,
    yearMonth: "2025-12",
  },
  {
    badgeId: "monthly_2025_12_score_margin_accuracy_rank2",
    title: "スコア精度 2位（2025年12月）",
    description:
      "2025年12月 スコア精度ランキング2位。\n鋭い読みで差を詰めた、計算派予想家。",
    type: "monthly",
    metric: "score_margin_accuracy",
    rank: 2,
    yearMonth: "2025-12",
  },
  {
    badgeId: "monthly_2025_12_score_margin_accuracy_rank3",
    title: "スコア精度 3位（2025年12月）",
    description:
      "2025年12月 スコア精度ランキング3位。\n点差感覚に優れた、堅実な分析派。",
    type: "monthly",
    metric: "score_margin_accuracy",
    rank: 3,
    yearMonth: "2025-12",
  },

  // ===== PREDICTION ACCURACY =====
  {
    badgeId: "monthly_2025_12_prediction_accuracy_rank1",
    title: "予測精度 1位（2025年12月）",
    description:
      "2025年12月 予測精度ランキング1位。\n最も結果を当て続けた、信頼の的中王。",
    type: "monthly",
    metric: "prediction_accuracy",
    rank: 1,
    yearMonth: "2025-12",
  },
  {
    badgeId: "monthly_2025_12_prediction_accuracy_rank2",
    title: "予測精度 2位（2025年12月）",
    description:
      "2025年12月 予測精度ランキング2位。\n高精度を維持した、安定感ある予想家。",
    type: "monthly",
    metric: "prediction_accuracy",
    rank: 2,
    yearMonth: "2025-12",
  },
  {
    badgeId: "monthly_2025_12_prediction_accuracy_rank3",
    title: "予測精度 3位（2025年12月）",
    description:
      "2025年12月 予測精度ランキング3位。\n的中率の高さが光った、実力派。",
    type: "monthly",
    metric: "prediction_accuracy",
    rank: 3,
    yearMonth: "2025-12",
  },

  // ===== CALIBRATION ACCURACY =====
  {
    badgeId: "monthly_2025_12_calibration_accuracy_rank1",
    title: "一致度 1位（2025年12月）",
    description:
      "2025年12月 一致度ランキング1位。\n確率を語らせたら右に出る者なし。",
    type: "monthly",
    metric: "calibration_accuracy",
    rank: 1,
    yearMonth: "2025-12",
  },
  {
    badgeId: "monthly_2025_12_calibration_accuracy_rank2",
    title: "一致度 2位（2025年12月）",
    description:
      "2025年12月 一致度ランキング2位。\n予想と結果を高い水準で揃えた理論派。",
    type: "monthly",
    metric: "calibration_accuracy",
    rank: 2,
    yearMonth: "2025-12",
  },
  {
    badgeId: "monthly_2025_12_calibration_accuracy_rank3",
    title: "一致度 3位（2025年12月）",
    description:
      "2025年12月 一致度ランキング3位。\n確率感覚に優れた、バランス型予想家。",
    type: "monthly",
    metric: "calibration_accuracy",
    rank: 3,
    yearMonth: "2025-12",
  },

  // ===== UPSET RATE =====
  {
    badgeId: "monthly_2025_12_upset_rate_rank1",
    title: "UPSET RATE 1st (Dec 2025)",
    description:
      "2025年12月 アップセットランキング1位。\n波乱を的中させ続けた、番狂わせの旗手。",
    type: "monthly",
    metric: "upset_rate",
    rank: 1,
    yearMonth: "2025-12",
  },
  {
    badgeId: "monthly_2025_12_upset_rate_rank2",
    title: "UPSET RATE 2nd (Dec 2025)",
    description:
      "2025年12月 アップセットランキング2位。\n大穴を何度も射抜いた、チャレンジャー。",
    type: "monthly",
    metric: "upset_rate",
    rank: 2,
    yearMonth: "2025-12",
  },
  {
    badgeId: "monthly_2025_12_upset_rate_rank3",
    title: "UPSET RATE 3rd (Dec 2025)",
    description:
      "2025年12月 アップセットランキング3位。\n波乱を恐れぬ、攻めの予想家。",
    type: "monthly",
    metric: "upset_rate",
    rank: 3,
    yearMonth: "2025-12",
  },
];

async function insertMasterBadges() {
  console.log("=== INSERT MASTER BADGES START ===");

  let batch = db.batch();
  let count = 0;

  for (const badge of BADGES) {
    const ref = db.collection("master_badges").doc(badge.badgeId);

    batch.set(
      ref,
      {
        title: badge.title,
        description: badge.description,
        type: badge.type,
        metric: badge.metric,
        rank: badge.rank,
        yearMonth: badge.yearMonth,
        // icon は後で手動追加
      },
      { merge: true }
    );

    count++;

    if (count % 450 === 0) {
      await batch.commit();
      batch = db.batch();
    }
  }

  await batch.commit();

  console.log(`✔ inserted/updated badges: ${count}`);
  console.log("=== INSERT FINISHED ===");
  process.exit(0);
}

insertMasterBadges().catch((e) => {
  console.error("❌ insert failed:", e);
  process.exit(1);
});
