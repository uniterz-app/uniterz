/**
 * Web `ReferralStampBoard` 相当（たたき台）
 * 達成マスに円形 UNITERZ INVITE スタンプを押印
 * 3 / 5 / 10 はマイルストーン色（LIME / AMBER / INK）
 */
import { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { G, Polygon } from "react-native-svg";
import {
  nextReferralMilestone,
  referralReferrerUnitsEarned,
} from "../../../../../../lib/referral/referralRewards";
import {
  buildReferralStampSlots,
  type ReferralStampSlot,
} from "../../../../../../lib/referral/referralStampBoard";
import UniterzClearStampNative, {
  type UniterzClearStampToneNative,
} from "./UniterzClearStampNative";

const OX = "Oxanium_700Bold";

type Props = {
  completedCount: number;
  isJa: boolean;
};

// Ledger background: thin hex-outline pattern (subtle, static).
const PATTERN_VB_W = 640;
const PATTERN_VB_H = 420;
const HEX_R = 18;
const INNER_HEX_R = 10.5;
const HEX_DX = 1.5 * HEX_R;
const HEX_DY = Math.sqrt(3) * HEX_R;

function hexPoints(cx: number, cy: number, r: number): string {
  const a0 = Math.PI / 6;
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = a0 + (Math.PI / 3) * i;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

function buildHexBackdrop(): Array<{ outer: string; inner: string; key: string }> {
  const arr: Array<{ outer: string; inner: string; key: string }> = [];
  const cols = Math.ceil(PATTERN_VB_W / HEX_DX) + 3;
  const rows = Math.ceil(PATTERN_VB_H / HEX_DY) + 3;

  for (let row = -1; row < rows; row++) {
    const y = row * HEX_DY - HEX_DY;
    const xOffset = row % 2 === 1 ? HEX_DX / 2 : 0;
    for (let col = -1; col < cols; col++) {
      const x = col * HEX_DX - HEX_DX + xOffset;
      const outer = hexPoints(x, y, HEX_R);
      const inner = hexPoints(x, y, INNER_HEX_R);
      arr.push({ outer, inner, key: `${row}:${col}` });
    }
  }

  return arr;
}

function StampCellNative({
  index,
  stamped,
  milestoneBonusUnits,
  isNextTarget,
  milestoneTone,
}: ReferralStampSlot) {
  const isMilestone = milestoneBonusUnits != null;
  const cellTone: UniterzClearStampToneNative =
    (milestoneTone as UniterzClearStampToneNative | null) ?? "cyan";

  return (
    <View
      style={[
        styles.cellOuter,
        stamped
          ? cellTone === "lime"
            ? styles.cellStampedLime
            : cellTone === "amber"
              ? styles.cellStampedAmber
              : cellTone === "ink"
                ? styles.cellStampedInk
                : styles.cellStamped
          : isNextTarget
            ? styles.cellNext
            : styles.cellEmpty,
      ]}
      accessibilityLabel={
        stamped
          ? `invite ${index} stamped`
          : isNextTarget
            ? `invite ${index} next`
            : `invite ${index} empty`
      }
    >
      {stamped ? (
        <UniterzClearStampNative
          compact
          tone={cellTone}
          size={64}
          rotateDeg={-8 - (index % 3)}
        />
      ) : (
        <Text
          style={[
            styles.cellIndex,
            isNextTarget ? styles.cellIndexNext : styles.cellIndexEmpty,
          ]}
        >
          {index}
        </Text>
      )}

      {isMilestone && milestoneTone ? (
        <View
          style={[
            styles.bonusChip,
            stamped
              ? milestoneTone === "lime"
                ? styles.bonusLimeOn
                : milestoneTone === "ink"
                  ? styles.bonusInkOn
                  : styles.bonusAmberOn
              : milestoneTone === "lime"
                ? styles.bonusLimeOff
                : milestoneTone === "ink"
                  ? styles.bonusInkOff
                  : styles.bonusAmberOff,
          ]}
        >
          <Text
            style={[
              styles.bonusChipText,
              stamped && milestoneTone === "ink"
                ? styles.bonusChipTextInkOn
                : stamped
                  ? styles.bonusChipTextOn
                  : milestoneTone === "lime"
                    ? styles.bonusChipTextLimeOff
                    : milestoneTone === "ink"
                      ? styles.bonusChipTextInkOff
                      : styles.bonusChipTextAmberOff,
            ]}
          >
            +{milestoneBonusUnits}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

export default function ReferralStampBoardNative({
  completedCount,
  isJa,
}: Props) {
  const slots = useMemo(
    () => buildReferralStampSlots(completedCount),
    [completedCount]
  );
  const hexBackdrop = useMemo(() => buildHexBackdrop(), []);
  const earned = referralReferrerUnitsEarned(completedCount);
  const next = nextReferralMilestone(completedCount);

  return (
    <View style={styles.board}>
      {/* thin hex pattern background */}
      <View pointerEvents="none" style={styles.patternLayer}>
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${PATTERN_VB_W} ${PATTERN_VB_H}`}
          preserveAspectRatio="none"
        >
          {hexBackdrop.map((h) => (
            <G key={h.key}>
              <Polygon
                points={h.outer}
                fill="none"
                stroke="rgba(255,255,255,0.24)"
                strokeWidth={1}
                strokeLinejoin="round"
              />
              <Polygon
                points={h.inner}
                fill="none"
                stroke="rgba(0,245,255,0.16)"
                strokeWidth={0.8}
                strokeLinejoin="round"
              />
            </G>
          ))}
        </Svg>
      </View>
      <View style={styles.head}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.eyebrow}>
            {isJa ? "招待スタンプラリー" : "Invite stamp rally"}
          </Text>
          <Text style={styles.title}>
            <Text style={styles.titleDigits}>
              {completedCount} / 10
            </Text>
            {isJa ? " 達成" : " locked"}
          </Text>
        </View>
        <View style={styles.earnedCol}>
          <Text style={styles.earnedLabel}>{isJa ? "獲得" : "Earned"}</Text>
          <Text style={styles.earnedValue}>
            {earned.total}
            <Text style={styles.earnedUnit}> UNIT</Text>
          </Text>
        </View>
      </View>

      {/* 台帳本体（本番寄せ: プレビュー枠は削除） */}
      <View style={styles.grid}>
        {[0, 1].map((row) => (
          <View key={row} style={styles.gridRow}>
            {slots.slice(row * 5, row * 5 + 5).map((slot) => (
              <View key={slot.index} style={styles.gridCell}>
                <StampCellNative {...slot} />
              </View>
            ))}
          </View>
        ))}
      </View>

      <Text style={styles.hint}>
        {next
          ? isJa
            ? `次のスタンプ目標: ${next.target} 人目（あと ${next.remaining}）· ボーナス +${next.bonusUnits} Unit`
            : `Next stamp: #${next.target} (need ${next.remaining}) · bonus +${next.bonusUnits}`
          : isJa
            ? "10 枠すべて INVITE。マイルストーン上限到達（モック）"
            : "All 10 slots INVITE. Milestone cap reached (mock)"}
      </Text>
      <Text style={styles.breakdown}>
        {isJa
          ? `内訳: 基本 ${earned.base} + マイルストーン ${earned.milestones} · 3 LIME / 5 AMBER / 10 INK`
          : `Base ${earned.base} + milestones ${earned.milestones} · 3 LIME / 5 AMBER / 10 INK`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.25)",
    backgroundColor: "rgba(4,10,16,0.96)",
    padding: 12,
    gap: 12,
  },
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.22,
  },
  head: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: 8,
  },
  eyebrow: {
    fontFamily: OX,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(165,243,252,0.7)",
    textTransform: "uppercase",
  },
  title: {
    marginTop: 4,
    fontFamily: OX,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.2,
    color: "#fff",
    textTransform: "uppercase",
  },
  titleDigits: {
    transform: [{ skewX: "-12deg" }],
  },
  earnedCol: { alignItems: "flex-end" },
  earnedLabel: {
    fontFamily: OX,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  earnedValue: {
    fontFamily: OX,
    fontSize: 18,
    fontWeight: "800",
    color: "rgba(207,250,254,1)",
    transform: [{ skewX: "-12deg" }],
  },
  earnedUnit: {
    fontSize: 9,
    letterSpacing: 1,
    color: "rgba(255,255,255,0.45)",
  },
  preview: {
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  previewLabel: {
    fontFamily: OX,
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: "rgba(255,255,255,0.4)",
    textTransform: "uppercase",
  },
  previewRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  previewItem: { alignItems: "center", gap: 6 },
  previewToneLabel: {
    fontFamily: OX,
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 1,
  },
  toneLime: { color: "#B8FF3C" },
  toneAmber: { color: "#FBBF24" },
  toneInk: { color: "#FF2D55" },
  previewHint: {
    fontSize: 10,
    lineHeight: 14,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
  grid: { gap: 8 },
  gridRow: { flexDirection: "row", gap: 8 },
  gridCell: { flex: 1, aspectRatio: 1 },
  cellOuter: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  cellEmpty: {
    overflow: "hidden",
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  cellNext: {
    overflow: "hidden",
    borderStyle: "dashed",
    borderColor: "rgba(103,232,249,0.55)",
    backgroundColor: "rgba(0,245,255,0.05)",
  },
  cellStamped: {
    overflow: "visible",
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(0,245,255,0.06)",
  },
  cellStampedLime: {
    overflow: "visible",
    borderColor: "rgba(184,255,60,0.55)",
    backgroundColor: "rgba(184,255,60,0.08)",
  },
  cellStampedAmber: {
    overflow: "visible",
    borderColor: "rgba(252,211,77,0.55)",
    backgroundColor: "rgba(251,191,36,0.08)",
  },
  cellStampedInk: {
    overflow: "visible",
    borderColor: "rgba(255,45,85,0.55)",
    backgroundColor: "rgba(255,45,85,0.08)",
  },
  cellIndex: {
    fontFamily: OX,
    fontSize: 15,
    fontWeight: "800",
    transform: [{ skewX: "-12deg" }],
  },
  cellIndexNext: { color: "rgba(207,250,254,0.9)" },
  cellIndexEmpty: { color: "rgba(255,255,255,0.35)" },
  bonusChip: {
    position: "absolute",
    top: -2,
    right: -2,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },
  bonusLimeOn: { backgroundColor: "#B8FF3C" },
  bonusAmberOn: { backgroundColor: "#FCD34D" },
  bonusInkOn: { backgroundColor: "#FF2D55" },
  bonusLimeOff: {
    borderWidth: 1,
    borderColor: "rgba(184,255,60,0.5)",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  bonusAmberOff: {
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.5)",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  bonusInkOff: {
    borderWidth: 1,
    borderColor: "rgba(255,45,85,0.5)",
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  bonusChipText: {
    fontFamily: OX,
    fontSize: 7,
    fontWeight: "800",
    letterSpacing: 0.4,
    transform: [{ skewX: "-12deg" }],
  },
  bonusChipTextOn: { color: "#050508" },
  bonusChipTextInkOn: { color: "#fff" },
  bonusChipTextLimeOff: { color: "rgba(217,255,138,0.9)" },
  bonusChipTextAmberOff: { color: "rgba(253,230,138,0.9)" },
  bonusChipTextInkOff: { color: "rgba(255,138,163,0.9)" },
  hint: {
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.5)",
  },
  breakdown: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
  },
});
