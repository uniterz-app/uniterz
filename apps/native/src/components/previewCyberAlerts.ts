import { cyberAlert } from "./cyberAlertHost";

/** Dev / デザイン確認用 — 4 バリエーションを連続表示 */
export function previewCyberAlerts(language: "ja" | "en" = "ja") {
  const isJa = language === "ja";
  cyberAlert(
    isJa ? "投稿完了" : "Posted",
    isJa ? "予想を保存しました。" : "Prediction saved."
  );
  setTimeout(() => {
    cyberAlert(
      isJa ? "入力エラー" : "Invalid input",
      isJa ? "スコアを入力してください。" : "Please enter scores."
    );
  }, 900);
  setTimeout(() => {
    cyberAlert(
      isJa ? "編集モード" : "Edit mode",
      isJa
        ? "予想済みの試合は、スコアをタップして修正できます。"
        : "Tap scores on predicted games to edit."
    );
  }, 1800);
  setTimeout(() => {
    cyberAlert(
      isJa ? "退会しますか？" : "Leave this group?",
      isJa ? "このグループから退会します。" : "You will leave this group.",
      [
        { text: isJa ? "キャンセル" : "Cancel", style: "cancel" },
        { text: isJa ? "退会" : "Leave", style: "destructive" },
      ]
    );
  }, 2700);
}
