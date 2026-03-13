"use client";

import { motion } from "framer-motion";

export default function CyberOverlay() {
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* 暗いベール（既存背景を残しつつサイバー化） */}
      <div className="absolute inset-0 bg-black/45" />

      {/* 深いネオン霧（ポップじゃなく暗め） */}
      <motion.div
        className="absolute inset-0 mix-blend-screen opacity-100"
        style={{
          backgroundImage:
            "radial-gradient(circle at 18% 22%, rgba(0,255,255,0.20), transparent 55%)," +
            "radial-gradient(circle at 82% 28%, rgba(255,0,180,0.10), transparent 60%)," +
            "radial-gradient(circle at 30% 86%, rgba(0,180,255,0.12), transparent 58%)," +
            "radial-gradient(circle at 78% 86%, rgba(140,60,255,0.10), transparent 60%)",
          backgroundSize: "220% 220%",
        }}
        animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
        transition={{ duration: 26, repeat: Infinity, repeatType: "mirror", ease: "linear" }}
      />

      {/* 斜めビーム（近未来感） */}
      <motion.div
        className="absolute inset-0 mix-blend-screen opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(115deg," +
            "transparent 0%," +
            "rgba(0,255,255,0.14) 18%," +
            "transparent 32%," +
            "rgba(255,0,180,0.10) 52%," +
            "transparent 68%," +
            "rgba(0,255,180,0.08) 82%," +
            "transparent 100%)",
          backgroundSize: "160% 160%",
        }}
        animate={{ backgroundPosition: ["0% 50%", "100% 50%"] }}
        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
      />

      {/* サイバーグリッド（細い） */}
      <div
        className="absolute inset-0 mix-blend-screen opacity-[0.10]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.10) 1px, transparent 1px)," +
            "linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
          backgroundSize: "92px 92px",
        }}
      />

      {/* スキャンライン（必須） */}
      <div
        className="absolute inset-0 opacity-[0.14]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 1px, transparent 1px, transparent 7px)",
        }}
      />

      {/* ノイズ（テクスチャ） */}
      <div
        className="absolute inset-0 mix-blend-overlay opacity-[0.06]"
        style={{
          backgroundImage:
            "repeating-radial-gradient(circle at 40% 40%, rgba(255,255,255,0.35) 0 1px, transparent 1px 8px)",
          backgroundSize: "160px 160px",
        }}
      />
    </div>
  );
}
