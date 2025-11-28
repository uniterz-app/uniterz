"use client";
import PredictionPostCard, {
  type PredictionPost,
} from "@/app/component/post/PredictionPostCard";

const demo: PredictionPost[] = [
  {
    id: "p1",
    author: { name: "ユーザー名", avatarUrl: "/avatar-placeholder.png" },
    createdAtText: "2時間前",
    game: {
      league: "bj",
      home: "千葉ジェッツ",
      away: "レバンガ北海道",
      status: "final",
      finalScore: { home: 83, away: 73 },
    },
    resultUnits: 4.68,
    legs: [
      {
        kind: "main",
        label: "homeが1〜5点差で勝利",
        odds: 7.8,
        pct: 60,
        outcome: "hit",
      },
      {
        kind: "secondary",
        label: "homeが6〜10点差で勝利",
        odds: 9.2,
        pct: 40,
        outcome: "miss",
      },
    ],
    note: "リバウンド優位＋ホームの連勝傾向。3Qのラインナップ相性が良く、接戦勝ち想定。",
  },

  {
    id: "p2",
    author: { name: "Analyst K" },
    createdAtText: "昨日",
    game: {
      league: "bj", // ←★★★ 追加したのはここだけ
      home: "川崎",
      away: "A東京",
      status: "scheduled",
    },
    resultUnits: null,
    legs: [
      {
        kind: "main",
        label: "A東京が1〜5点差で勝利",
        odds: 6.4,
        pct: 50,
        outcome: "pending",
      },
      {
        kind: "secondary",
        label: "A東京が6〜10点差で勝利",
        odds: 9.1,
        pct: 30,
        outcome: "pending",
      },
      {
        kind: "tertiary",
        label: "川崎が1〜5点差で勝利",
        odds: 7.0,
        pct: 20,
        outcome: "pending",
      },
    ],
    note: "川崎のTO率が高めでエンドゲーム弱め。A東京のクラッチDを評価。",
  },
];

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0a3b47] text-white p-4 md:p-8 space-y-6">
      {demo.map((d) => (
        <PredictionPostCard key={d.id} post={d} />
      ))}
    </div>
  );
}
