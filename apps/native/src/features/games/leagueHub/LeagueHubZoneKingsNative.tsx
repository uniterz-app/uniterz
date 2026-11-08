import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Path, Rect, Text as SvgText } from "react-native-svg";
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
import {
  HubChips,
  HubEmpty,
  HubRow,
  HubToggle,
  formatHubValue,
  teamInk,
  type HubLang,
} from "./leagueHubUiNative";

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
  const byId = new Map(zones.map((z) => [z.id, z]));
  const board = byId.get(zoneId);
  const rows = board ? (mode === "pct" ? board.byPct : board.byFga) : [];
  const line = "rgba(255,255,255,0.28)";
  const baselineY = SHOT_ZONE_PAINT.y + SHOT_ZONE_PAINT.h;
  const top = shotCourtTop();

  return (
    <View>
      <View style={styles.court}>
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
            {ZONE_ORDER.map((id) => {
              const king = byId.get(id)?.byPct[0];
              if (!king) return null;
              const pos = NAME_POS[id];
              const active = id === zoneId;
              const nameSize =
                id === "restricted" || id === "left_corner_3" || id === "right_corner_3" ? 17 : 19;
              const boxW = Math.max(king.name.length * nameSize * 0.6, 60) + 14;
              return (
                <G key={`k-${id}`}>
                  <Rect
                    x={pos.x - boxW / 2}
                    y={pos.y - 4 - nameSize}
                    width={boxW}
                    height={nameSize + 26}
                    rx={4}
                    fill="rgba(4,4,10,0.78)"
                  />
                  <SvgText
                    x={pos.x}
                    y={pos.y - 4}
                    textAnchor="middle"
                    fontSize={nameSize}
                    fontWeight="800"
                    fill={active ? CYBER_TAB_CYAN : teamInk(king.teamId)}
                  >
                    {king.name}
                  </SvgText>
                  <SvgText
                    x={pos.x}
                    y={pos.y + 16}
                    textAnchor="middle"
                    fontSize={17}
                    fontWeight="700"
                    fill={active ? CYBER_TAB_CYAN : "rgba(255,255,255,0.75)"}
                  >
                    {formatHubValue(king.fgPct, "pct")}
                  </SvgText>
                </G>
              );
            })}
          </G>
        </Svg>
      </View>
      <View style={styles.controls}>
        <View style={styles.chipsWrap}>
          <HubChips
            items={ZONE_ORDER.map((id) => ({ id, label: ZONE_LABEL[id][lang] }))}
            value={zoneId}
            onChange={setZoneId}
          />
        </View>
      </View>
      <View style={styles.listHead}>
        <HubToggle
          items={[
            { id: "pct", label: "FG%" },
            { id: "fga", label: lang === "ja" ? "試投数" : "VOLUME" },
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
            value={mode === "pct" ? formatHubValue(r.fgPct, "pct") : r.fga.toFixed(1)}
            valueSub={`${formatShotZoneMakesPerGame(r)} / G`}
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
  controls: {
    marginTop: 8,
  },
  chipsWrap: {},
  listHead: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
});
