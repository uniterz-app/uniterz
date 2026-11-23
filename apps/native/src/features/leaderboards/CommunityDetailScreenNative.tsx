import { useCallback, useRef, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MobilePageShell from "../profile/mobileScreens/MobilePageShell";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import type { LeaderboardsStackParamList } from "../../navigation/types";
import { navigateToPublicProfileNative } from "../../navigation/navigateToPublicProfileNative";
import { useNativeLanguage } from "../../i18n/NativeLanguageProvider";
import type { Language } from "../../../../../lib/i18n/language";
import { useBottomTabBarInsets } from "../../navigation/useBottomTabBarInsets";
import { spacing } from "../../theme/tokens";
import CommunityGroupDetailViewNative from "./CommunityGroupDetailViewNative";
import { CommunityModalBackdropNative } from "./CommunityCrtPartsNative";
import { communityApiUrl, communityAuthHeader } from "./communityApiNative";
import { invalidateCommunityGroupDetail } from "./communityGroupDetailCacheNative";
import { communityPressableTapStyle } from "./communityCrtThemeNative";
import { peekLeaderboardsGroupReturnPreview } from "../../../../../lib/navigation/leaderboardsGroupReturn";

/** グループ詳細 — スタック画面（一覧の上にモーダルを載せない） */
export default function CommunityDetailScreenNative() {
  const route = useRoute<RouteProp<LeaderboardsStackParamList, "CommunityDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<LeaderboardsStackParamList>>();
  const { bottomContentReserveY } = useBottomTabBarInsets();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeLanguage();
  const { groupId } = route.params;
  const listPreview = peekLeaderboardsGroupReturnPreview(groupId);
  const scrollRef = useRef<ScrollView>(null);
  const bounceOnRef = useRef(false);

  const [endConfirmName, setEndConfirmName] = useState(listPreview?.name ?? "");
  const [endingGroup, setEndingGroup] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leavingGroup, setLeavingGroup] = useState(false);
  const [headerImageEditing, setHeaderImageEditing] = useState(false);

  /** 上端だけゴムバンド禁止。下がったあとは通常の弾力を戻す */
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = e.nativeEvent.contentOffset.y > 1;
    if (next === bounceOnRef.current) return;
    bounceOnRef.current = next;
    scrollRef.current?.setNativeProps({ bounces: next });
  }, []);

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
        cyberAlert("", String(json?.error ?? "failed"));
        return;
      }
      cyberAlert("", language === "en" ? "Group ended." : "グループを終了しました。");
      invalidateCommunityGroupDetail(groupId);
      navigation.goBack();
    } finally {
      setEndingGroup(false);
    }
  }, [groupId, language, getIdToken, navigation]);

  const confirmLeaveGroup = useCallback(async () => {
    const h = await communityAuthHeader(getIdToken);
    if (!h) {
      cyberAlert("", language === "en" ? "Sign in required." : "ログインが必要です。");
      return;
    }
    setLeavingGroup(true);
    try {
      const res = await fetch(communityApiUrl(`/api/communities/${groupId}/leave`), {
        method: "POST",
        headers: { Authorization: h },
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        cyberAlert("", String(json?.error ?? "failed"));
        return;
      }
      setLeaveConfirmOpen(false);
      cyberAlert("", language === "en" ? "Left group." : "退会しました。");
      invalidateCommunityGroupDetail(groupId);
      navigation.goBack();
    } finally {
      setLeavingGroup(false);
    }
  }, [groupId, language, getIdToken, navigation]);

  if (!fUser) {
    return (
      <MobilePageShell
        title="GROUP"
        eyebrow="LEADERBOARDS"
        onClose={() => navigation.goBack()}
        backgroundColor="#000000"
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
        title="GROUP"
        eyebrow="LEADERBOARDS"
        onClose={() => navigation.goBack()}
        backgroundColor="#000000"
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          scrollEnabled={!headerImageEditing}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: bottomContentReserveY + spacing.md },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          alwaysBounceVertical={false}
          overScrollMode="never"
          onScroll={onScroll}
          scrollEventThrottle={16}
        >
          <CommunityGroupDetailViewNative
            groupId={groupId}
            language={language}
            listPreview={listPreview}
            scrollEnabled={false}
            inDetailCard
            getIdToken={getIdToken}
            onSummaryLoaded={(summary) => {
              setEndConfirmName(summary.name);
            }}
            onExitAction={() => navigation.goBack()}
            onRequestEndGroup={() => {
              void confirmEndGroup();
            }}
            endingGroup={endingGroup}
            onRequestLeave={() => setLeaveConfirmOpen(true)}
            onImageUpdated={() => {
              invalidateCommunityGroupDetail(groupId);
            }}
            onHeaderImageEditingChange={setHeaderImageEditing}
            onOpenProfile={(handle, warm) => {
              navigateToPublicProfileNative(navigation, {
                handle,
                fromLeaderboards: true,
                leaderboardsGroupId: groupId,
                ...(warm ? { warm } : {}),
              });
            }}
          />
        </ScrollView>
      </MobilePageShell>

      <LeaveGroupConfirmModalNative
        visible={leaveConfirmOpen}
        groupName={endConfirmName}
        language={language}
        busy={leavingGroup}
        onCancel={() => {
          if (!leavingGroup) setLeaveConfirmOpen(false);
        }}
        onConfirm={() => void confirmLeaveGroup()}
      />
    </>
  );
}

function LeaveGroupConfirmModalNative({
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
  const title = language === "en" ? "Leave this group?" : "このグループから退会しますか？";
  const body =
    language === "en"
      ? `You will leave "${groupName ?? "this group"}".`
      : `「${groupName ?? "このグループ"}」から退会します。`;

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
            {busy ? "…" : language === "en" ? "Leave" : "退会する"}
          </Text>
        </Pressable>
      </View>
    </CommunityModalBackdropNative>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
    flexGrow: 1,
    backgroundColor: "#000000",
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
    fontSize: 17,
    fontWeight: "700",
    color: "#F8FAFC",
    marginBottom: 8,
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.7)",
    marginBottom: 16,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  confirmBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#00F5FF",
  },
  confirmText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#050508",
  },
});
