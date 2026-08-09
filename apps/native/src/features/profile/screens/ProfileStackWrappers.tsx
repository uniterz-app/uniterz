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
import ProSubscribePreviewNative from "../mobileScreens/ProSubscribePreviewNative";
import SeasonPredictPreviewScreenNative from "../mobileScreens/SeasonPredictPreviewScreenNative";
import FuturisticBgPreviewScreenNative from "../backgrounds/FuturisticBgPreviewScreenNative";
import TitleSkinPreviewScreenNative from "../backgrounds/TitleSkinPreviewScreenNative";
import WaveProSkinPreviewScreenNative from "../backgrounds/WaveProSkinPreviewScreenNative";
import RankingListProSkinPreviewScreenNative from "../backgrounds/RankingListProSkinPreviewScreenNative";
import ProSkinUnlockPreviewScreenNative from "../mobileScreens/ProSkinUnlockPreviewScreenNative";
import ReferralStampCelebratePreviewScreenNative from "../mobileScreens/ReferralStampCelebratePreviewScreenNative";
import UnitEarnCelebratePreviewScreenNative from "../mobileScreens/UnitEarnCelebratePreviewScreenNative";
import CareerFlipButtonPreviewScreenNative from "../mobileScreens/CareerFlipButtonPreviewScreenNative";
import UnitEarnModalDesignPreviewScreenNative from "../mobileScreens/UnitEarnModalDesignPreviewScreenNative";
import UnitEarnOverlayAnimPreviewScreenNative from "../mobileScreens/UnitEarnOverlayAnimPreviewScreenNative";
import UnitEarnOverlayFontPreviewScreenNative from "../mobileScreens/UnitEarnOverlayFontPreviewScreenNative";
import UniterzLogoTypePreviewScreenNative from "../mobileScreens/UniterzLogoTypePreviewScreenNative";
import TeamStatsPreviewScreenNative from "../../games/teamStats/TeamStatsPreviewScreenNative";
import PlayerStatsPreviewScreenNative from "../../games/playerStats/PlayerStatsPreviewScreenNative";
import PlayerDetailPreviewScreenNative from "../../games/playerDetail/PlayerDetailPreviewScreenNative";
import TeamDetailPreviewScreenNative from "../../games/teamDetail/TeamDetailPreviewScreenNative";
import LiveGameStatsPreviewScreenNative from "../../games/live/LiveGameStatsPreviewScreenNative";
import { armProSkinUnlockPreviewOnProfile } from "../reports/proSkinUnlockPreviewArm";
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
    <ProSubscribePreviewNative
      language={language}
      onClose={() => navigation.goBack()}
      onOpenSkin={() => navigation.navigate("ProSkin")}
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

export function FuturisticBgPreviewScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <FuturisticBgPreviewScreenNative
      language={language}
      onClose={() => navigation.goBack()}
    />
  );
}

export function TitleSkinPreviewScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <TitleSkinPreviewScreenNative
      language={language}
      onClose={() => navigation.goBack()}
    />
  );
}

export function WaveProSkinPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <WaveProSkinPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
    />
  );
}

export function RankingListProSkinPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <RankingListProSkinPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
    />
  );
}

export function ProSkinUnlockPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <ProSkinUnlockPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
      onForceOnProfile={() => {
        armProSkinUnlockPreviewOnProfile();
        navigation.navigate("ProfileHome");
      }}
    />
  );
}

export function ReferralStampCelebratePreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <ReferralStampCelebratePreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
      onOpenInvite={() => navigation.replace("Invite")}
    />
  );
}

export function UnitEarnCelebratePreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <UnitEarnCelebratePreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
      onOpenUnitLedger={() => navigation.replace("UnitLedger")}
    />
  );
}

export function CareerFlipButtonPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <CareerFlipButtonPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
    />
  );
}

export function UnitEarnModalDesignPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <UnitEarnModalDesignPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
    />
  );
}

export function UnitEarnOverlayAnimPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <UnitEarnOverlayAnimPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
    />
  );
}

export function UnitEarnOverlayFontPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <UnitEarnOverlayFontPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
    />
  );
}

export function UniterzLogoTypePreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <UniterzLogoTypePreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={() => navigation.goBack()}
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
