"use client";

import { useMemo, type CSSProperties } from "react";
import { createPortal } from "react-dom";
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m as motion,
  useReducedMotion,
} from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Language } from "@/lib/i18n/language";
import { nameBebas } from "@/lib/fonts";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";

/** 削除確認・NO DATA と同系の Bebas 英字ラベル（UI 言語に依存しない） */
const CYBER_ACTION_CANCEL = "CANCEL";
const CYBER_ACTION_END = "END";

const endConfirmLabelStyle: CSSProperties = {
  color: "#ff6363",
  textShadow:
    "0 0 16px rgba(255,90,90,1), 0 0 36px rgba(239,68,68,0.95), 0 0 64px rgba(220,38,38,0.75), 0 0 96px rgba(153,27,27,0.45)",
};

const easeOut = [0.22, 1, 0.36, 1] as const;

const DIALOG_PANEL_CLASS = [
  "relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/18 p-5",
  "bg-linear-to-b from-white/12 via-cyan-950/25 to-zinc-950/50",
  "backdrop-blur-2xl backdrop-saturate-[1.8]",
  "shadow-[inset_0_1px_0_rgba(255,255,255,0.2),inset_0_-1px_0_rgba(0,0,0,0.25),0_28px_96px_rgba(0,0,0,0.55)]",
  "ring-1 ring-cyan-400/25",
].join(" ");

type Props = {
  open: boolean;
  groupName?: string;
  language: Language;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

function EndGroupConfirmDialog({
  open,
  groupName,
  language,
  busy,
  onCancel,
  onConfirm,
}: Props) {
  const prefersReducedMotion = useReducedMotion();

  const copy = useMemo(
    () =>
      language === "en"
        ? {
            title: "End this group?",
            named: groupName ? `"${groupName}"` : null,
            bullets: [
              "It will disappear from My Community.",
              "No one can join with the invite code after this.",
              "Ended groups don’t count toward how many you can own.",
            ],
          }
        : {
            title: "グループを終了しますか？",
            named: groupName ? `「${groupName}」` : null,
            bullets: [
              "マイコミュニティの一覧から消えます。",
              "これ以降、招待コードでは参加できません。",
              "終了したグループは「作れる数」に含まれません。",
            ],
          },
    [language, groupName]
  );

  if (!open) return null;

  return (
    <motion.div
      key="end-group-confirm"
      role="presentation"
      className="fixed inset-0 z-[1000010] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm pointer-events-auto"
      initial={prefersReducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={prefersReducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: 0.2, ease: easeOut }}
      onClick={() => {
        if (!busy) onCancel();
      }}
    >
      <motion.div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="end-group-confirm-title"
        className={DIALOG_PANEL_CLASS}
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={prefersReducedMotion ? undefined : { opacity: 0, scale: 0.98, y: 6 }}
        transition={{ duration: 0.24, ease: easeOut }}
        onClick={(e) => e.stopPropagation()}
      >
        <p
          id="end-group-confirm-title"
          className="px-1 py-1 text-center text-sm font-semibold text-white/95 drop-shadow-[0_1px_8px_rgba(0,0,0,0.45)] sm:text-base"
        >
          {copy.title}
        </p>
        {copy.named ? (
          <p className="mt-1 text-center text-xs text-white/55">{copy.named}</p>
        ) : null}
        <ul className="mt-4 space-y-2 px-1 text-left text-sm leading-relaxed text-white/78">
          {copy.bullets.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div className="mt-5 flex w-full flex-row items-center justify-between gap-3">
          <motion.button
            type="button"
            disabled={busy}
            className={[
              "group relative flex h-[2.9em] min-w-[8.5em] shrink-0 items-center justify-start gap-2 overflow-hidden rounded-[11px]",
              "border-2 border-cyan-400/55 bg-white/6 px-3 backdrop-blur-md",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]",
              "transition-all duration-500 ease-out",
              "hover:border-cyan-300/85 hover:bg-cyan-500/22 disabled:pointer-events-none disabled:opacity-45",
            ].join(" ")}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            onClick={onCancel}
          >
            <ArrowLeft
              className={[
                "h-[1.35em] w-[1.35em] shrink-0 text-cyan-200/95",
                "transition-transform duration-500 ease-out",
                "group-hover:-translate-x-1.5",
              ].join(" ")}
              aria-hidden
            />
            <span
              className={[
                nameBebas.className,
                "text-[0.95rem] leading-none tracking-[0.14em] sm:text-[1.05rem]",
              ].join(" ")}
              style={cyberNoDataLabelStyle}
            >
              {CYBER_ACTION_CANCEL}
            </span>
          </motion.button>
          <motion.button
            type="button"
            disabled={busy}
            className={[
              "group relative flex h-[2.9em] min-w-[8.5em] shrink-0 items-center justify-center overflow-hidden rounded-[11px] px-3",
              "border-2 border-red-600 bg-white/6 backdrop-blur-md",
              "shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_0_22px_rgba(220,38,38,0.45),0_0_40px_rgba(185,28,28,0.22)]",
              "transition-all duration-500 ease-out",
              "hover:border-red-500 hover:bg-red-700/45 hover:shadow-[0_0_36px_rgba(239,68,68,0.55),0_0_56px_rgba(220,38,38,0.35)] disabled:pointer-events-none disabled:opacity-45",
            ].join(" ")}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            onClick={() => void onConfirm()}
          >
            <span
              className={[
                nameBebas.className,
                "text-center text-[0.95rem] leading-none tracking-[0.14em] sm:text-[1.05rem]",
              ].join(" ")}
              style={endConfirmLabelStyle}
            >
              {busy ? "…" : CYBER_ACTION_END}
            </span>
            <ArrowRight
              className={[
                "pointer-events-none absolute right-3 top-1/2 h-[1.35em] w-[1.35em] -translate-y-1/2 shrink-0 text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.85)]",
                "transition-transform duration-500 ease-out",
                "group-hover:translate-x-0.5 group-hover:text-red-300",
              ].join(" ")}
              aria-hidden
            />
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function EndGroupConfirmModal(props: Props) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <LazyMotion features={domAnimation}>
      <AnimatePresence>{props.open ? <EndGroupConfirmDialog {...props} /> : null}</AnimatePresence>
    </LazyMotion>,
    document.body
  );
}
