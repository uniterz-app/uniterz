import { ReactNode } from "react";
import HelpScoringLogicNative from "./HelpScoringLogicNative";
import { HelpAnswerText, HelpBulletList, HelpFaqItemNative } from "./HelpAccordionItemNative";

const GRADIENTS = {
  cyan: ["rgba(6,182,212,0.7)", "rgba(59,130,246,0.7)", "rgba(99,102,241,0.7)"] as const,
  violet: ["rgba(139,92,246,0.7)", "rgba(217,70,239,0.7)", "rgba(99,102,241,0.7)"] as const,
  emerald: ["rgba(16,185,129,0.7)", "rgba(20,184,166,0.7)", "rgba(6,182,212,0.7)"] as const,
  amber: ["rgba(245,158,11,0.7)", "rgba(249,115,22,0.7)", "rgba(239,68,68,0.7)"] as const,
};

function scoringLogicJa(): ReactNode {
  return (
    <HelpScoringLogicNative
      intro="採点ロジックは下記4項目に分かれています。項目をタップすると詳細が開きます。"
      defaultOpenId="totalPoints"
      sections={[
        {
          id: "winRate",
          title: "勝率",
          content: "勝敗予想の的中率です（勝ち数 ÷ 投稿数）。",
        },
        {
          id: "totalPoints",
          title: "総合得点",
          content:
            "【サッカー（WC など）】勝者的中 +4点。HOME得点一致 +3点、AWAY得点一致 +3点（完全一致のみ）。基本点は0/4/7/10点（勝者のみ4点、片方一致7点、完全一致10点）。【NBA】勝者的中 +4点。得失点差の近さ（Max4点）と合計得点の近さ（Max2点）で加点（すべて一致で基本点10点）。連勝ボーナス：3〜4連勝 +1点、5〜6連勝 +2点、7連勝以上 +3点。アップセットボーナス：少数派予想が的中し試合がアップセットだった場合 +2点。※ 勝者予想を外した場合、総合得点は0点です。",
        },
        {
          id: "scorePrecision",
          title: "スコア精度",
          content:
            "1試合 0〜10点：HOME得点差（最大3）＋ AWAY得点差（最大3）＋ 得失点差（最大4）。誤差0で満点、誤差1〜11で段階的に減点、誤差12以上は0点です。",
        },
        {
          id: "upsetPoints",
          title: "アップセット得点",
          content:
            "アップセット（番狂わせ）が起きた試合で、少数派の予想を当てたときに加点される指標です（1試合0〜10点）。予想側が45%以下の少数派になると対象になり、10%以下の強い少数派に近づくほど10点に近い高得点になります。",
        },
      ]}
    />
  );
}

function scoringLogicEn(): ReactNode {
  return (
    <HelpScoringLogicNative
      intro="Scoring is split into four sections below. Tap a section to expand details."
      defaultOpenId="totalPoints"
      sections={[
        {
          id: "winRate",
          title: "Win Rate",
          content: "Your winner-prediction accuracy (wins ÷ submissions).",
        },
        {
          id: "totalPoints",
          title: "Total Points",
          content:
            "[Football (WC, etc.)] Correct winner: +4. HOME goals match: +3, AWAY goals match: +3 (exact only). Base points: 0/4/7/10 (winner only 4, one side 7, exact 10). [NBA] Correct winner: +4. Margin closeness (max 4) and total-score closeness (max 2) add points (all match → 10 base). Win streak bonus: +1 for 3–4 wins, +2 for 5–6, +3 for 7+. Upset bonus: +2 when your minority pick wins in an upset match. If you miss the winner, total points are 0.",
        },
        {
          id: "scorePrecision",
          title: "Score Precision",
          content:
            "0–10 points per match: HOME score diff (max 3) + AWAY score diff (max 3) + margin diff (max 4). Full points at 0 error, gradually reduced for errors 1–11, and 0 at 12+.",
        },
        {
          id: "upsetPoints",
          title: "Upset Score",
          content:
            "Points earned when you correctly pick the minority side in an upset match (0–10 per match). Applies when your side is 45% or below; stronger minority (10% or below) earns closer to 10 points.",
        },
      ]}
    />
  );
}

export function getHelpFaqsNative(language: "ja" | "en"): HelpFaqItemNative[] {
  if (language === "en") {
    return [
      {
        id: "form",
        label: "How to play",
        question: "What can I enjoy in this app?",
        icon: "gamepad-variant",
        iconColor: "#a5f3fc",
        gradient: GRADIENTS.cyan,
        answer: (
          <>
            <HelpAnswerText>
              Uniterz is a sports-prediction fantasy game. You enjoy it by making predictions for matches. You can:
            </HelpAnswerText>
            <HelpBulletList
              items={[
                "Predict wins and losses.",
                "Predict scores (optional).",
                "Earn points from match-by-match submissions.",
                "Compete with other users in the rankings.",
              ]}
            />
            <HelpAnswerText>
              Your daily submission results are reflected on your profile and rankings.
            </HelpAnswerText>
          </>
        ),
      },
      {
        id: "stats",
        label: "Scoring",
        question: "What performance metrics are available?",
        icon: "chart-bar",
        iconColor: "#ddd6fe",
        gradient: GRADIENTS.violet,
        answer: (
          <>
            <HelpBulletList
              items={[
                "Win Rate: your accuracy in predicting winners.",
                "Score Precision: how close your predicted score is to the actual score.",
                "Upset Score: your ability to read upsets.",
                "Total Points: the combined score from all metrics.",
              ]}
            />
            <HelpAnswerText>
              Each metric is aggregated for the last 7 days, last 30 days, and all-time.
            </HelpAnswerText>
          </>
        ),
      },
      {
        id: "scoring-logic",
        label: "Scoring logic",
        question: "How are points calculated?",
        icon: "function-variant",
        iconColor: "#a7f3d0",
        gradient: GRADIENTS.emerald,
        answer: scoringLogicEn(),
      },
      {
        id: "ranking",
        label: "Rankings",
        question: "How are rankings displayed?",
        icon: "trophy",
        iconColor: "#fde68a",
        gradient: GRADIENTS.amber,
        answer: (
          <>
            <HelpAnswerText>Rankings are displayed separately for each metric:</HelpAnswerText>
            <HelpBulletList
              items={[
                "Win Rate rankings",
                "Score Precision rankings",
                "Total Points rankings",
                "Upset Score rankings",
              ]}
            />
            <HelpAnswerText>
              You can keep playing while watching how your rank changes over time.
            </HelpAnswerText>
          </>
        ),
      },
    ];
  }

  return [
    {
      id: "form",
      label: "ゲームの遊び方",
      question: "このアプリでは何を楽しめますか？",
      icon: "gamepad-variant",
      iconColor: "#a5f3fc",
      gradient: GRADIENTS.cyan,
      answer: (
        <>
          <HelpAnswerText>
            Uniterz は、スポーツ予想をベースに楽しむファンタジーゲームです。次のようなプレイができます。
          </HelpAnswerText>
          <HelpBulletList
            items={["勝敗予想", "スコア予想（任意）", "試合ごとの投稿でポイント獲得", "ランキングで他ユーザーと競争"]}
          />
          <HelpAnswerText>日々の投稿結果はプロフィールやランキングに反映されます。</HelpAnswerText>
        </>
      ),
    },
    {
      id: "stats",
      label: "スコア計算",
      question: "どんな成績指標がありますか？",
      icon: "chart-bar",
      iconColor: "#ddd6fe",
      gradient: GRADIENTS.violet,
      answer: (
        <>
          <HelpBulletList
            items={[
              "勝率：勝敗予想の的中率",
              "スコア精度：スコア予想と結果のズレ",
              "Upsetスコア：番狂わせを読み切る力",
              "総合得点：各指標を合算したスコア",
            ]}
          />
          <HelpAnswerText>各指標は、7日間・30日間・通算で集計されます。</HelpAnswerText>
        </>
      ),
    },
    {
      id: "scoring-logic",
      label: "採点ロジック",
      question: "得点はどう計算されていますか？",
      icon: "function-variant",
      iconColor: "#a7f3d0",
      gradient: GRADIENTS.emerald,
      answer: scoringLogicJa(),
    },
    {
      id: "ranking",
      label: "ランキング",
      question: "ランキングはどのように表示されますか？",
      icon: "trophy",
      iconColor: "#fde68a",
      gradient: GRADIENTS.amber,
      answer: (
        <>
          <HelpAnswerText>ランキングは指標ごとに個別に表示されます。</HelpAnswerText>
          <HelpBulletList
            items={[
              "勝率ランキング",
              "スコア精度ランキング",
              "総合得点ランキング",
              "Upsetスコアランキング",
            ]}
          />
          <HelpAnswerText>期間ごとの順位変化を見ながらプレイを継続できます。</HelpAnswerText>
        </>
      ),
    },
  ];
}

export function getHelpPageCopy(language: "ja" | "en") {
  return language === "en"
    ? {
        title: "Help & Guide",
        description: "Learn how to use Uniterz and how scoring works.",
        lastUpdatedLabel: "Last updated: ",
      }
    : {
        title: "ヘルプ・ガイド",
        description: "Uniterz の使い方とスコアリングについて",
        lastUpdatedLabel: "最終更新: ",
      };
}
