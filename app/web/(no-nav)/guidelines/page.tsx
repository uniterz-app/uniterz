// app/web/(with-nav)/guidelines/page.tsx
"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";

export default function WebCommunityGuidelinesPage() {
  return (
    <LegalPageLayout
      variant="web"
      title="コミュニティガイドライン"
      description="Uniterz V2 を安心して利用するための行動指針です。"
      updatedAt="2025-12-08"
    >
      {/* 1 */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold mb-1">1. Uniterz V2 の基本方針</h2>
        <p>
          Uniterz は、
          <span className="font-semibold">
            「スポーツ分析を共有し、互いに成長するためのプラットフォーム」
          </span>
          です。
        </p>
        <p>
          勝敗の的中だけではなく、スコア予想、戦力評価、確率思考、
          データの読み方などを共有し、
          <span className="font-semibold">分析力を高める場</span>
          として運営されています。
        </p>
      </section>

      {/* 2 */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold mb-1">2. 推奨される行動</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>他ユーザーの視点・意見・分析を尊重する</li>
          <li>結果だけでなく、根拠や考え方を共有する</li>
          <li>数値・指標を用いた建設的な議論を行う</li>
          <li>失敗も学びとして共有する</li>
        </ul>
      </section>

      {/* 3 */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold mb-1">3. 禁止行為</h2>
        <p className="mb-1">
          以下に該当する行為は禁止されます。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>誹謗中傷、差別、ハラスメント</li>
          <li>荒らし行為、過度な煽り、個人攻撃</li>
          <li>虚偽情報の流布</li>
          <li>スパム投稿・自動投稿</li>
          <li>著作権・肖像権侵害</li>
          <li>
            <span className="font-semibold">
              ギャンブル・投資サービスへの誘導
            </span>
          </li>
        </ul>
      </section>

      {/* 4 */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold mb-1">
          4. 数値・指標の取り扱いについて
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>表示される指標は、統計的評価であり将来の結果を保証するものではありません。</li>
          <li>他ユーザーの指標を批判目的で使用しないでください。</li>
          <li>指標の定義・計算式は変更される場合があります。</li>
          <li>無料機能とPro機能には表示項目・精度に差があります。</li>
        </ul>
      </section>

{/* 5 */}
<div>
  <h2 className="text-base font-semibold mb-1">
    5. 予想・分析内容に関する注意
  </h2>
  <ul className="list-disc pl-5 space-y-1">
    <li>本サービスで扱う数値や指標は、分析・可視化を目的としたものです。</li>
    <li>投稿内容はユーザー個人の見解であり、投資・賭博等の助言ではありません。</li>
    <li>本サービスの利用により生じた判断や結果について、運営は責任を負いません。</li>
  </ul>
</div>

      {/* 6 */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold mb-1">
          6. アカウントに関するルール
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>なりすまし行為の禁止</li>
          <li>複数アカウントによる不正利用の禁止</li>
          <li>不正なランキング操作・集計妨害の禁止</li>
        </ul>
      </section>

      {/* 7 */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold mb-1">
          7. 違反時の措置
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>投稿の削除・編集依頼</li>
          <li>アカウントの一時停止</li>
          <li>重大な場合のアカウント凍結</li>
        </ul>
        <p className="text-xs opacity-70">
          サービス秩序を維持するため、運営判断により即時対応する場合があります。
        </p>
      </section>

      {/* 8 */}
      <section className="space-y-2">
        <h2 className="text-base font-semibold mb-1">
          8. ガイドラインの改定
        </h2>
        <p>
          本ガイドラインは、運営方針・機能追加等に伴い変更することがあります。
          重要な変更はアプリ内にて告知されます。
        </p>
      </section>
    </LegalPageLayout>
  );
}
