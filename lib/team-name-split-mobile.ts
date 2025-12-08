import { splitTeamNameByLeague } from "./team-name-split";

/**
 * Mobile 専用：NBA の場合は nickname(line2) だけ表示する
 */
export function getMobileTeamName(league: "bj" | "j1" | "nba", rawName: string) {
  const [line1, line2] = splitTeamNameByLeague(league, rawName);

  // ★ NBA だけ nickname (line2) だけにする
  if (league === "nba") {
    return line2 || rawName; // 安全 fallback
  }

  // B1 / J1 は従来どおり line1 + line2 を組み立てたり自由に
  return `${line1} ${line2}`.trim();
}
