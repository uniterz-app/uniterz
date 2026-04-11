/**
 * マップ上のチーム位置（本拠アリーナ付近）。同州複数チームは座標で区別する。
 * coordinates は [longitude, latitude]（d3 / react-simple-maps の Marker 用）
 */

import type { NbaDivisionId } from "@/lib/nba/nbaTeamUsGeo";

export type TeamMapCoord = { lng: number; lat: number };

/** teamId → 表示座標 */
export const NBA_TEAM_MAP_COORDS: Record<string, TeamMapCoord> = {
  "nba-hawks": { lng: -84.3963, lat: 33.7573 },
  "nba-celtics": { lng: -71.0621, lat: 42.3662 },
  "nba-nets": { lng: -73.975, lat: 40.6826 },
  "nba-hornets": { lng: -80.8392, lat: 35.2251 },
  "nba-bulls": { lng: -87.6742, lat: 41.8806 },
  "nba-cavaliers": { lng: -81.6882, lat: 41.4965 },
  "nba-mavericks": { lng: -96.8103, lat: 32.7905 },
  "nba-nuggets": { lng: -105.0077, lat: 39.7487 },
  "nba-pistons": { lng: -83.0453, lat: 42.3411 },
  "nba-warriors": { lng: -122.3877, lat: 37.768 },
  "nba-rockets": { lng: -95.3621, lat: 29.7508 },
  "nba-pacers": { lng: -86.1555, lat: 39.7639 },
  "nba-clippers": { lng: -118.3453, lat: 33.9465 },
  "nba-lakers": { lng: -118.2673, lat: 34.043 },
  "nba-grizzlies": { lng: -90.0506, lat: 35.1382 },
  "nba-heat": { lng: -80.187, lat: 25.7814 },
  "nba-bucks": { lng: -87.9172, lat: 43.0451 },
  "nba-timberwolves": { lng: -93.2761, lat: 44.9795 },
  "nba-pelicans": { lng: -90.0821, lat: 29.949 },
  "nba-knicks": { lng: -73.9934, lat: 40.7505 },
  "nba-thunder": { lng: -97.5151, lat: 35.4634 },
  "nba-magic": { lng: -81.3839, lat: 28.5392 },
  "nba-76ers": { lng: -75.1715, lat: 39.9012 },
  "nba-suns": { lng: -112.0712, lat: 33.4457 },
  "nba-blazers": { lng: -122.6668, lat: 45.5316 },
  "nba-kings": { lng: -121.4995, lat: 38.5804 },
  "nba-spurs": { lng: -98.4375, lat: 29.427 },
  "nba-raptors": { lng: -79.379, lat: 43.6435 },
  "nba-jazz": { lng: -111.9911, lat: 40.7683 },
  "nba-wizards": { lng: -77.0209, lat: 38.8982 },
};

/** マーカー用の地理座標（コールアウト無しチームはそのまま） */
export function getTeamMarkerCoordinate(teamId: string): TeamMapCoord | null {
  return NBA_TEAM_MAP_COORDS[teamId] ?? null;
}

/** LA / NY のように近接する2チームをリーダー線で引き離す */
export type NbaMarketCalloutPair = {
  key: string;
  teamIds: readonly [string, string];
  /** 線の分岐点（2チーム座標の中点） */
  anchor: TeamMapCoord;
  /**
   * アンカーからのオフセット（SVG viewBox 座標系、Y 下向き正）。
   * LA は下方向の空き、NY は右方向の空きへ伸ばす。
   */
  endpoints: readonly { teamId: string; x: number; y: number }[];
};

function mid(a: TeamMapCoord, b: TeamMapCoord): TeamMapCoord {
  return { lng: (a.lng + b.lng) / 2, lat: (a.lat + b.lat) / 2 };
}

export const NBA_MARKET_CALLOUTS: NbaMarketCalloutPair[] = [
  {
    key: "la",
    teamIds: ["nba-lakers", "nba-clippers"],
    anchor: mid(
      NBA_TEAM_MAP_COORDS["nba-lakers"],
      NBA_TEAM_MAP_COORDS["nba-clippers"]
    ),
    endpoints: [
      { teamId: "nba-lakers", x: -52, y: 80 },
      { teamId: "nba-clippers", x: 58, y: 86 },
    ],
  },
  {
    key: "ny",
    teamIds: ["nba-knicks", "nba-nets"],
    anchor: mid(
      NBA_TEAM_MAP_COORDS["nba-knicks"],
      NBA_TEAM_MAP_COORDS["nba-nets"]
    ),
    endpoints: [
      /* 上側をボストンエリアと被らせないよう下寄り（Y は下向き正） */
      { teamId: "nba-knicks", x: 86, y: 14 },
      { teamId: "nba-nets", x: 94, y: 58 },
    ],
  },
];

/** 両方表示中なら通常マーカーを出さずコールアウト側に任せる */
export function nbaCalloutSkipTeamIds(
  teamIdsInView: readonly string[]
): Set<string> {
  const view = new Set(teamIdsInView);
  const skip = new Set<string>();
  for (const c of NBA_MARKET_CALLOUTS) {
    if (view.has(c.teamIds[0]) && view.has(c.teamIds[1])) {
      skip.add(c.teamIds[0]);
      skip.add(c.teamIds[1]);
    }
  }
  return skip;
}

export const NBA_DIVISION_TEAM_IDS: Record<NbaDivisionId, string[]> = {
  atlantic: [
    "nba-celtics",
    "nba-nets",
    "nba-knicks",
    "nba-76ers",
    "nba-raptors",
  ],
  central: [
    "nba-bulls",
    "nba-cavaliers",
    "nba-pistons",
    "nba-pacers",
    "nba-bucks",
  ],
  southeast: [
    "nba-hawks",
    "nba-hornets",
    "nba-heat",
    "nba-magic",
    "nba-wizards",
  ],
  northwest: [
    "nba-nuggets",
    "nba-timberwolves",
    "nba-thunder",
    "nba-blazers",
    "nba-jazz",
  ],
  pacific: [
    "nba-warriors",
    "nba-clippers",
    "nba-lakers",
    "nba-suns",
    "nba-kings",
  ],
  southwest: [
    "nba-mavericks",
    "nba-rockets",
    "nba-grizzlies",
    "nba-pelicans",
    "nba-spurs",
  ],
};

/**
 * ディビジョン選択時の地図フォーカス（geoNaturalEarth1）。
 * scale を上げると同じ枠内で地図（米国＋TOR）が拡大表示される。
 * Atlantic は BOS〜NY〜PHI〜TOR の外接矩形の中心に寄せ、ズームを強める（Web/Mobile 共通。狭い画面は projectionForMobile で別途補正）。
 */
export const NBA_PREDICTION_MAP_PROJECTION: Record<
  NbaDivisionId | "all",
  { center: [number, number]; scale: number }
> = {
  all: { center: [-93, 41.2], scale: 980 },
  atlantic: { center: [-75.22, 41.77], scale: 2360 },
  central: { center: [-87, 42.5], scale: 1860 },
  /**
   * サウスイーストは FL〜DC と縦に長い。中心をやや北へ寄せて DC / DMV が枠内で見切れにくくする。
   */
  southeast: { center: [-78.1, 34.35], scale: 1780 },
  /** 西寄り中心だと右端（MIN 側）や狭画面で左が切れやすい → 東へ寄せて画面上で左シフト */
  northwest: { center: [-108.5, 42.9], scale: 1650 },
  pacific: { center: [-120, 38], scale: 1480 },
  southwest: { center: [-98, 33], scale: 1680 },
};

export function getNbaTeamMapCoord(teamId: string): TeamMapCoord | null {
  return NBA_TEAM_MAP_COORDS[teamId] ?? null;
}
