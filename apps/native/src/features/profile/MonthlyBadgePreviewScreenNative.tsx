/**
 * __DEV__ — 月間ランキングバッジの確認用。一覧（小型版）・詳細（傾き / 裏返し）・受け取り演出を並べる。
 * 画像は API ベース URL の `public/badges/monthly/` から読む（開発はローカルの Next）。
 */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MobilePageShell from "./mobileScreens/MobilePageShell";
import BadgePaletteNative from "./BadgePaletteNative";
import ProfileBadgeDetailModal from "./ProfileBadgeDetailModal";
import MonthlyBadgeUnlockOverlayNative from "./MonthlyBadgeUnlockOverlayNative";
import type { ResolvedBadgeNative } from "./useNativeProfileBadges";
import { resolveUniterzAssetUrl } from "../../lib/resolveUniterzAssetUrl";
import {
  monthlyBadgeArt,
  monthlyBadgeCopy,
  monthlyBadgeRefsForLabel,
  monthlyRankingBadgeId,
  type MonthlyBadgeDivision,
  type MonthlyBadgeRecord,
  type MonthlyBadgeRef,
} from "../../../../../lib/badges/monthlyRankingBadge";

const LABELS = ["2026-10", "2026-11"] as const;

/** 2026-10 の dry-run 結果（刻印の見え方確認用） */
const SAMPLE: Record<string, Omit<MonthlyBadgeRecord, "participantCount">> = {
  pickup_overall_1: { engravedName: "しゅが〜", handle: "nu3jajjb", value: 262.4 },
  pickup_overall_2: { engravedName: "sayasaya", handle: "dzxqc3v0", value: 259.4 },
  pickup_overall_3: { engravedName: "jaycr", handle: "j5jua4a1", value: 259.4 },
  pickup_upset_1: { engravedName: "mtai", handle: "7fbbbbar", value: 49 },
  pickup_scorer_1: { engravedName: "タカイザー・ソゼ", handle: "3x5muzad", value: 22 },
  pickup_winrate_1: { engravedName: "たけさん", handle: "bfr5p96k", value: 0.792 },
  pro_overall_1: { engravedName: "ナスカレー", handle: "m20hpq2q", value: 541.2 },
  pro_overall_2: { engravedName: "タカイザー・ソゼ", handle: "3x5muzad", value: 540.3 },
  pro_overall_3: { engravedName: "negi_1604", handle: "hjrfdyn6", value: 530.2 },
  pro_upset_1: { engravedName: "ぱーかー", handle: "qwj3h1y2", value: 59 },
  pro_scorer_1: { engravedName: "しらくさ", handle: "ev6yn0zw", value: 36 },
  pro_winrate_1: { engravedName: "KENJI", handle: "d4c2yp8t", value: 0.846 },
};

const PARTICIPANTS: Record<MonthlyBadgeDivision, number> = { pickup: 2562, pro: 40 };

function sampleRecord(ref: MonthlyBadgeRef): MonthlyBadgeRecord {
  const s = SAMPLE[`${ref.division}_${ref.kind}_${ref.rank}`];
  return {
    engravedName: s?.engravedName ?? "UNITERZ",
    handle: s?.handle ?? null,
    value: s?.value ?? null,
    participantCount: PARTICIPANTS[ref.division],
  };
}

function toResolved(ref: MonthlyBadgeRef): ResolvedBadgeNative {
  const ja = monthlyBadgeCopy(ref, "ja");
  return {
    id: monthlyRankingBadgeId(ref),
    title: ja.title,
    description: ja.description,
    icon: resolveUniterzAssetUrl(monthlyBadgeArt(ref).full),
    participantCount: PARTICIPANTS[ref.division],
    grantedAt: new Date(),
    monthlyRecord: sampleRecord(ref),
  };
}

export default function MonthlyBadgePreviewScreenNative({
  language,
  onClose,
}: {
  language: string;
  onClose: () => void;
}) {
  const [label, setLabel] = useState<string>(LABELS[LABELS.length - 1]);
  const refs = useMemo(() => monthlyBadgeRefsForLabel(label), [label]);
  const [selected, setSelected] = useState<ResolvedBadgeNative | null>(null);
  const [unlock, setUnlock] = useState<{ ref: MonthlyBadgeRef; key: number } | null>(null);

  const sections: { division: MonthlyBadgeDivision; title: string }[] = [
    { division: "pickup", title: "PICK UP" },
    { division: "pro", title: "PRO LEAGUE" },
  ];

  return (
    <MobilePageShell
      title="月間バッジ プレビュー"
      eyebrow="DEV"
      subtitle="一覧をタップ → 詳細（傾ける / タップで裏返す）。下のボタンで受け取り演出"
      onClose={onClose}
      appBackground
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.buttons}>
          {LABELS.map((l) => (
            <Pressable
              key={l}
              onPress={() => setLabel(l)}
              style={({ pressed }) => [styles.btn, l === label && styles.btnActive, pressed && styles.btnPressed]}
            >
              <Text style={[styles.btnText, l === label && styles.btnTextActive]}>{l}</Text>
            </Pressable>
          ))}
        </View>
        {sections.map(({ division, title }) => {
          const list = refs.filter((r) => r.division === division);
          return (
            <View key={division} style={styles.section}>
              <Text style={styles.sectionTitle}>{title} — 一覧</Text>
              <BadgePaletteNative
                badges={list.map(toResolved)}
                emptyLabel=""
                language={language}
                onSelect={setSelected}
              />
              <Text style={styles.caption}>受け取り演出</Text>
              <View style={styles.buttons}>
                {list.map((ref) => (
                  <Pressable
                    key={monthlyRankingBadgeId(ref)}
                    onPress={() => setUnlock({ ref, key: Date.now() })}
                    style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
                  >
                    <Text style={styles.btnText}>
                      {ref.kind.toUpperCase()} {ref.rank}位
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <ProfileBadgeDetailModal
        visible={selected != null}
        badge={selected}
        language={language}
        onClose={() => setSelected(null)}
      />
      {unlock ? (
        <MonthlyBadgeUnlockOverlayNative
          key={unlock.key}
          badgeRef={unlock.ref}
          record={sampleRecord(unlock.ref)}
          language={language}
          onClose={() => setUnlock(null)}
        />
      ) : null}
    </MobilePageShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    gap: 28,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: "rgba(252,246,232,0.92)",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
  },
  caption: {
    color: "rgba(244,224,176,0.55)",
    fontSize: 11,
    marginTop: 4,
  },
  buttons: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.5)",
    borderRadius: 2,
  },
  btnPressed: {
    opacity: 0.6,
  },
  btnActive: {
    backgroundColor: "rgba(201,162,39,0.9)",
  },
  btnTextActive: {
    color: "#0a0a0c",
    fontWeight: "700",
  },
  btnText: {
    color: "rgba(252,246,232,0.9)",
    fontSize: 11,
    letterSpacing: 0.6,
  },
});
