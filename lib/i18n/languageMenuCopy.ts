/** サイドメニュー「言語」行と言語選択シート */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function languageMenuCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    label: L(lang, {
      ja: "言語",
      en: "Language",
      ko: "언어",
      zh: "语言",
      es: "Idioma",
      de: "Sprache",
      fr: "Langue",
      ar: "اللغة",
      pt: "Idioma",
    }),
    close: L(lang, {
      ja: "閉じる",
      en: "Close",
      ko: "닫기",
      zh: "关闭",
      es: "Cerrar",
      de: "Schließen",
      fr: "Fermer",
      ar: "إغلاق",
      pt: "Fechar",
    }),
    saveFailed: L(lang, {
      ja: "言語を変更できませんでした。通信状況を確認して、もう一度お試しください。",
      en: "Couldn't change the language. Check your connection and try again.",
      ko: "언어를 변경하지 못했습니다. 연결을 확인하고 다시 시도하세요.",
      zh: "无法更改语言。请检查网络后重试。",
      es: "No se pudo cambiar el idioma. Revisa tu conexión e inténtalo de nuevo.",
      de: "Sprache konnte nicht geändert werden. Prüfe die Verbindung und versuche es erneut.",
      fr: "Impossible de changer la langue. Vérifie ta connexion et réessaie.",
      ar: "تعذّر تغيير اللغة. تحقق من الاتصال وحاول مرة أخرى.",
      pt: "Não foi possível alterar o idioma. Verifique a conexão e tente novamente.",
    }),
  };
}
