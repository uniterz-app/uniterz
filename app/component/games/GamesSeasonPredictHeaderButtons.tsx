"use client";

/**
 * アワード / 順位予想 — ヘッダー左のコンパクト導線（STATS 右端ハンドルと分離）
 */
import { nameOxanium } from "@/lib/fonts";
import { gamesHeaderControlHeightClass } from "@/lib/ui/gamesHeaderBar";
import { CYBER_CHAMFER_ACCENT } from "@/lib/ui/cyberChamferAccent";

type Props = {
  isMobile: boolean;
  awardsLabel: string;
  standingsLabel: string;
  onAwards: () => void;
  onStandings: () => void;
  /** 未提出（締切前）なら右上に黄色マーク */
  awardsPending?: boolean;
  standingsPending?: boolean;
};

export default function GamesSeasonPredictHeaderButtons({
  isMobile,
  awardsLabel,
  standingsLabel,
  onAwards,
  onStandings,
  awardsPending = false,
  standingsPending = false,
}: Props) {
  const h = gamesHeaderControlHeightClass(isMobile);
  return (
    <div className="flex items-center gap-1.5">
      <HeaderIconButton
        src="/games-drawer/awards.png"
        label={awardsLabel}
        onClick={onAwards}
        heightClass={h}
        pending={awardsPending}
      />
      <HeaderIconButton
        src="/games-drawer/standings.png"
        label={standingsLabel}
        onClick={onStandings}
        heightClass={h}
        pending={standingsPending}
      />
    </div>
  );
}

function HeaderIconButton({
  src,
  label,
  onClick,
  heightClass,
  pending,
}: {
  src: string;
  label: string;
  onClick: () => void;
  heightClass: string;
  pending: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={[
        nameOxanium.className,
        "relative z-[1] flex aspect-square items-center justify-center overflow-hidden rounded-[5px] border border-yellow-400/40 bg-[rgba(8,11,18,0.92)] shadow-[0_0_10px_rgba(250,204,21,0.14)] transition hover:border-yellow-300/60 active:opacity-85 touch-manipulation cursor-pointer",
        heightClass,
      ].join(" ")}
    >
      <span
        aria-hidden
        className="block h-[22px] w-[22px]"
        style={{
          backgroundColor: CYBER_CHAMFER_ACCENT,
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
      {pending ? (
        <span
          aria-hidden
          className="pointer-events-none absolute right-[3px] top-[3px] h-[8px] w-[8px] animate-pulse rounded-full border border-[#050508] bg-[#FACC15] shadow-[0_0_6px_rgba(250,204,21,0.9)]"
        />
      ) : null}
    </button>
  );
}
