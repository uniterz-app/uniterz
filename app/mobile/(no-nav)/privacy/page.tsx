// app/mobile/(no-nav)/privacy/page.tsx
"use client";

import React from "react";
import LegalPageLayout from "@/app/component/settings/LegalPageLayout";

export default function MobilePrivacyPage() {
  return (
    <LegalPageLayout
      title="プライバシーポリシー"
      description="Uniterz におけるユーザー情報の取り扱いについて説明するページです。"
      updatedAt="2025-11-17"
      variant="mobile"
    >
      <section className="space-y-6 text-sm leading-relaxed text-white/80">
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            1. 取得する情報
          </h2>
          <p>本サービスは、主に次のような情報を取得します。</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>登録時に入力されたニックネーム・メールアドレスなどの情報</li>
            <li>投稿内容・いいね・ブックマークなど、アプリ内での行動履歴</li>
            <li>端末情報やログ情報（アクセス日時・IP アドレス等）</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            2. 情報の利用目的
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>本サービスの提供・運営・機能改善のため</li>
            <li>ユーザーの成績集計やランキング表示のため</li>
            <li>不正利用の監視や対応など、安全な運営のため</li>
            <li>キャンペーンや重要なお知らせの配信のため</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            3. 情報の第三者提供
          </h2>
          <p>
            法令に基づく場合を除き、
            <span className="font-semibold text-emerald-300">
              ユーザーの同意なく個人を特定できる形で第三者に提供することはありません
            </span>
            。
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            4. 外部サービスの利用
          </h2>
          <p>
            アクセス解析や認証のために、外部サービスを利用する場合があります。その際、外部サービス事業者がクッキー等を通じて情報を取得することがありますが、利用目的や取り扱いは各事業者のプライバシーポリシーに従います。
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            5. 情報の管理
          </h2>
          <p>
            取得した情報は、
            <span className="font-semibold text-emerald-300">
              不正アクセスや漏えい等が起きないよう適切な安全管理
            </span>
            を行います。利用目的の達成に必要な範囲で情報を保存し、不要になった情報は順次削除または匿名化します。
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            6. ユーザーの権利
          </h2>
          <p>
            ユーザーは、自身の情報について
            <span className="font-semibold text-sky-300">
              確認・訂正・削除
            </span>
            を求めることができます。具体的な方法については、アプリ内のお問い合わせ手段からご連絡ください。
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            7. プライバシーポリシーの変更
          </h2>
          <p>
            本ポリシーの内容は、必要に応じて変更されることがあります。重要な変更がある場合は、
            <span className="font-semibold text-sky-300">
              アプリ内のお知らせ等で告知
            </span>
            します。
          </p>
        </div>
      </section>
    </LegalPageLayout>
  );
}
