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
  /** Player Stats からの選手詳細（モック） */
  PlayerDetailPreview: { playerId?: string } | undefined;
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
  /** SQUAD BATTLE UI プレビュー（モック） */
  SquadBattlePreview: undefined;
  PublicProfile: PublicProfileParams;
};

export type LeaderboardsStackParamList = {
  LeaderboardsHome: { reopenGroupId?: string } | undefined;
  CommunityDetail: { groupId: string };
  /** SQUAD BATTLE UI プレビュー（モック） */
  SquadBattlePreview: undefined;
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
  /** __DEV__ 週間/月間レポート UI プレビュー（mock） */
  MonthlyReportPreview: { tab?: "weekly" | "monthly"; caseKey?: string } | undefined;
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
  /** __DEV__ Blender 平面ワードマーク 3D */
  UniterzLogo3dPreview: undefined;
  /** __DEV__ 課金 PRO タグ案 */
  UniterzProBadgePreview: undefined;
  /** __DEV__ 現行 vs 旧 Pro バッジ比較 */
  ProBadgeComparePreview: undefined;
  /** __DEV__ リザルトカード見た目案 */
  ResultCardDesignPreview: undefined;
  /** __DEV__ リザルト右上バッジ見た目案 */
  ResultBadgeDesignPreview: undefined;
  /** __DEV__ リザルト右上スタンプ見た目案 */
  ResultStampDesignPreview: undefined;
  /** __DEV__ リザルト左上連勝タグ見た目案 */
  ResultStreakTagDesignPreview: undefined;
  /** __DEV__ リザルト詳細デザイン用プレビュー */
  ResultDetailDesignPreview: undefined;
  /** __DEV__ サイバーロゴスプラッシュ */
  SplashLogoPreview: undefined;
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
  /** __DEV__ 試合一覧カード現行デザイン */
  MatchCardDesignPreview: undefined;
  /** __DEV__ プロフィール 2x2 メトリクス Free / Pro 現行 */
  ProfileKinetikMetricsPreview: undefined;
  /** __DEV__ Native ボタン見た目カタログ */
  ButtonDesignPreview: undefined;
  /** __DEV__ ランディング六角ライト見た目案 */
  HexLightDesignPreview: undefined;
  /** __DEV__ 下部ナビ見た目案 */
  NavBarDesignPreview: undefined;
  /** __DEV__ LP 用ランキング画面（総合スコアモック） */
  LpRankingPreview: undefined;
  /** __DEV__ ランキングリスト見た目案 */
  RankingListDesignPreview: undefined;
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
  Terms: undefined;
  Privacy: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
