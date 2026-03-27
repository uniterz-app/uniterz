import Link from "next/link";
import {
  planComparisonRows,
  planProGuide,
  planTrustLines,
  plans,
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
  return (
    <section
      id="plans"
      data-lp-animate="zoom"
      className="lp-section-shell"
    >
      <div className="lp-section-rail">
        <div className="mx-auto h-px w-full max-w-6xl bg-gradient-to-r from-transparent via-cyan-300/38 to-transparent" />
        <div className="mx-auto h-24 w-[68%] max-w-4xl bg-cyan-300/7 blur-3xl" />
      </div>

      <div className="relative grid gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:items-stretch lg:gap-12">
        <div className="flex min-h-0 max-w-3xl flex-col lg:flex-1">
          <div className="inline-flex items-center gap-3">
            <div className="h-px w-10 bg-gradient-to-r from-cyan-300/70 to-transparent" />
            <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-300/82">
              Plans
            </div>
          </div>

          <h2 className="lp-section-title">
            Freeで始めて、必要ならProで深く見る。
          </h2>

          <p className="lp-section-desc">
            迷ったらまずFree。分析まで使うならPro。使い方に合わせて、必要な深さだけ選べる。
          </p>

          <p className="mt-3 max-w-[42rem] text-sm leading-relaxed text-white/52">
            <span className="font-semibold text-cyan-200/88">Pro向き：</span>
            {planProGuide}
          </p>

          <div className="mt-8 flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.02))] p-[1px] backdrop-blur-xl">
            <div className="relative flex min-h-0 flex-1 flex-col rounded-[31px] bg-[linear-gradient(180deg,rgba(8,18,30,0.92),rgba(6,16,26,0.86))] p-6 sm:p-7">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/38 to-transparent" />
              <div className="pointer-events-none absolute inset-x-[10%] top-0 h-24 rounded-full bg-cyan-300/8 blur-3xl" />
              <div className="pointer-events-none absolute inset-[1px] rounded-[30px] ring-1 ring-inset ring-white/6" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(120,220,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(120,220,255,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />

              <div className="relative flex min-h-0 flex-1 flex-col">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/74">
                  機能比較
                </div>

                <div className="mt-3 text-[24px] font-black leading-[1.08] tracking-[-0.04em] text-white">
                  機能の違いを一覧で比較。
                </div>

                <p className="mt-3 max-w-[34rem] text-sm leading-7 text-white/58">
                  表の「一部」は Free
                  で概要のみ／制限ありを表します。詳細は右のプランカードとアプリ内表示をご確認ください。
                </p>

                <div
                  className="relative mt-6 -mx-1 overflow-x-auto sm:mx-0"
                  data-lp-stagger-group
                  data-lp-stagger-variant="up"
                  data-lp-stagger-step="0.06"
                >
                  <table className="w-full min-w-[320px] border-separate border-spacing-0 text-left">
                    <caption className="sr-only">
                      Free プランと Pro プランの機能比較
                    </caption>
                    <thead>
                      <tr>
                        <th
                          scope="col"
                          className="rounded-tl-2xl border border-b-0 border-white/10 bg-white/[0.04] px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/48"
                        >
                          機能
                        </th>
                        <th
                          scope="col"
                          className="border border-b-0 border-l-0 border-white/10 bg-white/[0.04] px-3 py-3 text-center text-[11px] font-black tracking-tight text-white/78"
                        >
                          Free
                        </th>
                        <th
                          scope="col"
                          className="rounded-tr-2xl border border-b-0 border-l-0 border-cyan-300/22 bg-cyan-300/[0.07] px-3 py-3 text-center text-[11px] font-black tracking-tight text-cyan-100/88"
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
                              className={`border border-white/10 bg-white/[0.025] px-4 py-3 text-left text-[13px] font-semibold leading-snug text-white/78 ${
                                isLast ? "rounded-bl-2xl border-b" : "border-b-0"
                              }`}
                            >
                              {row.feature}
                            </th>
                            <td
                              className={`border border-l-0 border-white/10 bg-white/[0.02] text-center ${
                                isLast ? "border-b" : "border-b-0"
                              }`}
                            >
                              {comparisonCell(row.free, "free")}
                            </td>
                            <td
                              className={`border border-l-0 border-cyan-300/16 bg-cyan-300/[0.03] text-center ${
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

                <ul className="mt-5 space-y-2 text-[12px] leading-relaxed text-white/42">
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
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/74">
              プラン選択
            </div>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/52 lg:max-w-sm">
              表で違いを確認したら、ここから登録へ進めます。
            </p>
          </div>

          <div
            className="relative grid flex-1 gap-6 sm:gap-6 lg:grid-cols-2 lg:items-start"
            data-lp-stagger-group
            data-lp-stagger-variant="up"
            data-lp-stagger-step="0.09"
          >
            {plans.map((plan) => {
              const isPro = plan.tier === "pro";

              return (
                <div
                  key={plan.name}
                  className={`group relative flex w-full min-h-0 self-start overflow-hidden rounded-[28px] border p-[1px] backdrop-blur-2xl transition duration-300 ${
                    isPro
                      ? "border-cyan-300/40 bg-[linear-gradient(165deg,rgba(45,232,255,0.18),rgba(255,255,255,0.05))] shadow-[0_16px_48px_rgba(34,211,238,0.12)] hover:border-cyan-300/55 hover:shadow-[0_22px_64px_rgba(34,211,238,0.16)]"
                      : "border-white/[0.1] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] hover:border-white/16 hover:shadow-[0_14px_40px_rgba(0,0,0,0.22)]"
                  }`}
                  data-lp-stagger-item
                >
                  <div
                    className={`relative flex w-full flex-col overflow-hidden rounded-[27px] px-5 pb-6 pt-5 sm:px-6 sm:pb-7 sm:pt-6 ${
                      isPro
                        ? "bg-[linear-gradient(180deg,rgba(6,22,38,0.97),rgba(4,14,26,0.94))]"
                        : "bg-[linear-gradient(180deg,rgba(10,18,30,0.96),rgba(6,14,24,0.92))]"
                    }`}
                  >
                    {isPro ? (
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-cyan-300 via-sky-400 to-emerald-400 opacity-95"
                        aria-hidden
                      />
                    ) : null}

                    <div className="pointer-events-none absolute inset-x-0 top-[3px] h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                    <div
                      className={`pointer-events-none absolute inset-x-[8%] top-8 h-28 rounded-full blur-3xl ${
                        isPro ? "bg-cyan-400/12" : "bg-white/[0.04]"
                      }`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-[1px] rounded-[26px] ring-1 ring-inset ${
                        isPro ? "ring-cyan-300/18" : "ring-white/[0.06]"
                      }`}
                    />

                    <div className="relative">
                      {isPro ? (
                        <div className="inline-flex w-fit rounded-full border border-cyan-300/25 bg-cyan-300/[0.1] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-100/88">
                          分析したい人向け
                        </div>
                      ) : (
                        <div className="inline-flex w-fit rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/65">
                          はじめての人向け
                        </div>
                      )}

                      <div
                        className={`mt-4 text-[clamp(1.5rem,4.5vw,1.875rem)] font-black leading-[1.05] tracking-[-0.04em] ${
                          isPro
                            ? "bg-gradient-to-br from-white via-cyan-50 to-cyan-300/85 bg-clip-text text-transparent"
                            : "text-white"
                        }`}
                      >
                        {plan.name}
                      </div>

                      {/* 価格を主役に */}
                      <div className="mt-5">
                        {isPro ? (
                          <>
                            <p className="text-xl font-black leading-tight tracking-tight text-white sm:text-2xl">
                              {plan.price}
                            </p>
                            <p className="mt-2 text-[13px] leading-snug text-cyan-200/58">
                              {plan.priceNote}
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-[2.25rem] font-black tabular-nums leading-none tracking-tight text-white sm:text-[2.5rem]">
                              {plan.price}
                            </p>
                            <p className="mt-2 text-[13px] font-medium text-white/48">
                              {plan.priceNote}
                            </p>
                          </>
                        )}
                      </div>

                      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/62">
                        {plan.subtitle}
                      </p>
                      <p className="mt-2 text-[13px] leading-relaxed text-white/50">
                        {plan.caption}
                      </p>
                    </div>

                    <div className="relative my-6 h-px w-full bg-gradient-to-r from-transparent via-white/12 to-transparent" />

                    <div className="relative">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/38">
                        このプランでできること
                      </p>
                      <ul className="mt-3.5 space-y-3">
                        {plan.summaryLines.map((line) => (
                          <li key={line} className="flex gap-3 text-[13px] leading-snug text-white/78">
                            <span
                              className={`mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-lg border text-[11px] font-bold ${
                                isPro
                                  ? "border-cyan-300/35 bg-cyan-300/[0.12] text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.15)]"
                                  : "border-white/14 bg-white/[0.06] text-white/75"
                              }`}
                              aria-hidden
                            >
                              ✓
                            </span>
                            <span>{line}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-7">
                      <Link
                        href={plan.ctaHref}
                        className={`inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl px-4 py-3 text-[13px] font-bold transition duration-200 ${
                          isPro
                            ? "border border-cyan-200/30 bg-gradient-to-r from-cyan-400 via-sky-500 to-teal-400 text-slate-950 shadow-[0_0_32px_rgba(34,211,238,0.28)] hover:brightness-[1.06] active:scale-[0.99]"
                            : "border border-white/14 bg-white/[0.07] text-white/92 hover:border-white/22 hover:bg-white/[0.1]"
                        }`}
                      >
                        {plan.button}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
