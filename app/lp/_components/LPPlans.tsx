import Link from "next/link";
import { plans } from "./lp-data";

export default function LPPlans() {
  return (
    <section className="relative mx-auto max-w-7xl px-6 py-24 sm:px-8 lg:px-10">
      <div className="max-w-2xl">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300/82">
          Plans
        </div>
        <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">
          Freeで参加、Proで深掘り
        </h2>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-[30px] border p-7 backdrop-blur-2xl ${plan.accent}`}
          >
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-2xl font-black tracking-tight">
                  {plan.name}
                </div>
                <div className="mt-2 text-sm text-white/64">{plan.price}</div>
              </div>

              {plan.name === "Free" ? (
                <Link
                  href="#signup"
                  className="rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/86 transition hover:bg-white/[0.08]"
                >
                  {plan.button}
                </Link>
              ) : (
                <button
                  type="button"
                  className="rounded-2xl border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-white/86"
                >
                  {plan.button}
                </button>
              )}
            </div>

            <div className="mt-6 space-y-3">
              {plan.items.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/74"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}