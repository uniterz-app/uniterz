/**
 * BDL は Two-Way / Exhibit 10 を契約エンドポイントで返さない。
 * Two-Way は Hoops Rumors tracker 等の curated。
 * Exhibit 10 = ロスター在籍 + 標準年俸なし + この表に無い。
 *
 * 出典: Hoops Rumors 2026/27 Two-Way Contract Tracker（2026-09-21 更新）
 * playerId は BDL / ロスター ID。
 */
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { playerIdLookupSet } from "@/lib/nba/playerIdAliases";

export type NbaTwoWayPlayerEntry = {
  playerId: string;
  teamId: string;
  name: string;
};

/** seasonKey → Two-Way 選手 */
export const NBA_TWO_WAY_PLAYERS_BY_SEASON: Readonly<
  Record<string, readonly NbaTwoWayPlayerEntry[]>
> = {
  "2026-27": [
    { playerId: "1028274126", teamId: "nba-hawks", name: "RayJ Dennis" },
    { playerId: "1057846172", teamId: "nba-hawks", name: "Keshon Gilbert" },
    { playerId: "56677722", teamId: "nba-hawks", name: "Jalen Wilson" },
    { playerId: "1057396966", teamId: "nba-celtics", name: "Amari Williams" },
    { playerId: "1091465698", teamId: "nba-celtics", name: "Dillon Mitchell" },
    { playerId: "1057846840", teamId: "nba-nets", name: "Chaney Johnson" },
    { playerId: "1091462892", teamId: "nba-nets", name: "Tyler Bilodeau" },
    { playerId: "1059875475", teamId: "nba-nets", name: "Grant Nelson" },
    { playerId: "1028244692", teamId: "nba-hornets", name: "PJ Hall" },
    { playerId: "1092116264", teamId: "nba-hornets", name: "Michael Ajayi" },
    { playerId: "1092116681", teamId: "nba-hornets", name: "Kylan Boswell" },
    { playerId: "1091903404", teamId: "nba-bulls", name: "Tobe Awaka" },
    { playerId: "1091907371", teamId: "nba-bulls", name: "Jaylin Sellers" },
    { playerId: "1028244219", teamId: "nba-cavaliers", name: "Tristan Enaruna" },
    { playerId: "1028245994", teamId: "nba-cavaliers", name: "Riley Minix" },
    { playerId: "1091907917", teamId: "nba-cavaliers", name: "Ernest Udeh, Jr." },
    { playerId: "1057848244", teamId: "nba-mavericks", name: "John Poulakidas" },
    { playerId: "1091465199", teamId: "nba-mavericks", name: "Tobi Lawal" },
    { playerId: "56677839", teamId: "nba-mavericks", name: "Jett Howard" },
    { playerId: "1028038474", teamId: "nba-nuggets", name: "K.J. Simpson" },
    { playerId: "1091464608", teamId: "nba-nuggets", name: "Bryce Hopkins" },
    { playerId: "56677831", teamId: "nba-nuggets", name: "Cam Whitmore" },
    { playerId: "1028205331", teamId: "nba-pistons", name: "Isaac Jones" },
    { playerId: "1091476372", teamId: "nba-pistons", name: "Ugonna Onyenso" },
    { playerId: "1028264794", teamId: "nba-pistons", name: "Elijah Harkless" },
    { playerId: "1057968644", teamId: "nba-warriors", name: "LJ Cryer" },
    { playerId: "1028265620", teamId: "nba-warriors", name: "Malevy Leons" },
    { playerId: "1097894227", teamId: "nba-warriors", name: "Graham Ike" },
    { playerId: "1092195008", teamId: "nba-rockets", name: "Quadir Copeland" },
    { playerId: "1058921044", teamId: "nba-rockets", name: "Sean Pedulla" },
    { playerId: "1094642691", teamId: "nba-rockets", name: "Rafael Castro" },
    { playerId: "56677849", teamId: "nba-pacers", name: "Kobe Brown" },
    { playerId: "56677862", teamId: "nba-pacers", name: "Jalen Slawson" },
    { playerId: "1091466792", teamId: "nba-pacers", name: "Braden Smith" },
    { playerId: "1091475805", teamId: "nba-clippers", name: "Nick Martinelli" },
    { playerId: "1028256970", teamId: "nba-clippers", name: "Jamarion Sharp" },
    { playerId: "56677582", teamId: "nba-clippers", name: "Jalen Pickett" },
    { playerId: "1057847504", teamId: "nba-lakers", name: "Chris Mañon" },
    { playerId: "1091906694", teamId: "nba-lakers", name: "AK Okereke" },
    { playerId: "1092732494", teamId: "nba-lakers", name: "Arthur Kaluma" },
    { playerId: "1057396260", teamId: "nba-grizzlies", name: "Javon Small" },
    { playerId: "1057394959", teamId: "nba-grizzlies", name: "Jahmai Mashack" },
    { playerId: "1091904403", teamId: "nba-heat", name: "Tre Donaldson" },
    { playerId: "1057846206", teamId: "nba-heat", name: "Vladislav Goldin" },
    { playerId: "1028125584", teamId: "nba-heat", name: "Keshad Johnson" },
    { playerId: "1028266882", teamId: "nba-bucks", name: "Cormac Ryan" },
    { playerId: "1057389374", teamId: "nba-bucks", name: "Kam Jones" },
    { playerId: "1057397172", teamId: "nba-timberwolves", name: "Rocco Zikarsky" },
    { playerId: "1028112004", teamId: "nba-timberwolves", name: "Zyon Pullin" },
    { playerId: "1028045812", teamId: "nba-timberwolves", name: "Enrique Freeman" },
    { playerId: "1091481720", teamId: "nba-pelicans", name: "Jaron Pierre Jr." },
    { playerId: "1094002723", teamId: "nba-pelicans", name: "Malik Dia" },
    { playerId: "1057392335", teamId: "nba-thunder", name: "Brooks Barnhizer" },
    { playerId: "1091904395", teamId: "nba-thunder", name: "Josh Dix" },
    { playerId: "1091466034", teamId: "nba-thunder", name: "Otega Oweh" },
    { playerId: "56677738", teamId: "nba-magic", name: "Colin Castleton" },
    { playerId: "1028271147", teamId: "nba-magic", name: "Alex Morales" },
    { playerId: "1091465870", teamId: "nba-magic", name: "Izaiyah Nelson" },
    { playerId: "1057847330", teamId: "nba-76ers", name: "Caleb Love" },
    { playerId: "56677829", teamId: "nba-76ers", name: "Rayan Rupert" },
    { playerId: "1057846700", teamId: "nba-suns", name: "CJ Huntley" },
    { playerId: "795959473", teamId: "nba-suns", name: "Pat Spencer" },
    { playerId: "1057387526", teamId: "nba-suns", name: "Koby Brea" },
    { playerId: "1057849685", teamId: "nba-blazers", name: "Chris Youngblood" },
    { playerId: "1076658911", teamId: "nba-blazers", name: "Jayson Kent" },
    { playerId: "1057396603", teamId: "nba-blazers", name: "John Tonje" },
    { playerId: "436846673", teamId: "nba-kings", name: "Adam Flagler" },
    { playerId: "1028037494", teamId: "nba-kings", name: "Jonathan Mogbo" },
    { playerId: "1091464155", teamId: "nba-spurs", name: "Ja'Kobi Gillespie" },
    { playerId: "1091463115", teamId: "nba-spurs", name: "Maliq Brown" },
    { playerId: "1028245237", teamId: "nba-spurs", name: "David Jones" },
    { playerId: "1057846535", teamId: "nba-raptors", name: "Chucky Hepburn" },
    { playerId: "64269023", teamId: "nba-raptors", name: "Trey Jemison" },
    { playerId: "1059753274", teamId: "nba-raptors", name: "Malachi Smith" },
    { playerId: "1028214958", teamId: "nba-jazz", name: "Blake Hinson" },
    { playerId: "1057844839", teamId: "nba-jazz", name: "Tamar Bates" },
    { playerId: "1028203085", teamId: "nba-jazz", name: "Trey Alexander" },
    { playerId: "1057391756", teamId: "nba-wizards", name: "Jamir Watkins" },
    { playerId: "1091465991", teamId: "nba-wizards", name: "Felix Okpara" },
  ],
};

const idSetsBySeason = new Map<string, Set<string>>();

function twoWayIdSet(seasonKey: string): Set<string> {
  const key = (seasonKey || CURRENT_NBA_SEASON_KEY).trim() || CURRENT_NBA_SEASON_KEY;
  let set = idSetsBySeason.get(key);
  if (set) return set;
  set = new Set<string>();
  for (const row of NBA_TWO_WAY_PLAYERS_BY_SEASON[key] ?? []) {
    for (const id of playerIdLookupSet(row.playerId)) set.add(id);
  }
  idSetsBySeason.set(key, set);
  return set;
}

export function isCuratedTwoWayPlayer(
  playerId: string | number | null | undefined,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): boolean {
  const id = String(playerId ?? "").trim();
  if (!id) return false;
  const set = twoWayIdSet(seasonKey);
  for (const cand of playerIdLookupSet(id)) {
    if (set.has(cand)) return true;
  }
  return false;
}

export function curatedTwoWayPlayersForSeason(
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): readonly NbaTwoWayPlayerEntry[] {
  const key = (seasonKey || CURRENT_NBA_SEASON_KEY).trim() || CURRENT_NBA_SEASON_KEY;
  return NBA_TWO_WAY_PLAYERS_BY_SEASON[key] ?? [];
}
