/**
 * Pro Skin 画面 chrome（7言語）。カタログ条件文は ja|en API のまま。
 */
import { L, resolveLocalizedLang } from "../../../../../lib/i18n/localize";

export function proSkinScreenCopy(
  language: string | null | undefined,
  viewerIsPro: boolean
) {
  const lang = resolveLocalizedLang(language);
  const catalogLang = lang === "ja" ? ("ja" as const) : ("en" as const);
  return {
    lang,
    catalogLang,
    subtitle: viewerIsPro
      ? L(lang, {
          ja: "上段は Pro ですぐ使えるスキン。下段はマイルストーン達成で解放されます。",
          en: "Top skins unlock with Pro. Milestone skins unlock as you progress.",
          ko: "상단은 Pro로 바로 사용. 하단은 마일스톤 달성 시 해제됩니다.",
          zh: "上方皮肤 Pro 即可用。下方需达成里程碑解锁。",
          es: "Las de arriba se desbloquean con Pro. Las de hitos, al progresar.",
          pt: "As de cima liberam com Pro. As de marco, conforme avança.",
          fr: "Haut : débloqué avec Pro. Bas : milestones.",
        })
      : L(lang, {
          ja: "プレビューは無料で見られます。適用するには Pro プランが必要です。",
          en: "Preview is free. Upgrade to Pro to apply a skin.",
          ko: "미리보기는 무료입니다. 적용하려면 Pro가 필요합니다.",
          zh: "可免费预览。应用需 Pro 方案。",
          es: "La vista previa es gratis. Necesitas Pro para aplicar.",
          pt: "A prévia é grátis. Precisa de Pro para aplicar.",
          fr: "Aperçu gratuit. Pro requis pour appliquer.",
        }),
    closeA11y: L(lang, {
      ja: "閉じる",
      en: "Close",
      ko: "닫기",
      zh: "关闭",
      es: "Cerrar",
      pt: "Fechar",
      fr: "Fermer",
    }),
    cancel: L(lang, {
      ja: "キャンセル",
      en: "Cancel",
      ko: "취소",
      zh: "取消",
      es: "Cancelar",
      pt: "Cancelar",
      fr: "Annuler",
    }),
    close: L(lang, {
      ja: "閉じる",
      en: "Close",
      ko: "닫기",
      zh: "关闭",
      es: "Cerrar",
      pt: "Fechar",
      fr: "Fermer",
    }),
    lockedPreviewOnly: L(lang, {
      ja: "プレビューのみ · 適用には Pro が必要です",
      en: "Preview only · Pro required to apply",
      ko: "미리보기만 · 적용에는 Pro 필요",
      zh: "仅预览 · 应用需 Pro",
      es: "Solo vista previa · Pro para aplicar",
      pt: "Só prévia · Pro para aplicar",
      fr: "Aperçu seul · Pro requis",
    }),
    lockedStill: L(lang, {
      ja: "このスキンはまだ解放されていません",
      en: "This skin is still locked",
      ko: "이 스킨은 아직 잠겨 있습니다",
      zh: "此皮肤尚未解锁",
      es: "Esta skin sigue bloqueada",
      pt: "Esta skin ainda está bloqueada",
      fr: "Cette skin est encore verrouillée",
    }),
    saving: L(lang, {
      ja: "保存中…",
      en: "Saving…",
      ko: "저장 중…",
      zh: "保存中…",
      es: "Guardando…",
      pt: "Salvando…",
      fr: "Enregistrement…",
    }),
    locked: L(lang, {
      ja: "未解放",
      en: "Locked",
      ko: "잠김",
      zh: "未解锁",
      es: "Bloqueada",
      pt: "Bloqueada",
      fr: "Verrouillée",
    }),
    applySkin: L(lang, {
      ja: "このスキンを適用",
      en: "Apply skin",
      ko: "이 스킨 적용",
      zh: "应用此皮肤",
      es: "Aplicar skin",
      pt: "Aplicar skin",
      fr: "Appliquer la skin",
    }),
    applied: L(lang, {
      ja: "適用済み",
      en: "Applied",
      ko: "적용됨",
      zh: "已应用",
      es: "Aplicada",
      pt: "Aplicada",
      fr: "Appliquée",
    }),
    saveFailed: L(lang, {
      ja: "保存に失敗しました。",
      en: "Save failed.",
      ko: "저장에 실패했습니다.",
      zh: "保存失败。",
      es: "Error al guardar.",
      pt: "Falha ao salvar.",
      fr: "Échec de l’enregistrement.",
    }),
  };
}
