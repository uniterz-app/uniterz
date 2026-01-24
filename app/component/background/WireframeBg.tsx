"use client";

import { motion } from "framer-motion";

export default function WireframeBg() {
  return (
    
    <div className="fixed inset-0 -z-30 pointer-events-none overflow-hidden">
      {/* ベースカラー */}
      <div className="absolute inset-0 bg-[#061f26]/30" />

      {/* 3Dワイヤー */}
      <motion.div
        className="absolute inset-[-40%]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(80,220,220,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(80,220,220,0.04) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
          transform: "rotateX(68deg) translateY(-35%)",
          transformOrigin: "top center",
        }}
        animate={{
          backgroundPositionY: ["0px", "60px"],
        }}
        transition={{
          duration: 16,
          ease: "linear",
          repeat: Infinity,
        }}
      />

      {/* 奥行きフェード */}
      <div
  className="absolute inset-0"
  style={{
    background: `
      radial-gradient(900px 420px at 15% -10%, rgba(0,220,255,0.12), transparent 60%),
      radial-gradient(700px 380px at 95% 15%, rgba(140,80,255,0.10), transparent 55%),
      linear-gradient(180deg, #061f26 0%, #041418 100%)
    `,
  }}
/>
    </div>
  );
}
