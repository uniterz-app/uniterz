/**
 * 将来シーズンの Player Option（PO）マスタ。
 * NBA.com FA 展望 / RealGM / 直近報道ベース。2026-27 PO は今夏行使・破棄済みのため含めない。
 *
 * resolveOptionForSeasonYear で最優先適用する。
 */
export type NbaContractOptionFlag = "PO" | "TO" | "MO";

/** playerId → seasonYear（例: 2027 = 2027-28）→ option */
export const NBA_CURATED_PLAYER_OPTIONS: Readonly<
  Record<string, Readonly<Partial<Record<number, NbaContractOptionFlag>>>>
> = {
  // --- 2027-28 PO ---
  "246": { 2027: "PO" }, // Nikola Jokić
  "15": { 2027: "PO" }, // Giannis Antetokounmpo
  "237": { 2027: "PO" }, // LeBron James
  "447": { 2027: "PO" }, // Karl-Anthony Towns
  "140": { 2027: "PO" }, // Kevin Durant
  "176": { 2027: "PO" }, // Rudy Gobert
  "228": { 2027: "PO" }, // Kyrie Irving
  "117": { 2027: "PO" }, // Anthony Davis
  "227": { 2027: "PO" }, // Brandon Ingram
  "666676": { 2027: "PO" }, // Ty Jerome
  "8": { 2027: "PO" }, // Grayson Allen
  "22": { 2027: "PO" }, // Deandre Ayton
  "172": { 2027: "PO" }, // Paul George
  "182": { 2027: "PO" }, // Jerami Grant
  "17895966": { 2027: "PO" }, // Jalen Green
  "214": { 2027: "PO" }, // Jrue Holiday
  "254": { 2027: "PO" }, // Luke Kennard
  "278": { 2027: "PO" }, // Damian Lillard
  "334": { 2027: "PO" }, // Dejounte Murray
  "387": { 2027: "PO" }, // Julius Randle
  "419": { 2027: "PO" }, // Anfernee Simons
  "324": { 2027: "PO" }, // Malik Monk
  "322": { 2027: "PO" }, // Donovan Mitchell
  "38017712": { 2027: "PO" }, // Ryan Rollins
  "38017697": { 2027: "PO" }, // Max Christie
  "210": { 2027: "PO" }, // Buddy Hield
  "666747": { 2027: "PO" }, // Caleb Martin
  "457": { 2027: "PO" }, // Jarred Vanderbilt
  "3547268": { 2027: "PO" }, // Zeke Nnaji
  "377": { 2027: "PO" }, // Bobby Portis
  "378": { 2027: "PO" }, // Kristaps Porziņģis
  "17553979": { 2027: "PO" }, // Jonathan Kuminga
  "38017686": { 2027: "PO" }, // Bennedict Mathurin

  // --- 2028-29 PO ---
  "73": { 2028: "PO" }, // Jalen Brunson
  "18": { 2028: "PO" }, // OG Anunoby
  "473": { 2028: "PO" }, // Derrick White
  "666400": { 2028: "PO" }, // Nickeil Alexander-Walker
  "132": { 2028: "PO" }, // Luka Dončić
  "3547248": { 2028: "PO" }, // Patrick Williams
  "177": { 2028: "PO" }, // Aaron Gordon
  "158": { 2028: "PO" }, // Dorian Finney-Smith
  "57875092": { 2028: "PO" }, // Gui Santos
  "4": { 2028: "PO" }, // Bam Adebayo
  "145": { 2028: "PO" }, // Joel Embiid
  "452": { 2028: "PO" }, // Myles Turner

  // --- 2029-30 PO ---
  "434": { 2029: "PO" }, // Jayson Tatum
  "57": { 2029: "PO" }, // Devin Booker
  "61": { 2029: "PO" }, // Mikal Bridges
  "17896024": { 2029: "PO" }, // Herb Jones
  "17896062": { 2029: "PO" }, // Alperen Şengün
  "231": { 2029: "PO" }, // Jaren Jackson Jr.
  "667378": { 2029: "PO" }, // Naz Reid
  "17553995": { 2029: "PO" }, // Austin Reaves

  // --- 2030-31 PO ---
  "175": { 2030: "PO" }, // Shai Gilgeous-Alexander
  "38017683": { 2030: "PO" }, // Paolo Banchero
};

export function curatedOptionForPlayerSeason(
  playerId: string | number | null | undefined,
  seasonYear: number
): NbaContractOptionFlag | undefined {
  const id = String(playerId ?? "").trim();
  if (!id) return undefined;
  return NBA_CURATED_PLAYER_OPTIONS[id]?.[seasonYear];
}
