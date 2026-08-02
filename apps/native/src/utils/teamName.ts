/**
 * Native 表示用チーム名ヘルパー。
 * Web と同じ `lib/team-name-split` / `lib/team-alias` を正とする
 * （簡易空白分割だと "New York Knicks" → "York Knicks" になる）。
 */
export { getTeamAlias } from "../../../../lib/team-alias";
export {
  splitTeamNameByLeague,
  joinTeamNameLines,
  splitWcCountryNameForMobileList,
} from "../../../../lib/team-name-split";
