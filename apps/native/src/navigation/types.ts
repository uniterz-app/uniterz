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
      }
    | undefined;
  GamePredict: { gameId: string };
  GamePredictions: { gameId: string };
  Standings: undefined;
  TeamDetail: { teamId: string };
  PlayoffBracket: undefined;
  PlayoffBracketView: undefined;
  BracketMarket: undefined;
};

export type ResultStackParamList = {
  ResultHome: undefined;
  ResultDetail: { postId: string };
};

export type RankingsStackParamList = {
  RankingsHome: undefined;
};

export type LeaderboardsStackParamList = {
  LeaderboardsHome: { reopenGroupId?: string } | undefined;
  CommunityDetail: { groupId: string };
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
      }
    | undefined;
  ProfileSettings: undefined;
  NotificationSettings: undefined;
  ProfilePassword: undefined;
  PublicProfile: {
    handle: string;
    fromRankings?: boolean;
    fromLeaderboards?: boolean;
    leaderboardsGroupId?: string;
  };
  Badges: undefined;
  Announcements: undefined;
  AnnouncementDetail: { id: string };
  PlanStatus: undefined;
  ProSubscribe: undefined;
  ProSuccess: { plan?: "monthly" | "annual" } | undefined;
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
  Signup: undefined;
  ResetPassword: undefined;
  Onboarding: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
