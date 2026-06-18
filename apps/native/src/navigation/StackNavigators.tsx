import { createNativeStackNavigator } from "@react-navigation/native-stack";
import GamesHomeScreen from "../features/games/GamesHomeScreen";
import ResultHomeScreen from "../features/results/ResultHomeScreen";
import ResultDetailStackScreen from "../features/results/ResultDetailStackScreen";
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
import GamePredictScreenNative from "../features/games/screens/GamePredictScreenNative";
import GamePredictionsScreenNative from "../features/games/screens/GamePredictionsScreenNative";
import StandingsScreenNative from "../features/games/screens/StandingsScreenNative";
import TeamDetailScreenNative from "../features/games/screens/TeamDetailScreenNative";
import PlayoffBracketPredictNative from "../features/games/screens/PlayoffBracketPredictNative";
import PlayoffBracketViewNative from "../features/games/screens/PlayoffBracketViewNative";
import BracketMarketScreenNative from "../features/games/screens/BracketMarketScreenNative";
import CommunityDetailScreenNative from "../features/leaderboards/CommunityDetailScreenNative";
import MobileCommunityGuidelinesScreen from "../features/profile/mobileScreens/MobileCommunityGuidelinesScreen";
import ProfileSettingsScreenNative from "../features/profile/screens/ProfileSettingsScreenNative";
import ProfilePasswordScreenNative from "../features/profile/screens/ProfilePasswordScreenNative";
import AnnouncementDetailScreenNative from "../features/profile/screens/AnnouncementDetailScreenNative";
import ProSuccessScreenNative from "../features/profile/screens/ProSuccessScreenNative";
import PlanChangeScreenNative from "../features/profile/screens/PlanChangeScreenNative";
import PlanChangeCompleteScreenNative from "../features/profile/screens/PlanChangeCompleteScreenNative";
import CancelPlanScreenNative from "../features/profile/screens/CancelPlanScreenNative";
import CancelCompleteScreenNative from "../features/profile/screens/CancelCompleteScreenNative";
import HelpScreenNative from "../features/legal/HelpScreenNative";
import PrivacyScreenNative from "../features/legal/PrivacyScreenNative";
import TermsScreenNative from "../features/legal/TermsScreenNative";
import ElectronicNoticeScreenNative from "../features/legal/ElectronicNoticeScreenNative";
import ContactScreenNative from "../features/legal/ContactScreenNative";
import FeatureRequestScreenNative from "../features/legal/FeatureRequestScreenNative";
import LandingScreenNative from "../features/legal/LandingScreenNative";
import {
  BadgesScreenWrapper,
  AnnouncementsScreenWrapper,
  PlanStatusScreenWrapper,
  ProSubscribeScreenWrapper,
} from "../features/profile/screens/ProfileStackWrappers";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
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
  detachInactiveScreens: false,
  freezeOnBlur: false,
};

function GuidelinesScreenWrapper() {
  const navigation = useNavigation();
  return <MobileCommunityGuidelinesScreen language="ja" onClose={() => navigation.goBack()} />;
}

function GamesStackScreen() {
  const { bottomContentReserveY } = useBottomTabBarInsets();
  return (
    <NativeStackBackdrop>
      <GamesStack.Navigator screenOptions={screenOptions}>
        <GamesStack.Screen name="GamesHome">
          {() => <GamesHomeScreen bottomReserveY={bottomContentReserveY} />}
        </GamesStack.Screen>
        <GamesStack.Screen name="GamePredict" component={GamePredictScreenNative} />
        <GamesStack.Screen name="GamePredictions" component={GamePredictionsScreenNative} />
        <GamesStack.Screen name="Standings" component={StandingsScreenNative} />
        <GamesStack.Screen name="TeamDetail" component={TeamDetailScreenNative} />
        <GamesStack.Screen name="PlayoffBracket" component={PlayoffBracketPredictNative} />
        <GamesStack.Screen name="PlayoffBracketView" component={PlayoffBracketViewNative} />
        <GamesStack.Screen name="BracketMarket" component={BracketMarketScreenNative} />
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
        <ResultStack.Screen name="ResultDetail" component={ResultDetailStackScreen} />
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
        <LeaderboardsStack.Screen name="CommunityDetail" component={CommunityDetailScreenNative} />
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
    />
  );
}

function ProfileStackScreen() {
  return (
    <NativeStackBackdrop>
      <ProfileStack.Navigator screenOptions={screenOptions}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileHomeRoute} />
      <ProfileStack.Screen name="ProfileSettings" component={ProfileSettingsScreenNative} />
      <ProfileStack.Screen name="ProfilePassword" component={ProfilePasswordScreenNative} />
      <ProfileStack.Screen name="Badges" component={BadgesScreenWrapper} />
      <ProfileStack.Screen name="Announcements" component={AnnouncementsScreenWrapper} />
      <ProfileStack.Screen name="AnnouncementDetail" component={AnnouncementDetailScreenNative} />
      <ProfileStack.Screen name="PlanStatus" component={PlanStatusScreenWrapper} />
      <ProfileStack.Screen name="ProSubscribe" component={ProSubscribeScreenWrapper} />
      <ProfileStack.Screen name="ProSuccess" component={ProSuccessScreenNative} />
      <ProfileStack.Screen name="PlanChange" component={PlanChangeScreenNative} />
      <ProfileStack.Screen name="PlanChangeComplete" component={PlanChangeCompleteScreenNative} />
      <ProfileStack.Screen name="CancelPlan" component={CancelPlanScreenNative} />
      <ProfileStack.Screen name="CancelComplete" component={CancelCompleteScreenNative} />
      <ProfileStack.Screen name="Help" component={HelpScreenNative} />
      <ProfileStack.Screen name="Privacy" component={PrivacyScreenNative} />
      <ProfileStack.Screen name="Terms" component={TermsScreenNative} />
      <ProfileStack.Screen name="ElectronicNotice" component={ElectronicNoticeScreenNative} />
      <ProfileStack.Screen name="Contact" component={ContactScreenNative} />
      <ProfileStack.Screen name="FeatureRequest" component={FeatureRequestScreenNative} />
      <ProfileStack.Screen name="CommunityGuidelines" component={GuidelinesScreenWrapper} />
      <ProfileStack.Screen name="Landing" component={LandingScreenNative} />
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
