// lib/make-b1-dummy.ts
import { teamColorsB1 } from "./teams-b1";

type TeamSide = {
  name: string;
  record: { w: number; l?: number; d?: number };
  number?: number;
  colorHex?: string;
};

const VENUES = [
  "代々木第一", "沖縄アリーナ", "有明アリーナ", "サンドーム福井",
  "さいたまS", "アダストリアみと", "ドルフィンズアリーナ",
];

const times = ["12:05", "13:05", "14:05", "15:05", "18:35", "19:05"];

const pick = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];
const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);

// B1のチーム名一覧（日本語名でOK）
const TEAMS = Object.keys(teamColorsB1);

/** 指定日のダミー試合を count 件つくる */
export function makeB1GamesForDate(day: Date, count = 6) {
  const pairs: Array<[string, string]> = [];

  // シャッフルして上から順にペアにする（奇数なら最後は捨てる）
  const bag = shuffle(TEAMS);
  for (let i = 0; i < Math.min(count * 2, bag.length - 1); i += 2) {
    if (bag[i] && bag[i + 1]) pairs.push([bag[i], bag[i + 1]]);
  }

  const games = pairs.slice(0, count).map(([homeName, awayName], i) => {
    // startAt を「day の times[i]」で作る
    const [hh, mm] = (times[i % times.length] || "13:05").split(":").map(Number);
    const startAtJst = new Date(
      day.getFullYear(),
      day.getMonth(),
      day.getDate(),
      hh,
      mm,
      0,
    );

    // ステータスをランダムに
    const r = Math.random();
    const status = r < 0.2 ? "final" : r < 0.5 ? "live" : "scheduled" as
      | "scheduled"
      | "live"
      | "final";

    // スコア / liveMeta / finalMeta をそれっぽく
    let score: { home: number; away: number } | null = null;
    let liveMeta: { period: string; runningTime?: string } | null = null;
    let finalMeta: { ot?: boolean } | null = null;

    if (status === "live") {
      const h = 50 + Math.floor(Math.random() * 50);
      const a = 50 + Math.floor(Math.random() * 50);
      score = { home: h, away: a };
      const q = pick(["Q1", "Q2", "Q3", "Q4"]);
      const clock = `${String(1 + Math.floor(Math.random() * 9)).padStart(2, "0")}:${String(
        Math.floor(Math.random() * 60)
      ).padStart(2, "0")}`;
      liveMeta = { period: q, runningTime: clock };
    } else if (status === "final") {
      const h = 60 + Math.floor(Math.random() * 50);
      const a = 60 + Math.floor(Math.random() * 50);
      score = { home: h, away: a };
      finalMeta = { ot: Math.random() < 0.15 };
    }

    // TeamSide（カラーは teams-b1 の primary を採用）
    const home: TeamSide = {
      name: homeName,
      record: { w: 10 + Math.floor(Math.random() * 10), l: 5 + Math.floor(Math.random() * 10) },
      number: 8,
      colorHex: teamColorsB1[homeName]?.primary,
    };
    const away: TeamSide = {
      name: awayName,
      record: { w: 10 + Math.floor(Math.random() * 10), l: 5 + Math.floor(Math.random() * 10) },
      number: 8,
      colorHex: teamColorsB1[awayName]?.primary,
    };

    return {
      id: `bj-${+startAtJst}-${i}`,
      league: "bj" as const,
      venue: pick(VENUES),
      roundLabel: `第${1 + (day.getDate() % 10)}節`,
      startAtJst,
      status,
      home,
      away,
      score,
      liveMeta,
      finalMeta,
    };
  });

  return games;
}
