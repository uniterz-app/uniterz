"use client";

/**
 * プロフィール「アワード」タブ — 提出済みシーズンアワード予想。
 * データ接続までは NO DATA（useMockWhenEmpty でプレビュー可）。
 */
import NbaSeasonAwardsViewPanel from "@/app/component/predict/season/NbaSeasonAwardsViewPanel";
import { MOCK_SUBMITTED_AWARDS } from "@/lib/predict/nbaSeasonPicksViewMocks";
import { nameBebas } from "@/lib/fonts";
import { CYBER_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";
import type { NbaSeasonAwardsPrediction } from "@/lib/predict/nbaSeasonAwardsPredict";

type Props = {
  language?: "ja" | "en";
  prediction?: NbaSeasonAwardsPrediction | null;
  useMockWhenEmpty?: boolean;
  className?: string;
};

export default function ProfileAwardsTab({
  language = "ja",
  prediction = null,
  useMockWhenEmpty = false,
  className,
}: Props) {
  const isJa = language === "ja";
  const resolved =
    prediction ?? (useMockWhenEmpty ? MOCK_SUBMITTED_AWARDS : null);

  if (!resolved) {
    return (
      <div
        className={[
          CYBER_GLASS_PANEL,
          "mt-4 space-y-3 p-6 text-center",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <p
          className={[
            nameBebas.className,
            "text-[clamp(1.75rem,9vw,2.7rem)] leading-none tracking-[0.22em] text-white/55",
          ].join(" ")}
        >
          NO DATA
        </p>
        <p className="text-sm text-white/45">
          {isJa
            ? "提出済みのシーズンアワード予想がありません"
            : "No season awards prediction submitted"}
        </p>
      </div>
    );
  }

  return (
    <div className={["mt-4", className].filter(Boolean).join(" ")}>
      <NbaSeasonAwardsViewPanel prediction={resolved} />
    </div>
  );
}
