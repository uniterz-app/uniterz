import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeAnnouncementsUnread } from "../useNativeAnnouncementsUnread";
import { useNativeProfilePlan } from "../useNativeProfilePlan";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import MobileBadgesScreen from "../mobileScreens/MobileBadgesScreen";
import MobileAnnouncementsScreen from "../mobileScreens/MobileAnnouncementsScreen";
import MobilePlanStatusScreen from "../mobileScreens/MobilePlanStatusScreen";
import MobileProSubscribeScreen from "../mobileScreens/MobileProSubscribeScreen";
import ProSubscribePreviewNative from "../mobileScreens/ProSubscribePreviewNative";
import SeasonPredictPreviewScreenNative from "../mobileScreens/SeasonPredictPreviewScreenNative";
import MonthlyReportPreviewScreenNative from "../mobileScreens/MonthlyReportPreviewScreenNative";
import LeagueStatsRailPreviewScreenNative from "../../games/stats/LeagueStatsRailPreviewScreenNative";
import TeamStatsPreviewScreenNative from "../../games/teamStats/TeamStatsPreviewScreenNative";
import PlayerStatsPreviewScreenNative from "../../games/playerStats/PlayerStatsPreviewScreenNative";
import PlayerDetailPreviewScreenNative from "../../games/playerDetail/PlayerDetailPreviewScreenNative";
import TeamDetailPreviewScreenNative from "../../games/teamDetail/TeamDetailPreviewScreenNative";
import LiveGameStatsPreviewScreenNative from "../../games/live/LiveGameStatsPreviewScreenNative";
import type { ProfileStackParamList } from "../../../navigation/types";

const apiBase = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL ?? null;

export function BadgesScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <MobileBadgesScreen
      language={language}
      uid={fUser?.uid}
      onClose={() => navigation.goBack()}
    />
  );
}

export function AnnouncementsScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser, status } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const { readIds } = useNativeAnnouncementsUnread(fUser?.uid, status === "ready");
  return (
    <MobileAnnouncementsScreen
      language={language}
      uid={fUser?.uid}
      authReady={status === "ready"}
      apiBase={apiBase}
      readIds={readIds}
      onClose={() => navigation.goBack()}
    />
  );
}

export function PlanStatusScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const { effectivePlan } = useNativeProfilePlan({ targetUid: fUser?.uid });
  const plan = effectivePlan === "pro" ? "pro" : "free";
  return (
    <MobilePlanStatusScreen
      language={language}
      uid={fUser?.uid}
      onClose={() => navigation.goBack()}
      onUpgrade={() => navigation.navigate("ProSubscribe")}
      apiBase={apiBase}
      onNavigate={(screen) => navigation.navigate(screen)}
    />
  );
}

export function ProSubscribeScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <MobileProSubscribeScreen
      language={language}
      onClose={() => navigation.goBack()}
      onSuccess={() => navigation.navigate("ProSkin")}
      onOpenPreview={() => navigation.navigate("ProSubscribePreview")}
    />
  );
}

export function ProSubscribePreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <ProSubscribePreviewNative
      language={language}
      onClose={() => navigation.goBack()}
      onOpenSkin={() => navigation.navigate("ProSkin")}
    />
  );
}

export function SeasonPredictPreviewScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <SeasonPredictPreviewScreenNative
      language={language}
      onClose={() => navigation.goBack()}
    />
  );
}

export function MonthlyReportPreviewScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute<RouteProp<ProfileStackParamList, "MonthlyReportPreview">>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);

  return (
    <MonthlyReportPreviewScreenNative
      language={language}
      initialCaseKey={route.params?.caseKey}
      initialTab={route.params?.tab}
      onClose={() => navigation.goBack()}
    />
  );
}

export function LeagueStatsPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <LeagueStatsRailPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
      onSelectTeam={(teamId) =>
        navigation.navigate("TeamDetailPreview", { teamId })
      }
      onSelectPlayer={(playerId) =>
        navigation.navigate("PlayerDetailPreview", { playerId })
      }
    />
  );
}

export function TeamStatsPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <TeamStatsPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
      onSelectTeam={(teamId) =>
        navigation.navigate("TeamDetailPreview", { teamId })
      }
    />
  );
}

export function PlayerStatsPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <PlayerStatsPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
      onSelectPlayer={(playerId) =>
        navigation.navigate("PlayerDetailPreview", { playerId })
      }
    />
  );
}

export function TeamDetailPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute<RouteProp<ProfileStackParamList, "TeamDetailPreview">>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <TeamDetailPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
      teamId={route.params?.teamId}
      onSelectPlayer={(playerId) =>
        navigation.navigate("PlayerDetailPreview", { playerId })
      }
    />
  );
}

export function PlayerDetailPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const route = useRoute<RouteProp<ProfileStackParamList, "PlayerDetailPreview">>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <PlayerDetailPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
      playerId={route.params?.playerId}
    />
  );
}

export function LiveGameStatsPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <LiveGameStatsPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
    />
  );
}
