"use client";

import dynamic from "next/dynamic";
import { createPortal } from "react-dom";
import { nameOxanium } from "@/lib/fonts";
import type { ActiveReportOverlay } from "@/lib/reports/useProReportDeliveryOverlay";
import { formatReportPeriodLabel } from "@/lib/reports/reportDelivery";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

const WeeklyReportView = dynamic(
  () => import("@/app/component/reports/WeeklyReportView"),
  { ssr: false }
);
const MonthlyReportView = dynamic(
  () => import("@/app/component/reports/MonthlyReportView"),
  { ssr: false }
);

type Props = {
  active: ActiveReportOverlay;
  language: string;
  onDismiss: () => void;
};

/** Pro プロフィール起動時のレポート配信オーバーレイ */
export default function ProfileReportDeliveryOverlay({
  active,
  language,
  onDismiss,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const kind = active.candidate.kind;
  const title = kind === "weekly" ? "WEEKLY REPORT" : "MONTHLY REPORT";
  const period = formatReportPeriodLabel(
    kind,
    active.candidate.periodKey,
    lang
  );

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/72 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-cyan-300/25 bg-[#070b14] shadow-[0_0_40px_rgba(34,211,238,0.18)] sm:rounded-2xl">
        <header className="flex items-start justify-between gap-3 border-b border-white/8 px-4 py-3">
          <div className="min-w-0">
            <p
              className={[
                nameOxanium.className,
                "text-[11px] font-extrabold uppercase tracking-[0.16em] text-cyan-200",
              ].join(" ")}
            >
              {title}
            </p>
            <p className="mt-0.5 text-[12px] text-white/55">{period}</p>
            {active.preview ? (
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-amber-200/80">
                Preview
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10"
          >
            {L(lang, {
              ja: "閉じる",
              en: "Close",
              ko: "닫기",
              zh: "关闭",
              es: "Cerrar",
              pt: "Fechar",
              fr: "Fermer",
            })}
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
          {kind === "weekly" && active.weekly ? (
            <WeeklyReportView report={active.weekly} language={lang} />
          ) : null}
          {kind === "monthly" && active.monthly ? (
            <MonthlyReportView report={active.monthly} language={lang} />
          ) : null}
        </div>

        <footer className="border-t border-white/8 px-4 py-3">
          <p className="text-center text-[11px] leading-relaxed text-white/45">
            {L(lang, {
              ja: "Report タブに保存されました。いつでも見返せます。",
              en: "Saved to the Report tab. You can revisit anytime.",
              ko: "Report 탭에 저장되었습니다. 언제든 다시 볼 수 있습니다.",
              zh: "已保存到 Report 标签，可随时回看。",
              es: "Guardado en la pestaña Report. Puedes volver cuando quieras.",
              pt: "Salvo na aba Report. Você pode revisar quando quiser.",
              fr: "Enregistré dans l’onglet Report. Revenez quand vous voulez.",
            })}
          </p>
          <button
            type="button"
            onClick={onDismiss}
            className="mt-2 flex min-h-11 w-full items-center justify-center rounded-xl border border-cyan-300/40 bg-cyan-400/12 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-400/18"
          >
            {L(lang, {
              ja: "OK",
              en: "Got it",
              ko: "확인",
              zh: "知道了",
              es: "Entendido",
              pt: "Entendi",
              fr: "Compris",
            })}
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
