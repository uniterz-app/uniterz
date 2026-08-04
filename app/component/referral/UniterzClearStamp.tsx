"use client";

/**
 * UNITERZ INVITE 円形スタンプ（モンハン QUEST CLEAR 参考のサイバーたたき台）
 */
import { nameOxanium } from "@/lib/fonts";

export type UniterzClearStampTone = "cyan" | "lime" | "amber" | "ink";

type Props = {
  size?: number;
  /** 押印の傾き（deg） */
  rotateDeg?: number;
  tone?: UniterzClearStampTone;
  className?: string;
  /**
   * 小さいマス用。装飾はたたき台と同じ。文字サイズだけ少し落とす。
   */
  compact?: boolean;
};

const TONE: Record<
  UniterzClearStampTone,
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

/** 外周ギザ（長短交互） */
function OuterSpikes({
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
    const len = long ? 11 : 6;
    const w = long ? 3.2 : 2;
    marks.push(
      <line
        key={`s-${i}`}
        x1={cx + Math.cos(a) * r}
        y1={cy + Math.sin(a) * r}
        x2={cx + Math.cos(a) * (r + len)}
        y2={cy + Math.sin(a) * (r + len)}
        stroke={stroke}
        strokeWidth={w}
        strokeLinecap="square"
      />
    );
  }
  return <g>{marks}</g>;
}

/** 円周ノード（菱・丸） */
function OrbitNodes({
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
    <g>
      {anglesDeg.map((deg) => {
        const a = ((deg - 90) * Math.PI) / 180;
        const x = cx + Math.cos(a) * r;
        const y = cy + Math.sin(a) * r;
        return (
          <g key={deg} transform={`translate(${x} ${y}) rotate(${deg})`}>
            <polygon
              points="0,-4.5 4,0 0,4.5 -4,0"
              fill={fill}
              stroke={stroke}
              strokeWidth={1.2}
            />
          </g>
        );
      })}
    </g>
  );
}

export default function UniterzClearStamp({
  size = 168,
  rotateDeg = -9,
  tone = "cyan",
  className,
  compact = false,
}: Props) {
  const c = TONE[tone];
  const cx = 120;
  const cy = 120;
  const vb = 240;

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        transform: `rotate(${rotateDeg}deg)`,
        filter: `drop-shadow(0 0 10px ${c.glow})`,
      }}
      aria-hidden
    >
      <svg viewBox={`0 0 ${vb} ${vb}`} width={size} height={size} fill="none">
        {/* outermost soft ring */}
        <circle
          cx={cx}
          cy={cy}
          r={108}
          stroke={c.fill}
          strokeWidth={1.2}
          opacity={0.35}
          strokeDasharray="2 6"
        />

        <OuterSpikes
          cx={cx}
          cy={cy}
          r={94}
          count={40}
          stroke={c.fill}
        />

        {/* double hull */}
        <circle cx={cx} cy={cy} r={93} stroke={c.fill} strokeWidth={5} />
        <circle cx={cx} cy={cy} r={86} stroke={c.fill} strokeWidth={2.2} />
        <circle
          cx={cx}
          cy={cy}
          r={79}
          stroke={c.fill}
          strokeWidth={1.6}
          strokeDasharray="4 3 1 3"
          opacity={0.9}
        />
        <circle cx={cx} cy={cy} r={66} stroke={c.fill} strokeWidth={3.2} />
        <circle
          cx={cx}
          cy={cy}
          r={60}
          stroke={c.fill}
          strokeWidth={1.4}
          opacity={0.7}
        />

        <OrbitNodes
          cx={cx}
          cy={cy}
          r={93}
          anglesDeg={[0, 45, 90, 135, 180, 225, 270, 315]}
          stroke={c.fill}
          fill={c.fill}
        />

        {/* LEFT cyber-fin cluster */}
        <g stroke={c.fill} fill={c.fill}>
          <path
            d="M48 92 L20 104 L8 120 L20 136 L48 148 L40 120 Z"
            fill={c.fill}
            fillOpacity={0.18}
            strokeWidth={2.4}
          />
          <path
            d="M54 84 L24 98 L14 120 L24 142 L54 156"
            fill="none"
            strokeWidth={2.8}
          />
          <path
            d="M60 94 L36 106 L28 120 L36 134 L60 146"
            fill="none"
            strokeWidth={2.2}
          />
          <path
            d="M34 104 L12 112 L16 120 L12 128 L34 136"
            fill="none"
            strokeWidth={1.8}
          />
          <path d="M12 110 L2 120 L12 130" fill="none" strokeWidth={2.4} />
          <rect x="62" y="106" width="11" height="3.5" />
          <rect x="62" y="130" width="11" height="3.5" />
          <rect x="56" y="114" width="7" height="12" />
          <circle cx="22" cy="120" r="3.8" fill="none" strokeWidth={2} />
          <circle cx="22" cy="120" r="1.5" />
          {[102, 111, 120, 129, 138].map((y) => (
            <circle key={`lr-${y}`} cx="46" cy={y} r="1.6" />
          ))}
        </g>

            {/* RIGHT cyber-fin cluster */}
            <g stroke={c.fill} fill={c.fill}>
              <path
                d="M192 92 L220 104 L232 120 L220 136 L192 148 L200 120 Z"
                fill={c.fill}
                fillOpacity={0.18}
                strokeWidth={2.4}
              />
              <path
                d="M186 84 L216 98 L226 120 L216 142 L186 156"
                fill="none"
                strokeWidth={2.8}
              />
              <path
                d="M180 94 L204 106 L212 120 L204 134 L180 146"
                fill="none"
                strokeWidth={2.2}
              />
              <path
                d="M206 104 L228 112 L224 120 L228 128 L206 136"
                fill="none"
                strokeWidth={1.8}
              />
              <path d="M228 110 L238 120 L228 130" fill="none" strokeWidth={2.4} />
              <rect x="167" y="106" width="11" height="3.5" />
              <rect x="167" y="130" width="11" height="3.5" />
              <rect x="177" y="114" width="7" height="12" />
              <circle cx="218" cy="120" r="3.8" fill="none" strokeWidth={2} />
              <circle cx="218" cy="120" r="1.5" />
              {[102, 111, 120, 129, 138].map((y) => (
                <circle key={`rr-${y}`} cx="194" cy={y} r="1.6" />
              ))}
            </g>

            {/* TOP crest */}
            <g stroke={c.fill} fill={c.fill}>
              <path d="M120 6 L134 22 L120 32 L106 22 Z" strokeWidth={1.6} />
              <path
                d="M92 14 L108 28 L120 20 L132 28 L148 14"
                fill="none"
                strokeWidth={2.6}
              />
              <path
                d="M82 24 L100 38 L120 28 L140 38 L158 24"
                fill="none"
                strokeWidth={2.1}
              />
              <path d="M98 36 L120 50 L142 36" fill="none" strokeWidth={2.3} />
              <path d="M106 46 L120 58 L134 46" fill="none" strokeWidth={1.9} />
              <path d="M84 30 L70 38 L84 46" fill="none" strokeWidth={2.1} />
              <path d="M156 30 L170 38 L156 46" fill="none" strokeWidth={2.1} />
              <rect x="115" y="60" width="10" height="4" />
              <circle cx="120" cy="18" r="2.2" />
            </g>

            {/* BOTTOM chevron stack + anchors */}
            <g stroke={c.fill} fill="none">
              <path d="M82 192 L120 226 L158 192" strokeWidth={3.1} />
              <path d="M92 180 L120 208 L148 180" strokeWidth={2.7} />
              <path d="M100 168 L120 192 L140 168" strokeWidth={2.3} />
              <path d="M108 156 L120 174 L132 156" strokeWidth={1.9} />
              <path d="M74 184 L60 198 L74 212" strokeWidth={2.3} />
              <path d="M166 184 L180 198 L166 212" strokeWidth={2.3} />
              <path
                d="M96 210 L120 234 L144 210"
                strokeWidth={1.7}
                opacity={0.75}
              />
              <circle cx="120" cy="218" r="2.2" fill={c.fill} />
            </g>

            {/* diagonal corner brackets */}
            <g stroke={c.fill} strokeWidth={2.1} fill="none">
              <path d="M36 36 L54 36 L54 46 M36 36 L36 54 L46 54" />
              <path d="M204 36 L186 36 L186 46 M204 36 L204 54 L194 54" />
              <path d="M36 204 L54 204 L54 194 M36 204 L36 186 L46 186" />
              <path d="M204 204 L186 204 L186 194 M204 204 L204 186 L194 186" />
            </g>

        {/* inner plate */}
        <circle cx={cx} cy={cy} r={52} fill={c.fill} opacity={0.12} />
        <circle
          cx={cx}
          cy={cy}
          r={52}
          stroke={c.fill}
          strokeWidth={1.5}
          opacity={0.55}
        />

        {/* stacked title */}
        <text
          x={cx}
          y={compact ? 112 : 108}
          textAnchor="middle"
          fill={c.fill}
          className={nameOxanium.className}
          style={{
            fontFamily: "Oxanium, Rajdhani, system-ui, sans-serif",
            fontWeight: 800,
            fontSize: compact ? 13 : 16,
            letterSpacing: compact ? 1.2 : 2,
          }}
        >
          UNITERZ
        </text>
        <text
          x={cx}
          y={compact ? 134 : 132}
          textAnchor="middle"
          fill={c.fill}
          style={{
            fontFamily: "Oxanium, Rajdhani, system-ui, sans-serif",
            fontWeight: 800,
            fontSize: compact ? 15 : 20,
            letterSpacing: compact ? 1.6 : 2.6,
          }}
        >
          INVITE
        </text>

        <circle cx="88" cy="120" r="2" fill={c.fill} />
        <circle cx="152" cy="120" r="2" fill={c.fill} />
        <line
          x1="78"
          y1="142"
          x2="162"
          y2="142"
          stroke={c.soft}
          strokeWidth={1.5}
        />
        <line
          x1="86"
          y1="98"
          x2="154"
          y2="98"
          stroke={c.soft}
          strokeWidth={1.2}
          opacity={0.7}
        />
      </svg>
    </div>
  );
}
