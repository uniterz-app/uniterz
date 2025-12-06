"use client";
import PredictionForm from "@/app/component/predict/PredictionFormV2";

export default function Preview() {
  const game = {
    id: "test-1",
    league: "bj",
    startAtJst: null,
    home: {
      name: "千葉ジェッツ",
      colorHex: "#e11d48",
      record: { w: 12, l: 5 },   // ← 追加
    },
    away: {
      name: "琉球ゴールデンキングス",
      colorHex: "#2563eb",
      record: { w: 10, l: 7 },   // ← 追加
    },
  };

  const user = { name: "テストユーザー" };

  return (
    <div className="max-w-xl mx-auto">
      <PredictionForm game={game as any} user={user} />
    </div>
  );
}
