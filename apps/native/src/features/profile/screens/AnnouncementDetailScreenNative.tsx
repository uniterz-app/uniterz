/**
 * Web `app/mobile/announcements/[id]/page.tsx` 相当
 */
import { useEffect, useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { CandleChartLoaderNative } from "../../../components/CandleChartLoaderNative";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { LinearGradient } from "expo-linear-gradient";
import { doc, getDoc, Timestamp } from "firebase/firestore";
import MobilePageShell from "../mobileScreens/MobilePageShell";
import type { ProfileStackParamList } from "../../../navigation/types";
import { colors } from "../../../theme/tokens";
import { db } from "../../../lib/firebase";
import { useFirebaseUser } from "../../../auth/FirebaseUserProvider";
import { markAnnouncementReadNative } from "../mobileScreens/markAnnouncementReadNative";
import {
  getSyntheticEventById,
  isInAppEventAnnouncementDetailNative,
} from "../mobileScreens/announcementsNativeUtils";
import { useNativeUserLanguage } from "../../../hooks/useNativeUserLanguage";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";
import { resolveEventNoticeCopy } from "@/lib/events/resolveEventNoticeCopy";

type AnnouncementRow = {
  title: string;
  body?: string;
  heroImageURL?: string;
  type?: string;
  postedAt?: Timestamp | Date | null;
};

const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL?.replace(/\/$/, "") ?? null;

const TYPE_META: Record<string, { label: UiStrings; colors: [string, string] }> = {
  event: {
    label: {
      ja: "イベント",
      en: "Event",
      ko: "이벤트",
      zh: "活动",
      es: "Evento",
      pt: "Evento",
      fr: "Événement",
    },
    colors: ["#00E5FF", "#0077FF"],
  },
  campaign: {
    label: {
      ja: "キャンペーン",
      en: "Campaign",
      ko: "캠페인",
      zh: "活动推广",
      es: "Campaña",
      pt: "Campanha",
      fr: "Campagne",
    },
    colors: ["#FF4DFF", "#A64DFF"],
  },
  update: {
    label: {
      ja: "アップデート",
      en: "Update",
      ko: "업데이트",
      zh: "更新",
      es: "Actualización",
      pt: "Atualização",
      fr: "Mise à jour",
    },
    colors: ["#9DFF00", "#3DFF75"],
  },
  maintenance: {
    label: {
      ja: "メンテナンス",
      en: "Maintenance",
      ko: "점검",
      zh: "维护",
      es: "Mantenimiento",
      pt: "Manutenção",
      fr: "Maintenance",
    },
    colors: ["#FFC400", "#FF7A00"],
  },
  info: {
    label: {
      ja: "お知らせ",
      en: "News",
      ko: "공지",
      zh: "公告",
      es: "Noticias",
      pt: "Avisos",
      fr: "Actualités",
    },
    colors: ["#9CA3AF", "#6B7280"],
  },
};

function formatDate(d?: Timestamp | Date | null) {
  if (!d) return "";
  const date = d instanceof Timestamp ? d.toDate() : d;
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}/${mm}/${dd} ${hh}:${min}`;
}

function heroUri(raw?: string): string | null {
  const value = (raw ?? "").trim();
  if (!value) return null;
  if (value.startsWith("http")) return value;
  if (value.startsWith("/") && API_BASE) return `${API_BASE}${value}`;
  return value;
}

export default function AnnouncementDetailScreenNative() {
  const route = useRoute<RouteProp<ProfileStackParamList, "AnnouncementDetail">>();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { fUser } = useFirebaseUser();
  const { language } = useNativeUserLanguage(fUser?.uid);
  const lang = resolveLocalizedLang(language);
  const { id } = route.params;
  const [row, setRow] = useState<AnnouncementRow | null>(null);
  const [synthetic, setSynthetic] = useState(false);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setMissing(false);
    setRow(null);
    setSynthetic(false);
    void (async () => {
      const snap = await getDoc(doc(db, "announcements", id));
      if (!alive) return;
      if (snap.exists()) {
        setRow(snap.data() as AnnouncementRow);
        setSynthetic(false);
      } else if (isInAppEventAnnouncementDetailNative(id)) {
        setSynthetic(true);
      } else {
        setMissing(true);
      }
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (!loading && !missing) {
      markAnnouncementReadNative(fUser?.uid ?? null, id);
    }
  }, [fUser?.uid, id, loading, missing]);

  const syntheticEvent = synthetic ? getSyntheticEventById(id) : undefined;
  const eventCopy = syntheticEvent
    ? resolveEventNoticeCopy(syntheticEvent, lang)
    : null;
  const typeKey = synthetic ? "event" : row?.type ?? "info";
  const meta = TYPE_META[typeKey] ?? TYPE_META.info!;
  const title = eventCopy ? eventCopy.title : row?.title ?? "";
  const body = eventCopy ? eventCopy.description : row?.body ?? "";
  const postedAt = syntheticEvent ? Timestamp.fromMillis(syntheticEvent.postedAtMs) : row?.postedAt;
  const src = synthetic ? null : heroUri(row?.heroImageURL);

  return (
    <MobilePageShell
      title="NEWS"
      subtitle={L(lang, {
        ja: "公式のお知らせ詳細です。",
        en: "Official announcement details.",
        ko: "공식 공지 상세 내용입니다.",
        zh: "官方公告详情。",
        es: "Detalles del anuncio oficial.",
        pt: "Detalhes do aviso oficial.",
        fr: "Détails de l'annonce officielle.",
      })}
      appBackground
      onClose={() => navigation.goBack()}
    >
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <CandleChartLoaderNative
              label={L(lang, {
                ja: "読み込み中",
                en: "Loading",
                ko: "불러오는 중",
                zh: "加载中",
                es: "Cargando",
                pt: "Carregando",
                fr: "Chargement",
              })}
            />
          </View>
        ) : missing || (!row && !syntheticEvent) ? (
          <Text style={styles.muted}>
            {L(lang, {
              ja: "お知らせが見つかりません。",
              en: "This announcement was not found.",
              ko: "공지를 찾을 수 없습니다.",
              zh: "未找到该公告。",
              es: "No se encontró el anuncio.",
              pt: "Aviso não encontrado.",
              fr: "Annonce introuvable.",
            })}
          </Text>
        ) : (
          <>
            {src ? <Image source={{ uri: src }} style={styles.hero} resizeMode="cover" /> : null}
            <View style={styles.typeRow}>
              <LinearGradient colors={meta.colors} style={styles.typePill}>
                <Text style={styles.typePillText}>{L(lang, meta.label)}</Text>
              </LinearGradient>
              <Text style={styles.date}>{formatDate(postedAt)}</Text>
            </View>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.body}>{body}</Text>
            {eventCopy ? (
              <View style={styles.eventBox}>
                <Text style={styles.eventLine}>
                  {L(lang, {
                    ja: "期間",
                    en: "Period",
                    ko: "기간",
                    zh: "期间",
                    es: "Periodo",
                    pt: "Período",
                    fr: "Période",
                  })}
                  : {eventCopy.period}
                </Text>
                {eventCopy.target ? (
                  <Text style={styles.eventLine}>
                    {L(lang, {
                      ja: "参加条件",
                      en: "Eligibility",
                      ko: "참가 조건",
                      zh: "参与条件",
                      es: "Requisitos",
                      pt: "Requisitos",
                      fr: "Conditions",
                    })}
                    : {eventCopy.target}
                  </Text>
                ) : null}
                {eventCopy.reward ? (
                  <Text style={styles.eventLine}>
                    {L(lang, {
                      ja: "特典",
                      en: "Reward",
                      ko: "보상",
                      zh: "奖励",
                      es: "Recompensa",
                      pt: "Recompensa",
                      fr: "Récompense",
                    })}
                    : {eventCopy.reward}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 48 },
  center: { paddingTop: 40, alignItems: "center" },
  muted: { color: colors.textSecondary, textAlign: "center", marginTop: 24 },
  hero: {
    width: "100%",
    height: 192,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 12,
  },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  typePillText: { fontSize: 11, fontWeight: "800", color: "rgba(0,0,0,0.88)" },
  date: { fontSize: 12, color: "rgba(248,250,252,0.6)" },
  title: { color: colors.textPrimary, fontSize: 18, fontWeight: "800", marginTop: 8, lineHeight: 24 },
  body: { color: "rgba(248,250,252,0.9)", fontSize: 15, lineHeight: 23, marginTop: 12 },
  eventBox: {
    marginTop: 14,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(18,8,24,0.72)",
    padding: 12,
    gap: 6,
  },
  eventLine: { color: "rgba(248,250,252,0.82)", fontSize: 13, lineHeight: 20 },
});
