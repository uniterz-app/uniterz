"use client";

import { useRouter } from "next/navigation";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";

type Kind = "awards" | "standings";

const HREF: Record<Kind, string> = {
  awards: "/mobile/season-awards",
  standings: "/mobile/season-standings",
};

/** シーズン予想ページ上部: AWARDS | STANDINGS 切替 */
export default function SeasonPredictKindTabs({ active }: { active: Kind }) {
  const router = useRouter();
  return (
    <div className="mb-3">
      <CyberSlantedTabBar fill aria-label="Season predict">
        {(["awards", "standings"] as const).map((kind) => (
          <CyberSlantedTab
            key={kind}
            role="tab"
            label={kind === "awards" ? "AWARDS" : "STANDINGS"}
            active={kind === active}
            onClick={() => {
              if (kind !== active) router.replace(HREF[kind]);
            }}
            compact
          />
        ))}
      </CyberSlantedTabBar>
    </div>
  );
}
