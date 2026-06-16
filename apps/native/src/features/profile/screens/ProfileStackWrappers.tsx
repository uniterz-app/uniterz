import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeAnnouncementsUnread } from "../useNativeAnnouncementsUnread";
import { useNativeProfilePlan } from "../useNativeProfilePlan";
import MobileBadgesScreen from "../mobileScreens/MobileBadgesScreen";
import MobileAnnouncementsScreen from "../mobileScreens/MobileAnnouncementsScreen";
import MobilePlanStatusScreen from "../mobileScreens/MobilePlanStatusScreen";
import MobileProSubscribeScreen from "../mobileScreens/MobileProSubscribeScreen";
import type { ProfileStackParamList } from "../../../navigation/types";

const apiBase = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL ?? null;

export function BadgesScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  return (
    <MobileBadgesScreen
      language="ja"
      uid={fUser?.uid}
      onClose={() => navigation.goBack()}
    />
  );
}

export function AnnouncementsScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser, status } = useFirebaseUser();
  const { readIds } = useNativeAnnouncementsUnread(fUser?.uid, status === "ready");
  return (
    <MobileAnnouncementsScreen
      language="ja"
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
  const { effectivePlan } = useNativeProfilePlan({ targetUid: fUser?.uid });
  const plan = effectivePlan === "pro" ? "pro" : "free";
  return (
    <MobilePlanStatusScreen
      language="ja"
      uid={fUser?.uid}
      onClose={() => navigation.goBack()}
      onUpgrade={() => navigation.navigate("ProSubscribe")}
      apiBase={apiBase}
      onNavigate={(screen) => navigation.navigate(screen)}
    />
  );
}

export function ProSubscribeScreenWrapper() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  return (
    <MobileProSubscribeScreen
      language="ja"
      onClose={() => navigation.goBack()}
      onSuccess={() => navigation.navigate("ProSuccess")}
    />
  );
}
