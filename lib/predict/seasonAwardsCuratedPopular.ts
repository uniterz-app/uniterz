/**
 * シーズンアワード「候補 5 人」— 運営がここだけ編集する。
 *
 * 編集ファイル: `lib/predict/seasonAwardsCuratedPopular.ts`
 * ID は BDL player id（文字列）。COTY は `AWARDS_PREVIEW_COACHES` の id。
 */
import type { NbaAwardId } from "@/lib/predict/nbaSeasonAwardsPredict";

export const SEASON_AWARDS_CURATED_POPULAR: Record<
  NbaAwardId,
  readonly string[]
> = {
  // Wemby / SGA / Jokic / Luka / Giannis
  mvp: ["56677822", "175", "246", "132", "15"],
  // Wemby / Holmgren / Ausar / Gobert / Mobley
  dpoy: ["56677822", "38017685", "56677826", "176", "17896076"],
  // Boozer / Caleb Wilson / Peterson / Dybantsa / Acuff Jr.
  roy: [
    "1091339280",
    "1091343852",
    "1091342427",
    "1091340077",
    "1091338860",
  ],
  // Brandon Miller / Harper / Pritchard / Ausar / Ware
  mip: ["56677823", "1057262518", "3547276", "56677826", "1028029127"],
  // Harper / Ajay Mitchell / Simons / Sheppard / Keldon
  sixth: ["1057262518", "1028037477", "419", "1028028519", "666682"],
  // Brunson / SGA / Luka / Curry / Wemby
  coy: ["73", "175", "132", "115", "56677822"],
  // Daigneault / Mazzulla / Udoka / Finch / Nurse
  coty: [
    "c-daigneault",
    "c-mazzulla",
    "c-udoka",
    "c-finch",
    "c-nurse",
  ],
};
