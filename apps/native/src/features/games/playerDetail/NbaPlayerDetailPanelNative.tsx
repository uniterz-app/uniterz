/** Web Player Detail 相当 — IDカード型ヘッダー + ゾーン効率マップ */
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, Image } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  Pattern,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  formatInjuryReturnEstimate,
  injuryReasonLabel,
} from "../../../../../../lib/nba/teamInjuries/injuryReasonDisplay";
import {
  averageRecentGameLogs,
  formatFgLine,
  formatPhysique,
  formatSalaryUsd,
  formatContractSeasonLabel,
  formatCareerSeasonLabel,
  formatAvailabilityStatus,
  availabilityStatusColor,
  resolvePlayerDisplayAge,
  formatTeamHistory,
  getNbaPlayerDetailPreview,
  NBA_PLAYER_DETAIL_SEASON_SHOWN,
  nbaCountryNameToIso2,
  type NbaPlayerAvailability,
  type NbaPlayerCareerSeasonBoard,
  type NbaPlayerCareerSeasonRow,
  type NbaPlayerDetailPreview,
  type NbaPlayerGameLog,
  type NbaPlayerSeasonMetric,
  type NbaPlayerShotZone,
  type NbaPlayerVenueSplit,
  type NbaPlayerVsOpponentSample,
} from "../../../../../../lib/predict/nbaPlayerDetailPreviewMocks";
import {
  isPlayerDetailRankShown,
  isPlayerDetailSalaryRankShown,
} from "../../../../../../lib/predict/nbaPlayerDetailHowTheyPlay";
import { nbaTwoWaySalaryForSeason } from "../../../../../../lib/nba/teamPayroll/mapBdlToTeamPayroll";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../../lib/rankings/nbaSeason";
import { rankingFlagImageUri } from "../../rankings/rankingFlagUri";
import {
  SHOT_ZONE_BASKET,
  SHOT_ZONE_GLOW_R,
  SHOT_ZONE_LABEL_POS,
  SHOT_ZONE_PAINT,
  SHOT_ZONE_RA_R,
  SHOT_ZONE_VB_H,
  SHOT_ZONE_VB_MIN_Y,
  SHOT_ZONE_VB_W,
  formatShotZoneMakes,
  shotCourtFreeThrowCirclePath,
  shotCourtTop,
  shotZonePathAboveBreak3Fill,
  shotZonePathLeftCorner3,
  shotZonePathMidRange,
  shotZonePathPaint,
  shotZonePathRightCorner3,
  shotZoneThreePointLine,
  shotZoneViewBox,
  zoneEfficiencyColor,
  zoneFgPctColor,
} from "../../../../../../lib/predict/nbaShotZoneCourtGeometry";
import {
  getTeamJerseyPrimaryColor,
  getTeamJerseySecondaryColor,
  getTeamUiAccentColor,
} from "../../../../../../lib/team-colors";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import { profileOverviewChartNoDataStyle } from "../../profile/profileOverviewChartShell";
import JerseyMarkSvg from "../JerseyMarkSvg";
import NbaPlayerHowTheyPlayNative from "./NbaPlayerHowTheyPlayNative";
import { useLeagueTeamStatsBundle } from "../../../../../../lib/nba/useLeagueTeamStatsBundle";
import { usePlayerStatLeadersBundle } from "../../../../../../lib/nba/usePlayerStatLeadersBundle";
import { useNbaPlayerDetailLiveOverlay } from "../../../../../../lib/nba/playerDetail/useNbaPlayerDetailLiveOverlay";
import { buildPlayerDetailInsights } from "../../../../../../lib/nba/detailInsights/buildPlayerDetailInsights";
import {
  DetailIdentityChipRowNative,
  DetailInsightSummaryNative,
} from "../detailInsights/DetailInsightBlocksNative";
import { DetailUsageStripNative } from "../detailInsights/DetailUsageStripNative";
import { DetailRoleChangeSectionNative } from "../detailInsights/DetailRoleChangeSectionNative";
import { DetailConsistencySectionNative } from "../detailInsights/DetailConsistencySectionNative";
import { formatNbaPlayerDisplayName } from "@/lib/nba/formatNbaPlayerListName";
import { nbaSeasonStatsReady } from "@/lib/predict/nbaSeasonStatsReady";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";

type Props = {
  language: "ja" | "en";
  playerId?: string;
};

const FORM_WIN = "#00F5FF";
const FORM_LOSS = "#FF2D78";
const OXANIUM = "Oxanium_800ExtraBold";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(124,255,107,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((n) => Number.isNaN(n))) {
    return `rgba(124,255,107,${alpha})`;
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

/** Web `PlayerDetailSectionNoData` — 枠を残し既存 chart NO DATA を中央に */
function PlayerDetailSectionNoDataNative({ accent }: { accent: string }) {
  return (
    <View
      accessibilityRole="text"
      accessibilityLabel="NO DATA"
      style={[
        styles.sectionNoData,
        { borderColor: hexToRgba(accent, 0.3) },
      ]}
    >
      <Text style={profileOverviewChartNoDataStyle}>NO DATA</Text>
    </View>
  );
}

function formatDraftHero(
  year: number | null,
  round: number | null,
  number: number | null
): string {
  if (year == null) return "—";
  const pick = number != null ? `#${number}` : "—";
  const r = round != null ? `R${round}` : "";
  return r ? `${year} ${r} ${pick}` : `${year} ${pick}`;
}

function JerseyHeroMark({
  teamId,
  jerseyNumber,
  accent,
}: {
  teamId: string;
  jerseyNumber: string;
  accent: string;
}) {
  const primary = getTeamJerseyPrimaryColor("nba", teamId);
  const secondary = getTeamJerseySecondaryColor("nba", teamId);
  const num = jerseyNumber.replace(/^#/, "") || "—";
  const lines = Array.from({ length: 18 }, (_, i) => i);

  return (
    <View style={[styles.avatarBox, { borderRightColor: accent }]}>
      <View style={styles.hatchWrap} pointerEvents="none">
        {lines.map((i) => (
          <View
            key={i}
            style={[
              styles.hatchLine,
              { left: -20 + i * 10, backgroundColor: `${accent}48` },
            ]}
          />
        ))}
      </View>
      <View style={styles.jerseyMarkWrap}>
        <JerseyMarkSvg accent={primary} accentEnd={secondary} size={72} />
        <Text
          style={[
            styles.jerseyNumOnMark,
            num.length >= 3 ? styles.jerseyNumOnMarkSmall : null,
          ]}
          numberOfLines={1}
        >
          {num}
        </Text>
      </View>
    </View>
  );
}

function IdMetaCell({
  label,
  value,
  flagIso2,
}: {
  label: string;
  value: string;
  flagIso2?: string | null;
}) {
  const flagUri = flagIso2 ? rankingFlagImageUri(flagIso2) : undefined;
  return (
    <View style={styles.idMetaCell}>
      <Text style={styles.idMetaLabel}>{label}</Text>
      <View style={styles.idMetaValueRow}>
        <Text style={styles.idMetaValue} numberOfLines={1}>
          {value}
        </Text>
        {flagUri ? (
          <Image
            source={{ uri: flagUri }}
            style={styles.idMetaFlag}
            resizeMode="cover"
            accessibilityLabel={value}
          />
        ) : null}
      </View>
    </View>
  );
}

function PlayerIdCard({ detail }: { detail: NbaPlayerDetailPreview }) {
  const fullName = formatNbaPlayerDisplayName(
    detail.firstName,
    detail.lastName,
    detail.playerId
  ).toUpperCase();
  const accent = getTeamJerseyPrimaryColor("nba", detail.teamId);
  const countryIso2 = nbaCountryNameToIso2(detail.country);
  return (
    <View style={[styles.idCard, { borderColor: accent }]}>
      <JerseyHeroMark
        teamId={detail.teamId}
        jerseyNumber={detail.jerseyNumber}
        accent={accent}
      />
      <View style={styles.idBody}>
        <Text style={styles.idName} numberOfLines={1}>
          {fullName}
        </Text>
        <View style={styles.idMetaGrid}>
          <IdMetaCell label="POSITION" value={detail.position} />
          <IdMetaCell label="EXP" value={`${detail.experienceYears} YRS`} />
          <IdMetaCell
            label="PHYSIQUE"
            value={formatPhysique(detail.height, detail.weight)}
          />
          <IdMetaCell label="TEAM" value={detail.teamAbbr} />
          <IdMetaCell
            label="COUNTRY"
            value={detail.country ?? "—"}
            flagIso2={countryIso2}
          />
          <IdMetaCell
            label="DRAFT"
            value={formatDraftHero(
              detail.draftYear,
              detail.draftRound,
              detail.draftNumber
            )}
          />
        </View>
      </View>
    </View>
  );
}

function zoneById(
  zones: NbaPlayerShotZone[],
  id: NbaPlayerShotZone["id"]
): NbaPlayerShotZone | undefined {
  return zones.find((z) => z.id === id);
}

function ZoneGlowDefs({
  zones,
}: {
  zones: Array<{ id: NbaPlayerShotZone["id"]; color: string }>;
}) {
  return (
    <Defs>
      <Pattern
        id="jerseyPixel"
        patternUnits="userSpaceOnUse"
        width={7}
        height={7}
      >
        <Circle cx={2.2} cy={2.2} r={1.15} fill="rgba(255,255,255,0.1)" />
      </Pattern>
      {zones.map(({ id, color }) => {
        const pos = SHOT_ZONE_LABEL_POS[id];
        const r = SHOT_ZONE_GLOW_R[id];
        return (
          <RadialGradient
            key={id}
            id={`zg-${id}`}
            cx={pos.x}
            cy={pos.y}
            rx={r}
            ry={r}
            fx={pos.x}
            fy={pos.y}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor={color} stopOpacity={0.7} />
            <Stop offset="45%" stopColor={color} stopOpacity={0.36} />
            <Stop offset="78%" stopColor={color} stopOpacity={0.12} />
            <Stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </RadialGradient>
        );
      })}
    </Defs>
  );
}

function ZoneStatLabel({
  zone,
  id,
}: {
  zone?: NbaPlayerShotZone;
  id: NbaPlayerShotZone["id"];
}) {
  const pos = SHOT_ZONE_LABEL_POS[id];
  if (!zone) return null;
  const pct = `${Math.round(zone.fgPct * 100)}%`;
  const makes = formatShotZoneMakes(zone);
  return (
    <>
      <SvgText
        x={pos.x}
        y={pos.y - 17}
        fill="rgba(255,255,255,0.4)"
        fontSize={11}
        fontWeight="700"
        fontFamily={METRIC_FONT}
        textAnchor="middle"
        letterSpacing={1}
      >
        {zone.short}
      </SvgText>
      <SvgText
        x={pos.x}
        y={pos.y + 8}
        fill="#ffffff"
        fontSize={26}
        fontWeight="800"
        fontFamily={OXANIUM}
        textAnchor="middle"
      >
        {pct}
      </SvgText>
      <SvgText
        x={pos.x}
        y={pos.y + 27}
        fill="rgba(255,255,255,0.55)"
        fontSize={14}
        fontWeight="600"
        fontFamily={METRIC_FONT}
        textAnchor="middle"
      >
        {makes}
      </SvgText>
    </>
  );
}

function ShotZoneHeatmap({
  zones,
  accent,
}: {
  zones: NbaPlayerShotZone[];
  accent: string;
}) {
  if (zones.length === 0) {
    return (
      <View style={styles.heatWrap}>
        <View style={styles.advTitleRow}>
          <Text style={styles.advTitle}>SHOT CHART</Text>
          <View style={styles.advTitleLine} />
        </View>
        <PlayerDetailSectionNoDataNative accent={accent} />
      </View>
    );
  }
  const ra = zoneById(zones, "restricted");
  const paint = zoneById(zones, "paint");
  const mid = zoneById(zones, "mid");
  const lc3 = zoneById(zones, "left_corner_3");
  const rc3 = zoneById(zones, "right_corner_3");
  const ab3 = zoneById(zones, "above_break_3");
  const baselineY = SHOT_ZONE_PAINT.y + SHOT_ZONE_PAINT.h;
  const top = shotCourtTop();
  const line = "rgba(255,255,255,0.28)";
  const colorOf = (z?: NbaPlayerShotZone) =>
    zoneFgPctColor(z?.fgPct ?? 0.35);

  const glowZones = (
    [
      ["above_break_3", ab3],
      ["mid", mid],
      ["left_corner_3", lc3],
      ["right_corner_3", rc3],
      ["paint", paint],
      ["restricted", ra],
    ] as const
  ).map(([id, z]) => ({ id, color: colorOf(z) }));

  const entries = [
    ["above_break_3", ab3],
    ["mid", mid],
    ["left_corner_3", lc3],
    ["right_corner_3", rc3],
    ["paint", paint],
    ["restricted", ra],
  ] as const;

  const zonePath = (id: NbaPlayerShotZone["id"]) => {
    if (id === "above_break_3") return shotZonePathAboveBreak3Fill();
    if (id === "mid") return shotZonePathMidRange();
    if (id === "left_corner_3") return shotZonePathLeftCorner3();
    if (id === "right_corner_3") return shotZonePathRightCorner3();
    return shotZonePathPaint();
  };

  return (
    <View style={styles.heatWrap}>
      <View style={styles.advTitleRow}>
        <Text style={styles.advTitle}>
          SHOT CHART
        </Text>
        <View style={styles.advTitleLine} />
      </View>
      <Text style={styles.heatSeason}>
        {nbaSeasonStatsReady()
          ? `${CURRENT_NBA_SEASON_KEY} SEASON`
          : "PRESEASON"}
      </Text>
      <View
        style={[
          styles.heatCourtFrame,
          {
            borderColor: hexToRgba(accent, 0.45),
            backgroundColor: "#04040a",
          },
        ]}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={shotZoneViewBox()}
          preserveAspectRatio="xMidYMid meet"
        >
          <Rect
            x={0}
            y={SHOT_ZONE_VB_MIN_Y}
            width={SHOT_ZONE_VB_W}
            height={SHOT_ZONE_VB_H}
            fill="#04040a"
          />
          <ZoneGlowDefs zones={glowZones} />

          <Path
            d={shotZonePathAboveBreak3Fill()}
            fill="url(#zg-above_break_3)"
          />
          <Path d={shotZonePathMidRange()} fill="url(#zg-mid)" />
          <Path d={shotZonePathLeftCorner3()} fill="url(#zg-left_corner_3)" />
          <Path d={shotZonePathRightCorner3()} fill="url(#zg-right_corner_3)" />
          <Path d={shotZonePathPaint()} fill="url(#zg-paint)" />
          <Circle
            cx={SHOT_ZONE_BASKET.x}
            cy={SHOT_ZONE_BASKET.y}
            r={SHOT_ZONE_RA_R}
            fill="url(#zg-restricted)"
          />

          {/* Jersey-like pixel mesh over fills */}
          {(
            [
              "above_break_3",
              "mid",
              "left_corner_3",
              "right_corner_3",
              "paint",
            ] as const
          ).map((id) => (
            <Path
              key={`px-${id}`}
              d={zonePath(id)}
              fill="url(#jerseyPixel)"
              opacity={0.35}
            />
          ))}
          <Circle
            cx={SHOT_ZONE_BASKET.x}
            cy={SHOT_ZONE_BASKET.y}
            r={SHOT_ZONE_RA_R}
            fill="url(#jerseyPixel)"
            opacity={0.4}
          />

          {/* Soft zone edges — skip: cluttered the court */}

          <Rect
            x={10}
            y={top}
            width={SHOT_ZONE_VB_W - 20}
            height={baselineY - top}
            fill="none"
            stroke={line}
            strokeWidth={1.4}
          />
          <Rect
            x={SHOT_ZONE_PAINT.x}
            y={SHOT_ZONE_PAINT.y}
            width={SHOT_ZONE_PAINT.w}
            height={SHOT_ZONE_PAINT.h}
            fill="none"
            stroke={line}
            strokeWidth={1.2}
          />
          <Path
            d={shotCourtFreeThrowCirclePath()}
            fill="none"
            stroke={line}
            strokeWidth={1.2}
          />
          <Circle
            cx={SHOT_ZONE_BASKET.x}
            cy={SHOT_ZONE_BASKET.y}
            r={SHOT_ZONE_RA_R}
            fill="none"
            stroke={line}
            strokeWidth={1.1}
          />
          <Circle
            cx={SHOT_ZONE_BASKET.x}
            cy={SHOT_ZONE_BASKET.y + 8}
            r={7}
            fill="none"
            stroke={hexToRgba(accent, 0.7)}
            strokeWidth={1.4}
          />
          <Line
            x1={SHOT_ZONE_BASKET.x - 26}
            y1={baselineY - 5}
            x2={SHOT_ZONE_BASKET.x + 26}
            y2={baselineY - 5}
            stroke={line}
            strokeWidth={2}
          />
          <Path
            d={shotZoneThreePointLine()}
            fill="none"
            stroke={line}
            strokeWidth={1.5}
          />

          {entries.map(([id, z]) => (
            <ZoneStatLabel key={id} id={id} zone={z} />
          ))}
        </Svg>
      </View>
      <View style={styles.heatLegend}>
        <Text style={styles.heatLegendText}>20%</Text>
        <View style={styles.magmaBar}>
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <View
              key={t}
              style={[
                styles.magmaSeg,
                { backgroundColor: zoneEfficiencyColor(t) },
              ]}
            />
          ))}
        </View>
        <Text style={styles.heatLegendText}>80%</Text>
      </View>
    </View>
  );
}

function fmtSplitNumNative(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function SplitTableRow({
  cols,
  borderColor,
  bottomBorder,
  header,
}: {
  cols: string[];
  borderColor?: string;
  bottomBorder?: boolean;
  header?: boolean;
}) {
  return (
    <View
      style={[
        styles.splitRow,
        bottomBorder
          ? {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: borderColor,
            }
          : null,
      ]}
    >
      {cols.map((text, i) => (
        <Text
          key={`${text}-${i}`}
          style={[
            i === 0 ? styles.splitCellLabel : styles.splitCell,
            i === cols.length - 1 && !header ? styles.splitCellLast : null,
            header ? styles.splitCellHeader : null,
          ]}
          numberOfLines={1}
        >
          {text}
        </Text>
      ))}
    </View>
  );
}

function PlayerVenueSplitsSectionNative({
  splits,
  accent,
  isJa,
}: {
  splits: NbaPlayerVenueSplit[];
  accent: string;
  isJa: boolean;
}) {
  const line = hexToRgba(accent, 0.18);
  const frame = hexToRgba(accent, 0.4);
  return (
    <View style={styles.advWrap}>
      <View style={styles.advTitleRow}>
        <Text style={styles.advTitle}>
          {isJa ? "ホーム / アウェイ" : "HOME / AWAY"}
        </Text>
        <View
          style={styles.advTitleLine}
        />
      </View>
      {splits.length === 0 ? (
        <PlayerDetailSectionNoDataNative accent={accent} />
      ) : (
        <>
          <Text style={styles.splitHint}>
            {isJa
              ? "今季の出場試合からの平均"
              : "Season average from games played"}
          </Text>
          <View style={[styles.splitTable, { borderColor: frame }]}>
            <SplitTableRow
              cols={["", "GP", "PTS", "REB", "AST", "+/-"]}
              borderColor={line}
              bottomBorder
              header
            />
            {splits.map((row, i) => (
              <SplitTableRow
                key={row.venue}
                cols={[
                  row.venue === "home" ? "HOME" : "AWAY",
                  String(row.games),
                  fmtSplitNumNative(row.pts),
                  fmtSplitNumNative(row.reb),
                  fmtSplitNumNative(row.ast),
                  `${row.plusMinus > 0 ? "+" : ""}${fmtSplitNumNative(row.plusMinus)}`,
                ]}
                borderColor={line}
                bottomBorder={i < splits.length - 1}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function PlayerVsOpponentSectionNative({
  samples,
  accent,
  isJa,
}: {
  samples: NbaPlayerVsOpponentSample[];
  accent: string;
  isJa: boolean;
}) {
  const line = hexToRgba(accent, 0.18);
  const frame = hexToRgba(accent, 0.4);
  return (
    <View style={styles.advWrap}>
      <View style={styles.advTitleRow}>
        <Text style={styles.advTitle}>
          {isJa ? "対戦相手別（平均）" : "VS OPPONENT (AVG)"}
        </Text>
        <View
          style={styles.advTitleLine}
        />
      </View>
      {samples.length === 0 ? (
        <PlayerDetailSectionNoDataNative accent={accent} />
      ) : (
        <>
          <Text style={styles.splitHint}>
            {isJa
              ? "今季の出場試合からの平均"
              : "Season average from games played"}
          </Text>
          <View style={[styles.splitTable, { borderColor: frame }]}>
            <SplitTableRow
              cols={[isJa ? "相手" : "OPP", "GP", "PTS", "REB", "AST", "+/-"]}
              borderColor={line}
              bottomBorder
              header
            />
            {samples.map((row, i) => (
              <SplitTableRow
                key={row.oppTeamId}
                cols={[
                  `vs ${row.oppAbbr}`,
                  String(row.games),
                  fmtSplitNumNative(row.pts),
                  fmtSplitNumNative(row.reb),
                  fmtSplitNumNative(row.ast),
                  `${row.plusMinus > 0 ? "+" : ""}${fmtSplitNumNative(row.plusMinus)}`,
                ]}
                borderColor={line}
                bottomBorder={i < samples.length - 1}
              />
            ))}
          </View>
        </>
      )}
    </View>
  );
}

function SeasonMetricsGrid({
  metrics,
  accent,
  gamesPlayed,
  isJa,
}: {
  metrics: NbaPlayerSeasonMetric[];
  accent: string;
  gamesPlayed: number;
  isJa: boolean;
}) {
  const shown = NBA_PLAYER_DETAIL_SEASON_SHOWN.map(
    (id) => metrics.find((m) => m.id === id)
  ).filter((m): m is NbaPlayerSeasonMetric => Boolean(m));
  const cellLine = hexToRgba(accent, 0.22);
  /** 開幕前 / 未出場は 0 埋めグリッドにせず NO DATA */
  const hasSeasonAverages = gamesPlayed > 0;
  return (
    <View style={styles.advWrap}>
      <View style={styles.advTitleRow}>
        <Text style={styles.advTitle}>
          {isJa ? "シーズン平均" : "SEASON AVERAGES"}
        </Text>
        <View style={styles.advTitleLine} />
      </View>
      {hasSeasonAverages ? (
        <View
          style={[styles.advGrid, { borderColor: hexToRgba(accent, 0.4) }]}
        >
          {shown.map((m, i) => {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const lastRow = Math.floor((shown.length - 1) / 3);
            return (
              <View
                key={m.id}
                style={[
                  styles.advCell,
                  col < 2
                    ? {
                        borderRightWidth: StyleSheet.hairlineWidth,
                        borderRightColor: cellLine,
                      }
                    : null,
                  row < lastRow
                    ? {
                        borderBottomWidth: StyleSheet.hairlineWidth,
                        borderBottomColor: cellLine,
                      }
                    : null,
                ]}
              >
                <View style={styles.advCellTop}>
                  <Text style={styles.advLabel}>{m.short}</Text>
                  {isPlayerDetailRankShown(m.leagueRank) ? (
                    <Text
                      style={[
                        styles.advRank,
                        {
                          color:
                            m.leagueRank <= 10
                              ? accent
                              : "rgba(255,255,255,0.35)",
                        },
                      ]}
                    >
                      #{m.leagueRank}
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.advValue}>{m.display}</Text>
              </View>
            );
          })}
        </View>
      ) : (
        <PlayerDetailSectionNoDataNative accent={accent} />
      )}
    </View>
  );
}

function fmtPerGameNative(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function fmtPctBrefNative(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return n.toFixed(3).replace(/^0/, "");
}

const CAREER_COLS_NATIVE: Array<{
  key: string;
  label: string;
  width: number;
  align?: "left" | "right";
  render: (row: NbaPlayerCareerSeasonRow) => string;
  emphasize?: boolean;
}> = [
  {
    key: "season",
    label: "Season",
    width: 64,
    align: "left",
    render: (r) => formatCareerSeasonLabel(r.seasonStart),
    emphasize: true,
  },
  { key: "age", label: "Age", width: 28, align: "left", render: (r) => String(r.age) },
  {
    key: "team",
    label: "TEAM",
    width: 40,
    align: "left",
    render: (r) => r.teamAbbr,
    emphasize: true,
  },
  { key: "g", label: "G", width: 28, render: (r) => String(r.games) },
  { key: "gs", label: "GS", width: 28, render: (r) => (r.gamesStarted == null ? "—" : String(r.gamesStarted)) },
  { key: "mp", label: "MP", width: 36, render: (r) => fmtPerGameNative(r.min) },
  {
    key: "pts",
    label: "PTS",
    width: 36,
    render: (r) => fmtPerGameNative(r.pts),
    emphasize: true,
  },
  { key: "reb", label: "REB", width: 36, render: (r) => fmtPerGameNative(r.reb) },
  { key: "ast", label: "AST", width: 36, render: (r) => fmtPerGameNative(r.ast) },
  { key: "fg", label: "FG", width: 32, render: (r) => fmtPerGameNative(r.fgm) },
  { key: "fga", label: "FGA", width: 36, render: (r) => fmtPerGameNative(r.fga) },
  { key: "fgp", label: "FG%", width: 40, render: (r) => fmtPctBrefNative(r.fgPct) },
  { key: "3p", label: "3P", width: 32, render: (r) => fmtPerGameNative(r.fg3m) },
  { key: "3pa", label: "3PA", width: 36, render: (r) => fmtPerGameNative(r.fg3a) },
  { key: "3pp", label: "3P%", width: 40, render: (r) => fmtPctBrefNative(r.fg3Pct) },
  { key: "ft", label: "FT", width: 32, render: (r) => fmtPerGameNative(r.ftm) },
  { key: "fta", label: "FTA", width: 36, render: (r) => fmtPerGameNative(r.fta) },
  { key: "ftp", label: "FT%", width: 40, render: (r) => fmtPctBrefNative(r.ftPct) },
  { key: "stl", label: "STL", width: 32, render: (r) => fmtPerGameNative(r.stl) },
  { key: "blk", label: "BLK", width: 32, render: (r) => fmtPerGameNative(r.blk) },
  { key: "tov", label: "TOV", width: 32, render: (r) => fmtPerGameNative(r.tov) },
];

/** Web `SeasonHistoryTable` 相当 — BRef 風シーズン平均 */
function SeasonHistorySection({
  regular,
  playoffs,
  accent,
  currentSeasonStart = 2025,
}: {
  regular: NbaPlayerCareerSeasonRow[];
  playoffs: NbaPlayerCareerSeasonRow[];
  accent: string;
  currentSeasonStart?: number;
}) {
  const [board, setBoard] = useState<NbaPlayerCareerSeasonBoard>("regular");
  /** 新しいシーズンを上（ingest も降順。表示で reverse しない） */
  const rows = [...(board === "regular" ? regular : playoffs)].sort(
    (a, b) => b.seasonStart - a.seasonStart
  );
  const frame = hexToRgba(accent, 0.35);
  const headLine = hexToRgba(accent, 0.18);

  return (
    <View style={styles.careerWrap}>
      <View style={styles.careerHeadRow}>
        <Text style={styles.advTitle}>
          SEASON AVERAGES · CAREER
        </Text>
        <View style={[styles.careerTabs, { borderColor: frame }]}>
          {(
            [
              ["regular", "Regular"],
              ["playoffs", "Playoffs"],
            ] as const
          ).map(([id, label]) => {
            const active = board === id;
            return (
              <Pressable
                key={id}
                onPress={() => setBoard(id)}
                style={[
                  styles.careerTab,
                  active ? { backgroundColor: accent } : null,
                ]}
              >
                <Text
                  style={[
                    styles.careerTabText,
                    { color: active ? "#050508" : "rgba(255,255,255,0.55)" },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {rows.length === 0 ? (
        <PlayerDetailSectionNoDataNative accent={accent} />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.careerScroll, { borderColor: frame }]}
          contentContainerStyle={styles.careerScrollContent}
        >
          <View>
            <View
              style={[
                styles.careerRow,
                {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: headLine,
                },
              ]}
            >
              {CAREER_COLS_NATIVE.map((col) => (
                <Text
                  key={col.key}
                  style={[
                    styles.careerHeadCell,
                    {
                      width: col.width,
                      textAlign: col.align === "left" ? "left" : "right",
                    },
                  ]}
                >
                  {col.label}
                </Text>
              ))}
            </View>
            {rows.map((row, i) => {
              const isCurrent = row.seasonStart === currentSeasonStart;
              return (
                <View
                  key={`${board}-${row.seasonStart}-${row.teamAbbr}`}
                  style={[
                    styles.careerRow,
                    isCurrent
                      ? { backgroundColor: hexToRgba(accent, 0.12) }
                      : null,
                    i < rows.length - 1
                      ? {
                          borderBottomWidth: StyleSheet.hairlineWidth,
                          borderBottomColor: hexToRgba(accent, 0.1),
                        }
                      : null,
                  ]}
                >
                  {CAREER_COLS_NATIVE.map((col) => (
                    <Text
                      key={col.key}
                      style={[
                        styles.careerCell,
                        {
                          width: col.width,
                          textAlign: col.align === "left" ? "left" : "right",
                          color: col.emphasize
                            ? "#FFFFFF"
                            : "rgba(255,255,255,0.75)",
                          fontWeight: col.emphasize ? "800" : "600",
                        },
                      ]}
                    >
                      {col.render(row)}
                    </Text>
                  ))}
                </View>
              );
            })}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function GameLogHeader({ borderColor }: { borderColor: string }) {
  return (
    <View
      style={[
        styles.gameRow,
        {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: borderColor,
          paddingVertical: 8,
        },
      ]}
    >
      <Text style={[styles.gameDate, styles.gameHead]}>DATE</Text>
      <Text style={[styles.gameVs, styles.gameHead]}>GAME</Text>
      <Text style={[styles.gameResult, styles.gameHead]}> </Text>
      <Text style={[styles.gameLine, styles.gameHead]}>MIN</Text>
      <Text style={[styles.gamePts, styles.gameHead]}>PTS</Text>
      <Text style={[styles.gameLine, styles.gameHead]}>R/A</Text>
      <Text style={[styles.gameFg, styles.gameHead]}>FG</Text>
    </View>
  );
}

function GameLogRow({
  log,
  border,
  borderColor,
}: {
  log: NbaPlayerGameLog;
  border: boolean;
  borderColor: string;
}) {
  const vs = `${log.home ? "vs" : "@"} ${log.oppAbbr}`;
  return (
    <View
      style={[
        styles.gameRow,
        border
          ? {
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: borderColor,
            }
          : null,
      ]}
    >
      <Text style={styles.gameDate}>{log.dateLabel}</Text>
      <Text style={styles.gameVs} numberOfLines={1}>
        {vs}
      </Text>
      <Text
        style={[
          styles.gameResult,
          log.result === "W" ? styles.win : styles.loss,
        ]}
      >
        {log.result}
      </Text>
      <Text style={styles.gameLine}>{Math.round(log.min)}m</Text>
      <Text style={styles.gamePts}>{log.pts}</Text>
      <Text style={styles.gameLine}>
        {log.reb}/{log.ast}
      </Text>
      <Text style={styles.gameFg}>{formatFgLine(log.fgm, log.fga)}</Text>
    </View>
  );
}

function RecentWindowCompare({
  logs,
  borderColor,
}: {
  logs: NbaPlayerGameLog[];
  borderColor: string;
}) {
  const l5 = averageRecentGameLogs(logs, 5);
  const l10 = averageRecentGameLogs(logs, 10);
  if (!l5 || !l10) return null;
  const hot = "#FCD34D";

  const rows: Array<{
    label: string;
    left: string;
    right: string;
    leftN: number;
    rightN: number;
  }> = [
    {
      label: "PTS",
      left: l5.pts.toFixed(1),
      right: l10.pts.toFixed(1),
      leftN: l5.pts,
      rightN: l10.pts,
    },
    {
      label: "REB",
      left: l5.reb.toFixed(1),
      right: l10.reb.toFixed(1),
      leftN: l5.reb,
      rightN: l10.reb,
    },
    {
      label: "AST",
      left: l5.ast.toFixed(1),
      right: l10.ast.toFixed(1),
      leftN: l5.ast,
      rightN: l10.ast,
    },
    {
      label: "FG%",
      left: `${(l5.fgPct * 100).toFixed(1)}%`,
      right: `${(l10.fgPct * 100).toFixed(1)}%`,
      leftN: l5.fgPct,
      rightN: l10.fgPct,
    },
    {
      label: "3PT%",
      left: `${(l5.fg3Pct * 100).toFixed(1)}%`,
      right: `${(l10.fg3Pct * 100).toFixed(1)}%`,
      leftN: l5.fg3Pct,
      rightN: l10.fg3Pct,
    },
  ];

  return (
    <View
      style={[
        styles.recentCompare,
        {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: borderColor,
        },
      ]}
    >
      <View style={styles.recentCompareHead}>
        <Text style={[styles.recentCompareSide, { color: hot }]}>LAST 5</Text>
        <View style={styles.recentCompareLabelCol} />
        <Text style={[styles.recentCompareSide, { color: hot }]}>LAST 10</Text>
      </View>
      {rows.map((row) => {
        const leftWin = row.leftN > row.rightN;
        const rightWin = row.rightN > row.leftN;
        return (
          <View key={row.label} style={styles.recentCompareRow}>
            <Text
              style={[
                styles.recentCompareVal,
                styles.recentCompareValLeft,
                leftWin ? { color: hot } : null,
              ]}
            >
              {row.left}
            </Text>
            <Text style={styles.recentCompareLabel}>{row.label}</Text>
            <Text
              style={[
                styles.recentCompareVal,
                styles.recentCompareValRight,
                rightWin ? { color: hot } : null,
              ]}
            >
              {row.right}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function GameLogsSection({
  logs,
  accent,
}: {
  logs: NbaPlayerGameLog[];
  accent: string;
}) {
  const [open, setOpen] = useState(true);
  const wins = logs.filter((g) => g.result === "W").length;
  const losses = logs.length - wins;
  const line = hexToRgba(accent, 0.14);

  if (logs.length === 0) {
    return (
      <View style={styles.formSection}>
        <Text style={styles.sectionTitleInline}>GAME LOGS</Text>
        <PlayerDetailSectionNoDataNative accent={accent} />
      </View>
    );
  }

  return (
    <View style={styles.formSection}>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={styles.formHeadPress}
        hitSlop={8}
      >
        <Text style={styles.sectionTitleInline}>
          GAME LOGS (LAST {logs.length})
        </Text>
        <Text style={styles.formRecord}>
          {wins}-{losses}
        </Text>
        <Text style={[styles.formChevron, { color: accent }]}>
          {open ? "▾" : "▸"}
        </Text>
      </Pressable>

      {open ? (
        <View
          style={[styles.gameList, { borderColor: hexToRgba(accent, 0.3) }]}
        >
          <RecentWindowCompare logs={logs} borderColor={line} />
          <GameLogHeader borderColor={line} />
          {logs.map((log, i) => (
            <GameLogRow
              key={log.gameId}
              log={log}
              border={i < logs.length - 1}
              borderColor={line}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function AvailabilityBanner({
  availability,
  isJa,
}: {
  availability: NbaPlayerAvailability;
  isJa: boolean;
}) {
  if (availability.status === "active") return null;
  const tone = availabilityStatusColor(availability.status);
  const status = formatAvailabilityStatus(availability.status, isJa);
  return (
    <View style={[styles.availCard, { borderColor: hexToRgba(tone, 0.55) }]}>
      <View style={styles.availTop}>
        <Text style={[styles.availStatus, { color: tone }]}>{status}</Text>
        {availability.returnEstimate ? (
          <Text style={[styles.availReturn, { color: hexToRgba(tone, 0.85) }]}>
            {formatInjuryReturnEstimate(
              availability.returnEstimate,
              isJa ? "ja" : "en"
            )}
          </Text>
        ) : null}
      </View>
      <Text style={styles.availReason}>
        {injuryReasonLabel(availability.reason, isJa ? "ja" : "en")}
      </Text>
    </View>
  );
}

function InfoRow({
  label,
  value,
  accent,
  valueAccent,
}: {
  label: string;
  value: string;
  accent: string;
  valueAccent?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoRow,
        { borderBottomColor: hexToRgba(accent, 0.12) },
      ]}
    >
      <Text style={styles.infoLabel}>{label}</Text>
      <Text
        style={[
          styles.infoValue,
          valueAccent ? { color: accent, fontWeight: "800" } : null,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export default function NbaPlayerDetailPanelNative({
  language,
  playerId,
}: Props) {
  const isJa = language === "ja";
  const insets = useSafeAreaInsets();
  const apiBaseUrl = getUniterzApiBaseUrl();
  const { bundle: leaders } = usePlayerStatLeadersBundle({ apiBaseUrl });
  const { bundle: teamStats } = useLeagueTeamStatsBundle({ apiBaseUrl });
  const base = useMemo(
    () => getNbaPlayerDetailPreview(playerId),
    [playerId]
  );
  const { detail, hasFetchError } = useNbaPlayerDetailLiveOverlay({
    playerId,
    apiBaseUrl,
    base,
    leaders,
  });
  const playerInsights = useMemo(
    () => buildPlayerDetailInsights({ detail, rosterPlayer: null }),
    [detail]
  );
  const bottomPad = Math.max(12, insets.bottom);
  const currentSalary = detail.contract?.seasons[0] ?? null;
  const isTwoWay =
    detail.contract?.contractType?.toLowerCase().includes("two-way") ||
    detail.contract?.contractType?.toLowerCase().includes("2-way") ||
    detail.position?.toLowerCase().includes("two-way") ||
    detail.position?.toLowerCase().includes("2-way") ||
    Boolean(
      detail.contract?.notes?.some(
        (n) =>
          n.toLowerCase().includes("two-way") || n.toLowerCase().includes("2-way")
      )
    );
  const isContractExpired =
    !detail.contract ||
    detail.contract.contractStatus?.toLowerCase().includes("expired") ||
    detail.contract.yearsRemaining <= 0 ||
    detail.contract.seasons.length === 0 ||
    (detail.contract.seasons.every((s) => s.baseSalary <= 0) && !isTwoWay);
  const accent = getTeamUiAccentColor("nba", detail.teamId);
  const dividerColor = hexToRgba(accent, 0.22);
  const frameColor = hexToRgba(accent, 0.35);
  const displayAge = resolvePlayerDisplayAge(detail);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.pad, { paddingBottom: bottomPad + 120 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.panel}>

        {hasFetchError ? (
          <Text style={styles.fetchError}>
            {isJa
              ? "一部データの取得に失敗しました。表示は取得できた範囲のみです。"
              : "Some live data failed to load. Showing what we could fetch."}
          </Text>
        ) : null}

        <PlayerIdCard detail={detail} />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        {playerInsights.summary ? (
          <>
            <DetailInsightSummaryNative
              text={
                isJa
                  ? playerInsights.summary.linesJa
                  : playerInsights.summary.linesEn
              }
            />
            <View style={{ height: 10 }} />
          </>
        ) : null}
        {playerInsights.roles.length > 0 ? (
          <>
            <DetailIdentityChipRowNative
              chips={playerInsights.roles}
              accent={accent}
              title="ROLE"
              isJa={isJa}
            />
            <View style={{ height: 10 }} />
          </>
        ) : null}
        <DetailUsageStripNative
          cells={playerInsights.usageStrip}
          accent={accent}
        />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <AvailabilityBanner
          availability={detail.availability}
          isJa={isJa}
        />

        <SeasonMetricsGrid
          metrics={detail.seasonMetrics}
          accent={accent}
          gamesPlayed={detail.season.gamesPlayed}
          isJa={isJa}
        />

        <View
          style={[
            styles.divider,
            { marginVertical: 12, backgroundColor: dividerColor },
          ]}
        />

        <DetailRoleChangeSectionNative
          signals={playerInsights.roleChanges}
          detailText={
            isJa
              ? playerInsights.roleChangeDetailJa
              : playerInsights.roleChangeDetailEn
          }
          accent={accent}
          isJa={isJa}
        />
        {playerInsights.roleChanges.length > 0 ? (
          <View
            style={[
              styles.divider,
              { marginVertical: 12, backgroundColor: dividerColor },
            ]}
          />
        ) : null}

        <NbaPlayerHowTheyPlayNative
          playerId={detail.playerId}
          accent={accent}
          isJa={isJa}
          leaders={leaders}
          teamStats={teamStats}
          detail={detail}
        />

        {(detail.venueSplits?.length ?? 0) > 0 ? (
          <>
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
            <PlayerVenueSplitsSectionNative
              splits={detail.venueSplits}
              accent={accent}
              isJa={isJa}
            />
          </>
        ) : null}

        {(detail.vsOpponentSamples?.length ?? 0) > 0 ? (
          <>
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
            <PlayerVsOpponentSectionNative
              samples={detail.vsOpponentSamples}
              accent={accent}
              isJa={isJa}
            />
          </>
        ) : null}

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        <SeasonHistorySection
          regular={detail.careerSeasons.regular}
          playoffs={detail.careerSeasons.playoffs}
          accent={accent}
        />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        <ShotZoneHeatmap zones={detail.shotZones} accent={accent} />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        {playerInsights.consistency ? (
          <>
            <DetailConsistencySectionNative
              data={playerInsights.consistency}
              accent={accent}
            />
            <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          </>
        ) : null}
        <GameLogsSection logs={detail.gameLogs} accent={accent} />

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />
        <View style={styles.advTitleRow}>
          <Text style={styles.advTitle}>
            CONTRACT
          </Text>
          <View style={styles.advTitleLine} />
        </View>
        {detail.contract && !isContractExpired && currentSalary ? (
            <View
              style={[styles.contractCard, { borderColor: frameColor }]}
            >
              <View style={styles.contractTop}>
                <View style={styles.contractSalaryBlock}>
                  <Text style={styles.contractLabel}>
                    {isJa ? "今季年俸" : "THIS SEASON"}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    {currentSalary.baseSalary > 0 ? (
                      <Text style={styles.contractSalary}>
                        {formatSalaryUsd(currentSalary.baseSalary)}
                      </Text>
                    ) : isTwoWay ? (
                      <>
                        <Text
                          style={{
                            fontSize: 10,
                            fontWeight: "800",
                            color: "rgba(255,255,255,0.7)",
                            backgroundColor: "rgba(255,255,255,0.1)",
                            paddingHorizontal: 4,
                            paddingVertical: 1,
                            borderRadius: 2,
                          }}
                        >
                          TW
                        </Text>
                        <Text style={styles.contractSalary}>
                          {formatSalaryUsd(nbaTwoWaySalaryForSeason(CURRENT_NBA_SEASON_KEY))}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.contractSalary}>—</Text>
                    )}
                  </View>
                </View>
                {isPlayerDetailSalaryRankShown(currentSalary.salaryRank) ? (
                  <View style={styles.contractRankBlock}>
                    <Text style={styles.contractLabel}>RANK</Text>
                    <Text style={[styles.contractRank, { color: "#FFFFFF" }]}>
                      #{currentSalary.salaryRank}
                    </Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.contractMetaRow}>
                <Text style={styles.contractMeta}>
                  {detail.contract.contractType}
                </Text>
                <Text style={styles.contractMetaDot}>
                  ·
                </Text>
                <Text style={styles.contractMeta}>
                  {isJa ? "残" : "REM"} {detail.contract.yearsRemaining} YR
                </Text>
                <Text style={styles.contractMetaDot}>
                  ·
                </Text>
                <Text style={styles.contractMeta}>
                  FA {detail.contract.freeAgencyYear}
                  {detail.contract.freeAgencyType
                    ? ` ${detail.contract.freeAgencyType}`
                    : ""}
                </Text>
              </View>
              <Text style={[styles.contractTotal, { color: accent }]}>
                {isJa ? "総額" : "TOTAL"}{" "}
                {formatSalaryUsd(detail.contract.totalValue)}
                {"  ·  "}
                {isJa ? "残保証" : "GUAR."}{" "}
                {formatSalaryUsd(detail.contract.remainingGuaranteed)}
              </Text>

              <View style={styles.contractSeasonList}>
                {detail.contract.seasons.map((s, i) => (
                  <View
                    key={s.season}
                    style={[
                      styles.contractSeasonRow,
                      i < detail.contract!.seasons.length - 1
                        ? {
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: hexToRgba(accent, 0.12),
                          }
                        : null,
                    ]}
                  >
                    <Text style={styles.contractSeasonYear}>
                      {formatContractSeasonLabel(s.season)}
                    </Text>
                    <Text style={styles.contractSeasonSalary}>
                      {s.baseSalary > 0
                        ? formatSalaryUsd(s.baseSalary)
                        : isTwoWay
                        ? "TW"
                        : "—"}
                    </Text>
                    {s.option ? (
                      <Text
                        style={[styles.contractSeasonOpt, { color: accent }]}
                      >
                        {s.option}
                      </Text>
                    ) : (
                      <Text style={styles.contractSeasonOptPlaceholder}> </Text>
                    )}
                  </View>
                ))}
              </View>
              {detail.contract.notes.length > 0 ? (
                <Text
                  style={[styles.contractNote, { color: hexToRgba(accent, 0.55) }]}
                >
                  {detail.contract.notes[0]}
                </Text>
              ) : null}
            </View>
        ) : detail.contract?.contractStatus?.toLowerCase().includes("expired") || (!detail.contract && !currentSalary) ? (
          <View
            style={[styles.contractCard, { borderColor: frameColor }]}
          >
            <View style={styles.contractTop}>
              <View style={styles.contractSalaryBlock}>
                <Text style={styles.contractLabel}>
                  {isJa ? "契約ステータス" : "CONTRACT STATUS"}
                </Text>
                <Text style={[styles.contractSalary, { fontSize: 18, color: "rgba(255,255,255,0.85)" }]}>
                  {isJa ? "契約満了 (FREE AGENT)" : "FREE AGENT / EXPIRED"}
                </Text>
              </View>
            </View>
            <View style={styles.contractMetaRow}>
              <Text style={styles.contractMeta}>
                {detail.contract?.contractType || "Free Agent"}
                {detail.contract?.freeAgencyYear ? ` · FA ${detail.contract.freeAgencyYear}` : ""}
                {detail.contract?.freeAgencyType ? ` ${detail.contract.freeAgencyType}` : ""}
              </Text>
            </View>
          </View>
        ) : (
          <PlayerDetailSectionNoDataNative accent={accent} />
        )}

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <View style={styles.advTitleRow}>
          <Text style={styles.advTitle}>AWARDS</Text>
          <View style={styles.advTitleLine} />
        </View>
        <View style={[styles.infoCard, { borderColor: frameColor }]}>
          {detail.awards.length > 0 ? (
            detail.awards.map((award) => (
              <InfoRow
                key={award.id}
                label={award.label}
                value={`× ${award.count}`}
                accent={accent}
                valueAccent
              />
            ))
          ) : (
            <InfoRow label="—" value={isJa ? "なし" : "None"} accent={accent} />
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: dividerColor }]} />

        <View style={styles.advTitleRow}>
          <Text style={styles.advTitle}>MORE</Text>
          <View style={styles.advTitleLine} />
        </View>
        <View style={[styles.infoCard, { borderColor: frameColor }]}>
          {displayAge != null ? (
            <InfoRow
              label={isJa ? "年齢" : "AGE"}
              value={String(displayAge)}
              accent={accent}
            />
          ) : null}
          <InfoRow
            label="COLLEGE"
            value={detail.college ?? "—"}
            accent={accent}
          />
          <InfoRow label="TEAM" value={detail.teamName} accent={accent} />
          <InfoRow
            label={isJa ? "経歴" : "HISTORY"}
            value={formatTeamHistory(detail.teamHistory)}
            accent={accent}
          />
        </View>

        <Text
          style={styles.footerAsOf}
        >
          {detail.asOfLabel}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fetchError: {
    color: "rgba(253, 230, 138, 0.95)",
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  root: { flex: 1 },
  pad: { paddingHorizontal: 12, paddingTop: 4 },
  panel: {
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 20,
  },
  idCard: {
    flexDirection: "row",
    borderWidth: 1,
    backgroundColor: "#050808",
    overflow: "hidden",
    minHeight: 132,
  },
  avatarBox: {
    width: 112,
    alignSelf: "stretch",
    borderRightWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#0a0a0c",
  },
  hatchWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: "hidden",
  },
  hatchLine: {
    position: "absolute",
    top: -40,
    width: 1,
    height: 220,
    transform: [{ rotate: "28deg" }],
  },
  jerseyMarkWrap: {
    width: 72,
    height: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  jerseyNumOnMark: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 28,
    textAlign: "center",
    fontFamily: OXANIUM,
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    transform: [{ skewX: "-6deg" }],
  },
  jerseyNumOnMarkSmall: {
    fontSize: 15,
    top: 30,
  },
  idBody: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 10,
    justifyContent: "center",
    gap: 8,
  },
  idName: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 0.6,
    transform: [{ skewX: "-8deg" }],
  },
  idMetaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  idMetaCell: {
    width: "50%",
    paddingRight: 6,
    paddingBottom: 6,
    gap: 1,
  },
  idMetaLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.38)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  idMetaValueRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
  },
  idMetaFlag: {
    width: 18,
    height: 12,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  idMetaValue: {
    flexShrink: 1,
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.3,
    transform: [{ skewX: "-6deg" }],
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(124,255,107,0.18)",
    marginVertical: 16,
  },
  sectionTitleInline: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    flex: 1,
  },
  formSection: { gap: 10 },
  formHeadPress: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  formChevron: {
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "800",
  },
  formRecord: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  gameList: {
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.55)",
    overflow: "hidden",
  },
  gameRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    gap: 4,
  },
  gameHead: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.8,
    transform: [],
  },
  gameDate: {
    width: 44,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 13,
  },
  gameVs: {
    flex: 1,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: "700",
    minWidth: 52,
  },
  gameResult: {
    width: 18,
    fontFamily: METRIC_FONT,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    transform: [{ skewX: "-8deg" }],
  },
  gameLine: {
    width: 46,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  gamePts: {
    width: 32,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  gameFg: {
    width: 52,
    textAlign: "right",
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
  },
  win: { color: FORM_WIN },
  loss: { color: FORM_LOSS },
  advWrap: { gap: 10 },
  advTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  advTitle: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "#FFFFFF",
  },
  advTitleLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  splitHint: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
    lineHeight: 14,
    marginBottom: 8,
  },
  splitTable: {
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    overflow: "hidden",
  },
  splitRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  splitCellLabel: {
    flex: 1.1,
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  splitCell: {
    flex: 0.75,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "right",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  splitCellHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.4)",
    transform: [{ skewX: "-6deg" }],
  },
  splitCellLast: {
    fontWeight: "800",
  },
  advGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderWidth: 1,
    backgroundColor: "rgba(6,8,12,0.72)",
    overflow: "hidden",
  },
  advCell: {
    width: "33.333%",
    paddingHorizontal: 10,
    paddingVertical: 12,
    gap: 4,
  },
  advCellTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  advLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(200,200,210,0.55)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  advRank: {
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-10deg" }],
  },
  advValue: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-8deg" }],
  },
  careerWrap: {
    gap: 10,
  },
  careerHeadRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    flexWrap: "wrap",
  },
  careerTabs: {
    flexDirection: "row",
    borderWidth: 1,
    overflow: "hidden",
  },
  careerTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  careerTabText: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  careerScroll: {
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  /** 右の BACK レールに最終列が隠れないよう余白 */
  careerScrollContent: {
    paddingRight: 56,
  },
  careerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    gap: 4,
  },
  careerHeadCell: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    transform: [{ skewX: "-6deg" }],
  },
  careerCell: {
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    transform: [{ skewX: "-6deg" }],
  },
  careerEmpty: {
    borderWidth: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  careerEmptyText: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.35)",
    fontSize: 12,
  },
  sectionNoData: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 88,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.45)",
    paddingHorizontal: 12,
    paddingVertical: 28,
  },
  heatWrap: { gap: 8 },
  heatHint: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.35)",
    fontSize: 10,
    letterSpacing: 0.4,
  },
  heatMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  heatSeason: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.65)",
    fontSize: 9,
    letterSpacing: 1.2,
    fontWeight: "700",
  },
  heatModePill: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  heatModePillText: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  heatSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  heatSummaryCell: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  heatSummaryDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
  },
  heatSummaryLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.35)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  heatSummaryValue: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.92)",
    fontSize: 14,
    fontWeight: "800",
  },
  heatCourtFrame: {
    position: "relative",
    borderWidth: 1,
    backgroundColor: "#06060c",
    overflow: "hidden",
    aspectRatio: SHOT_ZONE_VB_W / SHOT_ZONE_VB_H,
  },
  heatCorner: {
    position: "absolute",
    width: 10,
    height: 10,
    zIndex: 2,
  },
  heatCornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 2,
    borderLeftWidth: 2,
  },
  heatCornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 2,
    borderRightWidth: 2,
  },
  heatCornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 2,
  },
  heatCornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 2,
    borderRightWidth: 2,
  },
  distBlock: { gap: 6 },
  distTitle: {
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  distBar: {
    height: 8,
    flexDirection: "row",
    borderWidth: 1,
    overflow: "hidden",
  },
  distLegend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  distLegendItem: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  heatLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    justifyContent: "center",
  },
  magmaBar: {
    flex: 1,
    maxWidth: 180,
    height: 8,
    flexDirection: "row",
    borderRadius: 1,
    overflow: "hidden",
  },
  magmaSeg: {
    flex: 1,
    height: "100%",
  },
  heatLegendText: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  heatLegendSub: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.28)",
    fontSize: 9,
    letterSpacing: 0.3,
    textAlign: "center",
  },
  recentCompare: {
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 6,
    gap: 2,
  },
  recentCompareHead: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  recentCompareSide: {
    flex: 1,
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
    textAlign: "center",
  },
  recentCompareLabelCol: {
    width: 52,
  },
  recentCompareRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  recentCompareLabel: {
    width: 52,
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
  },
  recentCompareVal: {
    flex: 1,
    fontFamily: OXANIUM,
    fontSize: 16,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    color: "rgba(255,255,255,0.88)",
  },
  recentCompareValLeft: {
    textAlign: "right",
    paddingRight: 8,
  },
  recentCompareValRight: {
    textAlign: "left",
    paddingLeft: 8,
  },
  contractCard: {
    marginTop: 10,
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.55)",
    padding: 14,
    gap: 8,
  },
  contractTop: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  contractSalaryBlock: { gap: 4 },
  contractRankBlock: { alignItems: "flex-end", gap: 4 },
  contractLabel: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.38)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  contractSalary: {
    fontFamily: METRIC_FONT,
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "800",
    transform: [{ skewX: "-8deg" }],
  },
  contractRank: {
    fontFamily: METRIC_FONT,
    fontSize: 22,
    fontWeight: "800",
    transform: [{ skewX: "-8deg" }],
  },
  contractMetaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  contractMeta: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.62)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  contractMetaDot: {
    fontSize: 11,
    color: "rgba(255,255,255,0.62)",
  },
  contractTotal: {
    fontFamily: METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  contractSeasonList: {
    marginTop: 4,
    gap: 0,
  },
  contractSeasonRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    gap: 10,
  },
  contractSeasonYear: {
    fontFamily: METRIC_FONT,
    width: 48,
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.6,
  },
  contractSeasonSalary: {
    flex: 1,
    fontFamily: OXANIUM,
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  contractSeasonOpt: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.8,
    width: 28,
    textAlign: "right",
  },
  contractSeasonOptPlaceholder: {
    width: 28,
  },
  contractNote: {
    fontFamily: METRIC_FONT,
    fontSize: 11,
    lineHeight: 15,
  },
  infoCard: {
    marginTop: 10,
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.4)",
    overflow: "hidden",
  },
  availCard: {
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: "rgba(8,8,12,0.55)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  availTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  availStatus: {
    fontFamily: METRIC_FONT,
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1.4,
    transform: [{ skewX: "-8deg" }],
  },
  availReturn: {
    fontFamily: METRIC_FONT,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  availReason: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.72)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
    transform: [{ skewX: "-4deg" }],
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  infoLabel: {
    flex: 1,
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.82)",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
    transform: [{ skewX: "-6deg" }],
  },
  infoValue: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    transform: [{ skewX: "-6deg" }],
  },
  footerAsOf: {
    marginTop: 18,
    fontFamily: METRIC_FONT,
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
});
