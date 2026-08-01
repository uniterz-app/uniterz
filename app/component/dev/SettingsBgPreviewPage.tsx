"use client";

/**
 * 設定画面（SETTINGS）の背景色プレビュー。
 * 本番の ProfileEditSheet / Native 設定モーダルには未反映。
 */

import Link from "next/link";
import { useMemo, useState } from "react";
import { Camera, ChevronLeft } from "lucide-react";
import CyberSubpageShell from "@/app/component/common/CyberSubpageShell";
import { nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import {
  SETTINGS_BG_PREVIEW_DEFAULT_ID,
  SETTINGS_BG_PREVIEW_SWATCHES,
  settingsBgPreviewStyle,
} from "@/lib/ui/settingsBgPreviewSwatches";

type Props = {
  variant: "web" | "mobile";
};

export default function SettingsBgPreviewPage({ variant }: Props) {
  const hub = variant === "web" ? "/web" : "/mobile/season-preview";
  const [selectedId, setSelectedId] = useState(SETTINGS_BG_PREVIEW_DEFAULT_ID);

  const selected = useMemo(
    () =>
      SETTINGS_BG_PREVIEW_SWATCHES.find((s) => s.id === selectedId) ??
      SETTINGS_BG_PREVIEW_SWATCHES[0],
    [selectedId]
  );

  return (
    <div className="relative min-h-screen text-white">
      {/* プレビュー対象の背景面 */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 transition-[background-color,background-image] duration-300"
        style={settingsBgPreviewStyle(selected)}
      />

      <CyberSubpageShell
        bare
        eyebrow="PROFILE"
        title="SETTINGS"
        subtitle="Pools（dual-pool）は本番設定画面に反映済み。他は比較用です。"
        onBack={() => {
          if (typeof window !== "undefined") window.history.back();
        }}
        contentClassName={
          variant === "web"
            ? "max-w-2xl px-4 py-5 pb-44 md:px-6"
            : "max-w-lg px-4 py-5 pb-44"
        }
      >
        <p
          className={[
            nameOxanium.className,
            "mb-4 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/65",
          ].join(" ")}
        >
          Preview only · 単色以外の候補
        </p>
        <p className="mb-4 text-xs leading-relaxed text-white/45">
          下のスウォッチはほぼすべてグラデ／グロー／グリッド重ね。
          「現行」だけ比較用の単色です。
        </p>

        {/* 設定フォームの見た目サンプル */}
        <div className="flex flex-col gap-3.5">
          <div className="relative mx-auto h-[108px] w-[108px]">
            <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full border border-white/15 bg-white/5 text-3xl font-bold text-white/40">
              M
            </div>
            <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-[#0a0e14]">
              <Camera size={14} className="text-white" />
            </span>
          </div>

          <label className="flex flex-col gap-1.5 text-xs text-white/50">
            名前
            <input
              readOnly
              value="MPJ"
              className="border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-white/50">
            自己紹介
            <textarea
              readOnly
              value="Win now"
              rows={3}
              className="resize-none border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white outline-none"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-white/50">
            使用言語
            <div className="flex items-center justify-between border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white">
              日本語
              <span className="text-white/35">▾</span>
            </div>
          </label>
          <label className="flex flex-col gap-1.5 text-xs text-white/50">
            住んでいる国（任意）
            <div className="flex items-center justify-between border border-white/15 bg-black/40 px-3 py-2.5 text-sm text-white">
              日本
              <span className="text-white/35">▾</span>
            </div>
          </label>

          <button
            type="button"
            className={[
              nameOxanium.className,
              "mt-1 w-full border border-cyan-400/40 bg-cyan-500/20 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-cyan-50",
            ].join(" ")}
            style={{
              clipPath:
                "polygon(8px 0%, 100% 0%, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0% 100%, 0% 8px)",
              boxShadow: "0 0 24px rgba(34,211,238,0.18)",
            }}
          >
            変更を保存
          </button>
        </div>

        <div
          className={[
            jp.className,
            "mt-6 rounded-xl border border-dashed border-white/15 bg-black/25 px-3 py-3 text-xs leading-relaxed text-white/50",
          ].join(" ")}
        >
          <p className="font-semibold text-white/75">選択中</p>
          <p
            className={[
              nameRajdhani.className,
              "mt-1 text-[13px] font-semibold tracking-wide text-cyan-100/90",
            ].join(" ")}
          >
            {selected.label} · {selected.id}
          </p>
          <p className="mt-1 break-all font-mono text-[10px] text-white/35">
            {selected.background}
          </p>
          <p className="mt-2">{selected.note}</p>
          <p className="mt-2 text-white/40">
            本番採用は Pools（dual-pool）。Web ProfileEditSheet / Native
            設定モーダルに反映済みです。
          </p>
        </div>

        <Link
          href={hub}
          className="mt-4 inline-flex items-center gap-1 text-[11px] text-cyan-300/75 underline-offset-2 hover:underline"
        >
          <ChevronLeft size={14} />
          プレビュー一覧へ
        </Link>
      </CyberSubpageShell>

      {/* 下部スウォッチ選択 */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-black/75 px-3 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md">
        <p
          className={[
            nameOxanium.className,
            "mb-2 text-center text-[9px] font-bold uppercase tracking-[0.18em] text-white/40",
          ].join(" ")}
        >
          Background swatches
        </p>
        <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto pb-1">
          {SETTINGS_BG_PREVIEW_SWATCHES.map((swatch) => {
            const on = swatch.id === selectedId;
            return (
              <button
                key={swatch.id}
                type="button"
                onClick={() => setSelectedId(swatch.id)}
                className={[
                  "relative flex w-[72px] shrink-0 flex-col items-center gap-1.5 rounded-lg border px-1.5 py-2 transition",
                  on
                    ? "border-cyan-300/70 bg-cyan-300/10"
                    : "border-white/12 bg-white/[0.03] hover:border-white/25",
                ].join(" ")}
                aria-pressed={on}
              >
                <span
                  className="h-9 w-9 rounded-md border border-white/20 shadow-inner"
                  style={settingsBgPreviewStyle(swatch)}
                  aria-hidden
                />
                <span
                  className={[
                    nameOxanium.className,
                    "text-[9px] font-extrabold uppercase tracking-[0.08em]",
                    on ? "text-cyan-100" : "text-white/55",
                  ].join(" ")}
                >
                  {swatch.label}
                </span>
                {swatch.current ? (
                  <span className="absolute -right-0.5 -top-0.5 rounded bg-cyan-400/90 px-1 text-[7px] font-bold text-[#050b14]">
                    NOW
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
