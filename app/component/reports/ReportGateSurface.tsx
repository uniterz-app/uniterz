"use client";

/**
 * Report タブのゲート／空状態。
 * Free・月次ロックはモックをガウスぼかし＋説明＋CTA。
 * 月曜待ち・予想不足はモックなしの待機面。
 */

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Crosshair,
  HeartHandshake,
  LayoutGrid,
  MessageSquareText,
  Radar,
  Sparkles,
  Swords,
  Trophy,
  Waypoints,
} from "lucide-react";
import {
  reportGateCopy,
  reportGateCtaHref,
  type ReportGateBulletIcon,
} from "@/lib/reports/reportGateCopy";
import type { ReportGateKind } from "@/lib/reports/reportGateTypes";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import { jp, nameOxanium } from "@/lib/fonts";

type Lang = "ja" | "en";

const BULLET_ICONS: Record<ReportGateBulletIcon, typeof Trophy> = {
  result: Trophy,
  division: LayoutGrid,
  rival: Swords,
  target: Crosshair,
  comment: MessageSquareText,
  radar: Radar,
  habits: Waypoints,
  affinity: HeartHandshake,
  outlook: Sparkles,
  units: Trophy,
};

function TitleWithBrandFonts({ title }: { title: string }) {
  return (
    <>
      {title.split(/(Pro|Monthly)/).map((part, i) =>
        part === "Pro" || part === "Monthly" ? (
          <span
            key={i}
            className={[
              nameOxanium.className,
              "font-extrabold uppercase tracking-[0.06em]",
            ].join(" ")}
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

type Props = {
  kind: ReportGateKind;
  language: Lang;
  /** ぼかし下に置くプレビュー（free / monthlyLocked） */
  preview?: ReactNode;
  className?: string;
  /** 未指定時は既定 href。プレビューでは override 可 */
  ctaHref?: string | null;
  onCtaClick?: () => void;
};

const BLUR_KINDS: ReportGateKind[] = ["free", "monthlyLocked"];

const REPORT_FRAME = {
  weekly: {
    main: "#22d3ee",
    border: "rgba(34,211,238,0.40)",
    grid: "rgba(34,211,238,0.28)",
  },
  monthly: {
    main: "#a78bfa",
    border: "rgba(167,139,250,0.40)",
    grid: "rgba(167,139,250,0.28)",
  },
} as const;

function gatePeriod(kind: ReportGateKind): "weekly" | "monthly" {
  return kind === "waitingMonth" || kind === "monthlyLocked" ? "monthly" : "weekly";
}

export default function ReportGateSurface({
  kind,
  language,
  preview,
  className,
  ctaHref,
  onCtaClick,
}: Props) {
  const copy = reportGateCopy(kind, language);
  const href = ctaHref === undefined ? reportGateCtaHref(kind) : ctaHref;
  const showBlur = BLUR_KINDS.includes(kind) && preview != null;
  const period = gatePeriod(kind);
  const frame = REPORT_FRAME[period];
  const titleFont = language === "en" ? nameOxanium.className : jp.className;
  const bodyFont = language === "en" ? nameOxanium.className : jp.className;
  const bulletTone =
    period === "monthly"
      ? {
          panel: "border-[rgba(167,139,250,0.40)] bg-[rgba(167,139,250,0.07)]",
          icon: "border-[rgba(167,139,250,0.45)] bg-[rgba(167,139,250,0.15)] text-[#c4b5fd]",
          title: "text-[#ede9fe]",
        }
      : {
          panel: "border-[rgba(34,211,238,0.40)] bg-[rgba(34,211,238,0.07)]",
          icon: "border-[rgba(34,211,238,0.45)] bg-[rgba(34,211,238,0.15)] text-[#67e8f9]",
          title: "text-[#ecfeff]",
        };

  const cta =
    copy.cta && (href || onCtaClick) ? (
      onCtaClick && !href ? (
        <button
          type="button"
          onClick={onCtaClick}
          className={[
            nameOxanium.className,
            "min-h-10 min-w-[160px] border border-white/35 bg-[#00F5FF] px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#050508] transition hover:brightness-110 active:scale-[0.98]",
          ].join(" ")}
        >
          {copy.cta}
        </button>
      ) : (
        <Link
          href={href!}
          onClick={onCtaClick}
          className={[
            nameOxanium.className,
            "inline-flex min-h-10 min-w-[160px] items-center justify-center border border-white/35 bg-[#00F5FF] px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.12em] text-[#050508] transition hover:brightness-110 active:scale-[0.98]",
          ].join(" ")}
        >
          {copy.cta}
        </Link>
      )
    ) : null;

  const message = (
    <div className="relative z-1 flex w-full max-w-[22rem] flex-col items-stretch gap-3 px-3 text-center">
      <div className="flex flex-col items-center gap-2">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.24em]",
          ].join(" ")}
          style={{ color: frame.main }}
        >
          {copy.eyebrow}
        </p>
        <span className="inline-flex origin-top scale-[1.45]">
          <ProCyberBadge
            {...proBadgeStaticMotion}
            premium
            ariaLabel={language === "ja" ? "Pro会員" : "Pro member"}
          />
        </span>
      </div>
      <h2
        className={[
          titleFont,
          "text-balance text-[20px] font-bold leading-7 text-white",
        ].join(" ")}
      >
        {kind === "free" || kind === "monthlyLocked" ? (
          <TitleWithBrandFonts title={copy.title} />
        ) : (
          copy.title
        )}
      </h2>
      <p
        className={[
          bodyFont,
          "text-pretty text-[13px] leading-relaxed text-white/82",
        ].join(" ")}
      >
        {copy.body}
      </p>
      {cta ? <div className="flex justify-center">{cta}</div> : null}
      {copy.bullets && copy.bullets.length > 0 ? (
        <div className={["w-full rounded-[2px] border px-3 py-2.5 text-left", bulletTone.panel].join(" ")}>
          <ul className="list-none space-y-2">
            {copy.bullets.map((item) => {
              const Icon = BULLET_ICONS[item.icon];
              return (
                <li key={item.title} className="flex items-start gap-2.5">
                  <span
                    className={[
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] border",
                      bulletTone.icon,
                    ].join(" ")}
                    aria-hidden
                  >
                    <Icon className="h-3 w-3" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        language === "en" ? nameOxanium.className : jp.className,
                        "text-[11px] font-bold tracking-[0.04em]",
                        bulletTone.title,
                      ].join(" ")}
                    >
                      {item.title}
                    </p>
                    <p
                      className={[
                        language === "en" ? nameOxanium.className : jp.className,
                        "mt-0.5 break-words text-[11px] leading-snug text-white/78",
                      ].join(" ")}
                    >
                      {item.detail}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );

  if (!showBlur) {
    return (
      <div
        className={[
          "relative overflow-hidden rounded-[3px] border bg-[rgba(5,5,8,0.98)] px-4 py-14",
          className ?? "",
        ].join(" ")}
        style={{ borderColor: frame.border }}
      >
        <div className="relative z-1 flex justify-center">{message}</div>
      </div>
    );
  }

  return (
    <div
      className={[
        "relative isolate overflow-hidden rounded-[3px] border bg-[rgba(5,5,8,0.98)]",
        className ?? "",
      ].join(" ")}
      style={{ borderColor: frame.border }}
    >
      <div
        aria-hidden
        className="pointer-events-none select-none [mask-image:linear-gradient(180deg,#000_55%,transparent_100%)]"
      >
        <div className="max-h-[520px] overflow-hidden opacity-90">{preview}</div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 backdrop-blur-[12px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(4,8,14,0.22) 0%, rgba(4,8,14,0.62) 48%, rgba(4,8,14,0.82) 100%)",
        }}
      />

      <div className="absolute inset-0 z-1 flex items-start justify-center pt-12 pb-10 sm:pt-14">
        {message}
      </div>

      <div className="pointer-events-none invisible min-h-[280px]" aria-hidden />
    </div>
  );
}

