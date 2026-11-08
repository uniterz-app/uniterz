import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, G, Path, Rect } from "react-native-svg";
import {
  SHOT_ZONE_BASKET,
  SHOT_ZONE_LABEL_POS,
  SHOT_ZONE_PAINT,
  SHOT_ZONE_RA_R,
  SHOT_ZONE_VB_H,
  SHOT_ZONE_VB_MIN_Y,
  SHOT_ZONE_VB_W,
  formatShotZoneMakesPerGame,
  shotCourtFreeThrowCirclePath,
  shotCourtTop,
  shotZonePathAboveBreak3Fill,
  shotZonePathLeftCorner3,
  shotZonePathMidRange,
  shotZonePathPaint,
  shotZonePathRightCorner3,
  shotZoneThreePointLine,
} from "../../../../../../lib/predict/nbaShotZoneCourtGeometry";
import type { LeagueHubZoneBoard } from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
import type { NbaPlayerShotZoneId } from "../../../../../../lib/predict/nbaPlayerDetailPreviewMocks";
import { CYBER_TAB_CYAN } from "../../rankings/CyberSlantedTabNative";
import { METRIC_FONT } from "../../rankings/rankingsUiTheme";
import {
  HubChips,
  HubEmpty,
  HubPosToggle,
  HubRow,
  HubToggle,
  type HubPosFilter,
  formatHubValue,
  playerNameStyle,
  teamInk,
  type HubLang,
} from "./leagueHubUiNative";

const KING_WRAP_W = 150;

const ZONE_ORDER: readonly NbaPlayerShotZoneId[] = [
  "restricted",
  "paint",
  "mid",
  "left_corner_3",
  "right_corner_3",
  "above_break_3",
];

const ZONE_LABEL: Record<NbaPlayerShotZoneId, { ja: string; en: string }> = {
  restricted: { ja: "リング下", en: "RIM" },
  paint: { ja: "ペイント", en: "PAINT" },
  mid: { ja: "ミドル", en: "MID" },
  left_corner_3: { ja: "左コーナー3", en: "L CORNER 3" },
  right_corner_3: { ja: "右コーナー3", en: "R CORNER 3" },
  above_break_3: { ja: "トップ3", en: "ABOVE BREAK 3" },
};

function zonePath(id: NbaPlayerShotZoneId): string | null {
  if (id === "above_break_3") return shotZonePathAboveBreak3Fill();
  if (id === "mid") return shotZonePathMidRange();
  if (id === "left_corner_3") return shotZonePathLeftCorner3();
  if (id === "right_corner_3") return shotZonePathRightCorner3();
  if (id === "paint") return shotZonePathPaint();
  return null;
}

/** コーナーは細いので名前を中に寄せる */
const NAME_POS: Record<NbaPlayerShotZoneId, { x: number; y: number }> = {
  ...SHOT_ZONE_LABEL_POS,
  left_corner_3: { x: 80, y: SHOT_ZONE_LABEL_POS.left_corner_3.y },
  right_corner_3: { x: SHOT_ZONE_VB_W - 80, y: SHOT_ZONE_LABEL_POS.right_corner_3.y },
  restricted: { x: SHOT_ZONE_BASKET.x, y: SHOT_ZONE_BASKET.y + 2 },
};

type Props = {
  zones: LeagueHubZoneBoard[];
  lang: HubLang;
  onSelectPlayer: (playerId: string) => void;
};

export default function LeagueHubZoneKingsNative({ zones, lang, onSelectPlayer }: Props) {
  const [zoneId, setZoneId] = useState<NbaPlayerShotZoneId>("above_break_3");
  const [mode, setMode] = useState<"pct" | "fga">("pct");
  const [courtW, setCourtW] = useState(0);
  const [pos, setPos] = useState<HubPosFilter>("all");
  const byId = new Map(
    zones.map((z) => [z.id, pos === "all" || !z.byPos ? z : z.byPos[pos]] as const)
  );
  const board = byId.get(zoneId);
  const rows = board ? (mode === "pct" ? board.byPct : board.byFga) : [];
  const line = "rgba(255,255,255,0.28)";
  const baselineY = SHOT_ZONE_PAINT.y + SHOT_ZONE_PAINT.h;
  const top = shotCourtTop();

  return (
    <View>
      <View
        style={styles.court}
        onLayout={(e) => setCourtW(e.nativeEvent.layout.width)}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 ${SHOT_ZONE_VB_MIN_Y} ${SHOT_ZONE_VB_W} ${SHOT_ZONE_VB_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <Rect
            x={0}
            y={SHOT_ZONE_VB_MIN_Y}
            width={SHOT_ZONE_VB_W}
            height={SHOT_ZONE_VB_H}
            fill="#04040a"
          />
          {ZONE_ORDER.map((id) => {
            const active = id === zoneId;
            const fill = active ? "rgba(0,245,255,0.22)" : "rgba(255,255,255,0.03)";
            const d = zonePath(id);
            return d ? (
              <Path key={id} d={d} fill={fill} onPress={() => setZoneId(id)} />
            ) : (
              <Circle
                key={id}
                cx={SHOT_ZONE_BASKET.x}
                cy={SHOT_ZONE_BASKET.y}
                r={SHOT_ZONE_RA_R}
                fill={active ? "rgba(0,245,255,0.3)" : "rgba(255,255,255,0.05)"}
                onPress={() => setZoneId(id)}
              />
            );
          })}
          <G pointerEvents="none">
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
            <Path d={shotCourtFreeThrowCirclePath()} fill="none" stroke={line} strokeWidth={1.2} />
            <Circle
              cx={SHOT_ZONE_BASKET.x}
              cy={SHOT_ZONE_BASKET.y}
              r={SHOT_ZONE_RA_R}
              fill="none"
              stroke={line}
              strokeWidth={1.1}
            />
            <Path d={shotZoneThreePointLine()} fill="none" stroke={line} strokeWidth={1.5} />
          </G>
        </Svg>
        {courtW > 0
          ? ZONE_ORDER.map((id) => {
              const king = byId.get(id)?.byPct[0];
              if (!king) return null;
              const pos = NAME_POS[id];
              const active = id === zoneId;
              const scale = courtW / SHOT_ZONE_VB_W;
              const small =
                id === "restricted" || id === "left_corner_3" || id === "right_corner_3";
              const nameSize = (small ? 17 : 19) * scale;
              return (
                <View
                  key={`k-${id}`}
                  pointerEvents="none"
                  style={[
                    styles.kingWrap,
                    {
                      left: pos.x * scale - KING_WRAP_W / 2,
                      top: (pos.y - SHOT_ZONE_VB_MIN_Y - 6 - nameSize / scale) * scale,
                    },
                  ]}
                >
                  <View style={styles.kingBox}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.kingName,
                        playerNameStyle,
                        {
                          fontSize: nameSize,
                          color: active ? CYBER_TAB_CYAN : teamInk(king.teamId),
                        },
                      ]}
                    >
                      {king.name}
                    </Text>
                    <Text
                      style={[
                        styles.kingPct,
                        {
                          fontSize: 17 * scale,
                          color: active ? CYBER_TAB_CYAN : "rgba(255,255,255,0.75)",
                        },
                      ]}
                    >
                      {formatHubValue(king.fgPct, "pct")}
                    </Text>
                  </View>
                </View>
              );
            })
          : null}
      </View>
      <View style={styles.controls}>
        <View style={styles.chipsWrap}>
          <HubChips
            items={ZONE_ORDER.map((id) => ({ id, label: ZONE_LABEL[id].en }))}
            value={zoneId}
            onChange={setZoneId}
          />
        </View>
      </View>
      <View style={styles.listHead}>
        <HubPosToggle value={pos} onChange={setPos} lang={lang} />
        <HubToggle
          items={[
            { id: "pct", label: "FG%" },
            { id: "fga", label: "FGA" },
          ]}
          value={mode}
          onChange={setMode}
        />
      </View>
      {rows.length === 0 ? (
        <HubEmpty text={lang === "ja" ? "まだデータがありません" : "No data yet"} />
      ) : (
        rows.map((r, i) => (
          <HubRow
            key={r.playerId}
            rank={i + 1}
            teamId={r.teamId}
            name={r.name}
            value={
              mode === "pct"
                ? formatHubValue(r.fgPct, "pct")
                : String(r.fgaTotal ?? r.fga.toFixed(1))
            }
            valueSub={
              r.fgaTotal != null
                ? `${r.fgm} / ${r.fgaTotal}`
                : `${formatShotZoneMakesPerGame(r)} / G`
            }
            onPress={() => onSelectPlayer(r.playerId)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  court: {
    width: "100%",
    aspectRatio: SHOT_ZONE_VB_W / SHOT_ZONE_VB_H,
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.3)",
  },
  kingWrap: {
    position: "absolute",
    width: KING_WRAP_W,
    alignItems: "center",
  },
  kingBox: {
    backgroundColor: "rgba(4,4,10,0.78)",
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignItems: "center",
  },
  kingName: {
    includeFontPadding: false,
  },
  kingPct: {
    fontFamily: METRIC_FONT,
    fontWeight: "700",
    includeFontPadding: false,
  },
  controls: {
    marginTop: 8,
  },
  chipsWrap: {},
  listHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
});
