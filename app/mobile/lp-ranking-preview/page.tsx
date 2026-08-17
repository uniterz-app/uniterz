import OfficialLpRankingScreen from "@/app/lp-official/_components/OfficialLpRankingScreen";

/** /mobile/lp-ranking-preview — LP 用ランキング画面の実寸プレビュー（スクショ用） */
export default function MobileLpRankingPreviewPage() {
  return (
    <div className="min-h-svh bg-[#05070c] text-white">
      <div className="mx-auto w-full max-w-[430px]">
        <OfficialLpRankingScreen maxRows={10} />
      </div>
    </div>
  );
}
