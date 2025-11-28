// app/web/(with-nav)/legal/terms/page.tsx
"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";

export default function WebTermsPage() {
  return (
    <LegalPageLayout
      variant="web"
      title="利用規約（Terms of Service）"
      description="Uniterz を利用する際の基本的なルールをまとめたページです。ご利用の前に必ずお読みください。"
      updatedAt="2025-11-17"
    >
      <section>
        <h2 className="text-base font-semibold mb-1">1. サービスの概要</h2>
        <p>
          Uniterz（以下「本サービス」）は、
          <span className="font-semibold">
            スポーツの試合に関する予想・分析・成績を共有するコミュニティサービス
          </span>
          です。ユーザーは試合の予想投稿や成績の管理、他ユーザーの投稿の閲覧などを行うことができます。
        </p>
        <p className="mt-2">
          本サービス上では、
          <span className="font-semibold">
            実際のお金のやり取りやベット（賭け）そのものは行いません
          </span>
          。本サービスで使用する「ユニット」は仮想ポイントであり、現金その他の通貨・財産的価値とは直接結びつくものではありません。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">2. 規約の適用範囲</h2>
        <p>
          本利用規約（以下「本規約」）は、本サービスに関連する
          <span className="font-semibold">
            アプリ版・Web版・その他 Uniterz が提供するすべてのサービス
          </span>
          に適用されます。
        </p>
        <p className="mt-2">
          ユーザーは、本サービスを利用することにより、本規約の内容に同意したものとみなされます。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">3. アカウント</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            ユーザーは、登録時に
            <span className="font-semibold">正確かつ最新の情報</span>
            を入力するものとします。
          </li>
          <li>
            アカウント情報（メールアドレス・パスワード等）の管理は、
            <span className="font-semibold">ユーザー本人の責任</span>
            で行ってください。
          </li>
          <li>
            アカウントの不正利用・なりすまし等により生じた損害について、
            運営側は原則として責任を負いません。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">4. 禁止事項</h2>
        <p className="mb-1">
          ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>他ユーザーや第三者への誹謗中傷、差別的・攻撃的な発言</li>
          <li>スパム行為、過度な宣伝・勧誘目的の利用</li>
          <li>著作権・肖像権・その他の権利を侵害する行為</li>
          <li>
            本サービスを通じて
            <span className="font-semibold">
              外部のブックメーカーやギャンブルへの直接的な勧誘・誘導
            </span>
            を行う行為
          </li>
          <li>
            金銭の貸し借り、投資勧誘など、
            <span className="font-semibold">
              金銭トラブルに直結しうるやり取り
            </span>
          </li>
        </ul>
        <p className="mt-2 text-xs text-white/70">
          ※ Uniterz を通じてユーザー間で発生した金銭トラブルについては、
          当事者同士の自己責任となり、運営側は介入・補償いたしません。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">
          5. サービス内容の変更・停止
        </h2>
        <p>
          運営側は、本サービスの
          <span className="font-semibold">
            機能追加・変更・一時停止・終了
          </span>
          を行うことがあります。
        </p>
        <p className="mt-2">
          システムメンテナンスや不具合対応等により、
          <span className="font-semibold">
            一時的にサービスが利用できなくなる
          </span>
          場合があります。あらかじめご了承ください。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">6. 免責事項</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            本サービスで提供される情報について、
            <span className="font-semibold">
              その完全性・正確性を保証するものではありません
            </span>
            。
          </li>
          <li>
            本サービスの利用、または利用できなかったことにより生じた損害
            （外部サービスでの損失を含む）について、
            運営側は責任を負いません。
          </li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">7. 知的財産権</h2>
        <p>
          本サービスに関するロゴ・デザイン・UI・プログラム等にかかる知的財産権は、
          運営者または正当な権利者に帰属します。
        </p>
        <p className="mt-2">
          ユーザーが本サービスに投稿した内容の著作権は原則ユーザーに帰属しますが、
          運営側は、
          <span className="font-semibold">
            サービスの運営・表示・分析等のために必要な範囲で、投稿内容を利用できる
          </span>
          ものとします。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">8. 規約の変更</h2>
        <p>
          運営側は、本規約の内容を変更することがあります。重要な変更がある場合は、
          <span className="font-semibold">
            アプリ内のお知らせ等で告知
          </span>
          を行います。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">
          9. 準拠法・裁判管轄
        </h2>
        <p>
          本規約は、日本法に準拠し解釈されます。本サービスに関連して紛争が生じた場合、
          運営者の指定する日本国内の裁判所を第一審の専属的合意管轄裁判所とします。
        </p>
      </section>
    </LegalPageLayout>
  );
}
