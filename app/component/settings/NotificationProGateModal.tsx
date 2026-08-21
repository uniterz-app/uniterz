"use client";

import { notificationProGateCopy } from "@/lib/notifications/notificationProGateCopy";
import { ProCyberBadge } from "@/app/component/common/ProCyberBadge";
import { nameOxanium } from "@/lib/fonts";

type Props = {
  open: boolean;
  language: "ja" | "en";
  onClose: () => void;
  onSeePro: () => void;
};

export default function NotificationProGateModal({
  open,
  language,
  onClose,
  onSeePro,
}: Props) {
  const copy = notificationProGateCopy(language);
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[rgba(5,2,8,0.78)] p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="relative max-h-[88vh] w-full max-w-[400px] overflow-y-auto border border-[rgba(251,191,36,0.4)] bg-[#140e06] px-[18px] py-4 shadow-[0_0_24px_rgba(251,191,36,0.18)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="notif-pro-gate-title"
      >
        <div className="pointer-events-none absolute left-2 top-2 h-3 w-3 border-l border-t border-[rgba(252,211,77,0.7)]" />
        <div className="pointer-events-none absolute right-2 top-2 h-3 w-3 border-r border-t border-[rgba(252,211,77,0.7)]" />
        <div className="pointer-events-none absolute bottom-2 left-2 h-3 w-3 border-b border-l border-[rgba(252,211,77,0.7)]" />
        <div className="pointer-events-none absolute bottom-2 right-2 h-3 w-3 border-b border-r border-[rgba(252,211,77,0.7)]" />

        <div className="flex items-center justify-between">
          <p
            className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.2em] text-[rgba(253,230,138,0.88)]`}
          >
            {copy.eyebrow}
          </p>
          <button
            type="button"
            onClick={onClose}
            className="grid h-7 w-7 place-items-center text-[rgba(254,243,199,0.85)]"
            aria-label={copy.dismiss}
          >
            ×
          </button>
        </div>

        <div className="my-3 flex justify-center scale-[1.35]">
          <ProCyberBadge ariaLabel="PRO" premium />
        </div>

        <h2
          id="notif-pro-gate-title"
          className="text-center text-[17px] font-bold leading-6 text-white"
        >
          {copy.title}
        </h2>
        <p className="mt-2 text-center text-[13px] leading-5 text-white/70">
          {copy.body}
        </p>

        <div className="mt-3 flex items-center justify-between gap-3 border border-[rgba(251,191,36,0.35)] bg-[rgba(245,158,11,0.08)] px-3 py-2.5">
          <div>
            <p
              className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.12em] text-[rgba(253,230,138,0.8)]`}
            >
              {copy.priceLabel}
            </p>
            <p className={`${nameOxanium.className} text-[22px] font-extrabold text-[#fde68a]`}>
              {copy.price}
              <span className="ml-1 text-[12px] font-semibold text-[rgba(254,243,199,0.72)]">
                {copy.period}
              </span>
            </p>
          </div>
          <span className="border border-[rgba(251,191,36,0.45)] px-2 py-1 text-[10px] font-bold text-[rgba(253,230,138,0.95)]">
            {copy.trial}
          </span>
        </div>

        <ul className="mt-3 space-y-2 border border-[rgba(251,146,60,0.45)] bg-[rgba(249,115,22,0.07)] px-3 py-2.5">
          {copy.bullets.map((item) => (
            <li key={item.title} className="flex gap-2.5">
              <span className="mt-[5px] h-1.5 w-1.5 shrink-0 bg-[#fdba74]" />
              <div>
                <p
                  className={`${nameOxanium.className} text-[11px] font-extrabold tracking-wide text-[#ffedd5]`}
                >
                  {item.title}
                </p>
                <p className="mt-0.5 text-[11px] leading-[15px] text-white/70">
                  {item.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onSeePro}
          className={`${nameOxanium.className} mt-3 min-h-10 w-full border border-white/35 bg-[#00F5FF] px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.14em] text-[#050508]`}
        >
          {copy.cta}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full text-center text-[12px] font-semibold text-white/55 underline"
        >
          {copy.dismiss}
        </button>
      </div>
    </div>
  );
}
