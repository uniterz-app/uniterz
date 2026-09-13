/**
 * Report ゲート見た目プレビュー画面 — 7言語
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import type { ReportGatePreviewMode } from "@/lib/reports/reportGateTypes";

export function reportGatePreviewCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  const modeLabel = (key: ReportGatePreviewMode): string => {
    switch (key) {
      case "live":
        return L(lang, {
          ja: "ライブ（ゲートなし）",
          en: "Live (no gate)",
          ko: "라이브(게이트 없음)",
          zh: "实时（无门控）",
          es: "Live (sin gate)",
          pt: "Live (sem gate)",
          fr: "Live (sans gate)",
        });
      case "free":
        return L(lang, {
          ja: "Free ロック",
          en: "Free lock",
          ko: "Free 잠금",
          zh: "Free 锁定",
          es: "Bloqueo Free",
          pt: "Bloqueio Free",
          fr: "Verrou Free",
        });
      case "waitingMonday":
        return L(lang, {
          ja: "月曜待ち",
          en: "Waiting Monday",
          ko: "월요일 대기",
          zh: "等待周一",
          es: "Espera lunes",
          pt: "Aguardando segunda",
          fr: "Attente lundi",
        });
      case "waitingMonth":
        return L(lang, {
          ja: "月初待ち",
          en: "Waiting month",
          ko: "월초 대기",
          zh: "等待月初",
          es: "Espera mes",
          pt: "Aguardando mês",
          fr: "Attente mois",
        });
      case "insufficientPicks":
        return L(lang, {
          ja: "予想不足",
          en: "Not enough picks",
          ko: "예상 부족",
          zh: "预测不足",
          es: "Picks insuficientes",
          pt: "Picks insuficientes",
          fr: "Pas assez de picks",
        });
      case "monthlyLocked":
        return L(lang, {
          ja: "月次ロック",
          en: "Monthly lock",
          ko: "월간 잠금",
          zh: "月报锁定",
          es: "Bloqueo mensual",
          pt: "Bloqueio mensal",
          fr: "Verrou mensuel",
        });
    }
  };

  return {
    lang,
    subtitle: L(lang, {
      ja: "ブラー＋説明＋CTA／空状態の見た目確認。Pro でも切替で全パターンを見られます。",
      en: "Blur + copy + CTA / empty states. Force any gate even on Pro.",
      ko: "블러+설명+CTA/빈 상태 확인. Pro에서도 전환으로 전 패턴을 볼 수 있습니다.",
      zh: "模糊+说明+CTA/空状态预览。Pro 也可切换查看全部形态。",
      es: "Blur + copy + CTA / vacíos. Fuerza cualquier gate aunque seas Pro.",
      pt: "Blur + copy + CTA / vazios. Force qualquer gate mesmo no Pro.",
      fr: "Flou + copy + CTA / états vides. Forcez tout gate même en Pro.",
    }),
    liveHint: L(lang, {
      ja: "ゲートなし。実レポートがそのまま見えます（ここでは週次モック）。",
      en: "No gate. Full report as Pro would see it (weekly mock here).",
      ko: "게이트 없음. 실제 리포트가 그대로 보입니다(여기선 주간 목).",
      zh: "无门控。与 Pro 所见相同（此处为周报 mock）。",
      es: "Sin gate. Informe completo como en Pro (mock semanal aquí).",
      pt: "Sem gate. Relatório completo como no Pro (mock semanal aqui).",
      fr: "Sans gate. Rapport complet comme en Pro (mock hebdo ici).",
    }),
    modeLabel,
  };
}
