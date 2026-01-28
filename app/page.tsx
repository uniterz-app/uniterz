// app/page.tsx
"use client";

import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="min-h-screen w-full bg-[#020617] text-white">
      {/* background */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,rgba(56,189,248,0.15),transparent_60%)]" />

      {/* header */}
      <header className="relative z-10 mx-auto max-w-6xl px-6 py-6 flex items-center justify-between">
        <div className="text-xl font-extrabold tracking-tight">Uniterz</div>
        <Link
          href="/app"
          className="rounded-full border border-white/15 px-4 py-2 text-sm hover:bg-white/10 transition"
        >
          Open App
        </Link>
      </header>

      {/* hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-20 pb-24">
        <div className="max-w-3xl space-y-6">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Sports Analytics.
            <br />
            Prediction without Gambling.
          </h1>

          <p className="text-lg text-white/80">
            Uniterz is a sports analytics & prediction platform focused on data,
            probability, and performance analysis — not betting.
          </p>

          <p className="text-base text-white/60 leading-relaxed">
            Uniterz は、ギャンブルや賭け要素を一切含まない
            <br />
            <span className="text-white">
              スポーツ予想 × 分析に特化したデータ分析プラットフォーム
            </span>
            です。
          </p>

          <div className="mt-8 flex gap-4">
            <Link
              href="/app"
              className="rounded-xl bg-sky-500 px-6 py-3 font-semibold text-black hover:bg-sky-400 transition"
            >
              Launch App
            </Link>
            <Link
              href="/web/u/guest"
              className="rounded-xl border border-white/20 px-6 py-3 font-semibold text-white hover:bg-white/10 transition"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* features */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Feature
            title="Predictions / 予想"
            descEn="Game outcome and score predictions with confidence levels."
            descJa="勝敗・スコア予想と自信度（確率）を投稿・分析できます。"
          />
          <Feature
            title="Analytics / 分析"
            descEn="Win rate, precision, calibration, upset metrics and trends."
            descJa="勝率・精度・一致度・Upset 指標などを自動集計します。"
          />
          <Feature
            title="Visualization / 可視化"
            descEn="Charts and profiles to understand performance over time."
            descJa="成績をチャートやプロフィールで分かりやすく表示します。"
          />
        </div>
      </section>

      {/* safety */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-3xl border border-emerald-400/30 bg-emerald-400/10 p-8 space-y-3">
          <h2 className="text-2xl font-bold">No Gambling. No Real Money.</h2>
          <p className="text-white/80">
            Uniterz does not provide betting, odds, or real-money wagering.
            All predictions are for analytical and educational purposes only.
          </p>
          <p className="text-white/70">
            Uniterz は、賭博・ベッティング・金銭的報酬を扱いません。
            すべての予想は分析・学習目的のみで提供されます。
          </p>
        </div>
      </section>

      {/* footer */}
      <footer className="relative z-10 border-t border-white/10">
        <div className="mx-auto max-w-6xl px-6 py-10 flex flex-col md:flex-row gap-6 md:gap-10 text-sm text-white/60">
          <div className="font-semibold text-white">Uniterz</div>

          {/* ★ 修正：SettingsMenu と同じ遷移先 */}
          <div className="flex gap-6 flex-wrap">
            <Link href="/web/terms" className="hover:text-white">
              Terms
            </Link>
            <Link href="/web/privacy" className="hover:text-white">
              Privacy
            </Link>
            <Link href="/web/law" className="hover:text-white">
              Legal
            </Link>
            <Link href="/web/refund" className="hover:text-white">
              Refund
            </Link>
          </div>

          <div className="md:ml-auto">
            © {new Date().getFullYear()} Uniterz
          </div>
        </div>
      </footer>
    </main>
  );
}

function Feature({
  title,
  descEn,
  descJa,
}: {
  title: string;
  descEn: string;
  descJa: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur space-y-2">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-white/80">{descEn}</p>
      <p className="text-sm text-white/60">{descJa}</p>
    </div>
  );
}
