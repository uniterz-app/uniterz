"use client";

import { useRouter } from "next/navigation";

export default function FloatingCloseButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="fixed top-4 right-4 z-50 h-11 w-11 rounded-full border border-white/20 bg-white/10 text-white shadow-[0_8px_18px_rgba(0,0,0,0.35)] backdrop-blur active:scale-95"
      aria-label="閉じる"
    >
      <span className="text-2xl font-bold leading-none">×</span>
    </button>
  );
}
