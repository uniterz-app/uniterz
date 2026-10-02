/**
 * 2026 NBA Draft ルーキー（draftYear=2026）ROLE — 手振り。
 * 開幕前の見込み: 上位は即戦力〜エース候補、中位以降は育成/素材寄り。
 * ソース: NBA Draft Board + 大学/海外スカウティング要約（2026）。
 */
import type { CuratedRoleRow } from "./nbaCuratedPlayerRoles2026Rest";

export const NBA_CURATED_PLAYER_ROLES_2026_ROOKIES: Readonly<
  Record<string, readonly CuratedRoleRow[]>
> = {
  "nba-wizards": [
    {
      playerId: "1091340077",
      name: "AJ Dybantsa",
      hierarchy: "first_option",
      roles: [
        "three_level_scorer",
        "shot_creator",
        "slashing_wing",
        "transition_threat",
      ],
      note: "BYU · #1 · 6'9 scoring wing / McGrady-Tatum 型の主得点源候補",
    },
    {
      playerId: "1091465991",
      name: "Felix Okpara",
      hierarchy: "developmental",
      roles: [
        "rim_protector",
        "backup_big",
        "lob_threat",
        "rebounder",
      ],
      note: "Tennessee · #46→WAS · リムプロテクション寄りのビッグ",
    },
  ],
  "nba-jazz": [
    {
      playerId: "1091342427",
      name: "Darryn Peterson",
      hierarchy: "first_option",
      roles: [
        "lead_guard",
        "shot_creator",
        "pnr_handler",
        "pull_up_shooter",
      ],
      note: "Kansas · #2 · 攻撃型リードガード / Cade 以降級のガド候補",
    },
  ],
  "nba-grizzlies": [
    {
      playerId: "1091339280",
      name: "Cameron Boozer",
      hierarchy: "nba_ready",
      roles: [
        "hub_big",
        "paint_finisher",
        "passing_big",
        "rebounder",
      ],
      note: "Duke · #3 · 即戦力4/5 · 効率・パス・リバウンドのハブ",
    },
    {
      playerId: "1091351869",
      name: "Karim Lopez",
      hierarchy: "developmental",
      roles: [
        "big_wing",
        "multi_position_defender",
        "connector_wing",
        "floor_spacer",
      ],
      note: "NZ Breakers · #21→MEM · サイズと守備幅のあるビッグウイング",
    },
  ],
  "nba-bulls": [
    {
      playerId: "1091343852",
      name: "Caleb Wilson",
      hierarchy: "high_end_starter",
      roles: [
        "two_way_wing",
        "rim_pressure",
        "rebounder",
        "help_defender",
      ],
      note: "UNC · #4 · アスレチック2ウェイF · シュートは成長課題",
    },
    {
      playerId: "1091353537",
      name: "Dailyn Swain",
      hierarchy: "nba_ready",
      roles: [
        "slashing_wing",
        "rim_pressure",
        "multi_position_defender",
        "energy_wing",
      ],
      note: "Texas · #15 · ドライブと守備幅のあるウイング",
    },
  ],
  "nba-clippers": [
    {
      playerId: "1091343544",
      name: "Keaton Wagler",
      hierarchy: "nba_ready",
      roles: [
        "pnr_handler",
        "pull_up_shooter",
        "secondary_playmaker",
        "spot_up_shooter",
      ],
      note: "Illinois · #5 · オフドリブル射撃とパスのPG · Hali 比較",
    },
    {
      playerId: "1091465658",
      name: "Baba Miller",
      hierarchy: "developmental",
      roles: [
        "stretch_big",
        "passing_big",
        "rebounder",
        "utility_player",
      ],
      note: "Cincinnati · #36 · スキルのある6'11 F · ハンドリング/パス",
    },
    {
      playerId: "1091475805",
      name: "Nick Martinelli",
      hierarchy: "depth_piece",
      roles: [
        "midrange_scorer",
        "floater_game",
        "spot_up_shooter",
        "utility_wing",
      ],
      note: "Northwestern · #55 · クラフティなスコアラー · 異色の中距離",
    },
  ],
  "nba-nets": [
    {
      playerId: "1091339436",
      name: "Mikel Brown Jr.",
      hierarchy: "upside_bet",
      roles: [
        "primary_playmaker",
        "shot_creator",
        "pull_up_shooter",
        "pnr_handler",
      ],
      note: "Louisville · #6 · 最高水準のPG才能 · 怪我明けで育成寄り",
    },
    {
      playerId: "1091361657",
      name: "Joshua Jefferson",
      hierarchy: "nba_ready",
      roles: [
        "secondary_playmaker",
        "connector_wing",
        "spot_up_shooter",
        "rebounder",
      ],
      note: "Iowa State · #28→BKN · ポイントフォワード型の万能F",
    },
    {
      playerId: "1091462892",
      name: "Tyler Bilodeau",
      hierarchy: "developmental",
      roles: [
        "stretch_big",
        "spot_up_shooter",
        "floor_spacer",
        "backup_big",
      ],
      note: "UCLA · #43 · ストレッチ系ビッグ候補",
    },
  ],
  "nba-kings": [
    {
      playerId: "1091338860",
      name: "Darius Acuff Jr.",
      hierarchy: "upside_bet",
      roles: [
        "primary_handler",
        "shot_creator",
        "volume_scorer",
        "advantage_creator",
      ],
      note: "Arkansas · #7 · Trae 型の創造力 · 守備は課題",
    },
    {
      playerId: "1091361855",
      name: "Alex Karaban",
      hierarchy: "specialist",
      roles: [
        "cns_shooter",
        "spot_up_shooter",
        "floor_spacer",
        "glue_guy",
      ],
      note: "UConn · #29→SAC · 優勝経験の sniper · キャッチ&シュート",
    },
    {
      playerId: "1091466685",
      name: "Emanuel Sharp",
      hierarchy: "depth_piece",
      roles: [
        "spot_up_shooter",
        "three_pt_specialist",
        "guard_defender",
        "connector_guard",
      ],
      note: "Houston · #45 · シュート+フィジカル守備の2ガード",
    },
  ],
  "nba-hawks": [
    {
      playerId: "1091340263",
      name: "Kingston Flemings",
      hierarchy: "nba_ready",
      roles: [
        "lead_guard",
        "pnr_handler",
        "transition_threat",
        "table_setter",
      ],
      note: "Houston · #8 · スピードとパスのPG · Parker 比較",
    },
    {
      playerId: "1091350401",
      name: "Zuby Ejiofor",
      hierarchy: "energy_bench",
      roles: [
        "energy_guy",
        "rebounder",
        "help_defender",
        "screen_setter",
      ],
      note: "St. John's · #23 · 高モーターのエナジービッグ",
    },
    {
      playerId: "1091477603",
      name: "Henri Veesaar",
      hierarchy: "developmental",
      roles: [
        "stretch_5",
        "passing_big",
        "paint_finisher",
        "floor_spacer",
      ],
      note: "UNC · #52→ATL · 攻守バランスの7フッター · 守備は課題",
    },
  ],
  "nba-mavericks": [
    {
      playerId: "1091341156",
      name: "Morez Johnson",
      hierarchy: "nba_ready",
      roles: [
        "rebounder",
        "rim_protector",
        "paint_finisher",
        "dirty_work",
      ],
      note: "Michigan · #9 · フィジカル4/5 · シュートが伸びれば天井上昇",
    },
    {
      playerId: "1091350193",
      name: "Sergio De Larrea",
      hierarchy: "developmental",
      roles: [
        "secondary_playmaker",
        "ball_mover",
        "spot_up_shooter",
        "combo_guard",
      ],
      note: "Valencia · #25→DAL · ヨーロッパ仕込みのパッサー",
    },
    {
      playerId: "1091465199",
      name: "Tobi Lawal",
      hierarchy: "raw_prospect",
      roles: [
        "transition_threat",
        "rim_pressure",
        "energy_wing",
        "lob_threat",
      ],
      note: "Virginia Tech · #48 · 超跳躍アスリート · ポジション未定",
    },
  ],
  "nba-bucks": [
    {
      playerId: "1091349754",
      name: "Brayden Burries",
      hierarchy: "nba_ready",
      roles: [
        "combo_guard",
        "three_level_scorer",
        "spot_up_shooter",
        "multi_position_defender",
      ],
      note: "Arizona · #10 · 三レベル・シュートメイクのコンボ",
    },
    {
      playerId: "1091349196",
      name: "Nate Ament",
      hierarchy: "upside_bet",
      roles: [
        "big_wing",
        "floor_spacer",
        "shot_creator",
        "three_d_candidate",
      ],
      note: "Tennessee · #13→MIL · サイズ+シュートのBoom/Bust ウイング",
    },
  ],
  "nba-warriors": [
    {
      playerId: "1091351802",
      name: "Yaxel Lendeborg",
      hierarchy: "nba_ready",
      roles: [
        "multi_position_defender",
        "connector_wing",
        "spot_up_shooter",
        "transition_threat",
      ],
      note: "Michigan · #11 · 年長即戦力 · 守備とつなぎの万能F",
    },
  ],
  "nba-thunder": [
    {
      playerId: "1091351965",
      name: "Aday Mara",
      hierarchy: "nba_ready",
      roles: [
        "rim_protector",
        "defensive_anchor",
        "passing_big",
        "roll_man",
      ],
      note: "Michigan · #12 · 7'3 リムプロテクター · パスとポップの片鱗",
    },
    {
      playerId: "1091353486",
      name: "Bennett Stirtz",
      hierarchy: "rotation_player",
      roles: [
        "secondary_handler",
        "spot_up_shooter",
        "connector_guard",
        "game_manager",
      ],
      note: "Iowa · #16→OKC · 即戦力コネクタPG · サイズとシュート",
    },
    {
      playerId: "1091466034",
      name: "Otega Oweh",
      hierarchy: "developmental",
      roles: [
        "physical_wing",
        "slashing_wing",
        "spot_up_shooter",
        "guard_defender",
      ],
      note: "Kentucky · #41→OKC · フィジカルウイング · シュートフォームは個性的",
    },
  ],
  "nba-hornets": [
    {
      playerId: "1091353463",
      name: "Hannes Steinbach",
      hierarchy: "nba_ready",
      roles: [
        "glass_cleaner",
        "rebounder",
        "paint_finisher",
        "floor_spacer",
      ],
      note: "Washington · #14 · ボード支配のF-C · 3Pも改善中",
    },
    {
      playerId: "1091349204",
      name: "Christian Anderson",
      hierarchy: "developmental",
      roles: [
        "pnr_handler",
        "deep_range_shooter",
        "spot_up_shooter",
        "secondary_playmaker",
      ],
      note: "Texas Tech · #18 · クラス屈指のシューティングPG · サイズ課題",
    },
  ],
  "nba-raptors": [
    {
      playerId: "1091350801",
      name: "Allen Graves",
      hierarchy: "upside_bet",
      roles: [
        "three_d_candidate",
        "spot_up_shooter",
        "help_defender",
        "utility_wing",
      ],
      note: "Santa Clara · #19 · スタッツ詰めのアナリティクス型ウイング",
    },
    {
      playerId: "1091463018",
      name: "Jaden Bradley",
      hierarchy: "bench_creator",
      roles: [
        "poa_defender",
        "secondary_handler",
        "connector_guard",
        "game_manager",
      ],
      note: "Arizona · #50 · Big 12 POY · 守備とベンチ司令塔",
    },
  ],
  "nba-spurs": [
    {
      playerId: "1091352835",
      name: "Jayden Quaintance",
      hierarchy: "raw_prospect",
      roles: [
        "rim_protector",
        "help_defender",
        "switch_defender",
        "lob_threat",
      ],
      note: "Kentucky · #20 · ACL明けの守備素材 · 天井は高い",
    },
    {
      playerId: "1091363216",
      name: "Tarris Reed Jr.",
      hierarchy: "depth_piece",
      roles: [
        "rim_protector",
        "paint_finisher",
        "rebounder",
        "backup_big",
      ],
      note: "UConn · #26→SAS · 即戦力バックアップC",
    },
    {
      playerId: "1091464155",
      name: "Ja'Kobi Gillespie",
      hierarchy: "bench_scorer",
      roles: [
        "shot_creator",
        "pull_up_shooter",
        "spark_plug",
        "guard_defender",
      ],
      note: "Tennessee · #42 · シフトな得点PG · 早期出場の可能性",
    },
    {
      playerId: "1091463115",
      name: "Maliq Brown",
      hierarchy: "developmental",
      roles: [
        "energy_guy",
        "rebounder",
        "cutter",
        "help_defender",
      ],
      note: "Duke · #44 · エナジー系フォワード",
    },
  ],
  "nba-76ers": [
    {
      playerId: "1091352730",
      name: "Labaron Philon",
      hierarchy: "upside_bet",
      roles: [
        "primary_handler",
        "drive_creator",
        "transition_threat",
        "shot_creator",
      ],
      note: "Alabama · #22 · 方向転換と視線操作のダイナミックPG",
    },
  ],
  "nba-lakers": [
    {
      playerId: "1091349831",
      name: "Cameron Carr",
      hierarchy: "upside_bet",
      roles: [
        "slashing_wing",
        "movement_shooter",
        "pull_up_shooter",
        "transition_threat",
      ],
      note: "Baylor · #24→LAL · ツールとシュートアップサイドのウイング",
    },
  ],
  "nba-celtics": [
    {
      playerId: "1091360181",
      name: "Chris Cenac Jr.",
      hierarchy: "project_player",
      roles: [
        "rim_protector",
        "rebounder",
        "stretch_big",
        "lob_threat",
      ],
      note: "Houston · #27 · サイズ/運動量の素材ビッグ · 完成まで時間",
    },
    {
      playerId: "1091465698",
      name: "Dillon Mitchell",
      hierarchy: "specialist",
      roles: [
        "defensive_wing",
        "multi_position_defender",
        "hustle_player",
        "dirty_work",
      ],
      note: "St. John's · #40 · 守備特化ウイング · シュートほぼ無し",
    },
  ],
  "nba-suns": [
    {
      playerId: "1091362981",
      name: "Koa Peat",
      hierarchy: "role_player",
      roles: [
        "physical_wing",
        "dirty_work",
        "rebounder",
        "glue_guy",
      ],
      note: "Arizona · #30→PHX · タフネスの接着剤PF · シュートが鍵",
    },
  ],
  "nba-rockets": [
    {
      playerId: "1091467104",
      name: "Bruce Thornton",
      hierarchy: "developmental",
      roles: [
        "secondary_handler",
        "spot_up_shooter",
        "connector_guard",
        "pnr_handler",
      ],
      note: "Ohio State · #31→HOU · 安定型ガード候補",
    },
  ],
  "nba-timberwolves": [
    {
      playerId: "1091463885",
      name: "Isaiah Evans",
      hierarchy: "specialist",
      roles: [
        "deep_range_shooter",
        "movement_shooter",
        "spot_up_shooter",
        "three_pt_specialist",
      ],
      note: "Duke · #33→MIN · ダイナミック射手 · 守備/総合影響は課題",
    },
  ],
  "nba-cavaliers": [
    {
      playerId: "1091467074",
      name: "Meleek Thomas",
      hierarchy: "developmental",
      roles: [
        "spot_up_shooter",
        "pull_up_shooter",
        "poa_defender",
        "combo_guard",
      ],
      note: "Arkansas · #34→CLE · キャッチ＆ドリブル双方の射手",
    },
  ],
  "nba-nuggets": [
    {
      playerId: "1091463040",
      name: "Trevon Brazile",
      hierarchy: "project_player",
      roles: [
        "big_wing",
        "rim_pressure",
        "help_defender",
        "lob_threat",
      ],
      note: "Arkansas · #35→DEN · サイズ/アスリートの遅咲き素材",
    },
    {
      playerId: "1091464608",
      name: "Bryce Hopkins",
      hierarchy: "depth_piece",
      roles: [
        "physical_wing",
        "multi_position_defender",
        "spot_up_shooter",
        "rebounder",
      ],
      note: "St. John's · #49 · フィジカルウイング · ディフェンス幅",
    },
  ],
  "nba-heat": [
    {
      playerId: "1091463429",
      name: "Ryan Conwell",
      hierarchy: "bench_scorer",
      roles: [
        "shot_creator",
        "pull_up_shooter",
        "combo_guard",
        "spark_plug",
      ],
      note: "Louisville · #37→MIA · ショットメイカー型スコアラー",
    },
  ],
  "nba-pacers": [
    {
      playerId: "1091466792",
      name: "Braden Smith",
      hierarchy: "bench_creator",
      roles: [
        "primary_playmaker",
        "pnr_handler",
        "table_setter",
        "decision_maker",
      ],
      note: "Purdue · #38→IND · NCAA 通算アシスト王 · サイズ課題",
    },
  ],
  "nba-pistons": [
    {
      playerId: "1091352549",
      name: "Ebuka Okorie",
      hierarchy: "developmental",
      roles: [
        "shot_creator",
        "rim_pressure",
        "transition_threat",
        "combo_guard",
      ],
      note: "Stanford · #17→DET · 急上昇スコアガード · サイズは課題",
    },
    {
      playerId: "1091476372",
      name: "Ugonna Onyenso",
      hierarchy: "specialist",
      roles: [
        "rim_protector",
        "help_defender",
        "weakside_rotator",
        "backup_big",
      ],
      note: "Virginia · #53→DET · ブロック率エリートの守備特化C",
    },
  ],
  "nba-magic": [
    {
      playerId: "1091465870",
      name: "Izaiyah Nelson",
      hierarchy: "energy_bench",
      roles: [
        "energy_guy",
        "hustle_player",
        "rebounder",
        "rim_pressure",
      ],
      note: "USF · #51→ORL · AAC POY · 高モーターのアスリート",
    },
  ],
  "nba-pelicans": [
    {
      playerId: "1091481720",
      name: "Jaron Pierre Jr.",
      hierarchy: "fringe_nba",
      roles: [
        "slashing_wing",
        "spot_up_shooter",
        "utility_wing",
        "secondary_handler",
      ],
      note: "SMU · #58 · スラッシュ寄りウイング · 定着はこれから",
    },
  ],
};
