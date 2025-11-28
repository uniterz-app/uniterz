// app/mobile/(with-nav)/guidelines/page.tsx
"use client";

import LegalPageLayout from "@/app/component/settings/LegalPageLayout";

export default function MobileCommunityGuidelinesPage() {
  return (
    <LegalPageLayout
      variant="mobile"
      title="コミュニティガイドライン"
      description="Uniterz を気持ちよく使うためのルールとマナーをまとめています。"
      updatedAt="2025-11-17"
    >
      <section className="space-y-2">
        <h2 className="text-base font-semibold mb-1">1. Uniterz の考え方</h2>
        <p>
          Uniterz は、
          <span className="font-semibold">
            「スポーツの予想や分析を共有して楽しむコミュニティ」
          </span>
          です。
        </p>
        <p>
          互いを尊重しながら、試合の見解や数字の見方を共有し、
          <span className="font-semibold">「うまくなるための場」</span>
          として育てていきたいと考えています。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold mb-1">2. 投稿・コメントのマナー</h2>
        <p className="mb-1">次のような姿勢での利用を推奨します。</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            他ユーザーの予想や成績についても、
            <span className="font-semibold">リスペクトのあるコメント</span>
            を心がける
          </li>
          <li>
            「当たった / 外れた」で終わらせず、
            <span className="font-semibold">根拠や振り返りを共有</span>
            していく
          </li>
          <li>
            特定のチーム / 選手 / ユーザーを
            <span className="font-semibold">一方的に貶める表現は避ける</span>
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold mb-1">3. 禁止される行為の例</h2>
        <p className="mb-1">
          以下のような行為は、アカウント制限や投稿削除などの対象になる場合があります。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            個人への攻撃・誹謗中傷・差別的な発言、
            <span className="font-semibold">ハラスメント行為</span>
          </li>
          <li>
            スパム投稿や、明らかに
            <span className="font-semibold">宣伝のみを目的とした投稿</span>
          </li>
          <li>
            他人の著作物（文章・画像・動画など）を、
            <span className="font-semibold">無断で転載</span>
            する行為
          </li>
          <li>
            本サービスを通じて、
            <span className="font-semibold">
              お金のやり取り・ギャンブルサイトへの勧誘
            </span>
            を行う行為
          </li>
          <li>
            その他、利用規約に反する行為や、
            <span className="font-semibold">
              運営が不適切と判断した行為
            </span>
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold mb-1">
          4. 予想・ユニットに関する注意点
        </h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Uniterz 内で扱う
            <span className="font-semibold">「ユニット」は仮想ポイント</span>
            であり、実際のお金とは直接結びつきません。
          </li>
          <li>
            投稿された予想はあくまで
            <span className="font-semibold">個人の見解</span>であり、
            <span className="font-semibold">
              投資・ギャンブルなどの勧誘や助言を目的としたものではありません
            </span>
            。
          </li>
          <li>
            外部サービス（ブックメーカー等）で発生した損失について、
            <span className="font-semibold">
              本サービスおよび他ユーザーは責任を負いません
            </span>
            。
          </li>
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold mb-1">
          5. ガイドライン違反への対応
        </h2>
        <p className="mb-1">
          ガイドラインに反する行為が確認された場合、必要に応じて以下の対応を行うことがあります。
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>投稿内容の修正依頼や削除</li>
          <li>一時的なアカウント利用制限</li>
          <li>悪質な場合の、アカウント停止・退会措置</li>
        </ul>
        <p>
          できるだけ
          <span className="font-semibold">
            事前の注意喚起や対話を優先
          </span>
          しますが、緊急性が高いと判断した場合には、
          運営判断で迅速に対応することがあります。
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-base font-semibold mb-1">
          6. ガイドラインの見直し・更新
        </h2>
        <p>
          本コミュニティガイドラインは、サービスの成長や機能追加に合わせて
          <span className="font-semibold">内容を変更・追加</span>
          することがあります。
        </p>
        <p>
          重要な変更がある場合は、
          <span className="font-semibold">
            アプリ内のお知らせなどで告知
          </span>
          します。最新のガイドラインを確認したうえで、
          Uniterz をお楽しみください。
        </p>
      </section>
    </LegalPageLayout>
  );
}
