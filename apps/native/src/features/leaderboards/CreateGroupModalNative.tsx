import { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { Language } from "../../../../../lib/i18n/language";
import {
  COMMUNITY_LEAGUES,
  COMMUNITY_METRICS,
  type CommunityLeague,
  type CommunityMetric,
} from "../../../../../lib/communities/types";
import { leagueLabel, metricLabel } from "../../../../../lib/communities/labels";
import {
  FREE_MAX_MEMBERSHIPS,
  FREE_MAX_OWNED_GROUPS,
  PRO_MAX_MEMBERSHIPS,
  PRO_MAX_OWNED_GROUPS,
} from "../../../../../lib/communities/limitValues";
import { storage } from "../../lib/firebase";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import { RankingsShellGridOverlay } from "../rankings/rankingsUiDecorations";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import type { CreatedCommunityGroup } from "./communityApiNative";
import { communityApiUrl, communityAuthHeader } from "./communityApiNative";
import {
  communityFieldLabelStyle,
  communityModalCardStyle,
  communityPressableTapStyle,
} from "./communityCrtThemeNative";

type Props = {
  visible: boolean;
  language: Language;
  onClose: () => void;
  onCreated: (group?: CreatedCommunityGroup | null, inviteCode?: string) => void;
};

const GLASS_FIELD = {
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.14)",
  backgroundColor: "rgba(255,255,255,0.06)",
  paddingHorizontal: 10,
  paddingVertical: 8,
} as const;

export default function CreateGroupModalNative({ visible, language, onClose, onCreated }: Props) {
  const { fUser } = useFirebaseUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [headerUri, setHeaderUri] = useState<string | null>(null);
  const [metric, setMetric] = useState<CommunityMetric>("totalPoints");
  const [league, setLeague] = useState<CommunityLeague>("all");
  const [busy, setBusy] = useState(false);

  const t = useMemo(
    () =>
      language === "en"
        ? {
            title: "Create a group",
            name: "Group name",
            description: "Description (optional)",
            descriptionPh: "e.g. Weekend picks with friends — share the invite code to join",
            header: "Header image",
            metric: "Compete on",
            league: "League",
            scoringNote:
              "Scores count from the day this group is created (JST). Past results are not included.",
            cancel: "Cancel",
            submit: "Create",
            streakNote:
              "Win streak uses your account-wide streak, not only from group start.",
            planLimits: `Plan limits: Free users can create up to ${FREE_MAX_OWNED_GROUPS} groups and join up to ${FREE_MAX_MEMBERSHIPS} groups. Pro users can create up to ${PRO_MAX_OWNED_GROUPS} groups and join up to ${PRO_MAX_MEMBERSHIPS} groups.`,
            pickImage: "Pick image",
            creating: "Creating…",
          }
        : {
            title: "グループを作成",
            name: "グループ名",
            description: "説明（任意）",
            descriptionPh: "例：仲間とのNBA予想ランキング。招待コードで参加できます",
            header: "ヘッダー画像",
            metric: "競う項目",
            league: "リーグ",
            scoringNote:
              "グループ作成日（JST）以降の予想だけが集計されます。過去の成績は含みません。",
            cancel: "キャンセル",
            submit: "作成",
            streakNote:
              "連勝はアカウント全体の累計です（グループ開始日以降だけにはなりません）。",
            planLimits: `プラン上限: Free はグループを最大 ${FREE_MAX_OWNED_GROUPS} 件まで作成でき、最大 ${FREE_MAX_MEMBERSHIPS} 件まで参加できます。Pro はグループを最大 ${PRO_MAX_OWNED_GROUPS} 件まで作成でき、最大 ${PRO_MAX_MEMBERSHIPS} 件まで参加できます。`,
            pickImage: "画像を選ぶ",
            creating: "作成中…",
          },
    [language]
  );

  const closeReset = useCallback(() => {
    if (busy) return;
    setName("");
    setDescription("");
    setHeaderUri(null);
    setMetric("totalPoints");
    setLeague("all");
    onClose();
  }, [busy, onClose]);

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("", language === "en" ? "Photo access is required." : "写真へのアクセスが必要です。");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]?.uri) {
      setHeaderUri(result.assets[0].uri);
    }
  }, [language]);

  const onSubmit = useCallback(async () => {
    const n = name.trim();
    if (!fUser || n.length < 1 || busy) return;
    setBusy(true);
    try {
      const h = await communityAuthHeader(() => fUser.getIdToken());
      if (!h) return;

      let headerImageUrl: string | null = null;
      if (headerUri) {
        const resp = await fetch(headerUri);
        const blob = await resp.blob();
        const id = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        const fileRef = ref(storage, `community_headers/${fUser.uid}/${id}.jpg`);
        await uploadBytes(fileRef, blob, { contentType: "image/jpeg" });
        headerImageUrl = await getDownloadURL(fileRef);
      }

      const res = await fetch(communityApiUrl("/api/communities/create"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: h },
        body: JSON.stringify({
          name: n,
          description: description.trim() || null,
          headerImageUrl,
          rankingMetric: metric,
          periodType: "from_now",
          rankingLeague: league,
          rankingTeamIds: [],
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        Alert.alert("", String(json?.error ?? (language === "en" ? "Create failed." : "作成に失敗しました。")));
        return;
      }
      const created = json.group as CreatedCommunityGroup | undefined;
      const payload: CreatedCommunityGroup = created?.id
        ? { ...created, periodType: "from_now", role: created.role ?? "owner" }
        : {
            id: String(json.groupId ?? ""),
            name: n,
            description: description.trim() || null,
            memberCount: 1,
            headerImageUrl,
            rankingMetric: metric,
            periodType: "from_now",
            rankingLeague: league,
            rankingTeamIds: [],
            role: "owner",
          };
      onCreated(payload, String(json.inviteCode ?? "") || undefined);
      closeReset();
    } finally {
      setBusy(false);
    }
  }, [name, description, headerUri, metric, league, fUser, busy, language, onCreated, closeReset]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeReset}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={closeReset} disabled={busy}>
          {(Platform.OS === "ios" || Platform.OS === "android") && (
            <BlurView
              intensity={Platform.OS === "ios" ? 18 : 10}
              tint="dark"
              {...nativeBlurViewExtraProps()}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <View style={styles.backdropDim} />
        </Pressable>

        <View style={styles.card}>
          {(Platform.OS === "ios" || Platform.OS === "android") && (
            <BlurView
              intensity={Platform.OS === "ios" ? 28 : 16}
              tint="dark"
              {...nativeBlurViewExtraProps()}
              style={StyleSheet.absoluteFillObject}
            />
          )}
          <LinearGradient
            pointerEvents="none"
            colors={[
              "rgba(255,255,255,0.14)",
              "rgba(255,255,255,0.05)",
              "rgba(5,12,24,0.55)",
              "rgba(5,8,20,0.72)",
            ]}
            locations={[0, 0.18, 0.55, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(34,211,238,0.08)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cornerSheen}
          />
          <View pointerEvents="none" style={styles.insetHighlight} />
          <RankingsShellGridOverlay borderRadius={16} />

          <View style={styles.cardInner}>
            <View style={styles.header}>
              <View style={styles.titleRow}>
                <View style={styles.titleAccent} />
                <View style={styles.titleBlock}>
                  <Text style={styles.title}>{t.title}</Text>
                  <Text style={styles.planLimits}>{t.planLimits}</Text>
                </View>
              </View>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={communityFieldLabelStyle}>{t.name}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                maxLength={60}
                style={[GLASS_FIELD, styles.input]}
              />

              <Text style={[communityFieldLabelStyle, styles.gapTop]}>{t.description}</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                maxLength={280}
                multiline
                placeholder={t.descriptionPh}
                placeholderTextColor="rgba(255,255,255,0.28)"
                style={[GLASS_FIELD, styles.textarea]}
              />

              <Text style={[communityFieldLabelStyle, styles.gapTop]}>{t.header}</Text>
              <Pressable
                onPress={() => void pickImage()}
                style={({ pressed }) => [styles.pickBtn, pressed && communityPressableTapStyle(true)]}
              >
                <Text style={styles.pickBtnText}>{t.pickImage}</Text>
              </Pressable>
              {headerUri ? <Image source={{ uri: headerUri }} style={styles.preview} /> : null}

              <Text style={[styles.note, styles.gapTop]}>{t.scoringNote}</Text>

              <Text style={[communityFieldLabelStyle, styles.gapTop]}>{t.league}</Text>
              <OptionRow
                options={COMMUNITY_LEAGUES.map((k) => ({ key: k, label: leagueLabel(k, language) }))}
                value={league}
                onChange={(v) => setLeague(v as CommunityLeague)}
              />

              <Text style={[communityFieldLabelStyle, styles.gapTop]}>{t.metric}</Text>
              <OptionRow
                options={COMMUNITY_METRICS.map((k) => ({ key: k, label: metricLabel(k, language) }))}
                value={metric}
                onChange={(v) => setMetric(v as CommunityMetric)}
              />
              {metric === "activeWinStreak" ? <Text style={styles.note}>{t.streakNote}</Text> : null}
            </ScrollView>

            <View style={styles.footer}>
              <Pressable
                disabled={busy}
                onPress={closeReset}
                style={({ pressed }) => [styles.cancelBtn, pressed && communityPressableTapStyle(true)]}
              >
                <Text style={styles.cancelText}>{t.cancel}</Text>
              </Pressable>
              <Pressable
                disabled={busy || name.trim().length < 1}
                onPress={() => void onSubmit()}
                style={({ pressed }) => [
                  styles.submitBtn,
                  (busy || name.trim().length < 1) && styles.submitDisabled,
                  pressed && !(busy || name.trim().length < 1) && communityPressableTapStyle(true),
                ]}
              >
                <LinearGradient
                  pointerEvents="none"
                  colors={["rgba(34,211,238,0.22)", "rgba(34,211,238,0.1)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFillObject}
                />
                <Text style={styles.submitText}>{busy ? t.creating : t.submit}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function OptionRow({
  options,
  value,
  onChange,
}: {
  options: Array<{ key: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <View style={styles.optionWrap}>
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <Pressable
            key={opt.key}
            onPress={() => onChange(opt.key)}
            style={({ pressed }) => [
              styles.optionChip,
              active && styles.optionChipActive,
              pressed && communityPressableTapStyle(true),
            ]}
          >
            {active ? (
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(34,211,238,0.18)", "rgba(34,211,238,0.06)"]}
                style={StyleSheet.absoluteFillObject}
              />
            ) : null}
            <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  card: {
    ...communityModalCardStyle,
    width: "100%",
    maxWidth: 400,
    maxHeight: "88%",
    flexDirection: "column",
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(8,14,28,0.42)",
  },
  cornerSheen: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.85,
  },
  insetHighlight: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: 1,
  },
  cardInner: {
    position: "relative",
    zIndex: 2,
    flexShrink: 1,
    maxHeight: "100%",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: 10,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleAccent: {
    width: 3,
    borderRadius: 2,
    backgroundColor: "rgba(34,211,238,0.75)",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(236,254,255,0.96)",
  },
  planLimits: {
    marginTop: 8,
    fontSize: 10,
    lineHeight: 16,
    color: "rgba(255,255,255,0.42)",
  },
  scroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 20,
  },
  input: {
    color: "rgba(236,254,255,0.92)",
    fontSize: 14,
  },
  textarea: {
    color: "rgba(236,254,255,0.92)",
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: "top",
  },
  gapTop: {
    marginTop: 12,
  },
  pickBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingVertical: 10,
    alignItems: "center",
    overflow: "hidden",
  },
  pickBtnText: {
    fontSize: 12,
    color: "rgba(186,230,253,0.88)",
  },
  preview: {
    marginTop: 8,
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  note: {
    fontSize: 10,
    lineHeight: 16,
    color: "rgba(255,255,255,0.45)",
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    overflow: "hidden",
  },
  optionChipActive: {
    borderColor: "rgba(34,211,238,0.42)",
  },
  optionText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.62)",
  },
  optionTextActive: {
    color: "rgba(186,230,253,0.96)",
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: "hidden",
  },
  cancelText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.72)",
  },
  submitBtn: {
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.34)",
    backgroundColor: "rgba(34,211,238,0.1)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    overflow: "hidden",
  },
  submitDisabled: {
    opacity: 0.5,
  },
  submitText: {
    fontSize: 12,
    fontWeight: "700",
    color: "rgba(236,254,255,0.96)",
  },
});
