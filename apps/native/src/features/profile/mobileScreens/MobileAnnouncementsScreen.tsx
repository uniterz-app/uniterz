/**
 * Web `app/mobile/announcements/page.tsx` + `[id]/page.tsx` に相当（一覧→詳細）。
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
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

const TYPE_META: Record<string, { labelJa: string; labelEn: string; colors: [string, string] }> = {
  event: { labelJa: "イベント", labelEn: "Event", colors: ["#00E5FF", "#0077FF"] },
  campaign: { labelJa: "キャンペーン", labelEn: "Campaign", colors: ["#FF4DFF", "#A64DFF"] },
  update: { labelJa: "アップデート", labelEn: "Update", colors: ["#9DFF00", "#3DFF75"] },
  maintenance: { labelJa: "メンテナンス", labelEn: "Maintenance", colors: ["#FFC400", "#FF7A00"] },
  info: { labelJa: "お知らせ", labelEn: "News", colors: ["#9CA3AF", "#6B7280"] },
};

function TypePill({ label, colors }: { label: string; colors: [string, string] }) {
  return (
    <LinearGradient colors={colors} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={styles.typePill}>
      <Text style={styles.typePillText}>{label}</Text>
    </LinearGradient>
  );
}

function formatDate(d?: Timestamp | Date | null, isJa?: boolean) {
  if (!d) return "";
  const date = d instanceof Timestamp ? d.toDate() : d;
  return date.toLocaleString(isJa ? "ja-JP" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
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
  language: "ja" | "en";
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
  const isJa = language === "ja";
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

  const listTitle = isJa ? "お知らせ" : "News";
  const detailTitle = listTitle;

  if (detailId) {
    return (
      <MobilePageShell title={detailTitle} onClose={onClose} onBack={() => setDetailId(null)}>
        <ScrollView contentContainerStyle={styles.detailPad}>
          {detailLoading ? (
            <ActivityIndicator color="#67e8f9" style={{ marginTop: 24 }} />
          ) : detailSynthetic ? (
            <SyntheticEventBody isJa={isJa} announcementId={detailId} />
          ) : detailRow ? (
            <RegularAnnouncementBody row={detailRow} isJa={isJa} apiBase={apiBase} />
          ) : (
            <Text style={styles.muted}>
              {isJa ? "お知らせが見つかりません。" : "This announcement was not found."}
            </Text>
          )}
        </ScrollView>
      </MobilePageShell>
    );
  }

  return (
    <MobilePageShell title={listTitle} onClose={onClose}>
      <ScrollView contentContainerStyle={styles.listPad}>
        {loading ? (
          <View style={styles.skelWrap}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={styles.skelCard}>
                <View style={styles.skelImg} />
                <View style={styles.skelLine} />
                <View style={[styles.skelLine, { width: "70%" }]} />
              </View>
            ))}
          </View>
        ) : items.length === 0 ? (
          <Text style={styles.muted}>
            {isJa ? "現在お知らせはありません" : "No announcements."}
          </Text>
        ) : (
          items.map((a) => {
            const typeKey = a.type ?? "info";
            const meta = TYPE_META[typeKey] ?? TYPE_META.info!;
            const typeLabel = isJa ? meta.labelJa : meta.labelEn;
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
                    <Text style={styles.date}>{formatDate(a.postedAt, isJa)}</Text>
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
  isJa,
  apiBase,
}: {
  row: AnnouncementRow;
  isJa: boolean;
  apiBase: string | null;
}) {
  const typeKey = row.type ?? "info";
  const meta = TYPE_META[typeKey] ?? TYPE_META.info!;
  const typeLabel = isJa ? meta.labelJa : meta.labelEn;
  const src = heroUri(apiBase, row.heroImageURL);
  return (
    <>
      {src ? (
        <Image source={{ uri: src }} style={styles.detailHero} resizeMode="cover" />
      ) : null}
      <View style={styles.typeRow}>
        <TypePill label={typeLabel} colors={meta.colors} />
        <Text style={styles.date}>{formatDate(row.postedAt, isJa)}</Text>
      </View>
      <Text style={styles.detailH2}>{row.title}</Text>
      <Text style={styles.body}>{row.body ?? ""}</Text>
    </>
  );
}

function SyntheticEventBody({
  isJa,
  announcementId,
}: {
  isJa: boolean;
  announcementId: string;
}) {
  const e = getSyntheticEventById(announcementId);
  if (!e) {
    return (
      <Text style={styles.muted}>
        {isJa ? "お知らせが見つかりません。" : "This announcement was not found."}
      </Text>
    );
  }
  const meta = TYPE_META.event!;
  const typeLabel = isJa ? meta.labelJa : meta.labelEn;
  const posted = new Date(e.postedAtMs);
  const title = isJa ? e.title : (e.titleEn ?? e.title);
  const body = isJa ? e.description : (e.descriptionEn ?? e.description);
  const period = isJa ? e.period : (e.periodEn ?? e.period);
  const target = isJa ? e.target : (e.targetEn ?? e.target);
  const reward = isJa ? e.reward : (e.rewardEn ?? e.reward);
  return (
    <>
      <View style={styles.typeRow}>
        <TypePill label={typeLabel} colors={meta.colors} />
        <Text style={styles.date}>{posted.toLocaleString(isJa ? "ja-JP" : "en-US")}</Text>
      </View>
      <Text style={styles.detailH2}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
      <Text style={[styles.body, { marginTop: 10 }]}>
        {isJa ? "期間" : "Period"}: {period}
      </Text>
      {target ? (
        <Text style={styles.body}>
          {isJa ? "参加条件" : "Eligibility"}: {target}
        </Text>
      ) : null}
      {reward ? (
        <Text style={styles.body}>
          {isJa ? "特典" : "Reward"}: {reward}
        </Text>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  listPad: { padding: 16, paddingBottom: 48, gap: 20 },
  skelWrap: { gap: 16 },
  skelCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  skelImg: { height: 176, backgroundColor: "rgba(255,255,255,0.08)" },
  skelLine: { height: 14, marginHorizontal: 12, marginVertical: 6, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.08)" },
  card: {
    borderRadius: 16,
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
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  detailH2: { fontSize: 18, fontWeight: "800", color: "#f8fafc", marginTop: 4 },
  body: { marginTop: 12, fontSize: 15, lineHeight: 22, color: "rgba(248,250,252,0.9)" },
});
