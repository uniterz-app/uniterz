/**
 * ログアウト確認モーダル（7言語）
 */
import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";

export function logoutConfirmUiCopy(language: LocalizedLang | string) {
  const lang = resolveLocalizedLang(language);
  return {
    title: L(lang, {
      ja: "ログアウトしますか？",
      en: "Are you sure you want to log out?",
      ko: "로그아웃할까요?",
      zh: "确定要退出登录吗？",
      es: "¿Seguro que quieres cerrar sesión?",
      pt: "Tem certeza de que deseja sair?",
      fr: "Voulez-vous vraiment vous déconnecter ?",
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
    confirm: L(lang, {
      ja: "ログアウト",
      en: "Log out",
      ko: "로그아웃",
      zh: "退出登录",
      es: "Cerrar sesión",
      pt: "Sair",
      fr: "Se déconnecter",
    }),
  };
}
