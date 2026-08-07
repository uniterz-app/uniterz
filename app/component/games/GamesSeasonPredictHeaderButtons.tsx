"use client";

/**
 * アワード / 順位予想 — ヘッダー左のコンパクト導線（STATS 右端ハンドルと分離）
 */
import Image from "next/image";
import { nameOxanium } from "@/lib/fonts";
import { gamesHeaderControlHeightClass } from "@/lib/ui/gamesHeaderBar";

type Props = {
  isMobile: boolean;
  awardsLabel: string;
  standingsLabel: string;
  onAwards: () => void;
  onStandings: () => void;
};

export default function GamesSeasonPredictHeaderButtons({
  isMobile,
  awardsLabel,
  standingsLabel,
  onAwards,
  onStandings,
}: Props) {
  const h = gamesHeaderControlHeightClass(isMobile);
  return (
    <div className="flex items-center gap-1.5">
      <HeaderIconButton
        src="/games-drawer/awards.png"
        label={awardsLabel}
        onClick={onAwards}
        heightClass={h}
      />
      <HeaderIconButton
        src="/games-drawer/standings.png"
        label={standingsLabel}
        onClick={onStandings}
        heightClass={h}
      />
    </div>
  );
}

function HeaderIconButton({
  src,
  label,
  onClick,
  heightClass,
}: {
  src: string;
  label: string;
  onClick: () => void;
  heightClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        nameOxanium.className,
        "relative flex aspect-square items-center justify-center overflow-hidden rounded-[5px] border border-cyan-400/35 bg-[rgba(8,11,18,0.92)] shadow-[0_0_10px_rgba(34,211,238,0.12)] transition hover:border-cyan-300/55 active:opacity-85",
        heightClass,
      ].join(" ")}
    >
      <Image src={src} alt="" width={22} height={22} className="h-[22px] w-[22px] object-contain" />
    </button>
  );
}
