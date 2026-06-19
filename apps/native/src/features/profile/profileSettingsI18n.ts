import type { Language } from "../../../../../lib/i18n/language";

export function getProfilePasswordTexts(language: Language) {
  const isJa = language === "ja";
  return {
    title: isJa ? "パスワード変更" : "Change password",
    desc: isJa
      ? "現在のパスワードを入力し、新しいパスワードを設定してください。"
      : "Enter your current password and choose a new one.",
    current: isJa ? "現在のパスワード" : "Current password",
    next: isJa ? "新しいパスワード" : "New password",
    confirm: isJa ? "新しいパスワード（確認）" : "Confirm new password",
    save: isJa ? "変更" : "Update",
    saving: isJa ? "変更中..." : "Updating...",
    loginRequired: isJa ? "ログインが必要です。" : "Please sign in first.",
    fillAll: isJa ? "すべての項目を入力してください。" : "Please fill in all fields.",
    mismatch: isJa ? "新しいパスワードが一致しません。" : "New passwords do not match.",
    tooShort: isJa ? "新しいパスワードは6文字以上にしてください。" : "Use at least 6 characters.",
    wrongCurrent: isJa ? "現在のパスワードが正しくありません。" : "Current password is incorrect.",
    weak: isJa ? "パスワードが弱すぎます。" : "Password is too weak.",
    failed: isJa ? "変更に失敗しました。" : "Could not update password.",
    success: isJa ? "パスワードを変更しました。" : "Password updated.",
    errorTitle: isJa ? "エラー" : "Error",
  };
}
