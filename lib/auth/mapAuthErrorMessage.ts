import type { FirebaseError } from "firebase/app";

type AuthFlow = "login" | "signup";

/** Firebase Auth のエラーコードをユーザー向け文言に変換 */
export function mapAuthErrorMessage(
  error: unknown,
  flow: AuthFlow,
): string {
  const code = (error as FirebaseError | undefined)?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
      return "メールアドレスまたはパスワードが正しくありません。";
    case "auth/user-not-found":
      return "このメールアドレスのユーザーが見つかりません。";
    case "auth/invalid-email":
      return "メールアドレスの形式が正しくありません。";
    case "auth/email-already-in-use":
      return "このメールアドレスはすでに登録されています。";
    case "auth/weak-password":
      return "パスワードは6文字以上にしてください。";
    case "auth/network-request-failed":
      return "ネットワークに接続できません。接続を確認して再度お試しください。";
    case "auth/too-many-requests":
      return "試行回数が多すぎます。しばらく待ってから再度お試しください。";
    case "auth/user-disabled":
      return "このアカウントは無効になっています。";
    case "auth/operation-not-allowed":
      return "このログイン方法は現在利用できません。";
    default:
      return flow === "login"
        ? "ログインに失敗しました。入力内容をご確認ください。"
        : "アカウント作成に失敗しました。入力内容をご確認ください。";
  }
}
