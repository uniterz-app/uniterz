/**
 * Web `UniterzClearStamp` 相当（円形 INVITE スタンプたたき台）
 */
import { StyleSheet, View } from "react-native";
import Svg, {
  Circle,
  G,
  Line,
  Path,
  Polygon,
  Rect,
  Text as SvgText,
} from "react-native-svg";

export type UniterzClearStampToneNative = "cyan" | "lime" | "amber" | "ink";

type Props = {
  size?: number;
  rotateDeg?: number;
  tone?: UniterzClearStampToneNative;
  compact?: boolean;
};

const TONE: Record<
  UniterzClearStampToneNative,
  { fill: string; soft: string; glow: string }
> = {
  cyan: {
    fill: "#00F5FF",
    soft: "rgba(0,245,255,0.55)",
    glow: "rgba(0,245,255,0.35)",
  },
  lime: {
    fill: "#B8FF3C",
    soft: "rgba(184,255,60,0.55)",
    glow: "rgba(184,255,60,0.35)",
  },
  amber: {
    fill: "#FBBF24",
    soft: "rgba(251,191,36,0.55)",
    glow: "rgba(251,191,36,0.35)",
  },
  ink: {
    fill: "#FF2D55",
    soft: "rgba(255,45,85,0.55)",
    glow: "rgba(255,45,85,0.32)",
  },
};

function OuterSpikesNative({
  cx,
  cy,
  r,
  count,
  stroke,
}: {
  cx: number;
  cy: number;
  r: number;
  count: number;
  stroke: string;
}) {
  const marks = [];
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count - Math.PI / 2;
    const long = i % 2 === 0;
    marks.push(
      <Line
        key={`s-${i}`}
        x1={cx + Math.cos(a) * r}
        y1={cy + Math.sin(a) * r}
        x2={cx + Math.cos(a) * (r + (long ? 11 : 6))}
        y2={cy + Math.sin(a) * (r + (long ? 11 : 6))}
        stroke={stroke}
        strokeWidth={long ? 3.2 : 2}
        strokeLinecap="square"
      />
    );
  }
  return <G>{marks}</G>;
}

function OrbitNodesNative({
  cx,
  cy,
  r,
  anglesDeg,
  stroke,
  fill,
}: {
  cx: number;
  cy: number;
  r: number;
  anglesDeg: number[];
  stroke: string;
  fill: string;
}) {
  return (
    <G>
      {anglesDeg.map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        return (
          <G key={deg} transform={`translate(${x} ${y}) rotate(${deg})`}>
            <Polygon
              points="0,-4.5 4,0 0,4.5 -4,0"
              fill={fill}
              stroke={stroke}
              strokeWidth={1.2}
            />
          </G>
        );
      })}
    </G>
  );
}

export default function UniterzClearStampNative({
  size = 168,
  rotateDeg = -9,
  tone = "cyan",
  compact = false,
}: Props) {
  const c = TONE[tone];
  const cx = 120;
  const cy = 120;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          transform: [{ rotate: `${rotateDeg}deg` }],
          shadowColor: c.fill,
          shadowOpacity: 0.45,
          shadowRadius: 10,
          shadowOffset: { width: 0, height: 0 },
        },
      ]}
    >
      <Svg width={size} height={size} viewBox="0 0 240 240" fill="none">
        <Circle
          cx={cx}
          cy={cy}
          r={108}
          stroke={c.fill}
          strokeWidth={1.2}
          opacity={0.35}
          strokeDasharray="2 6"
        />

        <OuterSpikesNative
          cx={cx}
          cy={cy}
          r={94}
          count={40}
          stroke={c.fill}
        />

        <Circle cx={cx} cy={cy} r={93} stroke={c.fill} strokeWidth={5} />
        <Circle cx={cx} cy={cy} r={86} stroke={c.fill} strokeWidth={2.2} />
        <Circle
          cx={cx}
          cy={cy}
          r={79}
          stroke={c.fill}
          strokeWidth={1.6}
          strokeDasharray="4 3 1 3"
          opacity={0.9}
        />
        <Circle cx={cx} cy={cy} r={66} stroke={c.fill} strokeWidth={3.2} />
        <Circle
          cx={cx}
          cy={cy}
          r={60}
          stroke={c.fill}
          strokeWidth={1.4}
          opacity={0.7}
        />

        <OrbitNodesNative
          cx={cx}
          cy={cy}
          r={93}
          anglesDeg={[0, 45, 90, 135, 180, 225, 270, 315]}
          stroke={c.fill}
          fill={c.fill}
        />

        <G stroke={c.fill} fill={c.fill}>
              <Path
                d="M48 92 L20 104 L8 120 L20 136 L48 148 L40 120 Z"
                fill={c.fill}
                fillOpacity={0.18}
                strokeWidth={2.4}
              />
              <Path
                d="M54 84 L24 98 L14 120 L24 142 L54 156"
                fill="none"
                strokeWidth={2.8}
              />
              <Path
                d="M60 94 L36 106 L28 120 L36 134 L60 146"
                fill="none"
                strokeWidth={2.2}
              />
              <Path
                d="M34 104 L12 112 L16 120 L12 128 L34 136"
                fill="none"
                strokeWidth={1.8}
              />
              <Path d="M12 110 L2 120 L12 130" fill="none" strokeWidth={2.4} />
              <Rect x={62} y={106} width={11} height={3.5} />
              <Rect x={62} y={130} width={11} height={3.5} />
              <Rect x={56} y={114} width={7} height={12} />
              <Circle cx={22} cy={120} r={3.8} fill="none" strokeWidth={2} />
              <Circle cx={22} cy={120} r={1.5} />
              {[102, 111, 120, 129, 138].map((y) => (
                <Circle key={`lr-${y}`} cx={46} cy={y} r={1.6} />
              ))}
            </G>

            <G stroke={c.fill} fill={c.fill}>
              <Path
                d="M192 92 L220 104 L232 120 L220 136 L192 148 L200 120 Z"
                fill={c.fill}
                fillOpacity={0.18}
                strokeWidth={2.4}
              />
              <Path
                d="M186 84 L216 98 L226 120 L216 142 L186 156"
                fill="none"
                strokeWidth={2.8}
              />
              <Path
                d="M180 94 L204 106 L212 120 L204 134 L180 146"
                fill="none"
                strokeWidth={2.2}
              />
              <Path
                d="M206 104 L228 112 L224 120 L228 128 L206 136"
                fill="none"
                strokeWidth={1.8}
              />
              <Path d="M228 110 L238 120 L228 130" fill="none" strokeWidth={2.4} />
              <Rect x={167} y={106} width={11} height={3.5} />
              <Rect x={167} y={130} width={11} height={3.5} />
              <Rect x={177} y={114} width={7} height={12} />
              <Circle cx={218} cy={120} r={3.8} fill="none" strokeWidth={2} />
              <Circle cx={218} cy={120} r={1.5} />
              {[102, 111, 120, 129, 138].map((y) => (
                <Circle key={`rr-${y}`} cx={194} cy={y} r={1.6} />
              ))}
            </G>

            <G stroke={c.fill} fill={c.fill}>
              <Path d="M120 6 L134 22 L120 32 L106 22 Z" strokeWidth={1.6} />
              <Path
                d="M92 14 L108 28 L120 20 L132 28 L148 14"
                fill="none"
                strokeWidth={2.6}
              />
              <Path
                d="M82 24 L100 38 L120 28 L140 38 L158 24"
                fill="none"
                strokeWidth={2.1}
              />
              <Path d="M98 36 L120 50 L142 36" fill="none" strokeWidth={2.3} />
              <Path d="M106 46 L120 58 L134 46" fill="none" strokeWidth={1.9} />
              <Path d="M84 30 L70 38 L84 46" fill="none" strokeWidth={2.1} />
              <Path d="M156 30 L170 38 L156 46" fill="none" strokeWidth={2.1} />
              <Rect x={115} y={60} width={10} height={4} />
              <Circle cx={120} cy={18} r={2.2} />
            </G>

            <G stroke={c.fill} fill="none">
              <Path d="M82 192 L120 226 L158 192" strokeWidth={3.1} />
              <Path d="M92 180 L120 208 L148 180" strokeWidth={2.7} />
              <Path d="M100 168 L120 192 L140 168" strokeWidth={2.3} />
              <Path d="M108 156 L120 174 L132 156" strokeWidth={1.9} />
              <Path d="M74 184 L60 198 L74 212" strokeWidth={2.3} />
              <Path d="M166 184 L180 198 L166 212" strokeWidth={2.3} />
              <Path
                d="M96 210 L120 234 L144 210"
                strokeWidth={1.7}
                opacity={0.75}
              />
              <Circle cx={120} cy={218} r={2.2} fill={c.fill} />
            </G>

            <G stroke={c.fill} strokeWidth={2.1} fill="none">
              <Path d="M36 36 L54 36 L54 46 M36 36 L36 54 L46 54" />
              <Path d="M204 36 L186 36 L186 46 M204 36 L204 54 L194 54" />
              <Path d="M36 204 L54 204 L54 194 M36 204 L36 186 L46 186" />
              <Path d="M204 204 L186 204 L186 194 M204 204 L204 186 L194 186" />
            </G>

        <Circle cx={cx} cy={cy} r={52} fill={c.fill} opacity={0.12} />
        <Circle
          cx={cx}
          cy={cy}
          r={52}
          stroke={c.fill}
          strokeWidth={1.5}
          opacity={0.55}
        />

        <SvgText
          x={cx}
          y={compact ? 112 : 108}
          textAnchor="middle"
          fill={c.fill}
          fontFamily="Oxanium_700Bold"
          fontWeight="800"
          fontSize={compact ? 13 : 16}
          letterSpacing={compact ? 1.2 : 2}
        >
          UNITERZ
        </SvgText>
        <SvgText
          x={cx}
          y={compact ? 134 : 132}
          textAnchor="middle"
          fill={c.fill}
          fontFamily="Oxanium_700Bold"
          fontWeight="800"
          fontSize={compact ? 15 : 20}
          letterSpacing={compact ? 1.6 : 2.6}
        >
          INVITE
        </SvgText>

        <Circle cx={88} cy={120} r={2} fill={c.fill} />
        <Circle cx={152} cy={120} r={2} fill={c.fill} />
        <Line
          x1={78}
          y1={142}
          x2={162}
          y2={142}
          stroke={c.soft}
          strokeWidth={1.5}
        />
        <Line
          x1={86}
          y1={98}
          x2={154}
          y2={98}
          stroke={c.soft}
          strokeWidth={1.2}
          opacity={0.7}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
