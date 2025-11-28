// app/lib/support/contactTypes.ts
import type { Timestamp } from "firebase/firestore";

/** お問い合わせの種類（内部コード） */
export type ContactType = "bug" | "feature" | "report" | "other";

/** お問い合わせのステータス（運営側の管理用） */
export type ContactStatus = "unread" | "in_progress" | "resolved" | "closed";

/** Firestore に保存する contacts ドキュメントの型 */
export type ContactDoc = {
  // ユーザー入力系
  type: ContactType;              // 種別
  message: string;                // 本文（必須）
  email?: string | null;          // メールアドレス（任意）
  screenshotUrl?: string | null;  // 関連URL / スクショURL（任意）

  // コンテキスト情報
  fromPath?: string | null;       // フォームを開いた画面のパス
  appVariant?: "web" | "mobile";  // 送信元（web / mobile）

  // ユーザー情報（ログイン時のみ）
  userUid?: string | null;
  userDisplayName?: string | null;

  // 運営側管理用
  status: ContactStatus;          // 未読 / 対応中 / 解決 / クローズ
  createdAt: Timestamp;           // 作成日時
  updatedAt?: Timestamp;          // 更新日時（ステータス変更時など）
};

/** フロント側で使うラベル（セレクトボックス用） */
export const CONTACT_TYPE_OPTIONS: { value: ContactType; label: string }[] = [
  { value: "bug",     label: "不具合報告" },
  { value: "feature", label: "機能の要望" },
  { value: "report",  label: "通報（迷惑行為・ルール違反など）" },
  { value: "other",   label: "その他" },
];

/** ステータスの表示ラベル（今後 Admin 画面でも再利用予定） */
export const CONTACT_STATUS_LABEL: Record<ContactStatus, string> = {
  unread:      "未読",
  in_progress: "対応中",
  resolved:    "解決",
  closed:      "クローズ",
};
