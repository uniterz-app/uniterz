"use client";

import { jp } from "@/lib/fonts";

export type RankingsMainView = "rankings" | "community";

function TabBtn({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-4 py-2 text-sm backdrop-blur-md transition-colors",
        active
          ? "border-cyan-200/25 bg-white/10 font-extrabold text-white shadow-[0_0_18px_rgba(0,255,255,0.10)]"
          : "border-white/10 bg-white/5 text-white/70 hover:border-white/15 hover:text-white/90",
        jp.className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

type Props = {
  view: RankingsMainView;
  onViewChange: (v: RankingsMainView) => void;
  language: "ja" | "en";
};

export default function RankingsMainTabs({
  view,
  onViewChange,
  language,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-start gap-2">
      <TabBtn
        label={language === "en" ? "Rankings" : "ランキング"}
        active={view === "rankings"}
        onClick={() => onViewChange("rankings")}
      />
      <TabBtn
        label={language === "en" ? "My community" : "マイコミュニティ"}
        active={view === "community"}
        onClick={() => onViewChange("community")}
      />
    </div>
  );
}
