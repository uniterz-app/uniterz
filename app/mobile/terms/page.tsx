// app/mobile/(no-nav)/terms/page.tsx
"use client";

import React from "react";
import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";

export default function MobileTermsPage() {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const isEn = language === "en";

  return (
    <LegalPageLayout
      title={m.settings.termsOfService}
      description={
        isEn
          ? "This page sets forth the terms and conditions for using Uniterz. Please review them carefully before using the Service."
          : "Uniterz におけるご利用条件を定めたページです。ご利用前に必ずご確認ください。"
      }
      updatedAt="2026-03-23"
      variant="mobile"
    >
      <section className="space-y-6 text-sm leading-relaxed text-white/80">

        {/* 1 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            {isEn ? "1. Service Overview" : "1. サービス概要"}
          </h2>
          {isEn ? (
            <>
              <p>
                Uniterz (the "Service") is a fantasy sports service where you predict sports match results and compete using scores.
              </p>
              <p className="mt-2">
                Within this Service, there are{" "}
                <span className="font-semibold text-amber-300">
                  absolutely no financial transfers, gambling, betting, or similar activities
                </span>
                . The points, scores, rankings, etc. shown are in-game indicators and have no monetary value.
              </p>
            </>
          ) : (
            <>
              <p>
                Uniterz（以下「本サービス」）は、
                スポーツの試合結果を予想してスコアを競うファンタジースポーツサービスです。
              </p>
              <p className="mt-2">
                本サービスにおいて
                <span className="font-semibold text-amber-300">
                  金銭のやり取り、賭博行為、ベット行為は一切行いません
                </span>
                。表示されるポイント、スコア、ランキング等はゲーム内指標であり、金銭的価値を有しません。
              </p>
            </>
          )}
        </div>

        {/* 2 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            {isEn ? "2. Definitions" : "2. 用語の定義"}
          </h2>
          {isEn ? (
            <ul className="list-disc space-y-1 pl-5">
              <li>
                "Prediction": a user's submission regarding match results (wins/losses, scores, etc.).
              </li>
              <li>"Points": in-game scores awarded based on prediction results.</li>
              <li>"Rankings": ranking information displayed based on points, etc.</li>
              <li>"Pro Plan": a paid plan that expands access to certain features.</li>
            </ul>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              <li>「予想」：試合結果（勝敗・スコア等）に対するユーザーの投稿。</li>
              <li>「ポイント」：予想結果に応じて付与されるゲーム内スコア。</li>
              <li>「ランキング」：ポイント等に基づいて表示される順位情報。</li>
              <li>「Proプラン」：一部機能を拡張して利用できる有料プラン。</li>
            </ul>
          )}
        </div>

        {/* 3 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            {isEn ? "3. Scope of Application" : "3. 規約の適用範囲"}
          </h2>
          {isEn ? (
            <p>
              These Terms apply to all services and features provided in connection with this Service, including the app, the web version, the API, and all related functionalities. Users are deemed to have agreed to these Terms upon starting to use the Service.
            </p>
          ) : (
            <p>
              本規約は、本サービスの
              <span className="font-semibold text-sky-300">
                アプリ版・Web版・API・関連機能すべて
              </span>
              に適用されます。ユーザーは利用開始をもって本規約に同意したものとみなされます。
            </p>
          )}
        </div>

        {/* 4 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            {isEn ? "4. Account" : "4. アカウント"}
          </h2>
          {isEn ? (
            <ul className="list-disc space-y-1 pl-5">
              <li>Please keep your registration information accurate and up to date.</li>
              <li>Responsibility for account management belongs to the user.</li>
              <li>The operator is generally not responsible for damages arising from improper use.</li>
            </ul>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              <li>登録情報は正確かつ最新の内容を維持してください。</li>
              <li>アカウント管理責任はユーザー本人に帰属します。</li>
              <li>不正利用による損害について、運営は責任を負いません。</li>
            </ul>
          )}
        </div>

        {/* 5 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            {isEn ? "5. Handling of Points and Rankings" : "5. ポイント・ランキングの取り扱い"}
          </h2>
          {isEn ? (
            <ul className="list-disc space-y-1 pl-5">
              <li>Points and rankings are calculated based on calculation logic determined by the operator.</li>
              <li>They do not guarantee future results.</li>
              <li>
                The calculation methods and display items may change for improvement purposes.
              </li>
              <li>Displayed content may differ between the Free Plan and the Pro Plan.</li>
            </ul>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              <li>ポイント・ランキングは運営が定める計算ロジックに基づき算出されます。</li>
              <li>将来の結果を保証するものではありません。</li>
              <li>計算方法や表示項目は改善のため変更されることがあります。</li>
              <li>無料プランとProプランで表示内容が異なる場合があります。</li>
            </ul>
          )}
        </div>

        {/* 6 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            {isEn ? "6. Pro Plan" : "6. Proプラン"}
          </h2>
          {isEn ? (
            <ul className="list-disc space-y-1 pl-5">
              <li>The Pro Plan may include paid features.</li>
              <li>Pricing, content, and cancellation conditions follow the information displayed separately.</li>
              <li>Feature content may be changed.</li>
            </ul>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              <li>Proプランは有料機能を含む場合があります。</li>
              <li>料金・内容・解約条件は別途表示に従います。</li>
              <li>機能内容は変更されることがあります。</li>
            </ul>
          )}
        </div>

        {/* 7 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            {isEn ? "7. Prohibited" : "7. 禁止事項"}
          </h2>
          {isEn ? (
            <ul className="list-disc space-y-1 pl-5">
              <li>Impersonating other users or the operator.</li>
              <li>Acts that interfere with or misuse the operation of the Service (automated access, excessive requests, etc.).</li>
              <li>Unauthorized access and other acts that violate laws and regulations.</li>
            </ul>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              <li>他者や運営になりすます行為</li>
              <li>サービスの動作を妨害・悪用する行為（自動化アクセス、過剰リクエスト等）</li>
              <li>不正アクセスその他、法令に違反する行為</li>
            </ul>
          )}
        </div>

        {/* 8 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            {isEn ? "8. Changes or Suspension" : "8. サービスの変更・停止"}
          </h2>
          {isEn ? (
            <p>
              The operator may add, change, suspend, or end functions without prior notice. In some cases, you may be temporarily unable to use the Service due to maintenance, etc.
            </p>
          ) : (
            <p>
              機能の追加・変更・停止・終了を予告なく行う場合があります。メンテナンス等により一時利用できない場合があります。
            </p>
          )}
        </div>

        {/* 9 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            {isEn ? "9. Disclaimer" : "9. 免責事項"}
          </h2>
          {isEn ? (
            <ul className="list-disc space-y-1 pl-5">
              <li>We do not guarantee the accuracy or completeness of information.</li>
              <li>The operator will not be responsible for any damages arising from use.</li>
              <li>This Service does not provide investment advisory or gambling services.</li>
            </ul>
          ) : (
            <ul className="list-disc space-y-1 pl-5">
              <li>情報の正確性・完全性を保証しません。</li>
              <li>利用により生じた損害について、運営は責任を負いません。</li>
              <li>本サービスは投資助言・賭博サービスを提供するものではありません。</li>
            </ul>
          )}
        </div>

        {/* 10 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            {isEn ? "10. Intellectual Property" : "10. 知的財産権"}
          </h2>
          {isEn ? (
            <p>
              All rights related to this Service belong to the operator or rightsholders. User-submitted content may be used for operating the Service, displaying content, and improving quality.
            </p>
          ) : (
            <p>
              本サービスに関する権利は運営または権利者に帰属します。
              投稿内容は、サービス運営・表示・品質改善の目的で利用されることがあります。
            </p>
          )}
        </div>

        {/* 11 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            {isEn ? "11. Changes to the Terms" : "11. 規約の変更"}
          </h2>
          {isEn ? (
            <p>
              We will notify you of important changes within the app.
            </p>
          ) : (
            <p>
              規約の変更はアプリ内で告知します。変更後の利用をもって同意したものとみなします。
            </p>
          )}
        </div>

        {/* 12 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            {isEn ? "12. Governing Law and Jurisdiction" : "12. 準拠法・裁判管轄"}
          </h2>
          {isEn ? (
            <p>
              These Terms are governed by Japanese law, and disputes shall be subject to the exclusive jurisdiction of courts in Japan.
            </p>
          ) : (
            <p>
              本規約は日本法に準拠し、紛争は日本国内の裁判所を専属管轄とします。
            </p>
          )}
        </div>

        {/* 13 */}
        <div>
          {isEn ? (
            <>
              <h2 className="mb-1 text-base font-semibold text-white">
                13. Subscriptions (Recurring Billing)
              </h2>

              <p>
                The Pro Plan is provided as a monthly or annual subscription
                (recurring billing). Payments are processed through the payment
                service (Stripe) used by our company.
              </p>

              <h3 className="mt-3 font-semibold text-white">Auto-renewal</h3>
              <p>
                The Pro Plan is automatically renewed at the end of the contract
                period. Unless you complete the cancellation procedures, charges
                will be applied for the next billing cycle.
              </p>

              <h3 className="mt-3 font-semibold text-white">Cancellation</h3>
              <p>
                You can cancel from the designated procedures within the app.
                After cancellation, you can continue using Pro features until
                the end of the period you have already paid for. After the
                period ends, your account automatically returns to the Free Plan.
              </p>

              <h3 className="mt-3 font-semibold text-white">Refunds</h3>
              <p>
                Due to the nature of subscriptions, refunds generally will not
                be provided. However, in limited cases where our company
                specially approves it, we may process a refund.
              </p>

              <h3 className="mt-3 font-semibold text-white">
                Changes to Pricing and Content
              </h3>
              <p>
                The Pro Plan pricing, content, and conditions may change after
                providing prior notice. We will notify you of the changes within
                the app.
              </p>
            </>
          ) : (
            <>
              <h2 className="mb-1 text-base font-semibold text-white">
                13. サブスクリプション（定期課金）について
              </h2>

              <p>
                Proプランは、月額または年額の定期課金（サブスクリプション）として提供されます。
                課金は、当社が利用する決済サービス（Stripe）を通じて処理されます。
              </p>

              <h3 className="mt-3 font-semibold text-white">自動更新</h3>
              <p>
                Proプランは、契約期間満了時に自動更新されます。
                解約手続きを行わない限り、次回の課金が発生します。
              </p>

              <h3 className="mt-3 font-semibold text-white">解約について</h3>
              <p>
                解約はアプリ内の所定の手続きから行うことができます。
                解約後も、すでに支払い済みの期間終了まではPro機能を利用できます。
                期間終了後は自動的に無料プランに戻ります。
              </p>

              <h3 className="mt-3 font-semibold text-white">返金について</h3>
              <p>
                サブスクリプションの性質上、原則として返金は行いません。
                ただし、当社が特別に認めた場合に限り、返金対応を行うことがあります。
              </p>

              <h3 className="mt-3 font-semibold text-white">価格・内容の変更</h3>
              <p>
                Proプランの料金、内容、提供条件は、事前の告知を行った上で変更される場合があります。
                変更内容はアプリ内で告知します。
              </p>
            </>
          )}
        </div>

      </section>
    </LegalPageLayout>
  );
}
