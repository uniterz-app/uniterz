/** トレード Buzz フィード — 確度順・日本時間・出典つき（確定ではない） */
import { useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  NBA_TRADE_BUZZ_CONFIDENCE_LABEL,
  NBA_TRADE_BUZZ_KIND_LABEL,
  formatNbaTradeBuzzEventWhen,
  isNbaTradeBuzzStale,
  nbaTradeBuzzLatestMs,
  type NbaTradeBuzzEvent,
  type NbaTradeBuzzItem,
} from "../../../../../../../lib/predict/nbaTradeBuzz";
import TeamAbbrBadgeNative from "../../TeamAbbrBadgeNative";
import { nbaTeamIdFromBracketCode } from "../../../../../../../lib/nba-bracket-code";

type Props = {
  items: readonly NbaTradeBuzzItem[];
  language?: "ja" | "en";
  nowMs?: number;
  /** 取材の基準時刻（表示用・JST） */
  asOfLabel?: string | null;
  /** Free 向け。動画広告のプレースホルダ */
  showAdSlot?: boolean;
  onPressAd?: () => void;
};

const OX = "Oxanium_700Bold";

/** カードで最初に見せる出来事の数（残りは「もっと見る」） */
const EVENTS_PREVIEW = 2;

function formatAge(msAgo: number, ja: boolean): string {
  const h = Math.max(0, Math.round(msAgo / (60 * 60 * 1000)));
  if (h < 1) return ja ? "たった今" : "just now";
  if (h < 24) return ja ? `${h}時間前` : `${h}h ago`;
  const d = Math.round(h / 24);
  return ja ? `${d}日前` : `${d}d ago`;
}

function openSource(url: string | null | undefined) {
  if (!url) return;
  void Linking.openURL(url).catch(() => {});
}

function EventRow({
  event,
  ja,
}: {
  event: NbaTradeBuzzEvent;
  ja: boolean;
}) {
  return (
    <View style={styles.event}>
      <View style={styles.eventHead}>
        <Text style={styles.eventWhen}>
          {formatNbaTradeBuzzEventWhen(event)}
        </Text>
        <Text style={styles.eventKind}>
          {ja ? NBA_TRADE_BUZZ_KIND_LABEL[event.kind] : event.kind}
        </Text>
      </View>
      <Text style={styles.eventText}>{event.textJa}</Text>
      <Pressable
        onPress={() => openSource(event.sourceUrl)}
        disabled={!event.sourceUrl}
        accessibilityRole={event.sourceUrl ? "link" : undefined}
        hitSlop={6}
      >
        <Text
          style={[
            styles.source,
            event.sourceUrl ? styles.sourceLink : null,
          ]}
        >
          SOURCE · {event.sourceLabel}
          {event.sourceUrl ? " →" : ""}
        </Text>
      </Pressable>
    </View>
  );
}

function BuzzCard({
  item,
  nowMs,
  ja,
}: {
  item: NbaTradeBuzzItem;
  nowMs: number;
  ja: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const stale = isNbaTradeBuzzStale(item, nowMs);
  const conf = NBA_TRADE_BUZZ_CONFIDENCE_LABEL[item.confidence];
  const fromId = item.fromTeamAbbr
    ? nbaTeamIdFromBracketCode(item.fromTeamAbbr)
    : null;
  const latest = nbaTradeBuzzLatestMs(item);
  const shown = expanded
    ? item.events
    : item.events.slice(0, EVENTS_PREVIEW);
  const hidden = item.events.length - shown.length;

  return (
    <View style={[styles.card, stale ? styles.cardStale : null]}>
      <View style={styles.cardHead}>
        <Text style={styles.rank}>#{item.rank}</Text>
        <Text style={styles.conf}>{ja ? conf.ja : conf.en}</Text>
        <View style={styles.spacer} />
        <Text style={styles.age}>
          {latest > 0 ? formatAge(nowMs - latest, ja) : "—"}
          {stale ? (ja ? " · 古い" : " · stale") : ""}
        </Text>
      </View>

      <View style={styles.nameRow}>
        {/* 傾きは View に載せる（Android は Text の skewX が効かない）。書体は選手リーダー表 playerNameStyle と同じ */}
        <View style={styles.nameSlant}>
          <Text style={styles.name} numberOfLines={2}>
            {item.playerName}
          </Text>
        </View>
        {item.fromTeamAbbr ? (
          <TeamAbbrBadgeNative
            abbr={item.fromTeamAbbr}
            teamId={fromId ?? undefined}
          />
        ) : null}
      </View>

      <Text style={styles.headline}>{item.headlineJa}</Text>

      <View style={styles.events}>
        {shown.map((e, i) => (
          <EventRow key={`${item.id}-${i}`} event={e} ja={ja} />
        ))}
        {hidden > 0 || expanded ? (
          <Pressable
            onPress={() => setExpanded((v) => !v)}
            style={styles.moreBtn}
            accessibilityRole="button"
          >
            <Text style={styles.moreText}>
              {expanded
                ? ja
                  ? "たたむ"
                  : "Show less"
                : ja
                  ? `もっと見る（あと${hidden}件）`
                  : `Show ${hidden} more`}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/** 新しい順（最新の出来事の時刻）。同じ時刻は確度の高い順（rank 小さい順） */
function sortNewestFirst(
  items: readonly NbaTradeBuzzItem[]
): NbaTradeBuzzItem[] {
  return [...items].sort((a, b) => {
    const diff = nbaTradeBuzzLatestMs(b) - nbaTradeBuzzLatestMs(a);
    return diff !== 0 ? diff : a.rank - b.rank;
  });
}

export default function NbaTradeBuzzFeedNative({
  items,
  language = "ja",
  nowMs = Date.now(),
  asOfLabel = null,
  showAdSlot = true,
  onPressAd,
}: Props) {
  const ja = language === "ja";
  const sorted = sortNewestFirst(items);

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.intro}>
        <Text style={styles.introTitle}>BUZZ</Text>
        <Text style={styles.introBody}>
          {ja
            ? "記者の報道・球団や本人の発言を、新しい順に並べています。番号は確度（1 が最も確度が高い）。時刻は日本時間。確定ではなく、外れることもあります。"
            : "Reports and statements, newest first. The number is confidence (1 is highest). Times are JST. Not confirmed; misses happen."}
        </Text>
        {asOfLabel ? (
          <Text style={styles.asOf}>
            {ja ? `取材時点 ${asOfLabel}（JST）` : `As of ${asOfLabel} (JST)`}
          </Text>
        ) : null}
      </View>

      {sorted.map((item, index) => (
        <View key={item.id}>
          <BuzzCard item={item} nowMs={nowMs} ja={ja} />
          {showAdSlot && index === 1 ? (
            <Pressable
              onPress={onPressAd}
              style={styles.adSlot}
              accessibilityRole="button"
              accessibilityLabel={ja ? "広告（任意）" : "Optional ad"}
            >
              <Text style={styles.adEyebrow}>
                {ja ? "AD · 任意" : "AD · optional"}
              </Text>
              <Text style={styles.adTitle}>
                {ja
                  ? "動画を見ると、この試合の Pro Insight を 1 回"
                  : "Watch a video for 1 Pro Insight unlock"}
              </Text>
              <Text style={styles.adHint}>
                {ja
                  ? "押し込みではなく、自分で開くときだけ。Pro は広告なし。"
                  : "Only when you tap — Pro stays ad-free."}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.2)",
    backgroundColor: "rgba(0,245,255,0.05)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 4,
    marginBottom: 2,
  },
  introTitle: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
    color: "rgba(0,245,255,0.9)",
    textTransform: "uppercase",
  },
  introBody: {
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.5)",
  },
  asOf: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  card: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(6,10,16,0.96)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  cardStale: {
    opacity: 0.6,
  },
  cardHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rank: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(0,245,255,0.85)",
  },
  conf: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(252,211,77,0.85)",
    textTransform: "uppercase",
  },
  spacer: {
    flex: 1,
  },
  age: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  nameSlant: {
    flex: 1,
    minWidth: 0,
    alignSelf: "flex-start",
    transform: [{ skewX: "-6deg" }],
  },
  name: {
    fontFamily: "Oxanium_600SemiBold",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: "#fff",
    textTransform: "uppercase",
    includeFontPadding: false,
  },
  headline: {
    fontSize: 12,
    lineHeight: 18,
    color: "rgba(255,255,255,0.8)",
  },
  events: {
    marginTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 8,
    gap: 10,
  },
  event: {
    gap: 3,
  },
  eventHead: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventWhen: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "rgba(255,255,255,0.6)",
  },
  eventKind: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: "rgba(0,245,255,0.7)",
    textTransform: "uppercase",
  },
  eventText: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.72)",
  },
  source: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
  sourceLink: {
    color: "rgba(0,245,255,0.8)",
  },
  moreBtn: {
    alignSelf: "flex-start",
    paddingVertical: 2,
  },
  moreText: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "rgba(0,245,255,0.85)",
    textTransform: "uppercase",
  },
  adSlot: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderStyle: "dashed",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 4,
  },
  adEyebrow: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
  },
  adTitle: {
    fontFamily: OX,
    fontSize: 12,
    fontWeight: "800",
    color: "rgba(255,255,255,0.85)",
  },
  adHint: {
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(255,255,255,0.4)",
  },
});
