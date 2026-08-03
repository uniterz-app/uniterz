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
import { nameOxanium } from "@/lib/fonts";

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

  const cta =
    copy.cta && (href || onCtaClick) ? (
      onCtaClick && !href ? (
        <button
          type="button"
          onClick={onCtaClick}
          className={[
            nameOxanium.className,
            "min-h-12 min-w-[200px] border border-white/35 bg-[#00F5FF] px-5 py-3 text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#050508] transition hover:brightness-110 active:scale-[0.98]",
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
            "inline-flex min-h-12 min-w-[200px] items-center justify-center border border-white/35 bg-[#00F5FF] px-5 py-3 text-[13px] font-extrabold uppercase tracking-[0.12em] text-[#050508] transition hover:brightness-110 active:scale-[0.98]",
          ].join(" ")}
        >
          {copy.cta}
        </Link>
      )
    ) : null;

  const message = (
    <div className="flex w-full max-w-[22rem] flex-col items-stretch gap-3 px-3 text-center">
      <div className="flex flex-col items-center gap-2">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/80",
          ].join(" ")}
        >
          {copy.eyebrow}
        </p>
        {kind === "free" || kind === "monthlyLocked" ? (
          <span className="inline-flex origin-top scale-[1.45]">
            <ProCyberBadge
              {...proBadgeStaticMotion}
              premium
              ariaLabel={language === "ja" ? "Pro会員" : "Pro member"}
            />
          </span>
        ) : null}
      </div>
      <h2 className="text-balance text-[17px] font-bold leading-snug text-white">
        {kind === "free" || kind === "monthlyLocked" ? (
          <TitleWithBrandFonts title={copy.title} />
        ) : (
          copy.title
        )}
      </h2>
      <p className="text-pretty text-[13px] leading-relaxed text-white/72">
        {copy.body}
      </p>
      {cta ? <div className="flex justify-center">{cta}</div> : null}
      {copy.bullets && copy.bullets.length > 0 ? (
        <div className="w-full rounded-[2px] border border-orange-400/55 bg-orange-500/[0.07] px-3 py-2.5 text-left shadow-[0_0_18px_rgba(251,146,60,0.12)]">
          <ul className="list-none space-y-2">
            {copy.bullets.map((item) => {
              const Icon = BULLET_ICONS[item.icon];
              return (
                <li key={item.title} className="flex items-start gap-2.5">
                  <span
                    className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[2px] border border-orange-400/45 bg-orange-500/15 text-orange-300"
                    aria-hidden
                  >
                    <Icon className="h-3 w-3" strokeWidth={2.4} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p
                      className={[
                        nameOxanium.className,
                        "text-[11px] font-extrabold tracking-[0.04em] text-orange-100",
                      ].join(" ")}
                    >
                      {item.title}
                    </p>
                    <p className="mt-0.5 break-words text-[11px] leading-snug text-white/70">
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
          "relative overflow-hidden rounded-2xl border border-white/10",
          "bg-[linear-gradient(180deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)]",
          "px-4 py-14",
          className ?? "",
        ].join(" ")}
      >
        <div className="flex justify-center">{message}</div>
      </div>
    );
  }

  return (
    <div
      className={[
        "relative isolate overflow-hidden rounded-2xl border border-white/10",
        className ?? "",
      ].join(" ")}
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

      {/* 最低高さを確保（短いプレビューでも CTA が窮屈にならない） */}
      <div className="pointer-events-none invisible min-h-[280px]" aria-hidden />
    </div>
  );
}
