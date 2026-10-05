/** 通報・ブロック UI コピー（Web / Native 共用） */
import { L, type LocalizedLang } from "@/lib/i18n/localize";
import type { ModerationReportReason } from "@/lib/moderation/moderationTypes";

export type ModerationCopy = {
  moreLabel: string;
  report: string;
  block: string;
  unblock: string;
  cancel: string;
  close: string;
  reportGroup: string;
  reasonTitle: string;
  reasons: Record<ModerationReportReason, string>;
  reportDoneTitle: string;
  reportDoneBody: string;
  blockConfirmTitle: string;
  blockConfirmBody: string;
  blockDoneTitle: string;
  blockDoneBody: string;
  unblockDoneTitle: string;
  blockedBadge: string;
  failed: string;
  rateLimited: string;
};

export function moderationCopy(lang: LocalizedLang): ModerationCopy {
  return {
    moreLabel: "MORE",
    report: L(lang, { ja: "通報する", en: "Report" }),
    block: L(lang, { ja: "ブロックする", en: "Block" }),
    unblock: L(lang, { ja: "ブロックを解除", en: "Unblock" }),
    cancel: L(lang, { ja: "キャンセル", en: "Cancel" }),
    close: L(lang, { ja: "閉じる", en: "Close" }),
    reportGroup: L(lang, {
      ja: "このグループを通報",
      en: "Report this group",
    }),
    reasonTitle: L(lang, {
      ja: "通報の理由を選んでください",
      en: "Why are you reporting this?",
    }),
    reasons: {
      inappropriate: L(lang, {
        ja: "不適切な名前・画像",
        en: "Inappropriate name or image",
      }),
      spam: L(lang, { ja: "スパム・なりすまし", en: "Spam or impersonation" }),
      harassment: L(lang, {
        ja: "嫌がらせ・その他",
        en: "Harassment or other",
      }),
    },
    reportDoneTitle: L(lang, { ja: "通報を受け付けました", en: "Report sent" }),
    reportDoneBody: L(lang, {
      ja: "運営が内容を確認し、規約違反があれば 24 時間以内に削除・利用停止などの対応を行います。",
      en: "Our team will review it and remove content or suspend the account within 24 hours if it violates our Terms.",
    }),
    blockConfirmTitle: L(lang, {
      ja: "このユーザーをブロックしますか？",
      en: "Block this user?",
    }),
    blockConfirmBody: L(lang, {
      ja: "ブロックすると、この人はランキングやグループの順位表に表示されなくなります。プロフィールからいつでも解除できます。",
      en: "They will no longer appear in rankings or group leaderboards for you. You can unblock them from their profile anytime.",
    }),
    blockDoneTitle: L(lang, { ja: "ブロックしました", en: "User blocked" }),
    blockDoneBody: L(lang, {
      ja: "このユーザーはランキングに表示されなくなりました。",
      en: "This user will no longer appear in your rankings.",
    }),
    unblockDoneTitle: L(lang, {
      ja: "ブロックを解除しました",
      en: "User unblocked",
    }),
    blockedBadge: L(lang, { ja: "ブロック中", en: "Blocked" }),
    failed: L(lang, {
      ja: "送信できませんでした。時間をおいて再度お試しください。",
      en: "Couldn't send. Please try again later.",
    }),
    rateLimited: L(lang, {
      ja: "本日の通報の上限に達しました。お問い合わせからご連絡ください。",
      en: "You've reached today's report limit. Please contact us instead.",
    }),
  };
}
