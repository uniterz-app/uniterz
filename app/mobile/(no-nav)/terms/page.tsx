// app/mobile/(no-nav)/terms/page.tsx
"use client";

import React from "react";
import LegalPageLayout from "@/app/component/settings/LegalPageLayout";

export default function MobileTermsPage() {
  return (
    <LegalPageLayout
      title="利用規約"
      description="Uniterz を安全に楽しんでいただくためのルールをまとめたページです。ご利用の前に必ずお読みください。"
      updatedAt="2025-11-17"
      variant="mobile"
    >
      <section className="space-y-6 text-sm leading-relaxed text-white/80">
        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            1. サービス概要
          </h2>
          <p>
            Uniterz（以下「本サービス」）は、
            <span className="font-semibold text-emerald-300">
              スポーツの予想や分析を投稿・共有するコミュニティ
            </span>
            です。アプリ上で実際のお金のやり取りや賭け行為は行いません。
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            2. 規約の適用範囲
          </h2>
          <p>
            本利用規約（以下「本規約」）は、本サービスの
            <span className="font-semibold text-sky-300">
              アプリ版および Web 版
            </span>
            の利用に関する条件を定めるものです。ユーザーは本サービスを利用することで、本規約に同意したものとみなされます。
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            3. アカウント
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              登録にあたっては、
              <span className="font-semibold text-emerald-300">
                正確な情報
              </span>
              を入力してください。
            </li>
            <li>
              パスワード等の管理はユーザー本人の責任で行ってください。第三者による不正利用があっても、運営側は原則として責任を負いません。
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            4. 禁止事項
          </h2>
          <p className="mb-1">
            ユーザーは、本サービスの利用にあたり、次の行為を行ってはいけません。
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>他のユーザーや第三者への誹謗中傷・差別的な発言</li>
            <li>スパム投稿や過度な宣伝行為</li>
            <li>著作権・肖像権・プライバシーなど第三者の権利侵害</li>
            <li>
              本サービスを通じた
              <span className="font-semibold text-amber-300">
                金銭の勧誘やギャンブルサービスへの直接誘導
              </span>
            </li>
          </ul>
          <p className="mt-1">
            本サービスを通じて発生したユーザー間の金銭トラブルについて、
            運営側は一切の責任を負いません。
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            5. サービスの変更・停止
          </h2>
          <p>
            運営側は、必要に応じて本サービスの
            <span className="font-semibold text-sky-300">
              機能追加・変更・一時停止・終了
            </span>
            を行うことがあります。システムメンテナンスや不具合対応等により、一時的にサービスを利用できない場合があります。
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            6. 免責事項
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              本サービスで提供される情報の正確性・完全性について、
              <span className="font-semibold text-emerald-300">
                その保証はできません
              </span>
              。
            </li>
            <li>
              ユーザーが本サービスの情報をもとに行った行動の結果（例：
              外部サイトやブックメーカーでの損失など）について、
              運営側は責任を負いません。
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            7. 知的財産権
          </h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              ロゴ・デザイン・UI など、本サービスに関する知的財産権は、
              原則として運営側に帰属します。
            </li>
            <li>
              ユーザーが投稿した内容については、
              <span className="font-semibold text-emerald-300">
                本サービスの運営・表示・分析のための範囲
              </span>
              で、運営側が利用できるものとします。
            </li>
          </ul>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            8. 規約の変更
          </h2>
          <p>
            運営側は、必要に応じて本規約を変更することがあります。重要な変更がある場合は、
            <span className="font-semibold text-sky-300">
              アプリ内のお知らせ等で告知
            </span>
            します。変更後も本サービスを利用した場合、変更後の規約に同意したものとみなされます。
          </p>
        </div>

        <div>
          <h2 className="mb-1 text-base font-semibold text-white">
            9. 準拠法・裁判管轄
          </h2>
          <p>
            本規約は、日本法を準拠法とします。本サービスに関して紛争が生じた場合には、
            運営者の所在地を管轄する日本の裁判所を第一審の専属的合意管轄裁判所とします。
          </p>
        </div>
      </section>
    </LegalPageLayout>
  );
}
