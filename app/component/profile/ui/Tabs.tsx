"use client";
import React from "react";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";

export type ProfileMainTab = "overview" | "report" | "awards" | "bracket";

/** @deprecated use ProfileMainTab */
export type Tab = ProfileMainTab;

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

/** 下線インジケータ付きタブ（結果一覧など） */
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
  value: ProfileMainTab;
  onChange: (v: ProfileMainTab) => void;
  size?: UnderlineTabSize;
  /** split: 均等幅（CyberSlantedTabBar fill） */
  layout?: "inline" | "split";
};

export const PROFILE_MAIN_TAB_ORDER: readonly ProfileMainTab[] = [
  "overview",
  "report",
  "awards",
  "bracket",
] as const;

export const PROFILE_MAIN_TAB_LABELS_EN: Record<ProfileMainTab, string> = {
  overview: "OVERVIEW",
  report: "REPORT",
  awards: "AWARDS",
  bracket: "BRACKET",
};

/** プロフィール主タブ — CyberSlantedTab（ランキング等と同デザイン） */
export default function Tabs({
  value,
  onChange,
  size = "md",
  layout = "split",
}: Props) {
  const compact = size !== "lg";
  return (
    <CyberSlantedTabBar
      fill={layout !== "inline"}
      aria-label="Profile sections"
    >
      {PROFILE_MAIN_TAB_ORDER.map((id) => (
        <CyberSlantedTab
          key={id}
          role="tab"
          label={PROFILE_MAIN_TAB_LABELS_EN[id]}
          active={value === id}
          onClick={() => onChange(id)}
          compact={compact}
        />
      ))}
    </CyberSlantedTabBar>
  );
}
