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

/** 開催サイクル表示（ENTRY → BATTLE → DISBAND） */
export const GROUP_BATTLE_SEASON_PHASES = [
  {
    key: "entry" as const,
    label: "ENTRY",
    period: "約1〜2週間前から",
    desc: "グループを作成・参加してエントリー",
  },
  {
    key: "battle" as const,
    label: "BATTLE",
    period: "1ヶ月",
    desc: "週間×4 + 月間×1 の平均得点バトル",
  },
  {
    key: "reset" as const,
    label: "DISBAND",
    period: "終了後",
    desc: "解散して次回エントリーへ",
  },
] as const;

export const GROUP_BATTLE_HELP_TEXT = `3〜5人のスクワッドで、メンバー全員の総合スコア平均を競います。所属できるグループは1大会につき1つまで。空き枠があるグループに申請し、承認されると参加できます。募集中は招待コードでも参加可能。同時申請は最大${GROUP_BATTLE_MAX_PENDING_APPLICATIONS}件。約2ヶ月に1回開催。募集は開催約1〜2週間前から → メンバー確定後は入れ替え不可 → 1ヶ月間バトル（週間ランキング原則4回 + 月間1回）→ 終了後は解散。過去のスクワッドから同じ顔ぶれを再招集できます。`;
