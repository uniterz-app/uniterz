import type { NbaLeagueStatsMode } from "@/lib/nba/leagueStatsTableTabs";
import { isNbaLeagueStatsPreseason } from "@/lib/nba/leagueStatsPreseason";

export type LeagueStatsEmptyStateCopy = {
  title: string;
  body: string;
};

/** Team / Player リーグ表 — 行が無いときの文言 */
export function leagueStatsTableEmptyCopy(
  language: "ja" | "en",
  mode: NbaLeagueStatsMode,
  seasonKey?: string
): LeagueStatsEmptyStateCopy {
  const preseason = isNbaLeagueStatsPreseason(seasonKey);

  if (mode === "last10") {
    if (language === "ja") {
      return {
        title: "LAST 10",
        body: preseason
          ? "レギュラーシーズン開始後、直近10試合の集計を表示します。"
          : "直近10試合分のデータがまだありません。試合確定後に更新されます。",
      };
    }
    return {
      title: "LAST 10",
      body: preseason
        ? "Last 10 tables appear after the regular season opens."
        : "No last-10 sample yet. Updates after games finalize.",
    };
  }

  if (preseason) {
    if (language === "ja") {
      return {
        title: "PRESEASON",
        body: "レギュラーシーズン開始後、BDL 日次 ingest（18:00 JST）で本番データを表示します。",
      };
    }
    return {
      title: "PRESEASON",
      body: "Season tables go live after opening night via daily BDL ingest (18:00 JST).",
    };
  }

  if (language === "ja") {
    return {
      title: "NO DATA",
      body: "スナップショットを準備中です。しばらくしてから再度お試しください。",
    };
  }
  return {
    title: "NO DATA",
    body: "Snapshot not ready yet. Please check back shortly.",
  };
}

export function teamLast10HasPlayData(
  rows: readonly { wins: number; losses: number }[]
): boolean {
  return rows.some((r) => r.wins + r.losses > 0);
}
