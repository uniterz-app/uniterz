/**
 * ログイン / 登録 / パスワード再設定の補助コピー（ja | en）。
 * CTA・見出しの英字ブランド表記はそのまま。
 */
import {
  resolveAppUiLanguage,
  type AppUiLanguage,
} from "@/lib/i18n/resolveAppUiLanguage";

export type { AppUiLanguage };

export type AuthFormCopy = {
  forgotLead: string;
  forgotLink: string;
  forgotCombined: string;
  alreadyLead: string;
  resetHint: string;
  resetLead: string;
  resetLeadNote: string;
  backToLoginLead: string;
  backToLoginLink: string;
  inviteHint: string;
  missingInputTitle: string;
  missingEmail: string;
  missingBoth: string;
  weakPassword: string;
  authErrorTitle: string;
  resetSentTitle: string;
  resetSentBody: string;
  backA11y: string;
};

const COPY: Record<AppUiLanguage, AuthFormCopy> = {
  ja: {
    forgotLead: "パスワードをお忘れの方は",
    forgotLink: "こちら",
    forgotCombined: "パスワードをお忘れの方はこちら",
    alreadyLead: "すでにアカウントをお持ちの方は",
    resetHint: "登録メールアドレスを入力してください。",
    resetLead: "登録したメールアドレスにリセット用のリンクをお送りします。",
    resetLeadNote: "＊迷惑フォルダもご確認ください。",
    backToLoginLead: "ログインに",
    backToLoginLink: "戻る",
    inviteHint: "友達からコードをもらった場合のみ入力",
    missingInputTitle: "入力エラー",
    missingEmail: "メールアドレスを入力してください。",
    missingBoth: "メールアドレスとパスワードを入力してください。",
    weakPassword: "パスワードは6文字以上にしてください。",
    authErrorTitle: "認証エラー",
    resetSentTitle: "リセットリンクを送信しました",
    resetSentBody:
      "このメールが登録されていれば、リセット用リンクを送りました。届かない場合は迷惑メールもご確認ください。",
    backA11y: "戻る",
  },
  en: {
    forgotLead: "Forgot your password? ",
    forgotLink: "Reset here",
    forgotCombined: "Forgot your password? Reset here",
    alreadyLead: "Already have an account?",
    resetHint: "Enter the email address you registered with.",
    resetLead: "We'll send a password reset link to your registered email.",
    resetLeadNote: "* Please also check your spam folder.",
    backToLoginLead: "Back to ",
    backToLoginLink: "Log in",
    inviteHint: "Enter only if a friend shared a code with you",
    missingInputTitle: "Missing input",
    missingEmail: "Please enter your email address.",
    missingBoth: "Please enter both email and password.",
    weakPassword: "Password must be at least 6 characters.",
    authErrorTitle: "Authentication error",
    resetSentTitle: "Reset link sent",
    resetSentBody:
      "If this email is registered, we sent a reset link. Check spam if you don't see it.",
    backA11y: "Back",
  },
};

export function authFormCopy(lang: AppUiLanguage = resolveAppUiLanguage()): AuthFormCopy {
  return COPY[lang === "ja" ? "ja" : "en"];
}
