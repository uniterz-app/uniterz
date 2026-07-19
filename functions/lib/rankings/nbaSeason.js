"use strict";
// functions/src/rankings/nbaSeason.ts
// NBA ランキングのシーズンキー（例: "2026-27"）。
// 26-27 以降はシーズンごとに独立したバケット（rankingBySeason.<key>）に累積し、
// スナップショット doc は `s<key>_<metric>` に書く。過去シーズンのリセットは不要。
// Next 側の lib/rankings/nbaSeason.ts と同期すること。
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURRENT_NBA_SEASON_KEY = void 0;
exports.nbaSeasonKeyFromDateJST = nbaSeasonKeyFromDateJST;
exports.nbaSeasonSnapshotDocId = nbaSeasonSnapshotDocId;
/**
 * 日付（JST）からシーズンキーを導出する。
 * NBA は 10月開幕〜6月終了なので、7月以降 = 次シーズン扱い
 * （例: 2026-10 → "2026-27"、2027-04 → "2026-27"）。
 */
function nbaSeasonKeyFromDateJST(d) {
    const j = new Date(d.getTime() + 9 * 60 * 60 * 1000);
    const y = j.getUTCFullYear();
    const m = j.getUTCMonth() + 1;
    const startYear = m >= 7 ? y : y - 1;
    return `${startYear}-${String((startYear + 1) % 100).padStart(2, "0")}`;
}
/** ランキング一覧・snapshotRanks が参照する現行シーズン（日付から自動導出） */
exports.CURRENT_NBA_SEASON_KEY = nbaSeasonKeyFromDateJST(new Date());
/** cumulative_ranking_snapshots の doc id（例: s2026-27_totalPoints） */
function nbaSeasonSnapshotDocId(seasonKey, metric) {
    return `s${seasonKey}_${metric}`;
}
//# sourceMappingURL=nbaSeason.js.map