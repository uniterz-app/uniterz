/**
 * Web `app/mobile/announcements/page.tsx` + `[id]/page.tsx` に相当（一覧→詳細）。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CandleChartLoaderNative } from "../../../components/CandleChartLoaderNative";
import { SkeletonScanNative } from "../../../components/SkeletonScanNative";
import { LinearGradient } from "expo-linear-gradient";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../../../lib/firebase";
const VISIBLE_ANNOUNCEMENTS_FETCH_LIMIT = 100;

function sortAnnouncementsByPinnedThenPosted<
  T extends { id: string; pinned?: boolean; postedAt?: Timestamp | Date | null },
>(rows: T[]): T[] {
  return [...rows].sort((a, b) => {
    const pa = a.pinned ? 1 : 0;
    const pb = b.pinned ? 1 : 0;
    if (pa !== pb) return pb - pa;
    const am =
      a.postedAt instanceof Timestamp
        ? a.postedAt.toMillis()
        : a.postedAt
          ? a.postedAt.getTime()
          : 0;
    const bm =
      b.postedAt instanceof Timestamp
        ? b.postedAt.toMillis()
        : b.postedAt
          ? b.postedAt.getTime()
          : 0;
    return bm - am;
  });
}
import {
  getSyntheticEventById,
  isInAppEventAnnouncementDetailNative,
  mergeSyntheticEventIntoAnnouncementsNative,
} from "./announcementsNativeUtils";
import MobilePageShell from "./MobilePageShell";
import { markAnnouncementReadNative } from "./markAnnouncementReadNative";
import { DATE_LOCALE } from "@/lib/i18n/language";
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";
import { resolveEventNoticeCopy } from "@/lib/events/resolveEventNoticeCopy";

const LIST_LIMIT = 20;

type AnnouncementRow = {
  id: string;
  title: string;
  heroImageURL?: string;
  type?: string;
  postedAt?: Timestamp | Date | null;
  pinned?: boolean;
  body?: string;
};

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

function TypePill({ label, colors }: { label: string; colors: [string, string] }) {
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.typePill}>
      <Text style={styles.typePillText}>{label}</Text>
    </LinearGradient>
  );
}

function formatDate(d?: Timestamp | Date | null, lang: LocalizedLang = "en") {
  if (!d) return "";
  const date = d instanceof Timestamp ? d.toDate() : d;
  return date.toLocaleString(DATE_LOCALE[lang], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function typeLabelFor(meta: { label: UiStrings }, lang: LocalizedLang): string {
  return L(lang, meta.label);
}

function announcementsSubtitle(lang: LocalizedLang): string {
  return L(lang, {
    ja: "公式のお知らせ・イベント・メンテナンス情報です。",
    en: "Official announcements, events, and maintenance updates.",
    ko: "공식 공지·이벤트·점검 정보입니다.",
    zh: "官方公告、活动与维护信息。",
    es: "Anuncios oficiales, eventos y mantenimiento.",
    pt: "Avisos oficiais, eventos e manutenção.",
    fr: "Annonces officielles, événements et maintenance.",
  });
}


function heroUri(apiBase: string | null, raw?: string): string | null {
  const t = (raw ?? "").trim();
  if (!t) return null;
  if (t.startsWith("http")) return t;
  if (t.startsWith("/") && apiBase) return `${apiBase}${t}`;
  return t;
}

type Props = {
  language: string;
  uid: string | undefined;
  authReady: boolean;
  apiBase: string | null;
  readIds: Set<string>;
  onClose: () => void;
};

export default function MobileAnnouncementsScreen({
  language,
  uid,
  authReady,
  apiBase,
  readIds,
  onClose,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const [items, setItems] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<AnnouncementRow | null>(null);
  const [detailSynthetic, setDetailSynthetic] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const q = query(
          collection(db, "announcements"),
          where("visible", "==", true),
          limit(VISIBLE_ANNOUNCEMENTS_FETCH_LIMIT)
        );
        const snap = await getDocs(q);
        if (!alive) return;
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as AnnouncementRow[];
        const sorted = sortAnnouncementsByPinnedThenPosted(list);
        setItems(mergeSyntheticEventIntoAnnouncementsNative(sorted.slice(0, LIST_LIMIT)));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const openDetail = useCallback(
    (id: string) => {
      setDetailId(id);
      setDetailLoading(true);
      setDetailRow(null);
      setDetailSynthetic(false);
      markAnnouncementReadNative(uid, id);
      void (async () => {
        const ref = doc(db, "announcements", id);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setDetailRow({ id: snap.id, ...snap.data() } as AnnouncementRow);
          setDetailSynthetic(false);
        } else if (isInAppEventAnnouncementDetailNative(id)) {
          setDetailRow(null);
          setDetailSynthetic(true);
        } else {
          setDetailRow(null);
          setDetailSynthetic(false);
        }
        setDetailLoading(false);
      })();
    },
    [uid]
  );

  const isUnread = useMemo(() => {
    if (!authReady) return () => false;
    return (id: string) => !readIds.has(id);
  }, [authReady, readIds]);

  if (detailId) {
    return (
      <MobilePageShell
        title="NEWS"
        subtitle={announcementsSubtitle(lang)}
        onClose={onClose}
        onBack={() => setDetailId(null)}
      >
        <ScrollView contentContainerStyle={styles.detailPad}>
          {detailLoading ? (
            <View style={styles.loaderWrap}>
              <CandleChartLoaderNative label={L(lang, {
                ja: "読み込み中",
                en: "Loading",
                ko: "불러오는 중",
                zh: "加载中",
                es: "Cargando",
                pt: "Carregando",
                fr: "Chargement",
              })} />
            </View>
          ) : detailSynthetic ? (
            <SyntheticEventBody lang={lang} announcementId={detailId} />
          ) : detailRow ? (
            <RegularAnnouncementBody row={detailRow} lang={lang} apiBase={apiBase} />
          ) : (
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
          )}
        </ScrollView>
      </MobilePageShell>
    );
  }

  return (
    <MobilePageShell
      title="NEWS"
      subtitle={announcementsSubtitle(lang)}
      onClose={onClose}
    >
      <ScrollView contentContainerStyle={styles.listPad}>
        {loading ? (
          <View style={styles.skelWrap}>
            {[0, 1, 2].map((i) => (
              <SkeletonScanNative key={i} style={styles.skelCard}>
                <View style={styles.skelImg} />
                <View style={styles.skelLine} />
                <View style={[styles.skelLine, { width: "70%" }]} />
              </SkeletonScanNative>
            ))}
          </View>
        ) : items.length === 0 ? (
          <Text style={styles.muted}>
            {L(lang, {
              ja: "現在お知らせはありません",
              en: "No announcements.",
              ko: "현재 공지가 없습니다",
              zh: "目前没有公告",
              es: "No hay anuncios.",
              pt: "Sem avisos.",
              fr: "Aucune annonce.",
            })}
          </Text>
        ) : (
          items.map((a) => {
            const typeKey = a.type ?? "info";
            const meta = TYPE_META[typeKey] ?? TYPE_META.info!;
            const typeLabel = typeLabelFor(meta, lang);
            const unread = isUnread(a.id);
            const src = heroUri(apiBase, a.heroImageURL);
            return (
              <Pressable
                key={a.id}
                onPress={() => openDetail(a.id)}
                style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
              >
                {unread ? <View style={styles.unreadDot} /> : null}
                {src ? (
                  <Image source={{ uri: src }} style={styles.hero} resizeMode="cover" />
                ) : (
                  <View style={[styles.hero, { backgroundColor: "rgba(255,255,255,0.06)" }]} />
                )}
                <View style={styles.cardInner}>
                  <View style={styles.typeRow}>
                    <TypePill label={typeLabel} colors={meta.colors} />
                    <Text style={styles.date}>{formatDate(a.postedAt, lang)}</Text>
                  </View>
                  <Text style={styles.cardTitle}>{a.title}</Text>
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </MobilePageShell>
  );
}

function RegularAnnouncementBody({
  row,
  lang,
  apiBase,
}: {
  row: AnnouncementRow;
  lang: LocalizedLang;
  apiBase: string | null;
}) {
  const typeKey = row.type ?? "info";
  const meta = TYPE_META[typeKey] ?? TYPE_META.info!;
  const typeLabel = typeLabelFor(meta, lang);
  const src = heroUri(apiBase, row.heroImageURL);
  return (
    <>
      {src ? (
        <Image source={{ uri: src }} style={styles.detailHero} resizeMode="cover" />
      ) : null}
      <View style={styles.typeRow}>
        <TypePill label={typeLabel} colors={meta.colors} />
        <Text style={styles.date}>{formatDate(row.postedAt, lang)}</Text>
      </View>
      <Text style={styles.detailH2}>{row.title}</Text>
      <Text style={styles.body}>{row.body ?? ""}</Text>
    </>
  );
}

function SyntheticEventBody({
  lang,
  announcementId,
}: {
  lang: LocalizedLang;
  announcementId: string;
}) {
  const e = getSyntheticEventById(announcementId);
  if (!e) {
    return (
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
    );
  }
  const meta = TYPE_META.event!;
  const typeLabel = typeLabelFor(meta, lang);
  const posted = new Date(e.postedAtMs);
  const resolved = resolveEventNoticeCopy(e, lang);
  const title = resolved.title;
  const body = resolved.description;
  const period = resolved.period;
  const target = resolved.target;
  const reward = resolved.reward;
  return (
    <>
      <View style={styles.typeRow}>
        <TypePill label={typeLabel} colors={meta.colors} />
        <Text style={styles.date}>{posted.toLocaleString(DATE_LOCALE[lang])}</Text>
      </View>
      <Text style={styles.detailH2}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Text style={[styles.body, { marginTop: 10 }]}>
        {L(lang, {
          ja: "期間",
          en: "Period",
          ko: "기간",
          zh: "期间",
          es: "Periodo",
          pt: "Período",
          fr: "Période",
        })}: {period}
      </Text>
      {target ? (
        <Text style={styles.body}>
          {L(lang, {
            ja: "参加条件",
            en: "Eligibility",
            ko: "참가 조건",
            zh: "参与条件",
            es: "Elegibilidad",
            pt: "Elegibilidade",
            fr: "Éligibilité",
          })}: {target}
        </Text>
      ) : null}
      {reward ? (
        <Text style={styles.body}>
          {L(lang, {
            ja: "特典",
            en: "Reward",
            ko: "특전",
            zh: "奖励",
            es: "Recompensa",
            pt: "Recompensa",
            fr: "Récompense",
          })}: {reward}
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  listPad: { padding: 16, paddingBottom: 48, gap: 20 },
  loaderWrap: { paddingTop: 24, alignItems: "center" },
  skelWrap: { gap: 16 },
  skelCard: {
    borderRadius: 0,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  skelImg: { height: 176, backgroundColor: "rgba(255,255,255,0.08)" },
  skelLine: { height: 14, marginHorizontal: 12, marginVertical: 6, borderRadius: 0, backgroundColor: "rgba(255,255,255,0.08)" },
  card: {
    borderRadius: 0,
    overflow: "hidden",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  unreadDot: {
    position: "absolute",
    right: 10,
    top: 10,
    zIndex: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#22d3ee",
  },
  hero: { width: "100%", height: 176 },
  cardInner: { padding: 12 },
  typeRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  typePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  typePillText: { fontSize: 11, fontWeight: "800", color: "rgba(0,0,0,0.88)" },
  date: { fontSize: 12, color: "rgba(248,250,252,0.55)" },
  cardTitle: { marginTop: 6, fontSize: 16, fontWeight: "700", color: "#f8fafc" },
  muted: { textAlign: "center", color: "rgba(248,250,252,0.55)", marginTop: 24, fontSize: 14 },
  detailPad: { padding: 16, paddingBottom: 48 },
  detailHero: {
    width: "100%",
    height: 192,
    borderRadius: 0,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  detailH2: { fontSize: 18, fontWeight: "800", color: "#f8fafc", marginTop: 4 },
  body: { marginTop: 12, fontSize: 15, lineHeight: 22, color: "rgba(248,250,252,0.9)" },
});
