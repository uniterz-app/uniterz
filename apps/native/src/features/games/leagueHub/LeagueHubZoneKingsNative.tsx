import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
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
  shotZoneAboveBreak3Dividers,
  shotZonePathAboveBreak3Fill,
  shotZonePathAboveBreak3Sector,
  shotZonePathLeftCorner3,
  shotZonePathMidRange,
  shotZonePathPaint,
  shotZonePathRightCorner3,
  shotZoneThreePointLine,
} from "../../../../../../lib/predict/nbaShotZoneCourtGeometry";
import type {
  LeagueHubZoneBoard,
  LeagueHubZoneId,
} from "../../../../../../lib/nba/leagueHub/leagueHubTypes";
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

/** チップは 2 段: 中（3 つ）と 3P（コートと同じ左→右）。データにあるエリアだけ出す */
const INSIDE_ZONES: readonly LeagueHubZoneId[] = ["restricted", "paint", "mid"];
const THREE_ZONES: readonly LeagueHubZoneId[] = [
  "left_corner_3",
  "left_wing_3",
  "top_3",
  "above_break_3",
  "right_wing_3",
  "right_corner_3",
];
const ZONE_ORDER: readonly LeagueHubZoneId[] = [...INSIDE_ZONES, ...THREE_ZONES];

/** 3P の段は全部 3P なので「3」を付けない */
const ZONE_LABEL: Record<LeagueHubZoneId, string> = {
  restricted: "RIM",
  paint: "PAINT",
  mid: "MID",
  left_corner_3: "L CORNER",
  left_wing_3: "L WING",
  top_3: "TOP",
  above_break_3: "ABOVE BREAK",
  right_wing_3: "R WING",
  right_corner_3: "R CORNER",
};

function zonePath(id: LeagueHubZoneId): string | null {
  if (id === "above_break_3") return shotZonePathAboveBreak3Fill();
  if (id === "left_wing_3") return shotZonePathAboveBreak3Sector("left");
  if (id === "top_3") return shotZonePathAboveBreak3Sector("center");
  if (id === "right_wing_3") return shotZonePathAboveBreak3Sector("right");
  if (id === "mid") return shotZonePathMidRange();
  if (id === "left_corner_3") return shotZonePathLeftCorner3();
  if (id === "right_corner_3") return shotZonePathRightCorner3();
  if (id === "paint") return shotZonePathPaint();
  return null;
}

/** コーナーと 45 度は細いので名前を中に寄せる */
const NAME_POS: Record<LeagueHubZoneId, { x: number; y: number }> = {
  ...SHOT_ZONE_LABEL_POS,
  left_corner_3: { x: 80, y: SHOT_ZONE_LABEL_POS.left_corner_3.y },
  right_corner_3: { x: SHOT_ZONE_VB_W - 80, y: SHOT_ZONE_LABEL_POS.right_corner_3.y },
  restricted: { x: SHOT_ZONE_BASKET.x, y: SHOT_ZONE_BASKET.y + 2 },
  left_wing_3: { x: 80, y: 200 },
  top_3: SHOT_ZONE_LABEL_POS.above_break_3,
  right_wing_3: { x: SHOT_ZONE_VB_W - 80, y: 200 },
};

const SMALL_NAME_ZONES = new Set<LeagueHubZoneId>([
  "restricted",
  "left_corner_3",
  "right_corner_3",
  "left_wing_3",
  "right_wing_3",
]);

type Props = {
  zones: LeagueHubZoneBoard[];
  lang: HubLang;
  onSelectPlayer: (playerId: string) => void;
};

export default function LeagueHubZoneKingsNative({ zones, lang, onSelectPlayer }: Props) {
  const order = ZONE_ORDER.filter((id) => zones.some((z) => z.id === id));
  const [pickedZone, setZoneId] = useState<LeagueHubZoneId>(
    order.includes("top_3") ? "top_3" : "above_break_3"
  );
  const zoneId = order.includes(pickedZone) ? pickedZone : (order[0] ?? pickedZone);
  const [mode, setMode] = useState<"pct" | "fga">("pct");
  const [courtW, setCourtW] = useState(0);
  const [pos, setPos] = useState<HubPosFilter>("all");
  const byId = new Map(
    zones.map((z) => [z.id, pos === "all" || !z.byPos ? z : z.byPos[pos]] as const)
  );
  const board = byId.get(zoneId);
  const zone = zones.find((z) => z.id === zoneId);
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
          {order.map((id) => {
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
            {order.includes("top_3") ? (
              <Path
                d={shotZoneAboveBreak3Dividers()}
                fill="none"
                stroke={line}
                strokeWidth={1}
                strokeDasharray="5 5"
              />
            ) : null}
          </G>
        </Svg>
        {courtW > 0
          ? order.map((id) => {
              const king = byId.get(id)?.byPct[0];
              if (!king) return null;
              const pos = NAME_POS[id];
              const active = id === zoneId;
              const scale = courtW / SHOT_ZONE_VB_W;
              const small = SMALL_NAME_ZONES.has(id);
              const nameSize = (small ? 17 : 19) * scale;
              return (
                <View
                  key={`k-${id}`}
                  pointerEvents="box-none"
                  style={[
                    styles.kingWrap,
                    {
                      left: pos.x * scale - KING_WRAP_W / 2,
                      top: (pos.y - SHOT_ZONE_VB_MIN_Y - 6 - nameSize / scale) * scale,
                    },
                  ]}
                >
                  <Pressable
                    style={({ pressed }) => [styles.kingBox, pressed ? { opacity: 0.6 } : null]}
                    onPress={() => onSelectPlayer(king.playerId)}
                    hitSlop={4}
                  >
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
                  </Pressable>
                </View>
              );
            })
          : null}
      </View>
      <View style={styles.controls}>
        {[INSIDE_ZONES, THREE_ZONES].map((row, i) => {
          const ids = row.filter((id) => order.includes(id));
          return ids.length > 0 ? (
            <HubChips
              key={i}
              items={ids.map((id) => ({ id, label: ZONE_LABEL[id] }))}
              value={zoneId}
              onChange={setZoneId}
              wrap
              columns={ids.length > 3 ? 5 : 3}
            />
          ) : null;
        })}
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
      {zone ? (
        <View style={styles.zoneMeta}>
          {zone.leagueFgPct != null ? (
            <Text style={styles.zoneAvg}>
              {lang === "ja" ? "リーグ平均 " : "LEAGUE AVG "}
              <Text style={styles.zoneAvgValue}>{formatHubValue(zone.leagueFgPct, "pct")}</Text>
            </Text>
          ) : (
            <View />
          )}
          {mode === "pct" ? (
            <Text style={styles.zoneMin}>
              {lang === "ja"
                ? `1 試合 ${zone.minFga} 本以上${zone.minTotal ? `・合計 ${zone.minTotal} 本以上` : ""}`
                : `Min ${zone.minFga} FGA/G${zone.minTotal ? `, ${zone.minTotal} total` : ""}`}
            </Text>
          ) : null}
        </View>
      ) : null}
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
            framed
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
  listHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  zoneMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 4,
  },
  zoneAvg: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.5)",
    fontSize: 10,
    fontWeight: "700",
  },
  zoneAvgValue: {
    color: CYBER_TAB_CYAN,
    fontSize: 12,
    fontWeight: "800",
  },
  zoneMin: {
    fontFamily: METRIC_FONT,
    color: "rgba(255,255,255,0.4)",
    fontSize: 10,
  },
});
