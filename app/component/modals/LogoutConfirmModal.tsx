"use client";

import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function LogoutConfirmModal({ open, onClose, onConfirm }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* 背景フェード */}
          <motion.div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* モーダル */}
          <motion.div
            className="fixed z-50 inset-0 flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
          >
            <div className="bg-neutral-900 text-white rounded-2xl p-6 w-[90%] max-w-sm shadow-2xl border border-white/10">
              <div className="flex flex-col items-center text-center space-y-4">
                
                {/* アイコンをスライドイン表示 */}
                <motion.div
                  className="p-4 rounded-full bg-neutral-800"
                  initial={{ opacity: 0, y: -15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                >
                  <motion.div
                    initial={{ rotate: -30 }}
                    animate={{ rotate: 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 10 }}
                  >
                    <LogOut className="w-10 h-10 text-red-400" />
                  </motion.div>
                </motion.div>

                {/* タイトル */}
                <motion.h2
                  className="text-lg font-semibold"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.4 }}
                >
                  ログアウトしますか？
                </motion.h2>

                {/* ボタン */}
                <motion.div
                  className="flex gap-3 w-full mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="flex-1 py-2 rounded-lg bg-neutral-800 text-gray-300 hover:bg-neutral-700 transition"
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onConfirm}
                    className="flex-1 py-2 rounded-lg bg-red-500 text-white font-medium hover:bg-red-600 transition"
                  >
                    Log out
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
