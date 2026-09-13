/**
 * パスワード変更画面 chrome（7言語）
 */
import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";

export function changePasswordUiCopy(language: LocalizedLang | string) {
  const lang = resolveLocalizedLang(language);
  return {
    description: L(lang, {
      ja: "ログイン用パスワードを変更できます。",
      en: "Update the password you use to sign in.",
      ko: "로그인 비밀번호를 변경할 수 있습니다.",
      zh: "可更改登录密码。",
      es: "Actualiza la contraseña con la que inicias sesión.",
      pt: "Atualize a senha usada para entrar.",
      fr: "Modifiez le mot de passe de connexion.",
    }),
    current: L(lang, {
      ja: "現在のパスワード",
      en: "Current password",
      ko: "현재 비밀번호",
      zh: "当前密码",
      es: "Contraseña actual",
      pt: "Senha atual",
      fr: "Mot de passe actuel",
    }),
    next: L(lang, {
      ja: "新しいパスワード",
      en: "New password",
      ko: "새 비밀번호",
      zh: "新密码",
      es: "Nueva contraseña",
      pt: "Nova senha",
      fr: "Nouveau mot de passe",
    }),
    confirm: L(lang, {
      ja: "新しいパスワード（確認）",
      en: "Confirm new password",
      ko: "새 비밀번호(확인)",
      zh: "确认新密码",
      es: "Confirmar nueva contraseña",
      pt: "Confirmar nova senha",
      fr: "Confirmer le nouveau mot de passe",
    }),
    save: L(lang, {
      ja: "変更",
      en: "Update",
      ko: "변경",
      zh: "更改",
      es: "Actualizar",
      pt: "Atualizar",
      fr: "Mettre à jour",
    }),
    saving: L(lang, {
      ja: "変更中…",
      en: "Updating…",
      ko: "변경 중…",
      zh: "更改中…",
      es: "Actualizando…",
      pt: "Atualizando…",
      fr: "Mise à jour…",
    }),
    ok: L(lang, {
      ja: "パスワードを変更しました。",
      en: "Password updated.",
      ko: "비밀번호가 변경되었습니다.",
      zh: "密码已更改。",
      es: "Contraseña actualizada.",
      pt: "Senha atualizada.",
      fr: "Mot de passe mis à jour.",
    }),
    err: L(lang, {
      ja: "変更に失敗しました。",
      en: "Update failed.",
      ko: "변경에 실패했습니다.",
      zh: "更改失败。",
      es: "Error al actualizar.",
      pt: "Falha ao atualizar.",
      fr: "Échec de la mise à jour.",
    }),
    minLen: L(lang, {
      ja: "新しいパスワードは6文字以上にしてください。",
      en: "New password must be at least 6 characters.",
      ko: "새 비밀번호는 6자 이상이어야 합니다.",
      zh: "新密码至少 6 个字符。",
      es: "La nueva contraseña debe tener al menos 6 caracteres.",
      pt: "A nova senha deve ter pelo menos 6 caracteres.",
      fr: "Le nouveau mot de passe doit faire au moins 6 caractères.",
    }),
    mismatch: L(lang, {
      ja: "確認用パスワードが一致しません。",
      en: "Confirmation does not match.",
      ko: "확인 비밀번호가 일치하지 않습니다.",
      zh: "确认密码不一致。",
      es: "La confirmación no coincide.",
      pt: "A confirmação não confere.",
      fr: "La confirmation ne correspond pas.",
    }),
  };
}
