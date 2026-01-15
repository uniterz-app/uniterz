// app/mobile/(no-nav)/terms/page.tsx
"use client";

import React from "react";
import LegalPageLayout from "@/app/component/settings/LegalPageLayout";

export default function MobileTermsPage() {
  return (
    <LegalPageLayout
      title="利用規約"
      description="Uniterz V2 におけるご利用条件をまとめたページです。ご利用前に必ずお読みください。"
      updatedAt="2025-12-08"
      variant="mobile"
    >
      <section className="space-y-6 text-sm leading-relaxed text-white/80">

        {/* 1 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            1. サービス概要
          </h2>
          <p>
            Uniterz（以下「本サービス」）は、
            <span className="font-semibold text-emerald-300">
              スポーツの試合に関する予想・分析・成績を共有する分析特化型コミュニティ
            </span>
            です。
          </p>
          <p className="mt-2">
            本サービスにおいて
            <span className="font-semibold text-amber-300">
              金銭のやり取り、賭博行為、ベット行為は一切行いません
            </span>
            。表示される数値、ユニット、スコア、ランキング等はすべて分析・可視化を目的とした指標であり、金銭的価値を有しません。
          </p>
        </div>

        {/* 2 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            2. 用語の定義
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>「予想」：試合結果に対するユーザーの見解。</li>
            <li>「分析指標」：勝率、ブライアスコア、スコア精度、アップセット的中率、一致度（Calibration）等。</li>
            <li>「Proプラン」：一部分析指標を高度化・拡張表示する有料機能。</li>
          </ul>
        </div>

        {/* 3 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            3. 規約の適用範囲
          </h2>
          <p>
            本規約は、本サービスの
            <span className="font-semibold text-sky-300">
              アプリ版・Web版・API・関連機能すべて
            </span>
            に適用されます。ユーザーは利用開始をもって本規約に同意したものとみなされます。
          </p>
        </div>

        {/* 4 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            4. アカウント
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>登録情報は正確かつ最新の内容を維持してください。</li>
            <li>アカウント管理責任はユーザー本人に帰属します。</li>
            <li>不正利用による損害について、運営は責任を負いません。</li>
          </ul>
        </div>

        {/* 5 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            5. 分析指標・スコアの取り扱い
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>分析指標は統計処理・アルゴリズムに基づく結果です。</li>
            <li>将来の結果を保証するものではありません。</li>
            <li>計算方法は改善のため変更されることがあります。</li>
            <li>無料表示とPro表示で内容が異なる場合があります。</li>
          </ul>
        </div>

        {/* 6 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            6. Proプラン
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>Proプランは有料機能を含む場合があります。</li>
            <li>料金・内容・解約条件は別途表示に従います。</li>
            <li>機能内容は変更されることがあります。</li>
          </ul>
        </div>

        {/* 7 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            7. 禁止事項
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>誹謗中傷・差別的発言</li>
            <li>スパム・なりすまし</li>
            <li>著作権等の侵害</li>
            <li>
              <span className="font-semibold text-amber-300">
                ギャンブルまたは投資への勧誘・誘導
              </span>
            </li>
            <li>金銭トラブルに発展する行為</li>
          </ul>
          <p className="mt-1 text-xs text-white/60">
            ※ ユーザー間のトラブルは当事者間で解決してください。
          </p>
        </div>

        {/* 8 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            8. サービスの変更・停止
          </h2>
          <p>
            機能の追加・変更・停止・終了を予告なく行う場合があります。メンテナンス等により一時利用できない場合があります。
          </p>
        </div>

        {/* 9 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            9. 免責事項
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>情報の正確性・完全性を保証しません。</li>
            <li>利用により生じた損害について、運営は責任を負いません。</li>
          </ul>
        </div>

        {/* 10 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            10. 知的財産権
          </h2>
          <p>
            本サービスに関する権利は運営または権利者に帰属します。
            投稿内容は表示・分析目的で利用されることがあります。
          </p>
        </div>

        {/* 11 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            11. 規約の変更
          </h2>
          <p>
            規約の変更はアプリ内で告知します。変更後の利用をもって同意したものとみなします。
          </p>
        </div>

        {/* 12 */}
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            12. 準拠法・裁判管轄
          </h2>
          <p>
            本規約は日本法に準拠し、紛争は日本国内の裁判所を専属管轄とします。
          </p>
        </div>

        {/* 13 */}
<div>
  <h2 className="mb-1 text-base font-semibold text-white">
    13. サブスクリプション（定期課金）について
  </h2>

  <p>
    Proプランは、月額または年額の定期課金（サブスクリプション）として提供されます。
    課金は、当社が利用する決済サービス（Stripe）を通じて処理されます。
  </p>

  <h3 className="mt-3 font-semibold text-white">
    自動更新
  </h3>
  <p>
    Proプランは、契約期間満了時に自動更新されます。
    解約手続きを行わない限り、次回の課金が発生します。
  </p>

  <h3 className="mt-3 font-semibold text-white">
    解約について
  </h3>
  <p>
    解約はアプリ内の所定の手続きから行うことができます。
    解約後も、すでに支払い済みの期間終了まではPro機能を利用できます。
    期間終了後は自動的に無料プランに戻ります。
  </p>

  <h3 className="mt-3 font-semibold text-white">
    返金について
  </h3>
  <p>
    サブスクリプションの性質上、原則として返金は行いません。
    ただし、当社が特別に認めた場合に限り、返金対応を行うことがあります。
  </p>

  <h3 className="mt-3 font-semibold text-white">
    価格・内容の変更
  </h3>
  <p>
    Proプランの料金、内容、提供条件は、事前の告知を行った上で変更される場合があります。
    変更内容はアプリ内で告知します。
  </p>
</div>

      </section>
    </LegalPageLayout>
  );
}
