// app/web/(with-nav)/legal/terms/page.tsx
"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";

export default function WebTermsPage() {
  return (
    <LegalPageLayout
      variant="web"
      title="利用規約（Terms of Service）"
      description="Uniterz V2 におけるご利用条件を定めたページです。ご利用前に必ずお読みください。"
      updatedAt="2025-12-08"
    >
      <section>
        <h2 className="text-base font-semibold mb-1">1. サービスの概要</h2>
        <p>
          Uniterz（以下「本サービス」）は、スポーツの試合に関する予想、結果、各種分析指標を投稿・閲覧できる
          <span className="font-semibold">分析特化型コミュニティサービス</span>
          です。
        </p>
        <p className="mt-2">
          本サービス上では、
          <span className="font-semibold">金銭の受渡し、賭博、ベット等は一切行いません</span>。
          表示される数値、スコア、ユニット、ランキング等は
          <span className="font-semibold">すべて分析・可視化を目的とした指標</span>
          であり、金銭的価値を有しません。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">2. 用語の定義</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>「予想」：試合結果に対するユーザーの主観的見解を数値・テキストで表現したもの。</li>
          <li>「分析指標」：勝率、ブライアスコア、スコア精度、アップセット指数、一致度（Calibration）等の統計的指標。</li>
          <li>「一致度（Calibration）」：予測確率と実結果の乖離から算出される信頼性指標。</li>
          <li>「Proプラン」：分析指標の一部を高度化・拡張表示する有料プラン。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">3. 規約の適用範囲</h2>
        <p>
          本規約は、本サービスに関連する
          <span className="font-semibold">アプリ版・Web版・API・その他すべての提供機能</span>
          に適用されます。
        </p>
        <p className="mt-2">ユーザーは利用開始をもって本規約に同意したものとみなされます。</p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">4. アカウント</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>登録情報は正確かつ最新の内容を維持してください。</li>
          <li>アカウント管理責任はユーザー本人に帰属します。</li>
          <li>不正利用により生じた損害について、運営は原則責任を負いません。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">5. 分析指標・スコアの取り扱い</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>表示される指標は統計処理・アルゴリズムに基づく計算結果です。</li>
          <li>将来の結果を保証するものではありません。</li>
          <li>計算方法は改善のため予告なく変更されることがあります。</li>
          <li>無料表示とPro表示で内容・粒度が異なる場合があります。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">6. Proプラン</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>Proプランは月額・年額等の有料機能を含む場合があります。</li>
          <li>料金、提供内容、解約条件は別途定める表示に従います。</li>
          <li>機能内容は変更・追加・削除されることがあります。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">7. 禁止事項</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>誹謗中傷、差別的表現、嫌がらせ行為</li>
          <li>スパム、過度な勧誘、なりすまし</li>
          <li>著作権等の侵害</li>
          <li>
            <span className="font-semibold">
              ギャンブル・投資への直接的誘導または斡旋
            </span>
          </li>
          <li>金銭トラブルに発展するやり取り</li>
        </ul>
        <p className="mt-2 text-xs text-white/70">
          ※ ユーザー間で発生したトラブルは当事者間で解決するものとします。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">8. サービスの変更・停止</h2>
        <p>
          機能の追加・変更・停止・終了を予告なく行う場合があります。
          メンテナンスにより一時利用できない場合があります。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">9. 免責事項</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>情報の正確性・完全性を保証しません。</li>
          <li>利用により生じた損害について、運営は責任を負いません。</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">10. 知的財産権</h2>
        <p>
          本サービスに関する権利は運営または権利者に帰属します。
          投稿内容は運営により表示・分析目的で利用できるものとします。
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">11. 規約の変更</h2>
        <p>重要な変更はアプリ内にて告知します。</p>
      </section>

      <section>
        <h2 className="text-base font-semibold mb-1">12. 準拠法・裁判管轄</h2>
        <p>
          日本法に準拠し、紛争は日本国内の裁判所を専属管轄とします。
        </p>
      </section>
    </LegalPageLayout>
  );
}
