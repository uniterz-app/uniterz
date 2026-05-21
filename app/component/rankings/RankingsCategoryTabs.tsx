"use client";

import { nameBebas } from "@/lib/fonts";

export type RankingsCategory = "playoffs" | "bracket";

type Props = {
  category: RankingsCategory;
  onChange: (next: RankingsCategory) => void;
};

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "h-7 rounded-lg border px-2 text-[14px] leading-none tracking-[0.05em] transition-[color,border-color,box-shadow,text-shadow]",
        active
          ? "border-cyan-300/40 bg-cyan-300/20 text-cyan-100 shadow-[0_0_12px_rgba(103,232,249,0.28)]"
          : "border-white/45 bg-transparent text-white/75 hover:border-[#008cff] hover:text-white hover:shadow-[0_0_18px_rgba(0,140,255,0.4)]",
        nameBebas.className,
      ].join(" ")}
    >
      {label}
    </button>
  );
}

export default function RankingsCategoryTabs({
  category,
  onChange,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-white/3 p-0.5">
      <TabButton
        active={category === "playoffs"}
        label="Playoffs"
        onClick={() => onChange("playoffs")}
      />
      <TabButton
        active={category === "bracket"}
        label="Bracket"
        onClick={() => onChange("bracket")}
      />
    </div>
  );
}
