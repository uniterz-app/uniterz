import { useCallback, useMemo, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
  type TextStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import type { Language } from "../../../../../lib/i18n/language";
import {
  COMMUNITY_CREATE_LEAGUES,
  COMMUNITY_CREATE_METRICS,
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
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import { MATCH_CARD_METRIC_FONT } from "../games/matchCardTypography";
import type { CreatedCommunityGroup } from "./communityApiNative";
import { communityApiUrl, communityAuthHeader } from "./communityApiNative";
import {
  communityMono,
  communityPressableTapStyle,
} from "./communityCrtThemeNative";

type Props = {
  visible: boolean;
  language: Language;
  onClose: () => void;
  onCreated: (group?: CreatedCommunityGroup | null, inviteCode?: string) => void;
};

const FIELD = {
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.22)",
  backgroundColor: "#000000",
  paddingHorizontal: 10,
  paddingVertical: 8,
} as const;

const LABEL: TextStyle = {
  fontFamily: communityMono,
  fontSize: 10,
  fontWeight: "600",
  letterSpacing: 1.6,
  textTransform: "uppercase",
  color: "rgba(255,255,255,0.55)",
  marginBottom: 6,
};

const JP_BODY = Platform.select({
  ios: "NotoSansJP_400Regular",
  android: "NotoSansJP_400Regular",
  default: "NotoSansJP_400Regular",
});

const JP_MED = Platform.select({
  ios: "NotoSansJP_600SemiBold",
  android: "NotoSansJP_600SemiBold",
  default: "NotoSansJP_600SemiBold",
});

export default function CreateGroupModalNative({ visible, language, onClose, onCreated }: Props) {
  const { fUser } = useFirebaseUser();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [headerUri, setHeaderUri] = useState<string | null>(null);
  const [metric, setMetric] = useState<CommunityMetric>("totalPoints");
  const [league, setLeague] = useState<CommunityLeague>("nba");
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
    setLeague("nba");
    onClose();
  }, [busy, onClose]);

  const pickImage = useCallback(async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      cyberAlert("", language === "en" ? "Photo access is required." : "写真へのアクセスが必要です。");
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
          rankingMetric: "totalPoints",
          periodType: "from_now",
          rankingLeague: "nba",
          rankingTeamIds: [],
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.ok) {
        cyberAlert("", String(json?.error ?? (language === "en" ? "Create failed." : "作成に失敗しました。")));
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
            rankingMetric: "totalPoints",
            periodType: "from_now",
            rankingLeague: "nba",
            rankingTeamIds: [],
            role: "owner",
          };
      onCreated(payload, String(json.inviteCode ?? "") || undefined);
      closeReset();
    } finally {
      setBusy(false);
    }
  }, [name, description, headerUri, fUser, busy, language, onCreated, closeReset]);

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
          <View style={styles.cardInner}>
            <View style={styles.header}>
              <Text style={styles.title}>{t.title}</Text>
              <Text style={styles.planLimits}>{t.planLimits}</Text>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={LABEL}>{t.name}</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                maxLength={60}
                style={[FIELD, styles.input]}
              />

              <Text style={[LABEL, styles.gapTop]}>{t.description}</Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                maxLength={280}
                multiline
                placeholder={t.descriptionPh}
                placeholderTextColor="rgba(255,255,255,0.55)"
                style={[FIELD, styles.textarea]}
              />

              <Text style={[LABEL, styles.gapTop]}>{t.header}</Text>
              <Pressable
                onPress={() => void pickImage()}
                style={({ pressed }) => [styles.pickBtn, pressed && communityPressableTapStyle(true)]}
              >
                <Text style={styles.pickBtnText}>{t.pickImage}</Text>
              </Pressable>
              {headerUri ? <Image source={{ uri: headerUri }} style={styles.preview} /> : null}

              <Text style={[styles.note, styles.gapTop]}>{t.scoringNote}</Text>

              <Text style={[LABEL, styles.gapTop]}>{t.league}</Text>
              <OptionRow
                options={COMMUNITY_CREATE_LEAGUES.map((k) => ({
                  key: k,
                  label: leagueLabel(k, language),
                }))}
                value={league}
                onChange={(v) => setLeague(v as CommunityLeague)}
              />

              <Text style={[LABEL, styles.gapTop]}>{t.metric}</Text>
              <OptionRow
                options={COMMUNITY_CREATE_METRICS.map((k) => ({
                  key: k,
                  label: metricLabel(k, language),
                }))}
                value={metric}
                onChange={(v) => setMetric(v as CommunityMetric)}
              />
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
    backgroundColor: "rgba(0,0,0,0.78)",
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  card: {
    width: "100%",
    maxWidth: 400,
    maxHeight: "88%",
    flexDirection: "column",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "#000000",
  },
  cardInner: {
    position: "relative",
    zIndex: 2,
    flexShrink: 1,
    maxHeight: "100%",
    backgroundColor: "#000000",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.14)",
  },
  title: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#FFFFFF",
  },
  planLimits: {
    marginTop: 8,
    fontFamily: JP_BODY,
    fontSize: 11,
    lineHeight: 17,
    color: "rgba(255,255,255,0.58)",
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
    fontFamily: JP_MED,
    color: "#FFFFFF",
    fontSize: 15,
  },
  textarea: {
    fontFamily: JP_BODY,
    color: "#FFFFFF",
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: "top",
  },
  gapTop: {
    marginTop: 12,
  },
  pickBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "#000000",
    paddingVertical: 10,
    alignItems: "center",
  },
  pickBtnText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 12,
    letterSpacing: 1.2,
    color: "#FFFFFF",
  },
  preview: {
    marginTop: 8,
    width: 120,
    height: 120,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "#000000",
  },
  note: {
    fontFamily: JP_BODY,
    fontSize: 11,
    lineHeight: 17,
    color: "rgba(255,255,255,0.58)",
  },
  optionWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  optionChip: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    backgroundColor: "#000000",
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  optionChipActive: {
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
  },
  optionText: {
    fontFamily: JP_MED,
    fontSize: 12,
    color: "rgba(255,255,255,0.62)",
  },
  optionTextActive: {
    color: "#000000",
    fontWeight: "700",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.14)",
    backgroundColor: "#000000",
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    backgroundColor: "#000000",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 13,
    letterSpacing: 0.8,
    color: "#FFFFFF",
  },
  submitBtn: {
    borderWidth: 1,
    borderColor: "#FFFFFF",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  submitDisabled: {
    opacity: 0.4,
  },
  submitText: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "#000000",
  },
});
