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
  GamesHome: undefined;
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
  LeaderboardsHome: undefined;
  CommunityDetail: { groupId: string };
};

export type ProfileStackParamList = {
  ProfileHome:
    | {
        handle?: string;
        /** ランキング一覧から他人プロフィールを開いたとき */
        fromRankings?: boolean;
      }
    | undefined;
  ProfileSettings: undefined;
  ProfilePassword: undefined;
  Badges: undefined;
  Announcements: undefined;
  AnnouncementDetail: { id: string };
  PlanStatus: undefined;
  ProSubscribe: undefined;
  ProSuccess: undefined;
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
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
  ResetPassword: undefined;
  Onboarding: undefined;
  Landing: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};
