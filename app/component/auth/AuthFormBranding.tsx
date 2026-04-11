"use client";

import { authBrandWordmark } from "./authEnglishDisplay";

/**
 * ログイン／新規作成カード上部の UNITERZ ＋シアンの発光ライン（バナー写真参照）
 */
export default function AuthFormBranding() {
  return (
    <div className="-mt-1 mb-4 text-center sm:-mt-0.5 sm:mb-5">
      <p className={authBrandWordmark}>UNITERZ</p>
      <div
        className="mx-auto mt-3.5 h-px w-[min(220px,88%)] max-w-full bg-gradient-to-r from-transparent via-cyan-400/85 to-transparent shadow-[0_0_14px_rgba(34,211,238,0.5)]"
        aria-hidden
      />
    </div>
  );
}
