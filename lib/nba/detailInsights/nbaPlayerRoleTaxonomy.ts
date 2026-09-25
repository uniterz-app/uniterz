/**
 * PLAYER ROLE 辞書 — 序列タグ 1 + 役割タグ 2〜4
 *
 * 表示ルール:
 * - 序列タグ（hierarchy）は必ず 1
 * - 役割タグ（roles）は 2〜4
 * - 自動判定なし。curated のみ
 */
export type NbaHierarchyTagId =
  // エース・主力系
  | "first_option"
  | "second_option"
  | "third_option"
  | "core_player"
  | "franchise_player"
  | "all_star_level"
  | "star_role"
  // スターター・ローテ系
  | "starter"
  | "high_end_starter"
  | "low_end_starter"
  | "rotation_player"
  | "key_rotation"
  | "role_player"
  | "high_end_role_player"
  | "specialist"
  // ベンチ系
  | "sixth_man"
  | "bench_scorer"
  | "bench_creator"
  | "energy_bench"
  | "depth_piece"
  | "end_of_bench"
  | "two_way_level"
  | "g_league_call_up"
  // 育成・不確定系
  | "developmental"
  | "project_player"
  | "upside_bet"
  | "raw_prospect"
  | "nba_ready"
  | "fringe_nba"
  | "camp_body";

export type NbaRoleTagId =
  // ハンドラー系
  | "primary_handler"
  | "secondary_handler"
  | "pnr_handler"
  | "lead_guard"
  | "combo_guard"
  | "game_manager"
  | "table_setter"
  | "connector_guard"
  // クリエイター系
  | "shot_creator"
  | "on_ball_creator"
  | "self_creator"
  | "iso_scorer"
  | "advantage_creator"
  | "paint_touch_creator"
  | "drive_creator"
  | "late_clock_creator"
  // スコアラー系
  | "three_level_scorer"
  | "volume_scorer"
  | "efficient_scorer"
  | "slasher"
  | "rim_pressure"
  | "midrange_scorer"
  | "pull_up_shooter"
  | "floater_game"
  | "post_scorer"
  | "mismatch_scorer"
  // シューター系
  | "cns_shooter"
  | "spot_up_shooter"
  | "movement_shooter"
  | "deep_range_shooter"
  | "floor_spacer"
  | "shooting_big"
  | "stretch_big"
  | "corner_shooter"
  | "three_pt_specialist"
  // ウイング系
  | "three_d_wing"
  | "three_d_candidate"
  | "defensive_wing"
  | "physical_wing"
  | "big_wing"
  | "utility_wing"
  | "energy_wing"
  | "slashing_wing"
  | "connector_wing"
  | "two_way_wing"
  // ビッグマン系
  | "rim_protector"
  | "roll_man"
  | "lob_threat"
  | "paint_finisher"
  | "rebounder"
  | "glass_cleaner"
  | "screen_setter"
  | "dho_hub"
  | "high_post_hub"
  | "short_roll_playmaker"
  | "stretch_5"
  | "small_ball_5"
  | "backup_big"
  // パサー・司令塔系
  | "playmaker"
  | "primary_playmaker"
  | "secondary_playmaker"
  | "passing_big"
  | "hub_big"
  | "connector"
  | "decision_maker"
  | "ball_mover"
  // 守備系
  | "poa_defender"
  | "perimeter_defender"
  | "wing_stopper"
  | "guard_defender"
  | "multi_position_defender"
  | "switch_defender"
  | "help_defender"
  | "chase_defender"
  | "defensive_specialist"
  | "defensive_anchor"
  | "weakside_rotator"
  // エナジー・ロール系
  | "energy_guy"
  | "hustle_player"
  | "glue_guy"
  | "utility_player"
  | "culture_guy"
  | "spark_plug"
  | "dirty_work"
  | "transition_threat"
  | "cutter"
  | "off_ball_mover";

export type TagMeta = {
  id: string;
  label: string;
  /** 辞書の意味（JA） */
  meaningJa: string;
  groupJa: string;
};

export const HIERARCHY_TAGS: readonly TagMeta[] = [
  // エース・主力系
  { id: "first_option", label: "1st Option", meaningJa: "チームの第1得点源・中心", groupJa: "エース・主力系" },
  { id: "second_option", label: "2nd Option", meaningJa: "セカンドスター・2番手の得点源", groupJa: "エース・主力系" },
  { id: "third_option", label: "3rd Option", meaningJa: "3番手の得点源・補助スコアラー", groupJa: "エース・主力系" },
  { id: "core_player", label: "Core Player", meaningJa: "長期中核", groupJa: "エース・主力系" },
  { id: "franchise_player", label: "Franchise Player", meaningJa: "同一チームに10年以上在籍している球団の顔", groupJa: "エース・主力系" },
  { id: "all_star_level", label: "All-Star Level", meaningJa: "オールスター級", groupJa: "エース・主力系" },
  { id: "star_role", label: "Star Role", meaningJa: "スター寄りの役割", groupJa: "エース・主力系" },
  // スターター・ローテ系
  { id: "starter", label: "Starter", meaningJa: "スターター級", groupJa: "スターター・ローテ系" },
  { id: "high_end_starter", label: "High-End Starter", meaningJa: "上位スターター", groupJa: "スターター・ローテ系" },
  { id: "low_end_starter", label: "Low-End Starter", meaningJa: "下位スターター", groupJa: "スターター・ローテ系" },
  { id: "rotation_player", label: "Rotation Player", meaningJa: "ローテーション要員", groupJa: "スターター・ローテ系" },
  { id: "key_rotation", label: "Key Rotation", meaningJa: "重要ローテ", groupJa: "スターター・ローテ系" },
  { id: "role_player", label: "Role Player", meaningJa: "ロールプレイヤー", groupJa: "スターター・ローテ系" },
  { id: "high_end_role_player", label: "High-End Role Player", meaningJa: "上位ロールマン", groupJa: "スターター・ローテ系" },
  { id: "specialist", label: "Specialist", meaningJa: "特定役割の専門職", groupJa: "スターター・ローテ系" },
  // ベンチ系
  { id: "sixth_man", label: "Sixth Man", meaningJa: "シックスマン", groupJa: "ベンチ系" },
  { id: "bench_scorer", label: "Bench Scorer", meaningJa: "ベンチ得点役", groupJa: "ベンチ系" },
  { id: "bench_creator", label: "Bench Creator", meaningJa: "ベンチの司令塔・生成役", groupJa: "ベンチ系" },
  { id: "energy_bench", label: "Energy Bench", meaningJa: "ベンチから流れを変える選手", groupJa: "ベンチ系" },
  { id: "depth_piece", label: "Depth Piece", meaningJa: "控え枠", groupJa: "ベンチ系" },
  { id: "end_of_bench", label: "End of Bench", meaningJa: "ベンチ末端", groupJa: "ベンチ系" },
  { id: "two_way_level", label: "Two-Way Level", meaningJa: "2way契約級", groupJa: "ベンチ系" },
  { id: "g_league_call_up", label: "G League Call-Up", meaningJa: "Gリーグ昇格候補", groupJa: "ベンチ系" },
  // 育成・不確定系
  { id: "developmental", label: "Developmental", meaningJa: "育成枠", groupJa: "育成・不確定系" },
  { id: "project_player", label: "Project Player", meaningJa: "素材型", groupJa: "育成・不確定系" },
  { id: "upside_bet", label: "Upside Bet", meaningJa: "ポテンシャル枠", groupJa: "育成・不確定系" },
  { id: "raw_prospect", label: "Raw Prospect", meaningJa: "未完成素材", groupJa: "育成・不確定系" },
  { id: "nba_ready", label: "NBA Ready", meaningJa: "即戦力寄り", groupJa: "育成・不確定系" },
  { id: "fringe_nba", label: "Fringe NBA", meaningJa: "NBA定着ライン上", groupJa: "育成・不確定系" },
  { id: "camp_body", label: "Camp Body", meaningJa: "キャンプ要員", groupJa: "育成・不確定系" },
] as const;

export const ROLE_TAGS: readonly TagMeta[] = [
  // ハンドラー系
  { id: "primary_handler", label: "Primary Handler", meaningJa: "メインハンドラー", groupJa: "ハンドラー系" },
  { id: "secondary_handler", label: "Secondary Handler", meaningJa: "セカンドハンドラー", groupJa: "ハンドラー系" },
  { id: "pnr_handler", label: "PnR Handler", meaningJa: "ピック&ロール操作役", groupJa: "ハンドラー系" },
  { id: "lead_guard", label: "Lead Guard", meaningJa: "司令塔ガード", groupJa: "ハンドラー系" },
  { id: "combo_guard", label: "Combo Guard", meaningJa: "PG/SG兼用", groupJa: "ハンドラー系" },
  { id: "game_manager", label: "Game Manager", meaningJa: "安定運用型PG", groupJa: "ハンドラー系" },
  { id: "table_setter", label: "Table Setter", meaningJa: "味方を活かすセット役", groupJa: "ハンドラー系" },
  { id: "connector_guard", label: "Connector Guard", meaningJa: "ボールを止めないガード", groupJa: "ハンドラー系" },
  // クリエイター系
  { id: "shot_creator", label: "Shot Creator", meaningJa: "自分でシュートを作る", groupJa: "クリエイター系" },
  { id: "on_ball_creator", label: "On-Ball Creator", meaningJa: "ボール保持から作る", groupJa: "クリエイター系" },
  { id: "self_creator", label: "Self Creator", meaningJa: "自力得点型", groupJa: "クリエイター系" },
  { id: "iso_scorer", label: "Iso Scorer", meaningJa: "アイソ得点役", groupJa: "クリエイター系" },
  { id: "advantage_creator", label: "Advantage Creator", meaningJa: "ズレを作る選手", groupJa: "クリエイター系" },
  { id: "paint_touch_creator", label: "Paint Touch Creator", meaningJa: "ペイント侵入で崩す", groupJa: "クリエイター系" },
  { id: "drive_creator", label: "Drive Creator", meaningJa: "ドライブ起点", groupJa: "クリエイター系" },
  { id: "late_clock_creator", label: "Late Clock Creator", meaningJa: "ショットクロック終盤担当", groupJa: "クリエイター系" },
  // スコアラー系
  { id: "three_level_scorer", label: "3-Level Scorer", meaningJa: "3段階得点型", groupJa: "スコアラー系" },
  { id: "volume_scorer", label: "Volume Scorer", meaningJa: "大量得点型", groupJa: "スコアラー系" },
  { id: "efficient_scorer", label: "Efficient Scorer", meaningJa: "効率型得点役", groupJa: "スコアラー系" },
  { id: "slasher", label: "Slasher", meaningJa: "リムアタック型", groupJa: "スコアラー系" },
  { id: "rim_pressure", label: "Rim Pressure", meaningJa: "リム圧力", groupJa: "スコアラー系" },
  { id: "midrange_scorer", label: "Midrange Scorer", meaningJa: "ミドル得点型", groupJa: "スコアラー系" },
  { id: "pull_up_shooter", label: "Pull-up Shooter", meaningJa: "プルアップ型", groupJa: "スコアラー系" },
  { id: "floater_game", label: "Floater Game", meaningJa: "フローター型", groupJa: "スコアラー系" },
  { id: "post_scorer", label: "Post Scorer", meaningJa: "ポスト得点型", groupJa: "スコアラー系" },
  { id: "mismatch_scorer", label: "Mismatch Scorer", meaningJa: "ミスマッチ狙い", groupJa: "スコアラー系" },
  // シューター系
  { id: "cns_shooter", label: "C&S Shooter", meaningJa: "キャッチ&シュート", groupJa: "シューター系" },
  { id: "spot_up_shooter", label: "Spot-Up Shooter", meaningJa: "スポットアップ", groupJa: "シューター系" },
  { id: "movement_shooter", label: "Movement Shooter", meaningJa: "動きながら打つ", groupJa: "シューター系" },
  { id: "deep_range_shooter", label: "Deep Range Shooter", meaningJa: "ディープスリー", groupJa: "シューター系" },
  { id: "floor_spacer", label: "Floor Spacer", meaningJa: "スペーシング役", groupJa: "シューター系" },
  { id: "shooting_big", label: "Shooting Big", meaningJa: "シュート型ビッグ", groupJa: "シューター系" },
  { id: "stretch_big", label: "Stretch Big", meaningJa: "外に広がるビッグ", groupJa: "シューター系" },
  { id: "corner_shooter", label: "Corner Shooter", meaningJa: "コーナー待機型", groupJa: "シューター系" },
  { id: "three_pt_specialist", label: "3PT Specialist", meaningJa: "3P専門職", groupJa: "シューター系" },
  // ウイング系
  { id: "three_d_wing", label: "3&D Wing", meaningJa: "3P＋守備ウイング", groupJa: "ウイング系" },
  { id: "three_d_candidate", label: "3&D Candidate", meaningJa: "3&D候補", groupJa: "ウイング系" },
  { id: "defensive_wing", label: "Defensive Wing", meaningJa: "守備型ウイング", groupJa: "ウイング系" },
  { id: "physical_wing", label: "Physical Wing", meaningJa: "フィジカルウイング", groupJa: "ウイング系" },
  { id: "big_wing", label: "Big Wing", meaningJa: "大型ウイング", groupJa: "ウイング系" },
  { id: "utility_wing", label: "Utility Wing", meaningJa: "便利屋ウイング", groupJa: "ウイング系" },
  { id: "energy_wing", label: "Energy Wing", meaningJa: "運動量ウイング", groupJa: "ウイング系" },
  { id: "slashing_wing", label: "Slashing Wing", meaningJa: "ドライブ型ウイング", groupJa: "ウイング系" },
  { id: "connector_wing", label: "Connector Wing", meaningJa: "つなぎ役ウイング", groupJa: "ウイング系" },
  { id: "two_way_wing", label: "Two-Way Wing", meaningJa: "攻守両面ウイング", groupJa: "ウイング系" },
  // ビッグマン系
  { id: "rim_protector", label: "Rim Protector", meaningJa: "リムプロテクター", groupJa: "ビッグマン系" },
  { id: "roll_man", label: "Roll Man", meaningJa: "PnRロール役", groupJa: "ビッグマン系" },
  { id: "lob_threat", label: "Lob Threat", meaningJa: "ロブターゲット", groupJa: "ビッグマン系" },
  { id: "paint_finisher", label: "Paint Finisher", meaningJa: "ゴール下フィニッシャー", groupJa: "ビッグマン系" },
  { id: "rebounder", label: "Rebounder", meaningJa: "リバウンダー", groupJa: "ビッグマン系" },
  { id: "glass_cleaner", label: "Glass Cleaner", meaningJa: "リバウンド特化", groupJa: "ビッグマン系" },
  { id: "screen_setter", label: "Screen Setter", meaningJa: "スクリーン役", groupJa: "ビッグマン系" },
  { id: "dho_hub", label: "DHO Hub", meaningJa: "ハンドオフ起点", groupJa: "ビッグマン系" },
  { id: "high_post_hub", label: "High-Post Hub", meaningJa: "ハイポスト司令塔", groupJa: "ビッグマン系" },
  { id: "short_roll_playmaker", label: "Short Roll Playmaker", meaningJa: "ショートロール起点", groupJa: "ビッグマン系" },
  { id: "stretch_5", label: "Stretch 5", meaningJa: "3P型センター", groupJa: "ビッグマン系" },
  { id: "small_ball_5", label: "Small-Ball 5", meaningJa: "スモール5番", groupJa: "ビッグマン系" },
  { id: "backup_big", label: "Backup Big", meaningJa: "控えビッグ", groupJa: "ビッグマン系" },
  // パサー・司令塔系
  { id: "playmaker", label: "Playmaker", meaningJa: "プレーメイカー", groupJa: "パサー・司令塔系" },
  { id: "primary_playmaker", label: "Primary Playmaker", meaningJa: "主司令塔", groupJa: "パサー・司令塔系" },
  { id: "secondary_playmaker", label: "Secondary Playmaker", meaningJa: "補助司令塔", groupJa: "パサー・司令塔系" },
  { id: "passing_big", label: "Passing Big", meaningJa: "パス型ビッグ", groupJa: "パサー・司令塔系" },
  { id: "hub_big", label: "Hub Big", meaningJa: "中継点ビッグ", groupJa: "パサー・司令塔系" },
  { id: "connector", label: "Connector", meaningJa: "つなぎ役", groupJa: "パサー・司令塔系" },
  { id: "decision_maker", label: "Decision Maker", meaningJa: "判断役", groupJa: "パサー・司令塔系" },
  { id: "ball_mover", label: "Ball Mover", meaningJa: "ボール循環役", groupJa: "パサー・司令塔系" },
  // 守備系
  { id: "poa_defender", label: "POA Defender", meaningJa: "相手ボール保持者につく", groupJa: "守備系" },
  { id: "perimeter_defender", label: "Perimeter Defender", meaningJa: "外周守備", groupJa: "守備系" },
  { id: "wing_stopper", label: "Wing Stopper", meaningJa: "ウイングストッパー", groupJa: "守備系" },
  { id: "guard_defender", label: "Guard Defender", meaningJa: "ガード守備", groupJa: "守備系" },
  { id: "multi_position_defender", label: "Multi-Position Defender", meaningJa: "複数ポジション守備", groupJa: "守備系" },
  { id: "switch_defender", label: "Switch Defender", meaningJa: "スイッチ対応", groupJa: "守備系" },
  { id: "help_defender", label: "Help Defender", meaningJa: "ヘルプ守備", groupJa: "守備系" },
  { id: "chase_defender", label: "Chase Defender", meaningJa: "追いかけ守備", groupJa: "守備系" },
  { id: "defensive_specialist", label: "Defensive Specialist", meaningJa: "守備専門職", groupJa: "守備系" },
  { id: "defensive_anchor", label: "Defensive Anchor", meaningJa: "守備の軸", groupJa: "守備系" },
  { id: "weakside_rotator", label: "Weakside Rotator", meaningJa: "逆サイドヘルプ役", groupJa: "守備系" },
  // エナジー・ロール系
  { id: "energy_guy", label: "Energy Guy", meaningJa: "運動量要員", groupJa: "エナジー・ロール系" },
  { id: "hustle_player", label: "Hustle Player", meaningJa: "ハッスル型", groupJa: "エナジー・ロール系" },
  { id: "glue_guy", label: "Glue Guy", meaningJa: "接着剤タイプ", groupJa: "エナジー・ロール系" },
  { id: "utility_player", label: "Utility Player", meaningJa: "便利屋", groupJa: "エナジー・ロール系" },
  { id: "culture_guy", label: "Culture Guy", meaningJa: "カルチャー要員", groupJa: "エナジー・ロール系" },
  { id: "spark_plug", label: "Spark Plug", meaningJa: "流れを変える選手", groupJa: "エナジー・ロール系" },
  { id: "dirty_work", label: "Dirty Work", meaningJa: "泥仕事役", groupJa: "エナジー・ロール系" },
  { id: "transition_threat", label: "Transition Threat", meaningJa: "速攻要員", groupJa: "エナジー・ロール系" },
  { id: "cutter", label: "Cutter", meaningJa: "カッター", groupJa: "エナジー・ロール系" },
  { id: "off_ball_mover", label: "Off-Ball Mover", meaningJa: "オフボールで動く", groupJa: "エナジー・ロール系" },
] as const;

export const HIERARCHY_LABEL: Readonly<Record<NbaHierarchyTagId, string>> =
  Object.fromEntries(HIERARCHY_TAGS.map((t) => [t.id, t.label])) as Record<
    NbaHierarchyTagId,
    string
  >;

export const ROLE_TAG_LABEL: Readonly<Record<NbaRoleTagId, string>> =
  Object.fromEntries(ROLE_TAGS.map((t) => [t.id, t.label])) as Record<
    NbaRoleTagId,
    string
  >;

export const MIN_ROLE_TAGS = 2;
export const MAX_ROLE_TAGS = 4;
