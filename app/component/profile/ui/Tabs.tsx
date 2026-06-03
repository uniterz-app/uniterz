"use client";
import React from "react";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";

export type Tab = "overview" | "stats" | "bracket";

const sizeMap = {
  sm: "text-sm pb-2 tracking-[0.06em]",
  md: "text-[15px] pb-3 tracking-[0.06em]",
  lg: "text-[18px] pb-4 tracking-[0.06em]",
} as const;

export type UnderlineTabSize = keyof typeof sizeMap;

type UnderlineTabsProps<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  items: readonly T[];
  labelMap: Record<T, string>;
  size?: UnderlineTabSize;
  /** split: 各タブを均等幅（2タブなら画面を半分ずつ） */
  layout?: "inline" | "split";
};

export function UnderlineTabs<T extends string>({
  value,
  onChange,
  items,
  labelMap,
  size = "md",
  layout = "inline",
}: UnderlineTabsProps<T>) {
  const teamNameFont = bracketMarketTeamTypography(size !== "lg");
  const split = layout === "split";

  return (
    <div
      className={[
        "flex w-full border-b border-white/10",
        split ? "" : "gap-8",
      ].join(" ")}
      style={teamNameFont}
    >
      {items.map((t) => {
        const active = value === t;

        return (
          <button
            key={t}
            type="button"
            onClick={() => onChange(t)}
            className={[
              "relative font-medium transition-colors",
              sizeMap[size],
              split ? "flex flex-1 items-center justify-center min-w-0" : "",
              active
                ? "text-white"
                : "text-white/50 hover:text-white/80",
            ].join(" ")}
          >
            <span className={split ? "truncate px-2" : undefined}>
              {labelMap[t]}
            </span>

            {active && (
              <span
                className="
                  absolute left-0 -bottom-px
                  h-[2px] w-full
                  bg-[#6EA8FE]
                  rounded-full
                "
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

type Props = {
  value: Tab;
  onChange: (v: Tab) => void;
  showStats?: boolean;
  size?: UnderlineTabSize;
};

export default function Tabs({
  value,
  onChange,
  showStats = true,
  size = "md",
}: Props) {
  const items: Tab[] = showStats
    ? ["overview", "stats", "bracket"]
    : ["overview", "bracket"];

  const labelMap: Record<Tab, string> = {
    overview: "Overview",
    stats: "Pro Stats",
    bracket: "Bracket",
  };

  return (
    <UnderlineTabs
      value={value}
      onChange={onChange}
      items={items}
      labelMap={labelMap}
      size={size}
    />
  );
}