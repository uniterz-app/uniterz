"use client";

/**
 * /dev/rank-first-border-flow-preview
 * 1位ランキング行 — 枠を流れる光アニメーション案（本番未接続）
 */

import "./rankFirstBorderFlow.css";
import { RankFirstBorderEdgeScan } from "@/app/component/rankings/RankFirstBorderEdgeScan";
import { nameBebas, nameOxanium, nameRajdhani } from "@/lib/fonts";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";

const BG = "#06080F";
const CYAN = "#00F5FF";
const LIME = "#B8FF3C";
const MAGENTA = "#FF2BD6";

type FlowVariant = "conic" | "svgDash" | "dual" | "edgeScan" | "pulse";

const VARIANTS: Array<{
  key: FlowVariant;
  title: string;
  subtitle: string;
}> = [
  {
    key: "conic",
    title: "案A — LIME CONIC",
    subtitle: "ライム→金の光が枠を一周（MyRankCard 枠走り光と同系）",
  },
  {
    key: "svgDash",
    title: "案B — SVG DASH CHASE",
    subtitle: "点線が矩形の縁を追走 · HUD テクニカル",
  },
  {
    key: "dual",
    title: "案C — GOLD × CYAN デュアル",
    subtitle: "金とシアンの2束が逆回転で縁を流れる",
  },
  {
    key: "edgeScan",
    title: "案D — EDGE SCAN",
    subtitle: "上下左右から光ビームが縁をスキャン（レーダー感）",
  },
  {
    key: "pulse",
    title: "案E — CHAMPION PULSE",
    subtitle: "スロー conic + 枠全体が呼吸するグロー",
  },
];

function FlowOverlay({ variant }: { variant: FlowVariant }) {
  if (variant === "conic") {
    return (
      <>
        <div
          aria-hidden
          className="rank-first-flow-dim pointer-events-none absolute inset-0 z-[6]"
        />
        <div
          aria-hidden
          className="rank-first-flow--conic pointer-events-none absolute inset-0 z-[7] overflow-hidden"
        >
          <div className="rank-first-flow__spin" />
        </div>
      </>
    );
  }

  if (variant === "svgDash") {
    return (
      <>
        <div
          aria-hidden
          className="rank-first-flow-dim pointer-events-none absolute inset-0 z-[6]"
        />
        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[8] h-full w-full"
          preserveAspectRatio="none"
        >
          <rect
            x="1"
            y="1"
            width="99%"
            height="99%"
            fill="none"
            stroke={LIME}
            strokeWidth="1.5"
            vectorEffect="nonScalingStroke"
            pathLength={100}
            strokeDasharray="10 90"
            className="rank-first-flow-svg-dash"
          />
          <rect
            x="1"
            y="1"
            width="99%"
            height="99%"
            fill="none"
            stroke={CYAN}
            strokeWidth="1"
            vectorEffect="nonScalingStroke"
            pathLength={100}
            strokeDasharray="6 94"
            strokeDashoffset={-30}
            className="rank-first-flow-svg-dash rank-first-flow-svg-dash--cyan"
          />
        </svg>
      </>
    );
  }

  if (variant === "dual") {
    return (
      <>
        <div
          aria-hidden
          className="rank-first-flow-dim pointer-events-none absolute inset-0 z-[6]"
        />
        <div
          aria-hidden
          className="rank-first-flow--dual pointer-events-none absolute inset-0 z-[7] overflow-hidden"
        >
          <div className="rank-first-flow__spin rank-first-flow__spin--gold" />
          <div className="rank-first-flow__spin rank-first-flow__spin--cyan" />
        </div>
      </>
    );
  }

  if (variant === "edgeScan") {
    return <RankFirstBorderEdgeScan />;
  }

  return (
    <>
      <div
        aria-hidden
        className="rank-first-flow-dim pointer-events-none absolute inset-0 z-[6]"
      />
      <div
        aria-hidden
        className="rank-first-flow--pulse pointer-events-none absolute inset-0 z-[7] overflow-hidden"
      >
        <div className="rank-first-flow__spin" />
      </div>
    </>
  );
}

function MockFirstPlaceRow({ variant }: { variant: FlowVariant }) {
  return (
    <article
      className="relative flex min-h-[72px] items-stretch overflow-hidden"
      style={{
        background:
          "linear-gradient(90deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 42%, rgba(0,0,0,0.12) 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <FlowOverlay variant={variant} />

      <span
        aria-hidden
        className="relative z-10 w-[3px] shrink-0"
        style={{
          background: "#FFD65A",
          boxShadow: "0 0 12px rgba(255,214,90,0.72)",
        }}
      />

      <div className="relative z-10 flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 sm:gap-4 sm:px-4">
        <div className="w-[52px] shrink-0 sm:w-[58px]">
          <span
            className={[nameBebas.className, "block tabular-nums leading-none"].join(" ")}
            style={{
              fontSize: "2.55rem",
              transform: "skewX(-12deg)",
              display: "inline-block",
              color: "#FFFBEB",
              WebkitTextStroke: "1.2px #F59E0B",
              paintOrder: "stroke fill",
              filter:
                "drop-shadow(0 0 12px rgba(251,191,36,0.82)) drop-shadow(0 0 24px rgba(255,214,90,0.38))",
            }}
          >
            01
          </span>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            aria-hidden
            className={[nameOxanium.className, "text-[7px] font-bold tracking-[0.1em]"].join(
              " "
            )}
            style={{ color: LIME, textShadow: "0 0 6px rgba(184,255,60,0.55)" }}
          >
            +++
          </span>
          <div
            className="relative shrink-0 overflow-hidden rounded-sm"
            style={{
              width: 44,
              height: 44,
              border: "1px solid rgba(184,255,60,0.55)",
              boxShadow: "0 0 12px rgba(184,255,60,0.2)",
            }}
          >
            <RankingsAvatarCircle
              photoURL={null}
              displayName="CHAMPION"
              boxClassName="h-full w-full rounded-sm"
              gateReady
            />
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={[nameRajdhani.className, "truncate font-bold uppercase tracking-[0.06em]"].join(
              " "
            )}
            style={{
              color: CYAN,
              fontSize: "15px",
              textShadow: "0 0 12px rgba(0,245,255,0.35)",
            }}
          >
            SYNTAX_ERROR
          </div>
          <div className="mt-2 flex max-w-[168px] gap-[3px]">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-[5px] flex-1 rounded-[1px]"
                style={{
                  background: i < 9 ? "rgba(34,211,238,0.92)" : "rgba(255,255,255,0.07)",
                  boxShadow: i < 9 ? "0 0 6px rgba(34,211,238,0.55)" : "none",
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end justify-center pl-1">
          <span
            className={[nameRajdhani.className, "tabular-nums font-bold leading-none"].join(" ")}
            style={{
              color: "#FFD65A",
              fontSize: "1.35rem",
              textShadow: "0 0 10px rgba(255,214,90,0.55)",
            }}
          >
            9,984
          </span>
          <span
            className={[nameOxanium.className, "mt-1 text-[8px] font-bold uppercase tracking-[0.2em]"].join(
              " "
            )}
            style={{ color: MAGENTA }}
          >
            PTS
          </span>
        </div>
      </div>
    </article>
  );
}

export default function RankFirstBorderFlowPreviewPage() {
  return (
    <div
      className="min-h-svh px-3 py-8 text-white sm:px-6"
      style={{ background: BG }}
    >
      <div className="mx-auto max-w-lg space-y-8">
        <header className="space-y-2">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.28em]",
            ].join(" ")}
            style={{ color: "rgba(0,245,255,0.65)" }}
          >
            Dev Preview · Rank #1 Border Flow
          </p>
          <h1 className="text-lg font-black tracking-tight">
            1位行 — 枠を流れる光アニメーション
          </h1>
          <p className="text-xs leading-relaxed text-white/45">
            サイバー HUD 風に、1位ユーザーの行枠を光が巡る演出案。
            <strong className="font-normal text-lime-300/90"> 案D が本番採用済み。</strong>
          </p>
        </header>

        {VARIANTS.map((v) => (
          <section key={v.key} className="space-y-2">
            <div>
              <h2
                className={[nameOxanium.className, "text-[11px] font-bold uppercase tracking-[0.14em]"].join(
                  " "
                )}
                style={{ color: CYAN }}
              >
                {v.title}
              </h2>
              <p className="mt-0.5 text-[11px] text-white/45">{v.subtitle}</p>
            </div>
            <div
              className="cyber-rank-list-panel overflow-hidden"
              style={{
                boxShadow: "0 0 20px rgba(0,245,255,0.06)",
              }}
            >
              <MockFirstPlaceRow variant={v.key} />
            </div>
          </section>
        ))}

        <p className="text-[10px] leading-relaxed text-white/35">
          prefers-reduced-motion 時は静止枠のみ表示。本番適用時は 1位行（
          <code className="text-white/50">CyberRankingListRow</code>
          ）の firstFrame にのみ載せる想定。
        </p>
      </div>
    </div>
  );
}
