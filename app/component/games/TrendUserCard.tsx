"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Flame } from "lucide-react";
import FollowButton from "@/app/component/common/FollowButton";
import { formatCompactNumber } from "@/lib/trend";

const jpGothic =
  '"Hiragino Kaku Gothic Std","ヒラギノ角ゴ Std","Hiragino Kaku Gothic ProN","ヒラギノ角ゴ ProN",system-ui,sans-serif';
const jpGothicProN =
  '"Hiragino Kaku Gothic ProN","ヒラギノ角ゴ ProN",system-ui,sans-serif';

export type TrendUserCardProps = {
  href: string;
  uid: string;
  photoURL?: string;
  displayName: string;
  followers?: number;
  hot?: boolean;
  hotText?: string;
  className?: string;
  showStats?: boolean;
  winRate?: number;
  units?: number;
  streak?: number;
  primaryLeague?: "B1" | "J1" | string;
};

export default function TrendUserCard(props: TrendUserCardProps) {
  const {
    href,
    uid,
    photoURL,
    displayName,
    followers = 0,
    hot = true,
    hotText = "HOT",
    className = "",
    showStats = false,
    winRate,
    units,
    streak,
    primaryLeague,
  } = props;

  const router = useRouter();
  const goProfile = () => router.push(href);
  const onKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      goProfile();
    }
  };

  // 🔹 アバター：赤→オレンジ→白のグラデーションリング付き
  const avatar = (size: "sm" | "md") => {
    const px = size === "sm" ? 50 : 80; // 少し小さめ
    const showOn = size === "sm" ? "md:hidden" : "hidden md:block";

    return (
      <div className={showOn} style={{ width: px, height: px }}>
        {/* グラデーションリング */}
        <div
          className="
            w-full h-full rounded-full p-[2px] md:p-[2.5px]
            bg-gradient-to-tr from-red-500 via-orange-400 to-white
            shadow-[0_8px_24px_rgba(0,0,0,0.35)]
          "
        >
          {/* 中身（実際のアイコン） */}
          <div className="w-full h-full rounded-full overflow-hidden bg-black/40">
            {photoURL ? (
              <img
                src={photoURL}
                alt={displayName}
                width={px}
                height={px}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="block w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-[10px] text-white/70 bg-white/10">
                No Image
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goProfile}
      onKeyDown={onKey}
      className={[
        "relative overflow-hidden rounded-2xl",
        "min-h-[190px] md:min-h-[300px]",
        "w-[95%] md:w-[85%] mx-auto", // カード幅はちょい細め
        "bg-white/8 backdrop-blur-xl",
        "border border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.30)]",
        "transition-all duration-200 hover:border-white/35 focus:outline-none focus:ring-2 focus:ring-white/40",
        className,
      ].join(" ")}
      style={{ fontFamily: jpGothic }}
    >
      {/* 背景ブロブ（＋下の方に少し赤い光を追加） */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 -left-20 w-44 h-44 md:w-56 md:h-56 rounded-full bg-fuchsia-500/35 blur-3xl" />
        <div className="absolute -top-12 right-[-60px] w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-orange-500/40 to-pink-500/30 blur-3xl" />
        <div className="absolute -bottom-16 -left-10 w-52 h-52 md:w-64 md:h-64 rounded-full bg-gradient-to-tr from-cyan-500/35 to-emerald-400/25 blur-3xl" />
        <div className="hidden md:block absolute -bottom-10 -right-8 w-56 h-56 rounded-full bg-gradient-to-tl from-yellow-400/35 via-amber-400/25 to-orange-300/20 blur-3xl" />

        {/* 下側に赤いグロー */}
        <div
          className="
            absolute -bottom-12 left-1/2 -translate-x-1/2
            w-64 h-28 md:w-80 md:h-32
            rounded-full bg-red-500/45 blur-3xl
          "
        />

        <div className="absolute inset-0 bg-gradient-to-b from-white/15 md:from-white/20 via-transparent to-transparent" />
      </div>

     {/* HOTバッジ */}
{hot && (
  <div className="absolute left-2.5 top-2.5 md:left-3 md:top-3 z-10">
    <span
      className="
        inline-flex items-center gap-1
        px-2 py-[1px] md:px-2.5 md:py-[2px]
        rounded-full text-[9px] md:text-[11px]
        font-semibold text-white
        bg-gradient-to-r from-rose-500 to-orange-400
        shadow-[0_2px_10px_rgba(255,100,80,0.35)]
        ring-1 ring-white/30
      "
    >
      <Flame className="w-3 h-3 md:w-3.5 md:h-3.5" />
      
      {/* ← HOT テキストだけ下げる */}
      <span className="translate-y-[1px] md:translate-y-0 inline-block">
        {hotText}
      </span>
    </span>
  </div>
)}


      <div className="relative z-10 flex flex-col items-center text-center gap-2.5 md:gap-4 px-4 md:px-6 pb-4 md:pb-6 pt-9 md:pt-10 text-white">
        {/* アバター */}
        <Link
          href={href}
          onClick={(e) => e.stopPropagation()}
          className="block"
          aria-label={`${displayName}のプロフィールへ`}
        >
          {avatar("sm")}
          {avatar("md")}
        </Link>

        {/* ユーザー名（高さ固定） */}
<div className="min-w-0 w-full">
  <Link
    href={href}
    onClick={(e) => e.stopPropagation()}
    className="block"
  >
    <div
      className={`
        flex items-center justify-center
        text-center
        font-semibold
        text-[13px] md:text-xl
        leading-tight
        drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]
        /* 🔽 名前枠の高さを統一（1〜2行分くらい） */
        min-h-[32px] md:min-h-[44px]
      `}
    >
      <span className="line-clamp-2 break-words">
        {displayName}
      </span>
    </div>
  </Link>
</div>


        {primaryLeague && (
          <div className="hidden md:inline-block text-[11px] px-2 py-0.5 rounded-full bg-white/12 ring-1 ring-white/20">
            {primaryLeague} specialist
          </div>
        )}
        {/* ▼ 連勝表示（5連勝以上のみ表示） */}
{typeof streak === "number" && streak >= 5 && (
  <div
    className="
      flex items-center justify-center
      text-[12px] md:text-sm
      font-semibold
      px-3 py-1
      rounded-full
      bg-white/10
      ring-1 ring-white/20
      text-amber-300
    "
  >
    <Flame className="w-4 h-4 text-yellow-400 mr-1" />
    {streak} 連勝中
  </div>
)}

        {/* フォローボタン（ややコンパクト） */}
<div className="mt-auto w-full flex items-end justify-center">
  {/* モバイル用 */}
  <div
    className="
      md:hidden
      w-full max-w-[200px]
      min-h-[36px]       /* 🔹 ボタン1個ぶんの高さを常に確保 */
      flex items-center justify-center
    "
  >
    <FollowButton targetUid={uid} size="sm" variant="blue" />
  </div>

  {/* PC用 */}
  <div
    className="
      hidden md:flex
      w-full max-w-[230px]
      min-h-[40px]       /* 🔹 PC用ボタン高さを常に確保 */
      items-center justify-center
    "
  >
    <FollowButton targetUid={uid} size="md" variant="blue" />
  </div>
</div>
      </div>
    </div>
  );
}
