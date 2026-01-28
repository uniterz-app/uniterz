"use client";

import React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

type Variant = "web" | "mobile";

export default function CommunityGuidelinesPage({
  variant,
}: {
  variant: Variant;
}) {
  const router = useRouter();
  const isWeb = variant === "web";

  return (
    <div className="min-h-screen w-full bg-[#0a3b47] relative">
      {/* 戻るボタン（丸 ×） */}
      <button
        onClick={() => router.back()}
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full 
                   bg-white/10 backdrop-blur border border-white/20 
                   flex items-center justify-center text-white text-2xl 
                   shadow-[0_0_15px_rgba(0,0,0,0.4)] active:scale-95"
      >
        ×
      </button>

      <div
        className={
          isWeb
            ? "mx-auto max-w-3xl px-6 py-10 text-white"
            : "mx-auto max-w-[640px] px-4 py-8 text-white"
        }
      >
        {/* カード */}
        <div className="rounded-3xl bg-[#072d37] px-6 py-6 shadow-lg border border-white/10">
          {/* ヘッダー */}
          <div className="mb-4 flex items-center gap-3">
            {/* ロゴ */}
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/10 overflow-hidden">
              <Image
                src="/logo/logo.png"
                alt="Uniterz"
                width={40}
                height={40}
                className="object-contain"
              />
            </div>

            <div className="flex flex-col">
              <h1 className="text-xl md:text-2xl font-extrabold tracking-tight">
                コミュニティガイドライン
              </h1>
              <p className="mt-1 text-xs text-white/60">
                Uniterz を安心して楽しむために
              </p>
            </div>
          </div>

          {/* 本文 */}
          <div className="space-y-6 text-sm md:text-base leading-relaxed text-white/85">
            {/* 1 */}
            <section>
              <h2 className="text-lg font-bold mb-2">1. 禁止される行為</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>投資・ギャンブル・副業などへの勧誘</li>
                <li>「絶対当たる」「確実に儲かる」など誤解を招く表現</li>
                <li>外部サービス（LINE、情報商材等）への誘導</li>
                <li>金銭を伴う賭博行為の推奨</li>
                <li>他者への攻撃的・侮辱的な内容</li>
                <li>虚偽情報や実績の捏造、なりすまし</li>
                <li>無断転載など著作権侵害行為</li>
              </ul>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-lg font-bold mb-2">2. 投稿に関するルール</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>予想・分析は事実ベースで記述すること</li>
                <li>不正確な煽り・誤情報の投稿は禁止</li>
                <li>選手・チーム・他ユーザーへの過度な批判は禁止</li>
                <li>プロフィール文や投稿タイトルも同様に適用されます</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-lg font-bold mb-2">3. 違反時の対応</h2>
              <p>
                ガイドライン違反が確認された場合、以下の対応を行います：
              </p>
              <ul className="list-disc pl-5 space-y-1 mt-2">
                <li>軽度：投稿非表示・警告・修正依頼</li>
                <li>中度：一時的な利用制限</li>
                <li>重大：アカウント停止または永久BAN</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-lg font-bold mb-2">4. 安全なコミュニティのために</h2>
              <p>
                Uniterz は「予想 × 分析 × コミュニティ」を楽しむ場所です。
                すべてのユーザーが気持ちよく利用できるよう、ガイドライン遵守にご協力ください。
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
