import { useCallback, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import type { LeaderboardsStackParamList, MainTabParamList } from "../../navigation/types";
import { useNativeLanguage } from "../../i18n/NativeLanguageProvider";
import type { Language } from "../../../../../lib/i18n/language";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import { spacing } from "../../theme/tokens";
import CommunityGroupDetailViewNative from "./CommunityGroupDetailViewNative";
import { CommunityModalBackdropNative } from "./CommunityCrtPartsNative";
import { communityApiUrl, communityAuthHeader } from "./communityApiNative";
import { invalidateCommunityGroupDetail } from "./communityGroupDetailCacheNative";
import { communityPressableTapStyle } from "./communityCrtThemeNative";
import CommunityGroupDetailCardNative from "./CommunityGroupDetailCardNative";

/** Web `CommunityDetailClient`（mobile）相当 */
export default function CommunityDetailScreenNative() {
  const route = useRoute<RouteProp<LeaderboardsStackParamList, "CommunityDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<LeaderboardsStackParamList>>();
  const tabNavigation = useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeLanguage();
  const { groupId } = route.params;

  const [endConfirmOpen, setEndConfirmOpen] = useState(false);
  const [endConfirmName, setEndConfirmName] = useState("");
  const [endingGroup, setEndingGroup] = useState(false);
  const [headerImageEditing, setHeaderImageEditing] = useState(false);

  const getIdToken = useCallback(() => {
    if (!fUser) return Promise.reject(new Error("no user"));
    return fUser.getIdToken();
  }, [fUser]);

  const confirmEndGroup = useCallback(async () => {
    const h = await communityAuthHeader(getIdToken);
    if (!h) return;
    setEndingGroup(true);
    try {
      const res = await fetch(communityApiUrl(`/api/communities/${groupId}/archive`), {
        method: "POST",
        headers: { Authorization: h },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        Alert.alert("", String(json?.error ?? "failed"));
        return;
      }
      setEndConfirmOpen(false);
      Alert.alert("", language === "en" ? "Group ended." : "グループを終了しました。");
      invalidateCommunityGroupDetail(groupId);
      navigation.goBack();
    } finally {
      setEndingGroup(false);
    }
  }, [groupId, language, getIdToken, navigation]);

  if (!fUser) {
    return (
      <MobilePageShell
        title="GROUP"
        appBackground
        onClose={() => navigation.goBack()}
      >
        <Text style={styles.signIn}>
          {language === "en" ? "Sign in to view this group." : "グループを表示するにはログインしてください。"}
        </Text>
      </MobilePageShell>
    );
  }

  return (
    <>
      <MobilePageShell
        title="GROUP DETAIL"
        appBackground
        onClose={() => navigation.goBack()}
      >
        <ScrollView
          scrollEnabled={!headerImageEditing}
          contentContainerStyle={[styles.content, { paddingBottom: bottomContentReserveY + spacing.md }]}
          showsVerticalScrollIndicator={false}
        >
          <CommunityGroupDetailCardNative
            language={language}
            onBack={() => navigation.goBack()}
          >
            <CommunityGroupDetailViewNative
              groupId={groupId}
              language={language}
              scrollEnabled={false}
              inDetailCard
              getIdToken={getIdToken}
              onSummaryLoaded={(summary) => {
                setEndConfirmName(summary.name);
              }}
              onExitAction={() => navigation.goBack()}
              onRequestEndGroup={(name) => {
                setEndConfirmName(name);
                setEndConfirmOpen(true);
              }}
              onImageUpdated={() => {
                invalidateCommunityGroupDetail(groupId);
              }}
              onHeaderImageEditingChange={setHeaderImageEditing}
              onOpenProfile={(handle) => {
                tabNavigation.navigate("ProfileTab", {
                  screen: "ProfileHome",
                  params: {
                    handle,
                    fromLeaderboards: true,
                    leaderboardsGroupId: groupId,
                  },
                });
              }}
            />
          </CommunityGroupDetailCardNative>
        </ScrollView>
      </MobilePageShell>

      <EndGroupConfirmModalNative
        visible={endConfirmOpen}
        groupName={endConfirmName}
        language={language}
        busy={endingGroup}
        onCancel={() => {
          if (!endingGroup) setEndConfirmOpen(false);
        }}
        onConfirm={() => void confirmEndGroup()}
      />
    </>
  );
}

function EndGroupConfirmModalNative({
  visible,
  groupName,
  language,
  busy,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  groupName?: string;
  language: Language;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const title = language === "en" ? "End this group?" : "グループを終了しますか？";
  const body =
    language === "en"
      ? `This will archive "${groupName ?? "this group"}". Members will no longer see it in active slots.`
      : `「${groupName ?? "このグループ"}」を終了します。メンバーはアクティブなスロットから非表示になります。`;

  return (
    <CommunityModalBackdropNative visible={visible} onClose={busy ? () => {} : onCancel}>
      <Text style={modalStyles.title}>{title}</Text>
      <Text style={modalStyles.body}>{body}</Text>
      <View style={modalStyles.actions}>
        <Pressable
          disabled={busy}
          onPress={onCancel}
          style={({ pressed }) => [modalStyles.cancelBtn, pressed && communityPressableTapStyle(true)]}
        >
          <Text style={modalStyles.cancelText}>{language === "en" ? "Cancel" : "キャンセル"}</Text>
        </Pressable>
        <Pressable
          disabled={busy}
          onPress={onConfirm}
          style={({ pressed }) => [modalStyles.confirmBtn, pressed && communityPressableTapStyle(true)]}
        >
          <Text style={modalStyles.confirmText}>
            {busy ? "…" : language === "en" ? "End group" : "終了する"}
          </Text>
        </Pressable>
      </View>
    </CommunityModalBackdropNative>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  signIn: {
    marginTop: 24,
    textAlign: "center",
    fontSize: 14,
    color: "rgba(165,243,252,0.65)",
  },
});

const modalStyles = StyleSheet.create({
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(255,255,255,0.72)",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelText: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "600",
  },
  confirmBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "rgba(251,113,133,0.35)",
    backgroundColor: "rgba(244,63,94,0.15)",
    paddingVertical: 10,
    alignItems: "center",
  },
  confirmText: {
    color: "rgba(254,205,211,0.95)",
    fontWeight: "700",
  },
});
