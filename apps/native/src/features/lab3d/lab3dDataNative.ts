import * as THREE from "three";
import geo from "./demoData/geo.json";
import seasonGames from "./demoData/seasonGames.json";

/** geo.json の teams の並びがチーム番号 */
export const LAB_TEAMS = geo.teams as string[];
/** [緯度, 経度, アルバース x, アルバース y]（us-atlas の states-albers-10m と同じ投影） */
export const LAB_ARENAS = geo.arenas as [number, number, number, number][];
/** [home, away, 日本時間の日（1970-01-01 からの日数）, homeScore, awayScore, home を選んだ人数, away を選んだ人数]。未終了はスコア -1 */
export type LabGame = [number, number, number, number, number, number, number];
export const LAB_SEASON_GAMES = seasonGames as unknown as Record<string, LabGame[]>;
export const LAB_SEASONS = Object.keys(LAB_SEASON_GAMES).sort();
export const LAB_CURRENT_SEASON = LAB_SEASONS[LAB_SEASONS.length - 1];

export const TOKYO: [number, number] = [35.68, 139.69];

export const teamIndex = (teamId: string) => LAB_TEAMS.indexOf(teamId);

export function dayLabel(day: number) {
  const d = new Date(day * 86400000);
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

export function latLngToVec(lat: number, lng: number, r: number, out = new THREE.Vector3()) {
  const la = (lat * Math.PI) / 180;
  const lo = (lng * Math.PI) / 180;
  return out.set(r * Math.cos(la) * Math.cos(lo), r * Math.sin(la), -r * Math.cos(la) * Math.sin(lo));
}

export function arenaMiles(a: number, b: number) {
  const [la1, lo1] = LAB_ARENAS[a];
  const [la2, lo2] = LAB_ARENAS[b];
  const r = Math.PI / 180;
  const h = Math.sin(((la2 - la1) * r) / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(((lo2 - lo1) * r) / 2) ** 2;
  return 3959 * 2 * Math.asin(Math.sqrt(h));
}

/** 今季の終了済みで予想がある試合日（新しい順） */
export function labPickDays(limit = 3): number[] {
  const days = new Map<number, number>();
  for (const g of LAB_SEASON_GAMES[LAB_CURRENT_SEASON]) if (g[3] >= 0 && g[5] + g[6] > 0) days.set(g[2], (days.get(g[2]) ?? 0) + 1);
  return [...days.entries()].filter(([, n]) => n >= 3).map(([d]) => d).sort((a, b) => b - a).slice(0, limit);
}

export const gamesOnDay = (day: number) => LAB_SEASON_GAMES[LAB_CURRENT_SEASON].filter((g) => g[2] === day && g[3] >= 0);

/** チームのそのシーズンの試合（日付順）。margin はそのチームから見た点差 */
export function teamSeason(season: string, team: number) {
  return LAB_SEASON_GAMES[season]
    .filter((g) => (g[0] === team || g[1] === team) && g[3] >= 0)
    .map((g) => {
      const home = g[0] === team;
      const margin = home ? g[3] - g[4] : g[4] - g[3];
      return { g, home, opp: home ? g[1] : g[0], venue: g[0], day: g[2], margin, win: margin > 0 };
    });
}
