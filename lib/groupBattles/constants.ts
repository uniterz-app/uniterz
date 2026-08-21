/** グループバトル定数。正: docs/group-battle-design.md / tech-design */

export const GROUP_BATTLE_MIN_MEMBERS = 3;
export const GROUP_BATTLE_MAX_MEMBERS = 5;
export const GROUP_BATTLE_NAME_MAX_LEN = 20;
export const GROUP_BATTLE_MAX_PENDING_APPLICATIONS = 3;

/** 再招集 UI に出す過去 locked スクワッドの大会数 */
export const GROUP_BATTLE_PAST_SQUAD_LIMIT = 3;

/** 同一大会・同一相手への招待再送上限 */
export const GROUP_BATTLE_INVITE_MAX_PER_TARGET = 2;

/** 期間終了後、final 化するまでの猶予日数（個人ランキングと揃える） */
export const GROUP_BATTLE_FINALIZE_GRACE_DAYS = 2;

export const GROUP_BATTLE_TIE_RULE = "same_rank_same_unit" as const;

export const GROUP_BATTLE_COLLECTION = "group_battles";
export const GROUP_BATTLE_SNAPSHOTS_COLLECTION = "group_battle_period_snapshots";
export const UNIT_LEDGER_COLLECTION = "unit_ledger";

/** 開催サイクル表示（ENTRY → BATTLE → REWARD）— docs/group-battle-design.md */
export const GROUP_BATTLE_SEASON_PHASES = [
  {
    key: "entry" as const,
    label: "ENTRY",
    period: "約1〜2週間前",
    desc: "3〜5人のスクワッドを確定。開始後の入れ替えは不可",
  },
  {
    key: "battle" as const,
    label: "BATTLE",
    period: "約1ヶ月",
    desc: "Pick Up 試合の平均スコア。週間×4 + 月間×1",
  },
  {
    key: "reward" as const,
    label: "REWARD",
    period: "結果確定後",
    desc: "週間1位は全員 30 Unit、月間1位は全員 100 Unit。上位20まで順位に応じて獲得",
  },
] as const;

/** 初回イントロのルール1行（正: 3〜5人・平均スコア） */
export const GROUP_BATTLE_INTRO_TAGLINE =
  "3〜5人のスクワッドで、Pick Up 試合の総合スコア平均を競う。約2ヶ月に1回の期間限定バトル。";

export const GROUP_BATTLE_HELP_TEXT = `3〜5人のスクワッドで、メンバー全員の総合スコア平均を競います。対象は Pick Up 試合のみ（PRO LEAGUE の全試合スコアは使いません）。所属できるグループは1大会につき1つまで。空き枠があるグループに申請し、承認されると参加できます。募集中は招待コードでも参加可能。同時申請は最大${GROUP_BATTLE_MAX_PENDING_APPLICATIONS}件。約2ヶ月に1回開催。募集は開催約1〜2週間前から → メンバー確定後は入れ替え不可 → 1ヶ月間バトル（週間ランキング原則4回 + 月間1回）→ 結果確定後に週間1位はメンバー全員へ 30 Unit、月間1位は 100 Unit。上位20グループまで順位に応じた Unit を確定メンバー全員へ同額配布。過去のスクワッドから同じ顔ぶれを再招集できます。`;
