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
  TeamDetailPreview: { teamId?: string } | undefined;
  /** Player Stats からの選手詳細（モック） */
  PlayerDetailPreview: { playerId?: string } | undefined;
};

export type ResultStackParamList = {
  ResultHome: undefined;
  ResultDetail: { postId: string };
};

export type RankingsStackParamList = {
  RankingsHome: undefined;
  /** SQUAD BATTLE UI プレビュー（モック） */
  SquadBattlePreview: undefined;
};

export type LeaderboardsStackParamList = {
  LeaderboardsHome: { reopenGroupId?: string } | undefined;
  CommunityDetail: { groupId: string };
  /** SQUAD BATTLE UI プレビュー（モック） */
  SquadBattlePreview: undefined;
};

export type ProfileStackParamList = {
  ProfileHome:
    | {
        handle?: string;
        /** ランキング一覧から他人プロフィールを開いたとき */
        fromRankings?: boolean;
        /** グループ（Leaderboards タブ）から他人プロフィールを開いたとき */
        fromLeaderboards?: boolean;
        /** 戻る先のグループ ID（オーバーレイ / 詳細画面） */
        leaderboardsGroupId?: string;
        /** プロフィール編集モーダルを開く */
        openSettings?: boolean;
        /** Report タブを開く（月次プッシュ等） */
        openReportTab?: boolean;
      }
    | undefined;
  ProfileSettings: undefined;
  NotificationSettings: undefined;
  ProfilePassword: undefined;
  ProSkin: undefined;
  DeleteAccount: undefined;
  PublicProfile: {
    handle: string;
    fromRankings?: boolean;
    fromLeaderboards?: boolean;
    leaderboardsGroupId?: string;
    /** 週次レポートのライバル一覧から遷移 */
    fromWeeklyReport?: boolean;
  };
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
  /** __DEV__ Pro futuristic 背景プレビュー */
  FuturisticBgPreview: undefined;
  /** __DEV__ 称号 Pro Skin（金冠 / 雷 / 星）プレビュー */
  TitleSkinPreview: undefined;
  /** __DEV__ Pro Skin Wave9 プレビュー */
  WaveProSkinPreview: undefined;
  /** __DEV__ ランキング行 Pro Skin プレビュー */
  RankingListProSkinPreview: undefined;
  /** __DEV__ Pro Skin マイルストーン解放モーダル */
  ProSkinUnlockPreview: undefined;
  /** __DEV__ 招待達成スタンプ演出 */
  ReferralStampCelebratePreview: undefined;
  /** __DEV__ Unit 獲得演出 */
  UnitEarnCelebratePreview: undefined;
  /** __DEV__ CAREER フリップボタン見た目案 */
  CareerFlipButtonPreview: undefined;
  /** __DEV__ CAREER 情報の載せ場所案 */
  CareerPlacementPreview: undefined;
  /** __DEV__ Unit 獲得モーダル見た目案 A〜D */
  UnitEarnModalDesignPreview: undefined;
  /** __DEV__ Unit 獲得オーバーレイ入場アニメ案 */
  UnitEarnOverlayAnimPreview: undefined;
  /** __DEV__ Unit 獲得オーバーレイフォント案 */
  UnitEarnOverlayFontPreview: undefined;
  /** __DEV__ UNITERZ ウェスタン調ロゴ文字 3案 */
  UniterzLogoTypePreview: undefined;
  /** __DEV__ リーグ Team Stats（30 チーム表） */
  TeamStatsPreview: undefined;
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
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
