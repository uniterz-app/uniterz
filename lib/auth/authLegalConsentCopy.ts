/**
 * GET STARTED 直後の同意ゲート UI コピー（7言語）。
 * 規約・プライバシー本文は ja/en のまま（このファイルの対象外）。
 */
import { L, type LocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";
import { resolveAppUiLocalizedLang } from "@/lib/i18n/resolveAppUiLanguage";

export type AuthLegalConsentCopy = {
  title: string;
  message: string;
  termsAgree: string;
  privacyAgree: string;
  openLink: string;
  openTermsA11y: string;
  openPrivacyA11y: string;
  back: string;
  continue: string;
  closeA11y: string;
  backToConsentA11y: string;
  termsTitle: string;
  privacyTitle: string;
  lastUpdated: string;
};

const COPY: Record<keyof AuthLegalConsentCopy, UiStrings> = {
  title: {
    ja: "利用規約とプライバシーポリシーに同意しますか？",
    en: "Agree to the Terms of Use and Privacy Policy?",
    ko: "이용약관 및 개인정보처리방침에 동의하시겠습니까?",
    zh: "是否同意使用条款和隐私政策？",
    es: "¿Aceptas los Términos de uso y la Política de privacidad?",
    pt: "Concordar com os Termos de Uso e a Política de Privacidade?",
    fr: "Accepter les Conditions d'utilisation et la Politique de confidentialité ?",
  },
  message: {
    ja: "アカウントを作成する前に、内容をご確認ください。両方に同意すると登録画面へ進みます。",
    en: "Please review both documents before creating an account. Agreeing to both continues to registration.",
    ko: "계정을 만들기 전에 두 문서를 확인해 주세요. 모두 동의하면 가입 화면으로 이동합니다.",
    zh: "创建账户前请先阅读这两份文件。同意后即可继续注册。",
    es: "Revisa ambos documentos antes de crear una cuenta. Si aceptas ambos, continuarás al registro.",
    pt: "Revise os dois documentos antes de criar uma conta. Concordar com ambos segue para o cadastro.",
    fr: "Veuillez lire les deux documents avant de créer un compte. Les accepter vous mène à l'inscription.",
  },
  termsAgree: {
    ja: "利用規約に同意する",
    en: "I agree to the Terms of Use",
    ko: "이용약관에 동의합니다",
    zh: "我同意使用条款",
    es: "Acepto los Términos de uso",
    pt: "Concordo com os Termos de Uso",
    fr: "J'accepte les Conditions d'utilisation",
  },
  privacyAgree: {
    ja: "プライバシーポリシーに同意する",
    en: "I agree to the Privacy Policy",
    ko: "개인정보처리방침에 동의합니다",
    zh: "我同意隐私政策",
    es: "Acepto la Política de privacidad",
    pt: "Concordo com a Política de Privacidade",
    fr: "J'accepte la Politique de confidentialité",
  },
  openLink: {
    ja: "内容を見る",
    en: "View",
    ko: "보기",
    zh: "查看",
    es: "Ver",
    pt: "Ver",
    fr: "Voir",
  },
  openTermsA11y: {
    ja: "利用規約を開く",
    en: "Open Terms of Use",
    ko: "이용약관 열기",
    zh: "打开使用条款",
    es: "Abrir Términos de uso",
    pt: "Abrir Termos de Uso",
    fr: "Ouvrir les Conditions d'utilisation",
  },
  openPrivacyA11y: {
    ja: "プライバシーポリシーを開く",
    en: "Open Privacy Policy",
    ko: "개인정보처리방침 열기",
    zh: "打开隐私政策",
    es: "Abrir Política de privacidad",
    pt: "Abrir Política de Privacidade",
    fr: "Ouvrir la Politique de confidentialité",
  },
  back: {
    ja: "戻る",
    en: "Back",
    ko: "뒤로",
    zh: "返回",
    es: "Atrás",
    pt: "Voltar",
    fr: "Retour",
  },
  continue: {
    ja: "同意して続ける",
    en: "Agree & continue",
    ko: "동의하고 계속",
    zh: "同意并继续",
    es: "Aceptar y continuar",
    pt: "Concordar e continuar",
    fr: "Accepter et continuer",
  },
  closeA11y: {
    ja: "閉じる",
    en: "Close",
    ko: "닫기",
    zh: "关闭",
    es: "Cerrar",
    pt: "Fechar",
    fr: "Fermer",
  },
  backToConsentA11y: {
    ja: "同意画面に戻る",
    en: "Back to consent",
    ko: "동의 화면으로 돌아가기",
    zh: "返回同意画面",
    es: "Volver al consentimiento",
    pt: "Voltar ao consentimento",
    fr: "Retour au consentement",
  },
  termsTitle: {
    ja: "利用規約",
    en: "Terms of Use",
    ko: "이용약관",
    zh: "使用条款",
    es: "Términos de uso",
    pt: "Termos de Uso",
    fr: "Conditions d'utilisation",
  },
  privacyTitle: {
    ja: "プライバシーポリシー",
    en: "Privacy Policy",
    ko: "개인정보처리방침",
    zh: "隐私政策",
    es: "Política de privacidad",
    pt: "Política de Privacidade",
    fr: "Politique de confidentialité",
  },
  lastUpdated: {
    ja: "最終更新: ",
    en: "Last updated: ",
    ko: "최종 업데이트: ",
    zh: "最后更新: ",
    es: "Última actualización: ",
    pt: "Última atualização: ",
    fr: "Dernière mise à jour : ",
  },
};

export function authLegalConsentCopy(
  lang: LocalizedLang = resolveAppUiLocalizedLang()
): AuthLegalConsentCopy {
  return {
    title: L(lang, COPY.title),
    message: L(lang, COPY.message),
    termsAgree: L(lang, COPY.termsAgree),
    privacyAgree: L(lang, COPY.privacyAgree),
    openLink: L(lang, COPY.openLink),
    openTermsA11y: L(lang, COPY.openTermsA11y),
    openPrivacyA11y: L(lang, COPY.openPrivacyA11y),
    back: L(lang, COPY.back),
    continue: L(lang, COPY.continue),
    closeA11y: L(lang, COPY.closeA11y),
    backToConsentA11y: L(lang, COPY.backToConsentA11y),
    termsTitle: L(lang, COPY.termsTitle),
    privacyTitle: L(lang, COPY.privacyTitle),
    lastUpdated: L(lang, COPY.lastUpdated),
  };
}

/** 規約本文用（正本は ja / en のみ） */
export function legalBodyLang(lang: LocalizedLang): "ja" | "en" {
  return lang === "ja" ? "ja" : "en";
}
