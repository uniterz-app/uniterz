"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import { authDisplayButton } from "../auth/authEnglishDisplay";
import cyberFieldStyles from "../auth/cyberAuthField.module.css";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";

type Props = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  language?: Language;
};

export default function LogoutConfirmModal({
  open,
  onClose,
  onConfirm,
  language = "ja",
}: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const isEn = language === "en";
  const title = isEn ? "Log out?" : "ログアウトしますか？";
  const cancelLabel = "Cancel";
  const confirmLabel = "Log out";

  const titleClass =
    "font-[family-name:var(--font-geist-sans)] text-sm leading-snug text-white/85 sm:text-[0.9375rem]";

  const baseBtn =
    "flex flex-1 items-center justify-center rounded-[14px] border-0 px-3 py-3 transition-[transform,filter,opacity] duration-100 ease-out";

  const tree = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-0 z-[110] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
          >
            <div
              className={[
                "relative isolate w-[90%] max-w-sm overflow-hidden rounded-2xl border border-white/12 p-6 text-white",
                "bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.03)_42%,rgba(255,255,255,0.018)_100%),linear-gradient(180deg,rgba(5,8,20,0.80)_0%,rgba(5,8,20,0.80)_100%)]",
                "backdrop-blur-xl",
                "shadow-[0_18px_44px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.20),inset_0_-1px_0_rgba(255,255,255,0.05)]",
              ].join(" ")}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="pointer-events-none absolute inset-0 z-0 rounded-2xl opacity-[0.32]"
                style={PROFILE_SHELL_GRID_STYLE}
                aria-hidden
              />
              <div className="relative z-10 flex flex-col items-center space-y-4 text-center">
                <motion.div
                  className="relative flex justify-center"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, duration: 0.35 }}
                >
                  {/* サインアップのメール欄 rightSlot と同系の枠 */}
                  <div className={cyberFieldStyles.rightSlot} style={{ position: "relative", inset: "auto", transform: "none" }}>
                    <div
                      className={cyberFieldStyles.rightSlotInner}
                      data-static="true"
                    >
                      <LogOut className="size-[18px] text-red-400/95" aria-hidden strokeWidth={2.25} />
                    </div>
                  </div>
                </motion.div>

                <motion.h2
                  className={titleClass}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12, duration: 0.35 }}
                >
                  {title}
                </motion.h2>

                <motion.div
                  className="mt-1 flex w-full gap-3"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.35 }}
                >
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onClose}
                    className={[
                      baseBtn,
                      authDisplayButton,
                      "cursor-pointer border border-white/14 bg-white/[0.07] backdrop-blur-md",
                      "shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_24px_rgba(0,0,0,0.3)]",
                      "hover:bg-white/[0.11]",
                    ].join(" ")}
                  >
                    {cancelLabel}
                  </motion.button>
                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onConfirm}
                    className={[
                      baseBtn,
                      authDisplayButton,
                      "cursor-pointer",
                      "bg-gradient-to-r from-red-600 via-rose-600 to-red-500",
                      "shadow-[0_10px_30px_rgba(220,38,38,0.38),0_12px_34px_rgba(244,63,94,0.22),inset_0_1px_0_rgba(255,255,255,0.12)]",
                      "ring-1 ring-inset ring-red-300/35",
                    ].join(" ")}
                  >
                    {confirmLabel}
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(tree, document.body);
}
