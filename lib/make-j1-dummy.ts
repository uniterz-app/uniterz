// lib/make-j1-dummy.ts
import { teamColorsJ1 } from "@/lib/teams-j1"; // ← すでに作った色マップ（{ [name]: { primary, secondary } }）
                                                 // ファイル名やexport名はあなたの実装に合わせて調整してOK

type TeamSide = {
  name: string;
  record: { w: number; l?: number; d?: number };
  number?: number;
  colorHex?: string;
};

type GameItem = {
  id: string;
  venue?: string;
  roundLabel?: string;
  startAtJst: Date | null;
  status: "scheduled" | "live" | "final";
  home: TeamSide;
  away: TeamSide;
  score: { home: number; away: number } | null;
  liveMeta: { period: string; runningTime?: string } | null;
  finalMeta: { ot?: boolean } | null;
};

const j1Teams = Object.keys(teamColorsJ1);

/** 与えた日付用に、J1のダミー試合をいくつか作って返す */
export function makeJ1DummyGames(date: Date, count = 4): GameItem[] {
  // チームをシャッフルしてペアを作る
  const shuffled = [...j1Teams].sort(() => Math.random() - 0.5);
  const pairs = [];
  for (let i = 0; i < count * 2 && i + 1 < shuffled.length; i += 2) {
    pairs.push([shuffled[i], shuffled[i + 1]]);
  }

  return pairs.map(([homeName, awayName], idx): GameItem => {
    const start = new Date(date);
    start.setHours(13 + (idx % 3) * 2, 0, 0, 0); // 13:00, 15:00, 17:00…くらい

    const homeColor = teamColorsJ1[homeName]?.primary ?? "#16a34a"; // fallback緑
    const awayColor = teamColorsJ1[awayName]?.primary ?? "#ca8a04"; // fallback黄土

    return {
      id: `j-${start.getTime()}-${idx}`,
      venue: "サンプルスタジアム",
      roundLabel: "第25節",
      startAtJst: start,
      status: "scheduled",            // まずは全部“予定”でOK
      home: { name: homeName, record: { w: 12, d: 6, l: 7 }, colorHex: homeColor },
      away: { name: awayName, record: { w: 11, d: 8, l: 6 }, colorHex: awayColor },
      score: null,
      liveMeta: null,
      finalMeta: null,
    };
  });
}
