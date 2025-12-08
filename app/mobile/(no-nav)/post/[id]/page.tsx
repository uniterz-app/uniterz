"use client";

import { ArrowLeft } from "lucide-react";
import PostDetailClient from "./DetailClient";

export default function PostDetailPage() {
  const handleBack = () => {
    if (window.history.length > 1) window.history.back();
    else window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-[#0f2d35] text-white">
      {/* ===== 上部ヘッダー（戻るボタンのみ） ===== */}
      <div className="sticky top-0 z-20 flex items-center px-4 py-3 bg-[#0f2d35]/80 backdrop-blur">
        <button
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition"
          aria-label="戻る"
        >
          <ArrowLeft size={22} />
        </button>
      </div>

      {/* ===== 投稿カード本体 ===== */}
      <div className="max-w-3xl mx-auto px-4 py-6">
        <PostDetailClient />
      </div>
    </div>
  );
}
