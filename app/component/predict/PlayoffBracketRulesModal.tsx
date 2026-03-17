"use client";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PlayoffBracketRulesModal({
  open,
  onClose,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/72 backdrop-blur-[3px]"
      />

      <div className="relative z-[201] w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1015] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="text-[20px] font-semibold tracking-[0.02em] text-white">
          プレーオフブラケットのルール
        </div>

        <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-white/82">
          <div>
            <div className="mb-1 text-[15px] font-semibold text-white">
              採点方法
            </div>
            <div className="space-y-1">
              <p>・1回戦の勝者を当てると 4点</p>
              <p>・2回戦の勝者を当てると 5点</p>
              <p>・カンファレンス決勝の勝者を当てると 6点</p>
              <p>・NBAファイナルの勝者を当てると 6点</p>
              <p>・試合数までぴったり当てると さらに 2点</p>
            </div>
          </div>

          <div>
            <div className="mb-1 text-[15px] font-semibold text-white">
              重要
            </div>
            <div className="space-y-1">
              <p>・試合数のボーナスは、勝者予想も当たっている場合だけ加点されます</p>
              <p>・勝者を外したシリーズは 0点です</p>
              <p>・前のラウンドで勝ち上がっていないチームを次のラウンドで選んでいる場合、その予想は採点されません</p>
            </div>
          </div>

          <div>
            <div className="mb-1 text-[15px] font-semibold text-white">
              合計点
            </div>
            <p>・満点は 100点 です</p>
          </div>

          <div>
            <div className="mb-1 text-[15px] font-semibold text-white">
              提出後について
            </div>
            <p>・ブラケットは提出後に変更できません</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#163a5f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4c78]"
        >
          ルールを確認しました
        </button>
      </div>
    </div>
  );
}