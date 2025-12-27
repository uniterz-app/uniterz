"use client";

export default function BadgeDetailModal({
  badge,
  onClose,
}: {
  badge: any;
  onClose: () => void;
}) {
  const awardedAt =
    badge.awardedAt?.toMillis
      ? badge.awardedAt.toMillis()
      : typeof badge.awardedAt === "number"
      ? badge.awardedAt
      : null;

  return (
    <div
      className="
        fixed inset-0 z-[9999] flex items-center justify-center
        bg-black/60 backdrop-blur-sm
      "
      onClick={onClose}
    >
      {/* === カラーブロブ（背面演出） === */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* 黄金ブロブ（右上） */}
        <div
          className="
            absolute top-[-120px] right-[-60px]
            w-[280px] h-[280px]
            bg-[#FFD451]
            opacity-[0.18]
            rounded-full blur-[90px]
            mix-blend-screen
          "
        />

        {/* 赤ワインブロブ（左下） */}
        <div
          className="
            absolute bottom-[-100px] left-[-80px]
            w-[260px] h-[260px]
            bg-[#D12A4C]
            opacity-[0.16]
            rounded-full blur-[100px]
            mix-blend-screen
          "
        />

        {/* 白系の補助ブロブ（中央やや上） */}
        <div
          className="
            absolute top-[20%] left-[50%] -translate-x-1/2
            w-[200px] h-[200px]
            bg-white
            opacity-[0.1]
            rounded-full blur-[120px]
            mix-blend-screen
          "
        />
      </div>

      {/* ====== PANEL ====== */}
      <div
        className="
          relative
          bg-[#0d1620]/95 rounded-3xl px-8 pt-4 pb-12
          w-[85%] max-w-sm text-white
          border border-white/10 shadow-2xl
        "
        onClick={(e) => e.stopPropagation()}
      >
        {/* === バッジ画像 === */}
        <div className="flex justify-center leading-none">
          <img
            src={badge.icon}
            alt={badge.id}
            className="w-36 h-36 object-contain mb-0 leading-none"
          />
        </div>

        {/* === タイトル === */}
        <h2
          className="
            text-[18px] font-bold text-center tracking-wide
            mt-0 mb-0 leading-none
          "
        >
          {badge.title ?? badge.id}
        </h2>

        {/* === 説明文 === */}
        {badge.description && (
          <p className="text-white/70 text-center text-[14px] mt-1 mb-1 leading-snug">
            {badge.description}
          </p>
        )}

        {/* === 付与日 === */}
        {awardedAt && (
          <p className="text-[11px] text-white/40 text-center mt-1 leading-none">
            付与日：{new Date(awardedAt).toLocaleDateString("ja-JP")}
          </p>
        )}

        {/* === CLOSE ボタン === */}
        <button
          onClick={onClose}
          className="
            absolute left-1/2 -bottom-7 -translate-x-1/2
            w-14 h-14 rounded-full
            bg-white/10 border border-white/20
            flex items-center justify-center
            backdrop-blur-sm
            hover:bg-white/20 transition
          "
        >
          <span className="text-2xl leading-none">×</span>
        </button>
      </div>
    </div>
  );
}
