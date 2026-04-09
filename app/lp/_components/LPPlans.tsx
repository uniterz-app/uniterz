"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  planComparisonRows,
  planProGuide,
  planScreenshots,
  planTrustLines,
  type PlanComparisonAccess,
} from "./lp-data";

function comparisonCell(access: PlanComparisonAccess, variant: "free" | "pro") {
  const base =
    "inline-flex min-h-[44px] min-w-[4.5rem] items-center justify-center text-sm font-bold tabular-nums";

  if (access === "full") {
    return (
      <span
        className={`${base} ${
          variant === "pro"
            ? "text-cyan-200 drop-shadow-[0_0_12px_rgba(103,232,249,0.35)]"
            : "text-white/86"
        }`}
        title="利用可能"
      >
        ◯
      </span>
    );
  }

  if (access === "limited") {
    return (
      <span
        className={`${base} text-[11px] font-semibold tracking-wide text-white/62`}
        title="基本のみ／制限あり"
      >
        一部
      </span>
    );
  }

  return (
    <span className={`${base} text-white/28`} title="対象外">
      —
    </span>
  );
}

export default function LPPlans() {
  const pathname = usePathname();
  const signupHref =
    pathname?.includes("/mobile/lp") ? "/mobile/signup" : "/web/signup";
  const [activeTier, setActiveTier] = useState<"free" | "pro">("free");
  const activeSlot = useMemo(
    () => planScreenshots.find((slot) => slot.tier === activeTier) ?? planScreenshots[0],
    [activeTier]
  );

  return (
    <section
      id="plans"
      data-lp-animate="zoom"
      className="lp-section-shell"
    >
      <div className="lp-section-rail">
        <div className="mx-auto h-px w-full max-w-6xl bg-linear-to-r from-transparent via-cyan-300/38 to-transparent" />
        <div className="mx-auto h-24 w-[68%] max-w-4xl bg-cyan-300/7 blur-3xl" />
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-12">
        <div className="flex min-h-0 max-w-3xl flex-col lg:flex-1">
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-10 bg-linear-to-r from-cyan-300/70 to-transparent" />
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/82 sm:tracking-[0.28em]">
              Plans
            </div>
          </div>

          <h2 className="lp-section-title">
            Freeで順位参加、Proで上位固定へ。
          </h2>

          <p className="lp-section-desc">
            迷ったらまずFree。ランキングを継続して追い、上位を本気で狙うならPro。
          </p>

          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/52">
            <span className="font-semibold text-cyan-200/88">Pro向き：</span>
            {planProGuide}
          </p>

          <div className="mt-8 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-px backdrop-blur-xl">
            <div className="relative flex min-h-0 flex-1 flex-col rounded-[31px] bg-[linear-gradient(180deg,rgba(8,18,30,0.92),rgba(6,16,26,0.86))] p-4 sm:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-cyan-200/38 to-transparent" />
              <div className="pointer-events-none absolute inset-x-[10%] top-0 h-24 rounded-full bg-cyan-300/8 blur-3xl" />
              <div className="pointer-events-none absolute inset-px rounded-[30px] ring-1 ring-inset ring-white/6" />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(120,220,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(120,220,255,0.18)_1px,transparent_1px)] bg-size-[34px_34px] opacity-[0.06]" />

              <div className="relative flex min-h-0 flex-1 flex-col">
                <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/74 sm:tracking-[0.24em]">
                  機能比較
                </div>

                <div className="mt-3 text-[24px] font-black leading-[1.08] tracking-[-0.04em] text-white">
                  機能の違いを一覧で比較。
                </div>

                <p className="mt-3 max-w-136 text-sm leading-7 text-white/58">
                  表の「一部」は Free
                  で概要のみ／制限ありを表します。詳細は右のプランカードとアプリ内表示をご確認ください。
                </p>

                <p className="mt-3 flex items-center gap-2 text-[11px] font-medium text-cyan-200/70 lg:hidden">
                  <span className="inline-block h-1 w-6 rounded-full bg-linear-to-r from-cyan-300/60 to-transparent" />
                  比較表は横にスクロール
                </p>

                <div
                  className="relative mt-4 -mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0 lg:mt-6"
                  data-lp-stagger-group
                  data-lp-stagger-variant="up"
                  data-lp-stagger-step="0.10"
                >
                  <table className="w-full min-w-[280px] border-separate border-spacing-0 text-left min-[390px]:min-w-[300px] sm:min-w-[320px]">
                    <caption className="sr-only">
                      Free プランと Pro プランの機能比較
                    </caption>
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="rounded-tl-2xl border border-b-0 border-white/10 bg-white/4 px-3 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/52 sm:px-4 sm:text-[10px] sm:tracking-[0.2em]"
                        >
                          機能
                        </th>
                        <th
                          scope="col"
                          className="border border-b-0 border-l-0 border-white/10 bg-white/4 px-2.5 py-3 text-center text-[11px] font-black tracking-tight text-white/78 sm:px-3"
                        >
                          Free
                        </th>
                        <th
                          scope="col"
                          className="rounded-tr-2xl border border-b-0 border-l-0 border-cyan-300/22 bg-cyan-300/7 px-2.5 py-3 text-center text-[11px] font-black tracking-tight text-cyan-100/88 sm:px-3"
                        >
                          Pro
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {planComparisonRows.map((row, i) => {
                        const isLast = i === planComparisonRows.length - 1;
                        return (
                          <tr key={row.feature} data-lp-stagger-item>
                            <th
                              scope="row"
                              className={`border border-white/10 bg-white/2.5 px-3 py-3 text-left text-[13px] font-semibold leading-snug text-white/78 sm:px-4 ${
                                isLast ? "rounded-bl-2xl border-b" : "border-b-0"
                              }`}
                            >
                              {row.feature}
                            </th>
                            <td
                              className={`border border-l-0 border-white/10 bg-white/2 text-center ${
                                isLast ? "border-b" : "border-b-0"
                              }`}
                            >
                              {comparisonCell(row.free, "free")}
                            </td>
                            <td
                              className={`border border-l-0 border-cyan-300/16 bg-cyan-300/3 text-center ${
                                isLast ? "rounded-br-2xl border-b border-cyan-300/22" : "border-b-0"
                              }`}
                            >
                              {comparisonCell(row.pro, "pro")}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <ul className="mt-5 space-y-2 text-[13px] leading-6 text-white/44 sm:text-[12px] sm:leading-relaxed">
                  {planTrustLines.map((line) => (
                    <li key={line} className="flex gap-2">
                      <span className="mt-[0.35em] h-1 w-1 shrink-0 rounded-full bg-cyan-300/45" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col lg:h-full lg:min-w-0">
          <div className="mb-5 sm:mb-6">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/74 sm:tracking-[0.24em]">
              プラン選択
            </div>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/52 lg:max-w-sm">
              表で違いを確認したら、ここからランキング参加へ進めます。
            </p>
          </div>

          <div
            className="relative flex flex-1 flex-col gap-4"
            data-lp-stagger-group
            data-lp-stagger-variant="up"
            data-lp-stagger-step="0.13"
          >
            <div className="inline-flex w-full rounded-2xl border border-white/10 bg-white/3 p-1">
              <button
                type="button"
                onClick={() => setActiveTier("free")}
                className={`inline-flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  activeTier === "free"
                    ? "bg-white text-slate-950"
                    : "text-white/72 hover:text-white"
                }`}
              >
                Free
              </button>
              <button
                type="button"
                onClick={() => setActiveTier("pro")}
                className={`inline-flex flex-1 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-bold transition ${
                  activeTier === "pro"
                    ? "bg-linear-to-r from-cyan-400 via-sky-500 to-teal-400 text-slate-950"
                    : "text-white/72 hover:text-white"
                }`}
              >
                Pro
              </button>
            </div>

            <div
              key={activeSlot.tier}
              className={`group relative overflow-hidden rounded-[28px] border p-px ${
                activeSlot.tier === "pro"
                  ? "border-cyan-300/40 bg-[linear-gradient(165deg,rgba(45,232,255,0.18),rgba(255,255,255,0.05))]"
                  : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))]"
              }`}
              data-lp-stagger-item
            >
              <div className="relative rounded-[27px] bg-[linear-gradient(180deg,rgba(8,18,30,0.94),rgba(6,16,26,0.88))] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200/70 sm:tracking-[0.2em]">
                    {activeSlot.tier === "pro" ? "PRO SCREENSHOT" : "FREE SCREENSHOT"}
                  </div>
                  <div className="text-sm font-bold text-white">
                    {activeSlot.tier === "pro" ? "Pro" : "Free"}
                  </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                  {activeSlot.enabled && activeSlot.src ? (
                    <div className="relative h-[320px] w-full sm:h-[380px] lg:h-[420px]">
                      <Image
                        src={activeSlot.src}
                        alt={activeSlot.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 40vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-[320px] items-center justify-center px-6 text-center text-sm leading-6 text-white/45 sm:h-[380px] lg:h-[420px]">
                      プラン画面のスクショ未設定
                      <br />
                      lp-data.ts の `planScreenshots` にパスを設定
                    </div>
                  )}
                </div>

                <p className="mt-3 text-xs text-white/55">{activeSlot.title}</p>

                <div className="mt-4">
                  <Link
                    href={signupHref}
                    className={`inline-flex min-h-[46px] w-full items-center justify-center rounded-2xl px-3.5 py-3 text-sm font-bold transition ${
                      activeSlot.tier === "pro"
                        ? "border border-cyan-200/30 bg-linear-to-r from-cyan-400 via-sky-500 to-teal-400 text-slate-950"
                        : "border border-white/14 bg-white/7 text-white/92"
                    }`}
                  >
                    {activeSlot.tier === "pro"
                      ? "登録後、アプリで Pro を確認"
                      : "無料で始める"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
