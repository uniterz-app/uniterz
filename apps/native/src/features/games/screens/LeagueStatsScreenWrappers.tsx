/** Games スタック用 — STATS ハブと詳細プレビュー */
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import type { GamesStackParamList } from "../../../navigation/types";
import LeagueStatsHubScreenNative from "../stats/LeagueStatsHubScreenNative";
import TeamDetailPreviewScreenNative from "../teamDetail/TeamDetailPreviewScreenNative";
import PlayerDetailPreviewScreenNative from "../playerDetail/PlayerDetailPreviewScreenNative";

export function LeagueStatsScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const route = useRoute<RouteProp<GamesStackParamList, "LeagueStats">>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <LeagueStatsHubScreenNative
      language={language === "ja" ? "ja" : "en"}
      initialTab={route.params?.tab === "player" ? "player" : "team"}
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

/** @deprecated 互換 — STATS ハブ（Team）へ */
export function LeagueTeamStatsScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <LeagueStatsHubScreenNative
      language={language === "ja" ? "ja" : "en"}
      initialTab="team"
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

/** @deprecated 互換 — STATS ハブ（Player）へ */
export function LeaguePlayerStatsScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  return (
    <LeagueStatsHubScreenNative
      language={language === "ja" ? "ja" : "en"}
      initialTab="player"
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

export function GamesTeamDetailPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const route = useRoute<RouteProp<GamesStackParamList, "TeamDetailPreview">>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const returnToPredictOverlay = route.params?.returnToPredictOverlay;
  const returnToPredictGameId = route.params?.returnToPredictGameId?.trim();
  const predictToolsTab = route.params?.predictToolsTab;

  const handleClose = () => {
    if (returnToPredictOverlay) {
      navigation.goBack();
      return;
    }
    if (returnToPredictGameId) {
      navigation.navigate("GamesHome", {
        openPredictGameId: returnToPredictGameId,
        openPredictNbaToolsTab: predictToolsTab ?? "stats",
      });
      return;
    }
    navigation.goBack();
  };

  return (
    <TeamDetailPreviewScreenNative
      language={language === "ja" ? "ja" : "en"}
      onClose={handleClose}
      teamId={route.params?.teamId}
      onSelectPlayer={(playerId) =>
        navigation.navigate("PlayerDetailPreview", { playerId })
      }
    />
  );
}

export function GamesPlayerDetailPreviewScreenWrapper() {
  const navigation =
    useNavigation<NativeStackNavigationProp<GamesStackParamList>>();
  const route =
    useRoute<RouteProp<GamesStackParamList, "PlayerDetailPreview">>();
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
