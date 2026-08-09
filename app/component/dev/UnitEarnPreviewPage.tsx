"use client";

/**
 * /mobile/unit-earn-preview · /dev/unit-earn-preview
 * Unit 獲得演出（中央カウント → 金庫加算）の確認用。
 */
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import { useCountUp } from "@/lib/hooks/useCountUp";
import UnitEarnOverlay from "@/app/component/profile/UnitEarnOverlay";
import UnitEarnPlayButton from "@/app/component/profile/UnitEarnPlayButton";
import {
  UNIT_EARN_VAULT_COUNT_MS,
  UNIT_VAULT_DATA_ATTR,
} from "@/lib/units/unitEarnMotion";
import { unitEarnPreviewPlayEntry } from "@/lib/units/unitEarnPreview";

const PRESETS = [50, 120, 250, 1000] as const;
const DEFAULT_AMOUNT = 250;

export default function UnitEarnPreviewPage() {
  const reduceMotion = useReducedMotion() === true;
  const [balance, setBalance] = useState(1840);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [pending, setPending] = useState<{
    amount: number;
    from: number;
    to: number;
    title: string | null;
    subtitle: string | null;
    rank: number | null;
  } | null>(null);
  const [absorbed, setAbsorbed] = useState(false);
  const [countLatch, setCountLatch] = useState(false);

  const vaultBalance = pending
    ? absorbed
      ? pending.to
      : pending.from
    : balance;

  useEffect(() => {
    if (absorbed) {
      setCountLatch(true);
      return;
    }
    if (pending) setCountLatch(false);
  }, [absorbed, pending]);

  const counting =
    !reduceMotion && (!pending || absorbed || countLatch);
  const displayBalance = useCountUp(
    vaultBalance,
    UNIT_EARN_VAULT_COUNT_MS,
    counting,
    0,
    "target"
  );

  useEffect(() => {
    if (!countLatch || absorbed) return;
    if (displayBalance >= vaultBalance) setCountLatch(false);
  }, [absorbed, countLatch, displayBalance, vaultBalance]);

  const play = useCallback(
    (amount: number, meta?: {
      title?: string | null;
      subtitle?: string | null;
      rank?: number | null;
    }) => {
      if (pending) return;
      const from = balance;
      const to = balance + amount;
      setAbsorbed(false);
      setCountLatch(false);
      setPending({
        amount,
        from,
        to,
        title: meta?.title ?? "月間ランキング",
        subtitle: meta?.subtitle ?? "2026年1月 · NBA",
        rank: meta?.rank ?? 8,
      });
    },
    [balance, pending]
  );

  const playRankedPreview = useCallback(() => {
    const entry = unitEarnPreviewPlayEntry(previewIndex, true);
    setPreviewIndex((i) => i + 1);
    play(entry.amount, {
      title: entry.title,
      subtitle: entry.subtitle,
      rank: entry.rank,
    });
  }, [play, previewIndex]);

  return (
    <main className="min-h-screen bg-[#03080d] px-4 py-8 text-white">
      <div className="relative mx-auto w-full max-w-[420px]">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-300/80",
          ].join(" ")}
        >
          Preview
        </p>
        <h1
          className={[
            nameRajdhani.className,
            "mt-1 text-2xl font-bold text-white",
          ].join(" ")}
        >
          Unit Earn Animation
        </h1>
        <p className="mt-2 text-sm text-white/50">
          中央で獲得 Unit をカウントアップし、プロフィールの金庫へ飛んで加算する演出。
        </p>

        <div className="relative mt-6 min-h-[72px] rounded border border-white/10 bg-white/[0.03] px-3 py-3">
          <span className="text-xs text-white/45">Profile vault (右上角)</span>
          <div className="profile-edit-kinetik-unit-vault-anchor">
            <motion.div
              {...{ [UNIT_VAULT_DATA_ATTR]: "1" }}
              className={[
                "profile-edit-kinetik-unit-vault profile-edit-kinetik-unit-vault--corner",
                absorbed ? "profile-edit-kinetik-unit-vault--absorb" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              animate={
                absorbed && !reduceMotion
                  ? { scale: [1, 1.14, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.32, ease: [0.25, 1, 0.5, 1] }}
            >
              <span className="profile-edit-kinetik-unit-vault__disc" aria-hidden>
                <span className="profile-edit-kinetik-unit-vault__sheen" />
                <span className="profile-edit-kinetik-unit-vault__disc-inner">
                  U
                </span>
              </span>
              <span
                className={[
                  nameOxanium.className,
                  "profile-edit-kinetik-unit-vault__value",
                ].join(" ")}
              >
                {displayBalance.toLocaleString("en-US")}
              </span>
            </motion.div>
          </div>
        </div>

        <div className="mt-5">
          <UnitEarnPlayButton
            language="ja"
            disabled={pending != null}
            onPlay={playRankedPreview}
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => play(n)}
              disabled={pending != null}
              className={[
                nameOxanium.className,
                "border border-[#f6c344]/55 bg-transparent px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-[#f6c344] disabled:opacity-40",
              ].join(" ")}
            >
              +{n.toLocaleString("en-US")}
            </button>
          ))}
          <Link
            href="/mobile/mypage"
            className={[
              nameOxanium.className,
              "border border-white/20 bg-white/5 px-3 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-white/80",
            ].join(" ")}
          >
            On mypage
          </Link>
        </div>

        {pending ? (
          <UnitEarnOverlay
            open
            amount={pending.amount}
            title={pending.title}
            subtitle={pending.subtitle}
            rank={pending.rank}
            language="ja"
            onAbsorb={() => {
              setAbsorbed(true);
            }}
            onDone={() => {
              setBalance(pending.to);
              setPending(null);
              setAbsorbed(false);
            }}
          />
        ) : null}
      </div>
    </main>
  );
}
