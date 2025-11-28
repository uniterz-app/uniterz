"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";

export default function WebPrivacyPage() {
  return (
    <LegalPageLayout
      variant="web"
      title="プライバシーポリシー（Privacy Policy）"
      description="Uniterz におけるユーザー情報の取り扱いについて説明するページです。"
      updatedAt="2025-11-17"
    >
      <section>
        <h2 className="mb-1 text-base font-semibold">1. 基本方針</h2>
        <p>
          Uniterz（以下「本サービス」）は、ユーザーのプライバシーを尊重し、
          個人情報およびそれに準ずる情報を適切に取り扱うよう努めます。
        </p>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold">2. 取得する情報の種類</h2>
        <p className="mb-1">
          本サービスでは、次のような情報を取得する場合があります。
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>アカウント情報（ニックネーム、メールアドレス 等）</li>
          <li>プロフィール情報（自己紹介、アイコン画像 等）</li>
          <li>投稿内容（試合予想、コメント 等）</li>
          <li>成績データ（勝率、ユニット収支、平均オッズ 等）</li>
          <li>アクセスログ（利用日時、端末情報、IPアドレス 等）</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold">3. 情報の利用目的</h2>
        <p className="mb-1">取得した情報は、主に次の目的で利用します。</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>本サービスの提供・運営・改善のため</li>
          <li>ユーザーの成績表示、ランキング、分析機能の提供のため</li>
          <li>不正利用・スパム等を防止するための監視・対応のため</li>
          <li>重要なお知らせやメンテナンス情報の通知のため</li>
          <li>サービス利用状況の分析・統計データ作成のため</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold">4. 外部サービスの利用</h2>
        <p>
          本サービスでは、アクセス解析や認証などのために、
          <span className="font-semibold">
            外部サービス（例：アクセス解析ツール等）
          </span>
          を利用する場合があります。その際、外部サービス事業者がクッキー等を利用して情報を取得することがあります。
        </p>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold">
          5. 情報の管理と第三者提供
        </h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            本サービスは、取得した情報を適切に管理し、
            <span className="font-semibold">
              不正アクセス・紛失・改ざん等の防止
            </span>
            に努めます。
          </li>
          <li>
            法令に基づく場合を除き、
            <span className="font-semibold">
              ユーザーの同意なく第三者に個人情報を提供することはありません
            </span>
            。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold">6. ユーザーの権利</h2>
        <p>
          ユーザーは、本サービスに登録された自身の情報について、
          <span className="font-semibold">確認・修正・削除</span>
          を行うことができます。一部の操作はアプリ内の設定・プロフィール編集から行うことができ、その他の対応が必要な場合は、今後用意するお問い合わせ窓口からご相談いただけます。
        </p>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold">7. ポリシーの変更</h2>
        <p>
          本プライバシーポリシーの内容は、必要に応じて変更されることがあります。重要な変更がある場合は、
          <span className="font-semibold">アプリ内のお知らせ等で告知</span>
          します。
        </p>
      </section>

      <section>
        <h2 className="mb-1 text-base font-semibold">8. お問い合わせ</h2>
        <p>
          本ポリシーや情報の取り扱いに関するご質問・ご相談については、
          今後アプリ内で案内するお問い合わせフォーム等からご連絡いただけるよう整備していきます。
        </p>
      </section>
    </LegalPageLayout>
  );
}
