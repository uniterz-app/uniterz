/**
 * PLAYER ROLE — 手振り（curated）。
 * 辞書: `nbaPlayerRoleTaxonomy.ts`
 * ルール: 序列タグ 1 + 役割タグ 2〜4。自動判定なし。
 * Franchise Player = 同一チーム10年以上在籍のみ（Curry / Jokic / Embiid / Booker 等）。
 * 進捗: 全30チーム完了。
 */
import type { DetailInsightChip } from "@/lib/nba/detailInsights/detailInsightTypes";
import { enrichInsightChips } from "@/lib/nba/detailInsights/detailChipCopy";
import { NBA_CURATED_PLAYER_ROLES_2026_REST } from "./nbaCuratedPlayerRoles2026Rest";
import {
  HIERARCHY_LABEL,
  MAX_ROLE_TAGS,
  MIN_ROLE_TAGS,
  ROLE_TAG_LABEL,
  type NbaHierarchyTagId,
  type NbaRoleTagId,
} from "@/lib/nba/detailInsights/nbaPlayerRoleTaxonomy";

export type NbaCuratedPlayerRole = {
  playerId: string;
  /** 監査用表示名 */
  name: string;
  /** 序列タグ（必ず1） */
  hierarchy: NbaHierarchyTagId;
  /** 役割タグ（2〜4） */
  roles: readonly NbaRoleTagId[];
  note?: string;
};

/**
 * seasonKey → teamId → players。
 */
export const NBA_CURATED_PLAYER_ROLES: Readonly<
  Record<string, Readonly<Record<string, readonly NbaCuratedPlayerRole[]>>>
> = {
  "2026-27": {
    /**
     * Boston Celtics — 1チーム目（新辞書・精度確認）。
     * 序列1 + 役割2〜4。0mpg 深ベンチは未ラベル。
     */
    "nba-celtics": [
      {
        playerId: "434",
        name: "Jayson Tatum",
        hierarchy: "first_option",
        roles: [
          "volume_scorer",
          "three_level_scorer",
          "shot_creator",
          "late_clock_creator",
        ],
      },
      {
        playerId: "172",
        name: "Paul George",
        hierarchy: "second_option",
        roles: ["two_way_wing", "shot_creator", "wing_stopper", "spot_up_shooter"],
      },
      {
        playerId: "473",
        name: "Derrick White",
        hierarchy: "third_option",
        roles: ["three_d_wing", "poa_defender", "secondary_handler"],
      },
      {
        playerId: "3547276",
        name: "Payton Pritchard",
        hierarchy: "sixth_man",
        roles: [
          "floor_spacer",
          "cns_shooter",
          "connector_guard",
          "secondary_handler",
        ],
      },
      {
        playerId: "17553967",
        name: "Neemias Queta",
        hierarchy: "starter",
        roles: ["roll_man", "rim_protector", "glass_cleaner"],
      },
      {
        playerId: "17896060",
        name: "Sam Hauser",
        hierarchy: "specialist",
        roles: [
          "floor_spacer",
          "cns_shooter",
          "spot_up_shooter",
          "three_pt_specialist",
        ],
        note: "シューター専門。Sixth Man / Wing Stopper ではない",
      },
      {
        playerId: "399",
        name: "Mitchell Robinson",
        hierarchy: "key_rotation",
        roles: [
          "screen_setter",
          "glass_cleaner",
          "rebounder",
          "rim_protector",
        ],
        note: "オフェンスリバウンド込みで Rebounder / Glass Cleaner",
      },
      {
        playerId: "1028028434",
        name: "Baylor Scheierman",
        hierarchy: "rotation_player",
        roles: ["three_d_wing", "floor_spacer", "hustle_player"],
      },
      {
        playerId: "1028025242",
        name: "Devin Carter",
        hierarchy: "rotation_player",
        roles: [
          "secondary_handler",
          "hustle_player",
          "connector",
          "guard_defender",
        ],
      },
      {
        playerId: "104",
        name: "Mike Conley",
        hierarchy: "bench_creator",
        roles: ["playmaker", "game_manager", "connector", "table_setter"],
      },
      {
        playerId: "56677864",
        name: "Jordan Walsh",
        hierarchy: "energy_bench",
        roles: ["energy_wing", "hustle_player", "defensive_specialist"],
      },
      {
        playerId: "17896056",
        name: "Luka Garza",
        hierarchy: "bench_scorer",
        roles: ["stretch_big", "backup_big", "paint_finisher"],
      },
      {
        playerId: "1057277425",
        name: "Hugo González",
        hierarchy: "developmental",
        roles: ["defensive_wing", "hustle_player", "energy_guy"],
      },
      {
        playerId: "38017717",
        name: "Ron Harper Jr.",
        hierarchy: "depth_piece",
        roles: ["cns_shooter", "spot_up_shooter", "corner_shooter", "three_d_candidate"],
        note: "3&D Wing ではなく Candidate（ウイング系1つ）",
      },
      {
        playerId: "1057396966",
        name: "Amari Williams",
        hierarchy: "developmental",
        roles: ["backup_big", "rim_protector", "rebounder"],
      },
      // Hayden Gray / 0mpg rookies — 未登録
    ],

    /**
     * Philadelphia 76ers — 2チーム目。
     * ロスター: 2026-27 Firestore（Maxey / Brown / Embiid / LeBron 等）。
     * ウイング系・Stretch/Shooting Big は各1。0mpg は未ラベル。
     */
    "nba-76ers": [
      {
        playerId: "3547254",
        name: "Tyrese Maxey",
        hierarchy: "first_option",
        roles: [
          "primary_handler",
          "volume_scorer",
          "shot_creator",
          "pull_up_shooter",
        ],
      },
      {
        playerId: "70",
        name: "Jaylen Brown",
        hierarchy: "second_option",
        roles: [
          "volume_scorer",
          "shot_creator",
          "two_way_wing",
          "slasher",
        ],
      },
      {
        playerId: "145",
        name: "Joel Embiid",
        hierarchy: "franchise_player",
        roles: [
          "post_scorer",
          "three_level_scorer",
          "shot_creator",
          "late_clock_creator",
        ],
      },
      {
        playerId: "237",
        name: "LeBron James",
        hierarchy: "star_role",
        roles: [
          "primary_playmaker",
          "decision_maker",
          "advantage_creator",
          "slashing_wing",
        ],
      },
      {
        playerId: "1057261935",
        name: "VJ Edgecombe",
        hierarchy: "high_end_starter",
        roles: [
          "two_way_wing",
          "secondary_handler",
          "poa_defender",
          "hustle_player",
        ],
      },
      {
        playerId: "419",
        name: "Anfernee Simons",
        hierarchy: "sixth_man",
        roles: [
          "shot_creator",
          "pull_up_shooter",
          "spot_up_shooter",
          "floor_spacer",
        ],
      },
      {
        playerId: "38017730",
        name: "Dominick Barlow",
        hierarchy: "rotation_player",
        roles: [
          "defensive_wing",
          "hustle_player",
          "energy_guy",
          "rebounder",
        ],
      },
      {
        playerId: "666940",
        name: "Dean Wade",
        hierarchy: "specialist",
        roles: [
          "three_d_wing",
          "floor_spacer",
          "corner_shooter",
          "cns_shooter",
        ],
      },
      {
        playerId: "81",
        name: "Kentavious Caldwell-Pope",
        hierarchy: "high_end_role_player",
        roles: [
          "three_d_wing",
          "poa_defender",
          "cns_shooter",
          "floor_spacer",
        ],
      },
      {
        playerId: "1057847330",
        name: "Caleb Love",
        hierarchy: "bench_scorer",
        roles: [
          "shot_creator",
          "combo_guard",
          "pull_up_shooter",
          "secondary_handler",
        ],
      },
      {
        playerId: "1028034846",
        name: "Adem Bona",
        hierarchy: "key_rotation",
        roles: [
          "rim_protector",
          "roll_man",
          "lob_threat",
          "energy_guy",
        ],
      },
      {
        playerId: "56677829",
        name: "Rayan Rupert",
        hierarchy: "depth_piece",
        roles: ["energy_wing", "hustle_player", "utility_player"],
      },
      {
        playerId: "1028214238",
        name: "Justin Edwards",
        hierarchy: "depth_piece",
        roles: [
          "floor_spacer",
          "energy_wing",
          "hustle_player",
          "cns_shooter",
        ],
      },
      {
        playerId: "38017711",
        name: "Jabari Walker",
        hierarchy: "energy_bench",
        roles: [
          "energy_wing",
          "hustle_player",
          "rebounder",
          "dirty_work",
        ],
      },
      {
        playerId: "1028046422",
        name: "Ariel Hukporti",
        hierarchy: "depth_piece",
        roles: ["backup_big", "rim_protector", "rebounder"],
      },
      {
        playerId: "1028026812",
        name: "Dillon Jones",
        hierarchy: "end_of_bench",
        roles: ["energy_guy", "hustle_player", "utility_player"],
      },
      // 0mpg — 未登録
    ],
    ...NBA_CURATED_PLAYER_ROLES_2026_REST,
  },
};

function assertCurated(entry: NbaCuratedPlayerRole): void {
  const n = entry.roles.length;
  if (n < MIN_ROLE_TAGS || n > MAX_ROLE_TAGS) {
    throw new Error(
      `${entry.name}: roles must be ${MIN_ROLE_TAGS}–${MAX_ROLE_TAGS}, got ${n}`
    );
  }
  const uniq = new Set(entry.roles);
  if (uniq.size !== n) {
    throw new Error(`${entry.name}: duplicate role tags`);
  }
}

export function curatedPlayerRoleEntry(
  seasonKey: string,
  playerId: string | null | undefined
): NbaCuratedPlayerRole | null {
  const want = String(playerId ?? "").trim();
  if (!want) return null;
  const byTeam = NBA_CURATED_PLAYER_ROLES[seasonKey];
  if (!byTeam) return null;
  for (const list of Object.values(byTeam)) {
    const hit = list.find((p) => p.playerId === want);
    if (hit) {
      assertCurated(hit);
      return hit;
    }
  }
  return null;
}

/**
 * シーズン不明時: 全登録から playerId で探す。
 * teamId があればそのチームのエントリを優先。
 */
export function findCuratedPlayerRole(
  playerId: string | null | undefined,
  teamId?: string | null
): NbaCuratedPlayerRole | null {
  const want = String(playerId ?? "").trim();
  if (!want) return null;
  const preferTeam = String(teamId ?? "").trim();
  let fallback: NbaCuratedPlayerRole | null = null;
  for (const byTeam of Object.values(NBA_CURATED_PLAYER_ROLES)) {
    for (const [tid, list] of Object.entries(byTeam)) {
      const hit = list.find((p) => p.playerId === want);
      if (!hit) continue;
      assertCurated(hit);
      if (preferTeam && tid === preferTeam) return hit;
      if (!fallback) fallback = hit;
    }
  }
  return fallback;
}

export function buildCuratedPlayerRoleChips(
  entry: NbaCuratedPlayerRole | null | undefined
): DetailInsightChip[] {
  if (!entry) return [];
  assertCurated(entry);
  const raw = [
    {
      id: entry.hierarchy,
      label: HIERARCHY_LABEL[entry.hierarchy],
      category: "hierarchy",
      score: 100,
    },
    ...entry.roles.map((id, i) => ({
      id,
      label: ROLE_TAG_LABEL[id],
      category: "role",
      score: 50 - i,
    })),
  ];
  return enrichInsightChips(raw);
}
