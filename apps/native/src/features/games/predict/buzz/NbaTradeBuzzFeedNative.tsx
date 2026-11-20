/** トレード Buzz フィード — 最新の記事は開いた状態、続きは MORE */
import { useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import {
  NBA_TRADE_BUZZ_KIND_LABEL,
  formatNbaTradeBuzzEventWhen,
  nbaTradeBuzzLatestMs,
  type NbaTradeBuzzConfidence,
  type NbaTradeBuzzEvent,
  type NbaTradeBuzzItem,
} from "../../../../../../../lib/predict/nbaTradeBuzz";
import TeamAbbrBadgeNative from "../../TeamAbbrBadgeNative";
import { nbaTeamIdFromBracketCode } from "../../../../../../../lib/nba-bracket-code";
import {
  getTeamAbbrBadgeColor,
  teamColorRgba,
} from "../../../../../../../lib/team-colors";
import { nbaTradeBuzzItemMatchesTeam } from "../../../../../../../lib/predict/nbaTradeBuzzTeamFilter";

type Props = {
  items: readonly NbaTradeBuzzItem[];
  teamAbbr?: string | null;
  language?: "ja" | "en";
  nowMs?: number;
  /** 取材の基準時刻（表示用・JST） */
  asOfLabel?: string | null;
  /** Free 向け。動画広告のプレースホルダ */
  showAdSlot?: boolean;
  onPressAd?: () => void;
};

const OX = "Oxanium_700Bold";

const CONF_SHORT: Record<NbaTradeBuzzConfidence, { ja: string; en: string }> = {
  official: { ja: "公式", en: "Official" },
  multi: { ja: "複数", en: "Multi" },
  single: { ja: "単発", en: "Single" },
  opinion: { ja: "見立て", en: "Take" },
};

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
}: {
  event: NbaTradeBuzzEvent;
}) {
  return (
    <View style={styles.event}>
      <Text style={styles.eventMeta}>
        {formatNbaTradeBuzzEventWhen(event)}
        {"  "}
        {NBA_TRADE_BUZZ_KIND_LABEL[event.kind]}
      </Text>
      <Text style={styles.eventText}>{event.textJa}</Text>
      <Pressable
        onPress={() => openSource(event.sourceUrl)}
        disabled={!event.sourceUrl}
        accessibilityRole={event.sourceUrl ? "link" : undefined}
        hitSlop={6}
      >
        <Text
          style={[styles.source, event.sourceUrl ? styles.sourceLink : null]}
        >
          {event.sourceLabel}
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
  const conf = CONF_SHORT[item.confidence];
  const fromId = item.fromTeamAbbr
    ? nbaTeamIdFromBracketCode(item.fromTeamAbbr)
    : null;
  const latest = nbaTradeBuzzLatestMs(item);
  const first = item.events[0];
  const rest = item.events.slice(1);
  const tint = fromId ? getTeamAbbrBadgeColor(fromId) : null;

  return (
    <View
      style={[
        styles.card,
        tint
          ? {
              borderColor: teamColorRgba(tint, 0.42),
            }
          : null,
      ]}
    >
      {tint ? (
        <View
          pointerEvents="none"
          style={[
            styles.cardWash,
            { backgroundColor: teamColorRgba(tint, 0.12) },
          ]}
        />
      ) : null}
      <View style={styles.topRow}>
        <Text style={styles.conf}>{ja ? conf.ja : conf.en}</Text>
        <View style={styles.rightRail}>
          <Text style={styles.age} numberOfLines={1}>
            {latest > 0 ? formatAge(nowMs - latest, ja) : "—"}
          </Text>
        </View>
      </View>

      <View style={styles.nameRow}>
        <View style={styles.nameSlant}>
          <Text style={styles.name} numberOfLines={1}>
            {item.playerName}
          </Text>
        </View>
        <View style={styles.rightRail}>
          {item.fromTeamAbbr ? (
            <TeamAbbrBadgeNative
              abbr={item.fromTeamAbbr}
              teamId={fromId ?? undefined}
            />
          ) : null}
        </View>
      </View>

      {first ? (
        <View style={styles.lead}>
          <EventRow event={first} />
        </View>
      ) : (
        <Text style={styles.headline}>{item.headlineJa}</Text>
      )}

      {rest.length > 0 ? (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={styles.moreBtn}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
        >
          <Text style={styles.moreText}>
            {expanded ? "LESS ▲" : "MORE ▼"}
          </Text>
        </Pressable>
      ) : null}

      {expanded && rest.length > 0 ? (
        <View style={styles.events}>
          {rest.map((e, i) => (
            <EventRow key={`${item.id}-${i + 1}`} event={e} />
          ))}
        </View>
      ) : null}
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
  teamAbbr = null,
  language = "ja",
  nowMs = Date.now(),
  asOfLabel = null,
  showAdSlot = true,
  onPressAd,
}: Props) {
  const ja = language === "ja";
  const sorted = useMemo(() => {
    const next = sortNewestFirst(items);
    if (!teamAbbr) return next;
    return next.filter((item) => nbaTradeBuzzItemMatchesTeam(item, teamAbbr));
  }, [items, teamAbbr]);

  return (
    <View style={{ gap: 16 }}>
      <Text style={styles.intro}>
        {ja ? "新しい順 · 確定ではない" : "Newest first · not confirmed"}
        {asOfLabel ? ` · ${asOfLabel}` : ""}
        {teamAbbr ? ` · ${teamAbbr}` : ""}
      </Text>

      {sorted.length === 0 ? (
        <Text style={styles.empty}>
          {teamAbbr
            ? ja
              ? `${teamAbbr} の Buzz はまだない`
              : `No Buzz for ${teamAbbr} yet`
            : ja
              ? "Buzz はまだない"
              : "No Buzz yet"}
        </Text>
      ) : null}

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
              <Text style={styles.adTitle}>
                {ja ? "動画で Pro Insight を 1 回" : "Watch for 1 Pro Insight"}
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
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: "rgba(255,255,255,0.42)",
    marginBottom: 4,
  },
  empty: {
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.48)",
    paddingVertical: 12,
  },
  card: {
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(6,10,16,0.96)",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 8,
  },
  cardWash: {
    ...StyleSheet.absoluteFillObject,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 16,
    marginBottom: 6,
  },
  rightRail: {
    width: 76,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  conf: {
    flex: 1,
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    color: "rgba(252,211,77,0.9)",
    textTransform: "uppercase",
  },
  age: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(255,255,255,0.45)",
    textAlign: "right",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 24,
  },
  nameSlant: {
    flex: 1,
    minWidth: 0,
    marginRight: 8,
    transform: [{ skewX: "-6deg" }],
  },
  name: {
    fontFamily: "Oxanium_600SemiBold",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: "#fff",
    textTransform: "uppercase",
    lineHeight: 22,
  },
  headline: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.72)",
    marginTop: 8,
  },
  lead: {
    marginTop: 10,
  },
  events: {
    marginTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
    paddingTop: 12,
    gap: 14,
  },
  event: {
    gap: 3,
  },
  eventMeta: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.4,
    color: "rgba(0,245,255,0.75)",
  },
  eventText: {
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(255,255,255,0.78)",
  },
  source: {
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.4)",
  },
  sourceLink: {
    color: "rgba(0,245,255,0.85)",
  },
  moreBtn: {
    alignSelf: "flex-end",
    marginTop: 8,
    paddingVertical: 4,
  },
  moreText: {
    fontFamily: OX,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    color: "rgba(0,245,255,0.9)",
    textTransform: "uppercase",
  },
  adSlot: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderStyle: "dashed",
    backgroundColor: "rgba(255,255,255,0.03)",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  adTitle: {
    fontFamily: OX,
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(255,255,255,0.7)",
  },
});
