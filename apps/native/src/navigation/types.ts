import type { NavigatorScreenParams } from "@react-navigation/native";

/** メインタブ（mobile Web NavBar と同一） */
export type MainTabParamList = {
  GamesTab: NavigatorScreenParams<GamesStackParamList> | undefined;
  ResultTab: NavigatorScreenParams<ResultStackParamList> | undefined;
  RankingsTab: NavigatorScreenParams<RankingsStackParamList> | undefined;
  LeaderboardsTab: NavigatorScreenParams<LeaderboardsStackParamList> | undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type GamesStackParamList = {
  GamesHome:
    | {
        /** リザルト等から予想モーダルを開く試合 ID */
        openPredictGameId?: string;
        /** 予想済みのとき最初からスコア入力を表示 */
        expandScoreForm?: boolean;
        /** リザルト一覧から渡す投稿 ID（Games 側の myPost 未ロードでも編集モードに入る） */
        openPredictPostId?: string;
        /** リザルト投稿の予想スナップショット（スコア初期値用） */
        openPredictSeed?: {
          winner: "home" | "away" | "draw";
          scoreHome: number;
          scoreAway: number;
          goalScorer?: unknown;
        };
        /** アワード/順位予想などから戻るときサイドメニューを開く */
        openMenu?: boolean;
        /** DEV「チュートリアル再開」— 変更のたび welcome を強制 */
        restartTutorialAt?: number;
        /** チーム詳細から予想モーダル復帰時に STATS 等タブを開く */
        openPredictNbaToolsTab?: "insight" | "injuries" | "stats" | "roster";
      }
    | undefined;
  GamePredict: { gameId: string };
  GamePredictions: { gameId: string };
  Standings: undefined;
  TeamDetail: { teamId: string };
  PlayoffBracket: undefined;
  PlayoffBracketView: undefined;
  BracketMarket: undefined;
  /** シーズン アワード / 順位予想（プレビュー） */
  SeasonPredict: { mode: "awards" | "standings" };
  /** STATS ハブ（Team / Player タブ） */
  LeagueStats: { tab?: "team" | "player" } | undefined;
  /** @deprecated LeagueStats へ */
  LeagueTeamStats: undefined;
  /** @deprecated LeagueStats tab=player へ */
  LeaguePlayerStats: undefined;
  /** Team Stats からのチーム詳細（モック） */
  TeamDetailPreview:
    | {
        teamId?: string;
        /** 予想オーバーレイから開いた → goBack でモーダル再表示 */
        returnToPredictOverlay?: boolean;
        predictToolsTab?: "insight" | "injuries" | "stats" | "roster";
        /** @deprecated returnToPredictOverlay を優先 */
        returnToPredictGameId?: string;
      }
    | undefined;
  /** Player Stats / 予想 ROSTER からの選手詳細（モック） */
  PlayerDetailPreview:
    | {
        playerId?: string;
        /** 予想オーバーレイから開いた → goBack でモーダル再表示 */
        returnToPredictOverlay?: boolean;
        predictToolsTab?: "insight" | "injuries" | "stats" | "roster";
        /** @deprecated returnToPredictOverlay を優先 */
        returnToPredictGameId?: string;
      }
    | undefined;
};

/** 他人プロフィール。Profile / Rankings / Leaderboards / Result 各スタックで共用 */
export type PublicProfileParams = {
  handle: string;
  fromRankings?: boolean;
  fromLeaderboards?: boolean;
  leaderboardsGroupId?: string;
  fromWeeklyReport?: boolean;
  fromResultDetail?: boolean;
  resultDetailPostId?: string;
  fromMarkList?: boolean;
};

export type ResultStackParamList = {
  ResultHome: { reopenDetailPostId?: string } | undefined;
  ResultDetail: { postId: string };
  PublicProfile: PublicProfileParams;
};

export type RankingsStackParamList = {
  RankingsHome: undefined;
  /** SQUAD BATTLE 本番 */
  SquadBattle: { mode?: "production" | "preview" } | undefined;
  /** SQUAD BATTLE UI プレビュー（モック） */
  SquadBattlePreview: { mode?: "production" | "preview" } | undefined;
  PublicProfile: PublicProfileParams;
};

export type LeaderboardsStackParamList = {
  LeaderboardsHome: { reopenGroupId?: string } | undefined;
  CommunityDetail: { groupId: string };
  /** SQUAD BATTLE 本番 */
  SquadBattle: { mode?: "production" | "preview" } | undefined;
  /** SQUAD BATTLE UI プレビュー（モック） */
  SquadBattlePreview: { mode?: "production" | "preview" } | undefined;
  PublicProfile: PublicProfileParams;
};

export type ProfileStackParamList = {
  ProfileHome:
    | {
        handle?: string;
        /** ランキング一覧から他人プロフィールを開いたとき */
        fromRankings?: boolean;
        /** グループ（Leaderboards タブ）から他人プロフィールを開いたとき */
        fromLeaderboards?: boolean;
        /** リザルト詳細から他人プロフィールを開いたとき */
        fromResultDetail?: boolean;
        /** リザルト詳細へ戻るときの投稿 ID */
        resultDetailPostId?: string;
        /** 戻る先のグループ ID（オーバーレイ / 詳細画面） */
        leaderboardsGroupId?: string;
        /** プロフィール編集モーダルを開く */
        openSettings?: boolean;
        /** Report タブを開く（月次プッシュ等） */
        openReportTab?: boolean;
        /** MARK LIST から他人プロフィールへ行った戻り */
        openMarkList?: boolean;
      }
    | undefined;
  ProfileSettings: undefined;
  NotificationSettings: undefined;
  ProfilePassword: undefined;
  ProSkin: undefined;
  DeleteAccount: undefined;
  PublicProfile: PublicProfileParams;
  Badges: undefined;
  Invite: undefined;
  UnitLedger: undefined;
  Redeem: undefined;
  RedeemApply: { kind?: string } | undefined;
  RedeemProgress: { id: string };
  Announcements: undefined;
  AnnouncementDetail: { id: string };
  PlanStatus: undefined;
  ProSubscribe: undefined;
  ProSubscribePreview: undefined;
  SeasonPredictPreview: undefined;
  /** __DEV__ SQUAD BATTLE 全画面プレビュー */
  SquadBattlePreview: undefined;
  /** __DEV__ 週間/月間レポート UI プレビュー（mock） */
  MonthlyReportPreview: { tab?: "weekly" | "monthly"; caseKey?: string } | undefined;
  /** __DEV__ リーグ Team Stats（30 チーム表） */
  TeamStatsPreview: undefined;
  /** __DEV__ リーグ STATS ハブ（Team / Player、現行チップ型） */
  LeagueStatsPreview: undefined;
  /** __DEV__ リーグ Player Stats（指標トップリーダー） */
  PlayerStatsPreview: undefined;
  /** __DEV__ Team Detail 再構築プレビュー */
  TeamDetailPreview: { teamId?: string } | undefined;
  /** __DEV__ Player Detail 叩き台プレビュー */
  PlayerDetailPreview: { playerId?: string } | undefined;
  /** __DEV__ ライブ試合スタッツ（Team / Box Score） */
  LiveGameStatsPreview: undefined;
  ProSuccess: { plan?: "weekly" | "monthly" | "season" } | undefined;
  PlanChange: undefined;
  PlanChangeComplete: undefined;
  CancelPlan: undefined;
  CancelComplete: undefined;
  Help: undefined;
  Privacy: undefined;
  Terms: undefined;
  RefundPolicy: undefined;
  CommercialLaw: undefined;
  ElectronicNotice: undefined;
  Contact: undefined;
  FeatureRequest: undefined;
  /** 管理者: 機能リクエスト / 問い合わせ一覧 */
  AdminInbox: { kind: "feature" | "inbox" };
  AdminInboxDetail: { id: string; kind?: "feature" | "inbox" };
  /** 管理者: 商品交換申請 */
  AdminRedemptions: undefined;
  AdminRedemptionDetail: { id: string };
  /** 管理者: グループバトル開催 */
  AdminGroupBattles: undefined;
  CommunityGuidelines: undefined;
  Landing: undefined;
  /** __DEV__ 通知動作確認 */
  NotificationDev: undefined;
};

export type AuthStackParamList = {
  Landing: undefined;
  Login: { initialMode?: "login" | "signup" } | undefined;
  Signup: { inviteCode?: string } | undefined;
  ResetPassword: undefined;
  Onboarding: undefined;
  Terms: undefined;
  Privacy: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
