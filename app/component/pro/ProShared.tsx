// app/component/pro/ProShared.tsx
import type React from "react";
import { CheckCircle2 } from "lucide-react";

// ★ ここで共通の RangeValue 型を定義して export
export type RangeValue = "7d" | "30d" | "all";

export function FeatureLine({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <CheckCircle2 className="mt-[2px] h-4 w-4 flex-shrink-0 text-emerald-400" />
      <span>{children}</span>
    </li>
  );
}

export function FeatureCard({
  icon,
  title,
  body,
  badge,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
  badge?: string;
}) {
  return (
    <div className="relative rounded-2xl border border-white/15 bg-white/5 p-3.5 shadow-[0_10px_30px_rgba(0,0,0,0.45)] sm:p-4">
      <div className="mb-2.5 flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold leading-snug sm:text-[15px]">
              {title}
            </h3>
            {badge && (
              <span className="hidden items-center rounded-full border border-white/20 bg-white/10 px-2 py-[2px] text-[10px] text-white/80 sm:inline-flex">
                {badge}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ★ ここを <p> ではなく <div> にする（p の中に div/p を入れない） */}
      <div className="text-[11px] leading-relaxed text-white/80 sm:text-xs space-y-2">
        {body}
      </div>
    </div>
  );
}
