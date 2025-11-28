"use client";

import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import SearchTab from "./SearchTab";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function SearchTabModal({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* ===== 背景ブラー ONLY ===== */}
          <motion.div
            className="
              fixed inset-0 z-40
              backdrop-blur-lg
              bg-black/5
            "
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* ===== モーダル本体 ===== */}
          <motion.div
            className="
              fixed inset-x-0 top-0 z-50
              flex flex-col
              max-w-xl mx-auto w-full
              bg-[var(--color-app-bg,#0b2126)]/60
              backdrop-blur-xl
              border-b border-white/10
            "
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.20 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ===== 上部ヘッダー（閉じるだけ） ===== */}
            <div
              className="
                flex items-center justify-between
                px-4 py-4
                bg-[var(--color-app-bg,#0b2126)]/80
                backdrop-blur-xl
                border-b border-white/10
              "
            >
              <div className="text-lg font-bold text-white">検索</div>

              <button
                onClick={onClose}
                className="h-9 w-9 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>

            {/* ===== SearchTab 本体 ===== */}
            <div
              className="
                max-h-[75vh]
                overflow-y-auto
                bg-[var(--color-app-bg,#0b2126)]/40
                backdrop-blur-xl
                px-4 py-4
              "
            >
              <SearchTab />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
