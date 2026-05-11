"use client";

import React from "react";
import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";

type Variant = "web" | "mobile";

function ContentJa() {
  return (
    <>
      <section>
        <h2 className="mb-2 text-base font-bold text-white/90">1. Uniterz について</h2>
        <p>
          Uniterz はスポーツ試合の結果を予想し、スコアを競い合うファンタジーゲームです。
          試合ごとに勝敗・スコアを予想して投稿すると、結果に応じてポイントが付与され、
          ランキングやプロフィールに反映されます。
        </p>
        <p className="mt-2">
          金銭的リターンを目的としたサービスではなく、ゲーム内のポイントのみで競います。
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-bold text-white/90">2. 公平なプレイ</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>1試合につき1回まで予想を投稿できます（試合開始後の投稿は無効）</li>
          <li>複数アカウントを用いた不正なスコア稼ぎは禁止です</li>
          <li>他人のアカウントを使用したり、なりすましたりすることは禁止です</li>
          <li>システムの不具合を意図的に利用する行為は禁止です</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-base font-bold text-white/90">3. プロフィール・表示名について</h2>
        <p>
          プロフィールの表示名・ハンドル・自己紹介文は、他のユーザーに公開されます。
          以下の内容を含めることは禁止です。
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>他者を攻撃・侮辱・差別する表現</li>
          <li>虚偽の肩書き・所属の詐称</li>
          <li>外部サービスへの誘導（URL・連絡先の掲示など）</li>
          <li>スパム・宣伝目的の文言</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-base font-bold text-white/90">4. 禁止される行為</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>他者や運営になりすます行為</li>
          <li>サービスの動作を妨害・悪用する行為（自動化アクセス、過剰リクエスト等）</li>
          <li>不正アクセスその他、法令に違反する行為</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-base font-bold text-white/90">5. 違反時の対応</h2>
        <p>ガイドライン違反が確認された場合、以下のいずれかの対応を行うことがあります。</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>軽度：警告・内容の修正依頼</li>
          <li>中度：一時的な利用制限</li>
          <li>重大：アカウント停止または永久BAN</li>
        </ul>
        <p className="mt-2">対応の内容・程度は、当社の判断により決定します。</p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-bold text-white/90">6. サービスについて</h2>
        <p>
          Uniterz のサービス内容・仕様は予告なく変更される場合があります。
          掲載されている試合情報・ランキング・ポイント計算などについて、
          正確性・完全性を保証するものではありません。
        </p>
        <p className="mt-2">
          すべてのユーザーが健全にゲームを楽しめるよう、本ガイドラインの遵守にご協力ください。
        </p>
      </section>
    </>
  );
}

function ContentEn() {
  return (
    <>
      <section>
        <h2 className="mb-2 text-base font-bold text-white/90">1. About Uniterz</h2>
        <p>
          Uniterz is a fantasy sports game where you predict the results of sports matches
          and compete with scores. By submitting your predictions for each match (win/loss
          and score), you earn points based on the outcomes, and those points are reflected
          in the rankings and your profile.
        </p>
        <p className="mt-2">
          This is not a service intended for financial returns. You compete using only in-game points.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-bold text-white/90">2. Fair Play</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>You may submit predictions up to once per match (submissions after the match starts are invalid).</li>
          <li>Cheating by farming scores using multiple accounts is prohibited.</li>
          <li>Using someone else&apos;s account or impersonating others is prohibited.</li>
          <li>Intentionally exploiting system malfunctions is prohibited.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-base font-bold text-white/90">3. About Profiles / Display Names</h2>
        <p>
          Your profile display name, handle, and bio are visible to other users.
          You must not include the following:
        </p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Expressions that attack, insult, or discriminate against others.</li>
          <li>False titles or misrepresentation of affiliations.</li>
          <li>Promoting or directing users to external services (e.g., posting URLs/contact information).</li>
          <li>Spam or promotional text.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-base font-bold text-white/90">4. Prohibited Acts</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Impersonating other users or the operator.</li>
          <li>Acts that interfere with or abuse the service&apos;s operation (automated access, excessive requests, etc.).</li>
          <li>Unauthorized access and other acts that violate laws or regulations.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-base font-bold text-white/90">5. Actions When Violations Are Found</h2>
        <p>If a violation of these guidelines is confirmed, we may take one of the following actions:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>Mild: warning or a request to revise the content.</li>
          <li>Moderate: temporary restriction of usage.</li>
          <li>Severe: account suspension or a permanent ban.</li>
        </ul>
        <p className="mt-2">
          The content and severity of any response will be determined at our discretion.
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-base font-bold text-white/90">6. About the Service</h2>
        <p>
          The content and specifications of Uniterz may change without notice. Regarding match
          information, rankings, point calculations, etc., we do not guarantee accuracy or completeness.
        </p>
        <p className="mt-2">
          To help all users enjoy the game in a healthy manner, please cooperate with compliance to these guidelines.
        </p>
      </section>
    </>
  );
}

export default function CommunityGuidelinesPage({
  variant,
}: {
  variant: Variant;
}) {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);

  return (
    <LegalPageLayout
      variant={variant}
      title={m.settings.communityGuidelines}
      description={
        language === "ja"
          ? "スポーツ予想ファンタジーゲームを健全に楽しむために"
          : "To enjoy this sports-prediction fantasy game in a healthy and fair way."
      }
      updatedAt="2026-03-23"
    >
      {language === "ja" ? <ContentJa /> : <ContentEn />}
    </LegalPageLayout>
  );
}
