"use client";

import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { getPlayoffBracketStrings } from "@/lib/i18n/playoffBracket";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function PlayoffBracketRulesModal({
  open,
  onClose,
}: Props) {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const t = getPlayoffBracketStrings(language);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-200 overflow-y-auto overscroll-contain">
      <div className="relative flex min-h-full w-full items-center justify-center px-4 py-8">
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute inset-0 min-h-full bg-black/72 backdrop-blur-[3px]"
        />

        <div className="relative z-10 my-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1015] p-5 text-white shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
        <div className="text-[20px] font-semibold tracking-[0.02em] text-white">
          {t.rulesTitle}
        </div>

        <div className="mt-4 space-y-4 text-[14px] leading-relaxed text-white/82">
          <div>
            <div className="mb-1 text-[15px] font-semibold text-white">
              {t.scoringHeading}
            </div>
            <div className="space-y-1">
              <p>{t.scoringR1}</p>
              <p>{t.scoringR2}</p>
              <p>{t.scoringCF}</p>
              <p>{t.scoringFinals}</p>
              <p>{t.scoringGamesBonus}</p>
            </div>
          </div>

          <div>
            <div className="mb-1 text-[15px] font-semibold text-white">
              {t.importantHeading}
            </div>
            <div className="space-y-1">
              <p>{t.importantGamesBonus}</p>
              <p>{t.importantWrongWinner}</p>
              <p>{t.importantInvalidAdvance}</p>
            </div>
          </div>

          <div>
            <div className="mb-1 text-[15px] font-semibold text-white">
              {t.totalHeading}
            </div>
            <p>{t.totalMax}</p>
          </div>

          <div>
            <div className="mb-1 text-[15px] font-semibold text-white">
              {t.afterSubmitHeading}
            </div>
            <p>{t.afterSubmitNoEdit}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-xl bg-[#163a5f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4c78]"
        >
          {t.rulesConfirmButton}
        </button>
        </div>
      </div>
    </div>
  );
}
