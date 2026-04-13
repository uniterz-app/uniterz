"use client";

import React from "react";
import Image from "next/image";
import SettingsNeonCard from "@/app/component/settings/SettingsNeonCard";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { useFloatingBackNavigation } from "@/lib/hooks/useFloatingBackNavigation";
import { ChevronLeft } from "lucide-react";

type Variant = "web" | "mobile";

export default function CommunityGuidelinesPage({
  variant,
}: {
  variant: Variant;
}) {
  const isWeb = variant === "web";
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isEn = language === "en";
  const { goBack, prefersSideMenuAria } = useFloatingBackNavigation();
  const backAria =
    prefersSideMenuAria && user
      ? isEn
        ? "Back to side menu"
        : "サイドメニューに戻る"
      : isEn
        ? "Back"
        : "戻る";
  const updatedAt = "2026-03-23";

  return (
    <div className="min-h-screen w-full bg-[#050814] relative">
      <button
        type="button"
        onClick={goBack}
        className="fixed top-4 right-4 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-zinc-900/85 text-white shadow-[0_8px_18px_rgba(0,0,0,0.4)] backdrop-blur-sm transition hover:bg-zinc-800/90 active:scale-95"
        aria-label={backAria}
      >
        <ChevronLeft className="h-6 w-6" strokeWidth={2.25} aria-hidden />
      </button>

      <div
        className={
          isWeb
            ? "mx-auto max-w-3xl px-6 py-10 text-white"
            : "mx-auto max-w-[640px] px-4 py-8 text-white"
        }
      >
        <SettingsNeonCard className="w-full">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 overflow-hidden">
              <Image
                src="/logo/logo.png"
                alt="Uniterz"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                {isEn ? "Community Guidelines" : "コミュニティガイドライン"}
              </h1>
              <p className="mt-1 text-xs text-white/60">
                {isEn
                  ? "To enjoy this sports-prediction fantasy game in a healthy and fair way."
                  : "スポーツ予想ファンタジーゲームを健全に楽しむために"}
              </p>
              <p className="mt-1 text-xs text-white/50">
                {isEn ? `Last updated: ${updatedAt}` : `最終更新日: ${updatedAt}`}
              </p>
            </div>
          </div>

          <div className="space-y-6 text-sm md:text-base leading-relaxed text-white/85">
            <section>
              <h2 className="text-lg font-bold mb-2">
                {isEn ? "1. About Uniterz" : "1. Uniterz について"}
              </h2>
              <p>
                {isEn
                  ? "Uniterz is a fantasy sports game where you predict the results of sports matches and compete with scores. By submitting your predictions for each match (win/loss and score), you earn points based on the outcomes, and those points are reflected in the rankings and your profile."
                  : "Uniterz はスポーツ試合の結果を予想し、スコアを競い合うファンタジーゲームです。\n試合ごとに勝敗・スコアを予想して投稿すると、結果に応じてポイントが付与され、\nランキングやプロフィールに反映されます。"}
              </p>
              <p className="mt-2">
                {isEn
                  ? "This is not a service intended for financial returns. You compete using only in-game points."
                  : "金銭的リターンを目的としたサービスではなく、ゲーム内のポイントのみで競います。"}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">
                {isEn ? "2. Fair Play" : "2. 公平なプレイ"}
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  {isEn
                    ? "You may submit predictions up to once per match (submissions after the match starts are invalid)."
                    : "1試合につき1回まで予想を投稿できます（試合開始後の投稿は無効）"}
                </li>
                <li>
                  {isEn
                    ? "Cheating by farming scores using multiple accounts is prohibited."
                    : "複数アカウントを用いた不正なスコア稼ぎは禁止です"}
                </li>
                <li>
                  {isEn
                    ? "Using someone else's account or impersonating others is prohibited."
                    : "他人のアカウントを使用したり、なりすましたりすることは禁止です"}
                </li>
                <li>
                  {isEn
                    ? "Intentionally exploiting system malfunctions is prohibited."
                    : "システムの不具合を意図的に利用する行為は禁止です"}
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">
                {isEn ? "3. About Profiles / Display Names" : "3. プロフィール・表示名について"}
              </h2>
              <p>
                {isEn
                  ? "Your profile display name, handle, and bio are visible to other users. You must not include the following:"
                  : "プロフィールの表示名・ハンドル・自己紹介文は、他のユーザーに公開されます。\n以下の内容を含めることは禁止です。"}
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>{isEn ? "Expressions that attack, insult, or discriminate against others." : "他者を攻撃・侮辱・差別する表現"}</li>
                <li>{isEn ? "False titles or misrepresentation of affiliations." : "虚偽の肩書き・所属の詐称"}</li>
                <li>
                  {isEn
                    ? "Promoting or directing users to external services (e.g., posting URLs/contact information)."
                    : "外部サービスへの誘導（URL・連絡先の掲示など）"}
                </li>
                <li>{isEn ? "Spam or promotional text." : "スパム・宣伝目的の文言"}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">
                {isEn ? "4. Prohibited Acts" : "4. 禁止される行為"}
              </h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>{isEn ? "Impersonating other users or the operator." : "他者や運営になりすます行為"}</li>
                <li>
                  {isEn
                    ? "Acts that interfere with or abuse the service's operation (automated access, excessive requests, etc.)."
                    : "サービスの動作を妨害・悪用する行為（自動化アクセス、過剰リクエスト等）"}
                </li>
                <li>{isEn ? "Unauthorized access and other acts that violate laws or regulations." : "不正アクセスその他、法令に違反する行為"}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">
                {isEn ? "5. Actions When Violations Are Found" : "5. 違反時の対応"}
              </h2>
              <p>
                {isEn
                  ? "If a violation of these guidelines is confirmed, we may take one of the following actions:"
                  : "ガイドライン違反が確認された場合、以下のいずれかの対応を行うことがあります。"}
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>{isEn ? "Mild: warning or a request to revise the content." : "軽度：警告・内容の修正依頼"}</li>
                <li>{isEn ? "Moderate: temporary restriction of usage." : "中度：一時的な利用制限"}</li>
                <li>{isEn ? "Severe: account suspension or a permanent ban." : "重大：アカウント停止または永久BAN"}</li>
              </ul>
              <p className="mt-2">
                {isEn
                  ? "The content and severity of any response will be determined at our discretion."
                  : "対応の内容・程度は、当社の判断により決定します。"}
              </p>
            </section>

            <section>
              <h2 className="text-lg font-bold mb-2">
                {isEn ? "6. About the Service" : "6. サービスについて"}
              </h2>
              <p>
                {isEn
                  ? "The content and specifications of Uniterz may change without notice. Regarding match information, rankings, point calculations, etc., we do not guarantee accuracy or completeness."
                  : "Uniterz のサービス内容・仕様は予告なく変更される場合があります。\n掲載されている試合情報・ランキング・ポイント計算などについて、\n正確性・完全性を保証するものではありません。"}
              </p>
              <p className="mt-2">
                {isEn
                  ? "To help all users enjoy the game in a healthy manner, please cooperate with compliance to these guidelines."
                  : "すべてのユーザーが健全にゲームを楽しめるよう、\n本ガイドラインの遵守にご協力ください。"}
              </p>
            </section>
          </div>
        </SettingsNeonCard>
      </div>
    </div>
  );
}
