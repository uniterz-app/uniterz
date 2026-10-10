"use client";

/** 締切前「みんなの予想」解放のお知らせ（起動時 1 回） */
import { createPortal } from "react-dom";
import cn from "clsx";
import { jp, nameOxanium } from "@/lib/fonts";
import UniterzLogo from "@/app/component/units/UniterzLogo";
import {
  seasonPredictCrowdLaunchCopy,
  type SeasonPredictCrowdLaunchVariant,
} from "@/lib/predict/seasonPredictCrowdLaunch";

type Props = {
  variant: SeasonPredictCrowdLaunchVariant | null;
  language?: string | null;
  onPrimary: () => void;
  onClose: () => void;
};

export default function SeasonPredictCrowdLaunchCard({
  variant,
  language,
  onPrimary,
  onClose,
}: Props) {
  if (!variant || typeof document === "undefined") return null;
  const copy = seasonPredictCrowdLaunchCopy(language, variant);

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center px-7"
      role="dialog"
      aria-modal="true"
      aria-label={copy.title}
    >
      <button
        type="button"
        aria-label={copy.later}
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
      />
      <div
        className={cn(
          jp.className,
          "relative w-full max-w-[320px] border border-[rgba(0,245,255,0.35)] bg-[#07090d] px-[22px] pb-3.5 pt-[22px] text-center"
        )}
      >
        <p
          className={cn(
            nameOxanium.className,
            "text-[11px] font-extrabold tracking-[0.16em] text-[#ffe9a8]"
          )}
        >
          {copy.eyebrow}
        </p>
        <div className="mx-auto mt-2.5 w-[92px]">
          <UniterzLogo width={92} title="UNITERZ" />
        </div>
        <p className="mt-3 text-[17px] font-extrabold leading-6 text-white/95">
          {copy.title}
        </p>
        <p className="mt-2.5 text-[13px] font-semibold leading-5 text-[rgba(226,246,255,0.75)]">
          {copy.body}
        </p>
        <button
          type="button"
          onClick={onPrimary}
          className="mt-5 min-h-[44px] w-full bg-[#00F5FF] px-5 text-[14px] font-extrabold text-[#041018]"
        >
          {copy.primary}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-1.5 w-full py-2.5 text-[13px] font-semibold text-white/50"
        >
          {copy.later}
        </button>
      </div>
    </div>,
    document.body
  );
}
