import { useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GamesHomeScreen from "../features/games/GamesHomeScreen";
import ResultHomeScreen from "../features/results/ResultHomeScreen";
import RankingsHomeScreen from "../features/rankings/RankingsHomeScreen";
import LeaderboardsHomeScreen from "../features/leaderboards/LeaderboardsHomeScreen";
import ProfileHomeScreen from "../features/profile/ProfileHomeScreen";
import type {
  GamesStackParamList,
  ResultStackParamList,
  RankingsStackParamList,
  LeaderboardsStackParamList,
  ProfileStackParamList,
} from "./types";
import { useBottomTabBarInsets } from "./useBottomTabBarInsets";
import { useFirebaseUser } from "../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../hooks/useNativeUserLanguage";
import NativeStackBackdrop from "../components/NativeStackBackdrop";

const GamesStack = createNativeStackNavigator<GamesStackParamList>();
const ResultStack = createNativeStackNavigator<ResultStackParamList>();
const RankingsStack = createNativeStackNavigator<RankingsStackParamList>();
const LeaderboardsStack = createNativeStackNavigator<LeaderboardsStackParamList>();
const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

const screenOptions = {
  headerShown: false,
  animation: "fade" as const,
  contentStyle: { backgroundColor: "transparent" },
  // タブ切替連打時のフリーズ回避（MainTab と同様）。深層 push の detach は維持
  detachInactiveScreens: true,
  freezeOnBlur: false,
};

/**
 * 深層画面は getComponent + require で初回遷移までモジュール評価を遅延する。
 * タブホームだけ静的 import（起動時に必要な画面）。
 */

function GuidelinesScreenWrapper() {
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const MobileCommunityGuidelinesScreen =
    require("../features/profile/mobileScreens/MobileCommunityGuidelinesScreen").default;
  return <MobileCommunityGuidelinesScreen language={language} />;
}

function GamesHomeRoute() {
  const route = useRoute<RouteProp<GamesStackParamList, "GamesHome">>();
  const { bottomContentReserveY } = useBottomTabBarInsets();
  return (
    <GamesHomeScreen
      bottomReserveY={bottomContentReserveY}
      routeParams={route.params}
    />
  );
}

function GamesStackScreen() {
  return (
    <NativeStackBackdrop>
      <GamesStack.Navigator screenOptions={screenOptions}>
        <GamesStack.Screen name="GamesHome" component={GamesHomeRoute} />
        <GamesStack.Screen
          name="GamePredict"
          getComponent={() =>
            require("../features/games/screens/GamePredictScreenNative").default
          }
        />
        <GamesStack.Screen
          name="GamePredictions"
          getComponent={() =>
            require("../features/games/screens/GamePredictionsScreenNative").default
          }
        />
        <GamesStack.Screen
          name="Standings"
          getComponent={() =>
            require("../features/games/screens/StandingsScreenNative").default
          }
        />
        <GamesStack.Screen
          name="TeamDetail"
          getComponent={() =>
            require("../features/games/screens/TeamDetailScreenNative").default
          }
        />
        <GamesStack.Screen
          name="PlayoffBracket"
          getComponent={() =>
            require("../features/games/screens/PlayoffBracketPredictNative").default
          }
        />
        <GamesStack.Screen
          name="PlayoffBracketView"
          getComponent={() =>
            require("../features/games/screens/PlayoffBracketViewNative").default
          }
        />
        <GamesStack.Screen
          name="BracketMarket"
          getComponent={() =>
            require("../features/games/screens/BracketMarketScreenNative").default
          }
        />
        <GamesStack.Screen
          name="SeasonPredict"
          getComponent={() =>
            require("../features/games/screens/SeasonPredictScreenNative").default
          }
        />
        <GamesStack.Screen
          name="LeagueStats"
          getComponent={() =>
            require("../features/games/screens/LeagueStatsScreenWrappers")
              .LeagueStatsScreenWrapper
          }
        />
        <GamesStack.Screen
          name="LeagueTeamStats"
          getComponent={() =>
            require("../features/games/screens/LeagueStatsScreenWrappers")
              .LeagueTeamStatsScreenWrapper
          }
        />
        <GamesStack.Screen
          name="LeaguePlayerStats"
          getComponent={() =>
            require("../features/games/screens/LeagueStatsScreenWrappers")
              .LeaguePlayerStatsScreenWrapper
          }
        />
        <GamesStack.Screen
          name="TeamDetailPreview"
          getComponent={() =>
            require("../features/games/screens/LeagueStatsScreenWrappers")
              .GamesTeamDetailPreviewScreenWrapper
          }
        />
        <GamesStack.Screen
          name="PlayerDetailPreview"
          getComponent={() =>
            require("../features/games/screens/LeagueStatsScreenWrappers")
              .GamesPlayerDetailPreviewScreenWrapper
          }
        />
      </GamesStack.Navigator>
    </NativeStackBackdrop>
  );
}

function ResultStackScreen() {
  const { bottomContentReserveY } = useBottomTabBarInsets();
  return (
    <NativeStackBackdrop>
      <ResultStack.Navigator screenOptions={screenOptions}>
        <ResultStack.Screen name="ResultHome">
          {() => <ResultHomeScreen bottomReserveY={bottomContentReserveY} />}
        </ResultStack.Screen>
        <ResultStack.Screen
          name="ResultDetail"
          getComponent={() =>
            require("../features/results/ResultDetailStackScreen").default
          }
        />
      </ResultStack.Navigator>
    </NativeStackBackdrop>
  );
}

function RankingsStackScreen() {
  const { bottomContentReserveY } = useBottomTabBarInsets();
  return (
    <NativeStackBackdrop>
      <RankingsStack.Navigator screenOptions={screenOptions}>
        <RankingsStack.Screen name="RankingsHome">
          {() => <RankingsHomeScreen bottomReserveY={bottomContentReserveY} />}
        </RankingsStack.Screen>
        <RankingsStack.Screen
          name="SquadBattlePreview"
          getComponent={() =>
            require("../features/squads/SquadBattleScreenNative").default
          }
        />
      </RankingsStack.Navigator>
    </NativeStackBackdrop>
  );
}

function LeaderboardsStackScreen() {
  const { bottomContentReserveY } = useBottomTabBarInsets();
  return (
    <NativeStackBackdrop>
      <LeaderboardsStack.Navigator screenOptions={screenOptions}>
        <LeaderboardsStack.Screen name="LeaderboardsHome">
          {() => <LeaderboardsHomeScreen bottomReserveY={bottomContentReserveY} />}
        </LeaderboardsStack.Screen>
        <LeaderboardsStack.Screen
          name="CommunityDetail"
          getComponent={() =>
            require("../features/leaderboards/CommunityDetailScreenNative").default
          }
        />
        <LeaderboardsStack.Screen
          name="SquadBattlePreview"
          getComponent={() =>
            require("../features/squads/SquadBattleScreenNative").default
          }
        />
      </LeaderboardsStack.Navigator>
    </NativeStackBackdrop>
  );
}

function ProfileHomeRoute() {
  const route = useRoute<RouteProp<ProfileStackParamList, "ProfileHome">>();
  const { bottomContentReserveY } = useBottomTabBarInsets();
  return (
    <ProfileHomeScreen
      bottomReserveY={bottomContentReserveY}
      routeHandle={route.params?.handle}
      fromRankings={route.params?.fromRankings === true}
      fromLeaderboards={route.params?.fromLeaderboards === true}
      leaderboardsGroupId={route.params?.leaderboardsGroupId}
      openSettingsOnMount={route.params?.openSettings === true}
      openReportTabOnMount={route.params?.openReportTab === true}
    />
  );
}

function ProfileStackScreen() {
  return (
    <NativeStackBackdrop>
      <ProfileStack.Navigator screenOptions={screenOptions}>
        <ProfileStack.Screen name="ProfileHome" component={ProfileHomeRoute} />
        <ProfileStack.Screen
          name="PublicProfile"
          getComponent={() =>
            require("../features/profile/screens/PublicProfileScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="ProfileSettings"
          getComponent={() =>
            require("../features/profile/screens/ProfileSettingsScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="NotificationSettings"
          getComponent={() =>
            require("../features/profile/screens/NotificationSettingsScreenNative")
              .default
          }
        />
        <ProfileStack.Screen
          name="ProfilePassword"
          getComponent={() =>
            require("../features/profile/screens/ProfilePasswordScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="ProSkin"
          getComponent={() =>
            require("../features/profile/screens/ProSkinScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="DeleteAccount"
          getComponent={() =>
            require("../features/profile/screens/DeleteAccountScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="Badges"
          getComponent={() =>
            require("../features/profile/screens/ProfileStackWrappers")
              .BadgesScreenWrapper
          }
        />
        <ProfileStack.Screen
          name="Invite"
          getComponent={() =>
            require("../features/profile/screens/ReferralInviteScreenNative")
              .default
          }
        />
        <ProfileStack.Screen
          name="UnitLedger"
          getComponent={() =>
            require("../features/profile/screens/UnitLedgerScreenNative")
              .default
          }
        />
        <ProfileStack.Screen
          name="Redeem"
          getComponent={() =>
            require("../features/profile/screens/RedemptionHubScreenNative")
              .default
          }
        />
        <ProfileStack.Screen
          name="RedeemApply"
          getComponent={() =>
            require("../features/profile/screens/RedemptionApplyScreenNative")
              .default
          }
        />
        <ProfileStack.Screen
          name="RedeemProgress"
          getComponent={() =>
            require("../features/profile/screens/RedemptionProgressScreenNative")
              .default
          }
        />
        <ProfileStack.Screen
          name="Announcements"
          getComponent={() =>
            require("../features/profile/screens/ProfileStackWrappers")
              .AnnouncementsScreenWrapper
          }
        />
        <ProfileStack.Screen
          name="AnnouncementDetail"
          getComponent={() =>
            require("../features/profile/screens/AnnouncementDetailScreenNative")
              .default
          }
        />
        <ProfileStack.Screen
          name="PlanStatus"
          getComponent={() =>
            require("../features/profile/screens/ProfileStackWrappers")
              .PlanStatusScreenWrapper
          }
        />
        <ProfileStack.Screen
          name="ProSubscribe"
          getComponent={() =>
            require("../features/profile/screens/ProfileStackWrappers")
              .ProSubscribeScreenWrapper
          }
        />
        <ProfileStack.Screen
          name="ProSubscribePreview"
          getComponent={() =>
            require("../features/profile/screens/ProfileStackWrappers")
              .ProSubscribePreviewScreenWrapper
          }
        />
        <ProfileStack.Screen
          name="SeasonPredictPreview"
          getComponent={() =>
            require("../features/profile/screens/ProfileStackWrappers")
              .SeasonPredictPreviewScreenWrapper
          }
        />
        {__DEV__ ? (
          <ProfileStack.Screen
            name="FuturisticBgPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .FuturisticBgPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="TitleSkinPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .TitleSkinPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="WaveProSkinPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .WaveProSkinPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="RankingListProSkinPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .RankingListProSkinPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="ProSkinUnlockPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .ProSkinUnlockPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="ReferralStampCelebratePreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .ReferralStampCelebratePreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="UnitEarnCelebratePreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .UnitEarnCelebratePreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="CareerFlipButtonPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .CareerFlipButtonPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="CareerPlacementPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .CareerPlacementPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="UnitEarnModalDesignPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .UnitEarnModalDesignPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="UnitEarnOverlayAnimPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .UnitEarnOverlayAnimPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="UnitEarnOverlayFontPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .UnitEarnOverlayFontPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="UniterzLogoTypePreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .UniterzLogoTypePreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="TeamStatsPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .TeamStatsPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="PlayerStatsPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .PlayerStatsPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="TeamDetailPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .TeamDetailPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="PlayerDetailPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .PlayerDetailPreviewScreenWrapper
            }
          />
        ) : null}
        {__DEV__ ? (
          <ProfileStack.Screen
            name="LiveGameStatsPreview"
            getComponent={() =>
              require("../features/profile/screens/ProfileStackWrappers")
                .LiveGameStatsPreviewScreenWrapper
            }
          />
        ) : null}
        <ProfileStack.Screen
          name="ProSuccess"
          getComponent={() =>
            require("../features/profile/screens/ProSuccessScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="PlanChange"
          getComponent={() =>
            require("../features/profile/screens/PlanChangeScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="PlanChangeComplete"
          getComponent={() =>
            require("../features/profile/screens/PlanChangeCompleteScreenNative")
              .default
          }
        />
        <ProfileStack.Screen
          name="CancelPlan"
          getComponent={() =>
            require("../features/profile/screens/CancelPlanScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="CancelComplete"
          getComponent={() =>
            require("../features/profile/screens/CancelCompleteScreenNative")
              .default
          }
        />
        <ProfileStack.Screen
          name="Help"
          getComponent={() =>
            require("../features/legal/HelpScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="Privacy"
          getComponent={() =>
            require("../features/legal/PrivacyScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="Terms"
          getComponent={() =>
            require("../features/legal/TermsScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="ElectronicNotice"
          getComponent={() =>
            require("../features/legal/ElectronicNoticeScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="Contact"
          getComponent={() =>
            require("../features/legal/ContactScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="FeatureRequest"
          getComponent={() =>
            require("../features/legal/FeatureRequestScreenNative").default
          }
        />
        <ProfileStack.Screen
          name="CommunityGuidelines"
          component={GuidelinesScreenWrapper}
        />
        <ProfileStack.Screen
          name="Landing"
          getComponent={() =>
            require("../features/legal/LandingScreenNative").default
          }
        />
        {__DEV__ ? (
          <ProfileStack.Screen
            name="NotificationDev"
            getComponent={() =>
              require("../notifications/NotificationDevScreenNative").default
            }
          />
        ) : null}
      </ProfileStack.Navigator>
    </NativeStackBackdrop>
  );
}

export {
  GamesStackScreen,
  ResultStackScreen,
  RankingsStackScreen,
  LeaderboardsStackScreen,
  ProfileStackScreen,
};
