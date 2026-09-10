/**
 * ログイン / 登録 / パスワード再設定の補助コピー（7言語）。
 * CTA・見出しの英字ブランド表記はそのまま。
 */
import { L, type LocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";
import {
  resolveAppUiLocalizedLang,
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

const COPY: Record<keyof AuthFormCopy, UiStrings> = {
  forgotLead: {
    ja: "パスワードをお忘れの方は",
    en: "Forgot your password? ",
    ko: "비밀번호를 잊으셨나요? ",
    zh: "忘记密码了？",
    es: "¿Olvidaste tu contraseña? ",
    pt: "Esqueceu sua senha? ",
    fr: "Mot de passe oublié ? ",
  },
  forgotLink: {
    ja: "こちら",
    en: "Reset here",
    ko: "재설정하기",
    zh: "点此重置",
    es: "Restablecer aquí",
    pt: "Redefinir aqui",
    fr: "Réinitialiser ici",
  },
  forgotCombined: {
    ja: "パスワードをお忘れの方はこちら",
    en: "Forgot your password? Reset here",
    ko: "비밀번호를 잊으셨나요? 재설정하기",
    zh: "忘记密码了？点此重置",
    es: "¿Olvidaste tu contraseña? Restablecer aquí",
    pt: "Esqueceu sua senha? Redefinir aqui",
    fr: "Mot de passe oublié ? Réinitialiser ici",
  },
  alreadyLead: {
    ja: "すでにアカウントをお持ちの方は",
    en: "Already have an account?",
    ko: "이미 계정이 있으신가요?",
    zh: "已经有账号了？",
    es: "¿Ya tienes una cuenta?",
    pt: "Já tem uma conta?",
    fr: "Vous avez déjà un compte ?",
  },
  resetHint: {
    ja: "登録メールアドレスを入力してください。",
    en: "Enter the email address you registered with.",
    ko: "가입할 때 사용한 이메일 주소를 입력하세요.",
    zh: "请输入注册时使用的邮箱地址。",
    es: "Introduce el correo con el que te registraste.",
    pt: "Digite o e-mail usado no cadastro.",
    fr: "Saisissez l'adresse e-mail utilisée à l'inscription.",
  },
  resetLead: {
    ja: "登録したメールアドレスにリセット用のリンクをお送りします。",
    en: "We'll send a password reset link to your registered email.",
    ko: "등록된 이메일로 비밀번호 재설정 링크를 보내드립니다.",
    zh: "我们会向您注册的邮箱发送密码重置链接。",
    es: "Te enviaremos un enlace de restablecimiento al correo registrado.",
    pt: "Enviaremos um link de redefinição para o e-mail cadastrado.",
    fr: "Nous enverrons un lien de réinitialisation à votre e-mail enregistré.",
  },
  resetLeadNote: {
    ja: "＊迷惑フォルダもご確認ください。",
    en: "* Please also check your spam folder.",
    ko: "＊스팸 메일함도 확인해 주세요.",
    zh: "＊请同时查看垃圾邮件文件夹。",
    es: "* Revisa también tu carpeta de spam.",
    pt: "* Verifique também a pasta de spam.",
    fr: "* Vérifiez également votre dossier spam.",
  },
  backToLoginLead: {
    ja: "ログインに",
    en: "Back to ",
    ko: "로그인으로 ",
    zh: "返回",
    es: "Volver a ",
    pt: "Voltar para ",
    fr: "Retour à ",
  },
  backToLoginLink: {
    ja: "戻る",
    en: "Log in",
    ko: "돌아가기",
    zh: "登录",
    es: "Iniciar sesión",
    pt: "Entrar",
    fr: "la connexion",
  },
  inviteHint: {
    ja: "友達からコードをもらった場合のみ入力",
    en: "Enter only if a friend shared a code with you",
    ko: "친구에게 코드를 받은 경우에만 입력하세요",
    zh: "仅在收到好友分享的邀请码时填写",
    es: "Introdúcelo solo si un amigo te compartió un código",
    pt: "Preencha apenas se um amigo compartilhou um código",
    fr: "À saisir uniquement si un ami vous a donné un code",
  },
  missingInputTitle: {
    ja: "入力エラー",
    en: "Missing input",
    ko: "입력 오류",
    zh: "输入有误",
    es: "Falta información",
    pt: "Dados faltando",
    fr: "Saisie incomplète",
  },
  missingEmail: {
    ja: "メールアドレスを入力してください。",
    en: "Please enter your email address.",
    ko: "이메일 주소를 입력해 주세요.",
    zh: "请输入邮箱地址。",
    es: "Introduce tu correo electrónico.",
    pt: "Digite seu e-mail.",
    fr: "Veuillez saisir votre adresse e-mail.",
  },
  missingBoth: {
    ja: "メールアドレスとパスワードを入力してください。",
    en: "Please enter both email and password.",
    ko: "이메일과 비밀번호를 모두 입력해 주세요.",
    zh: "请输入邮箱和密码。",
    es: "Introduce el correo y la contraseña.",
    pt: "Digite o e-mail e a senha.",
    fr: "Veuillez saisir l'e-mail et le mot de passe.",
  },
  weakPassword: {
    ja: "パスワードは6文字以上にしてください。",
    en: "Password must be at least 6 characters.",
    ko: "비밀번호는 6자 이상이어야 합니다.",
    zh: "密码至少需要 6 个字符。",
    es: "La contraseña debe tener al menos 6 caracteres.",
    pt: "A senha deve ter pelo menos 6 caracteres.",
    fr: "Le mot de passe doit contenir au moins 6 caractères.",
  },
  authErrorTitle: {
    ja: "認証エラー",
    en: "Authentication error",
    ko: "인증 오류",
    zh: "认证错误",
    es: "Error de autenticación",
    pt: "Erro de autenticação",
    fr: "Erreur d'authentification",
  },
  resetSentTitle: {
    ja: "リセットリンクを送信しました",
    en: "Reset link sent",
    ko: "재설정 링크를 보냈습니다",
    zh: "重置链接已发送",
    es: "Enlace de restablecimiento enviado",
    pt: "Link de redefinição enviado",
    fr: "Lien de réinitialisation envoyé",
  },
  resetSentBody: {
    ja: "このメールが登録されていれば、リセット用リンクを送りました。届かない場合は迷惑メールもご確認ください。",
    en: "If this email is registered, we sent a reset link. Check spam if you don't see it.",
    ko: "해당 이메일이 등록되어 있다면 재설정 링크를 보냈습니다. 보이지 않으면 스팸함도 확인해 주세요.",
    zh: "如果该邮箱已注册，我们已发送重置链接。若未收到，请查看垃圾邮件。",
    es: "Si este correo está registrado, enviamos un enlace de restablecimiento. Revisa el spam si no lo ves.",
    pt: "Se este e-mail estiver cadastrado, enviamos um link de redefinição. Verifique o spam se não encontrar.",
    fr: "Si cet e-mail est enregistré, nous avons envoyé un lien de réinitialisation. Vérifiez les spams.",
  },
  backA11y: {
    ja: "戻る",
    en: "Back",
    ko: "뒤로",
    zh: "返回",
    es: "Atrás",
    pt: "Voltar",
    fr: "Retour",
  },
};

export function authFormCopy(
  lang: LocalizedLang = resolveAppUiLocalizedLang()
): AuthFormCopy {
  return {
    forgotLead: L(lang, COPY.forgotLead),
    forgotLink: L(lang, COPY.forgotLink),
    forgotCombined: L(lang, COPY.forgotCombined),
    alreadyLead: L(lang, COPY.alreadyLead),
    resetHint: L(lang, COPY.resetHint),
    resetLead: L(lang, COPY.resetLead),
    resetLeadNote: L(lang, COPY.resetLeadNote),
    backToLoginLead: L(lang, COPY.backToLoginLead),
    backToLoginLink: L(lang, COPY.backToLoginLink),
    inviteHint: L(lang, COPY.inviteHint),
    missingInputTitle: L(lang, COPY.missingInputTitle),
    missingEmail: L(lang, COPY.missingEmail),
    missingBoth: L(lang, COPY.missingBoth),
    weakPassword: L(lang, COPY.weakPassword),
    authErrorTitle: L(lang, COPY.authErrorTitle),
    resetSentTitle: L(lang, COPY.resetSentTitle),
    resetSentBody: L(lang, COPY.resetSentBody),
    backA11y: L(lang, COPY.backA11y),
  };
}
