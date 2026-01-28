// app/mobile/(with-nav)/guidelines/page.tsx
"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";

export default function MobileCommunityGuidelinesPage() {
  return (
    <LegalPageLayout
      variant="mobile"
      title="コミュニティガイドライン"
      description="Uniterz V2 を安心して利用するための行動指針です。"
      updatedAt="2025-12-08"
    >
      <section className="space-y-3">

        {/* 1 */}
        <div>
          <h2 className="text-base font-semibold mb-1">
            1. Uniterz V2 の基本方針
          </h2>
          <p>
            Uniterz は、
            <span className="font-semibold">
              「スポーツ分析を共有し、互いに成長する場」
            </span>
            です。
          </p>
          <p>
            勝敗だけでなく、スコア予想、戦力分析、確率の考え方などを共有し、
            <span className="font-semibold">
              データリテラシーを高めるコミュニティ
            </span>
            を目指します。
          </p>
        </div>

        {/* 2 */}
        <div>
          <h2 className="text-base font-semibold mb-1">
            2. 推奨される行動
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>他ユーザーの意見・分析を尊重する</li>
            <li>結果だけでなく根拠や視点を共有する</li>
            <li>数値・データを用いた建設的な議論を行う</li>
            <li>敗因・成功要因を冷静に振り返る</li>
          </ul>
        </div>

        {/* 3 */}
        <div>
          <h2 className="text-base font-semibold mb-1">
            3. 禁止行為
          </h2>
          <p className="mb-1">
            次の行為は禁止されています。
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>誹謗中傷、差別、ハラスメント</li>
            <li>荒らし、煽り、執拗な攻撃</li>
            <li>虚偽情報の拡散</li>
            <li>スパム投稿・自動ツールによる投稿</li>
            <li>著作権を侵害する投稿</li>
            <li>
              <span className="font-semibold">
                ギャンブル・投資・金銭取引への誘導
              </span>
            </li>
          </ul>
        </div>

        {/* 4 */}
        <div>
          <h2 className="text-base font-semibold mb-1">
            4. 数値・指標の取り扱い
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>指標は統計的評価であり、絶対的な正解ではありません。</li>
            <li>他者の数値を煽り目的で使用しないでください。</li>
            <li>指標は改善や仕様変更される場合があります。</li>
            <li>無料版と Pro 表示の違いを理解した上で利用してください。</li>
          </ul>
        </div>

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
        <div>
          <h2 className="text-base font-semibold mb-1">
            6. アカウントとマナー
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>なりすましの禁止</li>
            <li>複数アカウントによる不正行為の禁止</li>
            <li>他人になりすます行為の禁止</li>
          </ul>
        </div>

        {/* 7 */}
        <div>
          <h2 className="text-base font-semibold mb-1">
            7. 違反時の対応
          </h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>投稿削除</li>
            <li>利用制限・一時停止</li>
            <li>重度の場合、アカウント停止</li>
          </ul>
          <p className="mt-1 text-xs text-white/60">
            運営は、健全な運営のため、必要と判断した措置を講じます。
          </p>
        </div>

        {/* 8 */}
        <div>
          <h2 className="text-base font-semibold mb-1">
            8. ガイドラインの改定
          </h2>
          <p>
            本ガイドラインは、サービス改善のため更新されることがあります。
            重要な変更はアプリ内で告知されます。
          </p>
        </div>

      </section>
    </LegalPageLayout>
  );
}
