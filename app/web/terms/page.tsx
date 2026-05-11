// app/web/(with-nav)/legal/terms/page.tsx
"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";

export default function WebTermsPage() {
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const isEn = language === "en";

  return (
    <LegalPageLayout
      variant="web"
      title={m.settings.termsOfService}
      description={
        isEn
          ? "This page sets forth the terms and conditions for using Uniterz. Please review them carefully before using the Service."
          : "Uniterz におけるご利用条件を定めたページです。ご利用前に必ずご確認ください。"
      }
      updatedAt="2026-03-23"
    >
      <section>
        <h2 className="text-base font-semibold mb-1">
          {isEn ? "1. Service Overview" : "1. サービスの概要"}
        </h2>
        {isEn ? (
          <>
            <p>
              Uniterz (the "Service") is a fantasy sports service where you predict sports match results and compete using scores.
            </p>
            <p className="mt-2">
              Within this Service, there are{" "}
              <span className="font-semibold">
                absolutely no financial transfers, gambling, betting, or similar activities
              </span>
              . The points, scores, rankings, etc. shown are in-game indicators and have no monetary value.
            </p>
          </>
        ) : (
          <>
            <p>
              Uniterz（以下「本サービス」）は、スポーツの試合結果を予想してスコアを競うファンタジースポーツサービスです。
            </p>
            <p className="mt-2">
              本サービス上では、
              <span className="font-semibold">
                金銭の受渡し、賭博、ベット等は一切行いません
              </span>
              。表示されるポイント、スコア、ランキング等はゲーム内指標であり、金銭的価値を有しません。
            </p>
          </>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">
          {isEn ? "2. Definitions" : "2. 用語の定義"}
        </h2>
        {isEn ? (
          <ul className="list-disc pl-5 space-y-1">
            <li>
              "Prediction": a user's submission regarding match results (wins/losses, scores, etc.).
            </li>
            <li>"Points": in-game scores awarded based on prediction results.</li>
            <li>"Rankings": ranking information displayed based on points, etc.</li>
            <li>"Pro Plan": a paid plan that expands access to certain features.</li>
          </ul>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            <li>「予想」：試合結果（勝敗・スコア等）に対するユーザーの投稿。</li>
            <li>「ポイント」：予想結果に応じて付与されるゲーム内スコア。</li>
            <li>「ランキング」：ポイント等に基づいて表示される順位情報。</li>
            <li>「Proプラン」：一部機能を拡張して利用できる有料プラン。</li>
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">
          {isEn ? "3. Scope of Application" : "3. 規約の適用範囲"}
        </h2>
        {isEn ? (
          <>
            <p>
              These Terms apply to all services and features provided in connection with this Service,
              including the app, the web version, the API, and all other provided functionalities.
            </p>
            <p className="mt-2">Users are deemed to have agreed to these Terms upon starting to use the Service.</p>
          </>
        ) : (
          <>
            <p>
              本規約は、本サービスに関連する
              <span className="font-semibold">アプリ版・Web版・API・その他すべての提供機能</span>
              に適用されます。
            </p>
            <p className="mt-2">ユーザーは利用開始をもって本規約に同意したものとみなされます。</p>
          </>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">
          {isEn ? "4. Account" : "4. アカウント"}
        </h2>
        {isEn ? (
          <ul className="list-disc pl-5 space-y-1">
            <li>Please keep your registration information accurate and up to date.</li>
            <li>Responsibility for account management belongs to the user.</li>
            <li>
              In principle, the operator is not responsible for damages arising from improper use.
            </li>
          </ul>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            <li>登録情報は正確かつ最新の内容を維持してください。</li>
            <li>アカウント管理責任はユーザー本人に帰属します。</li>
            <li>不正利用により生じた損害について、運営は原則責任を負いません。</li>
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">
          {isEn ? "5. Handling of Points and Rankings" : "5. ポイント・ランキングの取り扱い"}
        </h2>
        {isEn ? (
          <ul className="list-disc pl-5 space-y-1">
            <li>Points and rankings are calculated based on calculation logic determined by the operator.</li>
            <li>They do not guarantee future results.</li>
            <li>
              The calculation methods and display items may be changed without prior notice for improvement.
            </li>
            <li>Displayed content may differ between the Free Plan and the Pro Plan.</li>
          </ul>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            <li>ポイント・ランキングは運営が定める計算ロジックに基づき算出されます。</li>
            <li>将来の結果を保証するものではありません。</li>
            <li>計算方法や表示項目は改善のため予告なく変更されることがあります。</li>
            <li>無料プランとProプランで表示内容が異なる場合があります。</li>
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">
          {isEn ? "6. Pro Plan" : "6. Proプラン"}
        </h2>
        {isEn ? (
          <ul className="list-disc pl-5 space-y-1">
            <li>
              The Pro Plan may include paid features such as monthly or annual subscriptions.
            </li>
            <li>
              Pricing, content, and cancellation conditions will follow the information displayed separately.
            </li>
            <li>Feature content may be changed, added, or removed.</li>
          </ul>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            <li>Proプランは月額・年額等の有料機能を含む場合があります。</li>
            <li>料金、提供内容、解約条件は別途定める表示に従います。</li>
            <li>機能内容は変更・追加・削除されることがあります。</li>
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">
          {isEn ? "7. Prohibited" : "7. 禁止事項"}
        </h2>
        {isEn ? (
          <ul className="list-disc pl-5 space-y-1">
            <li>Impersonating other users or the operator.</li>
            <li>
              Acts that interfere with or misuse the operation of the Service (automated access, excessive requests, etc.).
            </li>
            <li>Unauthorized access and other acts that violate applicable laws or regulations.</li>
          </ul>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            <li>他者や運営になりすます行為</li>
            <li>サービスの動作を妨害・悪用する行為（自動化アクセス、過剰リクエスト等）</li>
            <li>不正アクセスその他、法令に違反する行為</li>
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">
          {isEn ? "8. Changes or Suspension" : "8. サービスの変更・停止"}
        </h2>
        {isEn ? (
          <p>
            The operator may add, change, suspend, or end functions without prior notice. In some cases, you may be temporarily unable to use the Service due to maintenance, etc.
          </p>
        ) : (
          <p>
            機能の追加・変更・停止・終了を予告なく行う場合があります。
            メンテナンスにより一時利用できない場合があります。
          </p>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">
          {isEn ? "9. Disclaimer" : "9. 免責事項"}
        </h2>
        {isEn ? (
          <ul className="list-disc pl-5 space-y-1">
            <li>We do not guarantee the accuracy or completeness of information.</li>
            <li>The operator will not be responsible for any damages arising from use.</li>
            <li>This Service does not provide investment advisory or gambling services.</li>
          </ul>
        ) : (
          <ul className="list-disc pl-5 space-y-1">
            <li>情報の正確性・完全性を保証しません。</li>
            <li>利用により生じた損害について、運営は責任を負いません。</li>
            <li>本サービスは投資助言・賭博サービスを提供するものではありません。</li>
          </ul>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">
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
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">
          {isEn ? "11. Changes to the Terms" : "11. 規約の変更"}
        </h2>
        {isEn ? (
          <p>We will notify you of important changes within the app.</p>
        ) : (
          <p>重要な変更はアプリ内にて告知します。</p>
        )}
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">
          {isEn ? "12. Governing Law and Jurisdiction" : "12. 準拠法・裁判管轄"}
        </h2>
        {isEn ? (
          <p>
            These Terms are governed by Japanese law, and disputes shall be subject to the exclusive jurisdiction of courts in Japan.
          </p>
        ) : (
          <p>
            日本法に準拠し、紛争は日本国内の裁判所を専属管轄とします。
          </p>
        )}
      </section>
    </LegalPageLayout>
  );
}
