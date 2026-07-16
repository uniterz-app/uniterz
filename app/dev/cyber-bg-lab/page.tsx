"use client";

/**
 * /dev/cyber-bg-lab
 * アプリ向け cyber 背景 — 全新パターン比較（本番未接続）
 */

import { useState } from "react";
import CyberBgLabFx from "@/app/component/background/CyberBgLabFx";
import { nameOxanium, nameRajdhani } from "@/lib/fonts";
import {
  CYBER_BG_LAB_VARIANTS,
  type CyberBgLabVariant,
} from "@/lib/ui/cyberBgLabVariants";

function MockAppChrome() {
  return (
    <div className="cyber-bg-lab-chrome">
      <div className="cyber-bg-lab-chrome__nav">
        <span className={nameOxanium.className + " cyber-bg-lab-chrome__logo"}>
          Uniterz
        </span>
        <div className="cyber-bg-lab-chrome__avatar" />
      </div>
      <div className="cyber-bg-lab-chrome__card">
        <div className="cyber-bg-lab-chrome__title" />
        <div className="cyber-bg-lab-chrome__grid">
          <div className="cyber-bg-lab-chrome__tile" />
          <div className="cyber-bg-lab-chrome__tile cyber-bg-lab-chrome__tile--alt" />
          <div className="cyber-bg-lab-chrome__tile cyber-bg-lab-chrome__tile--alt" />
          <div className="cyber-bg-lab-chrome__tile" />
        </div>
      </div>
      <div className="cyber-bg-lab-chrome__tabbar" />
    </div>
  );
}

function BgPreviewPanel({
  variant,
  wide,
  selected,
  onSelect,
}: {
  variant: (typeof CYBER_BG_LAB_VARIANTS)[number];
  wide?: boolean;
  selected?: boolean;
  onSelect?: () => void;
}) {
  const Tag = onSelect ? "button" : "article";

  return (
    <Tag
      type={onSelect ? "button" : undefined}
      onClick={onSelect}
      className={[
        "group w-full text-left transition",
        onSelect ? "cursor-pointer" : "",
        selected ? "ring-1 ring-cyan-400/45 rounded-[22px]" : "",
      ].join(" ")}
    >
      <div
        className={[
          "cyber-bg-lab-preview",
          wide ? "cyber-bg-lab-preview--wide" : "",
        ].join(" ")}
      >
        <CyberBgLabFx variant={variant.id} />
        <MockAppChrome />
      </div>

      <div className="cyber-bg-lab-card-meta px-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2
            className={[
              nameRajdhani.className,
              "text-sm font-bold tracking-wide text-white",
            ].join(" ")}
          >
            {variant.label}
          </h2>
          <span className="cyber-bg-lab-card-tag">{variant.tag}</span>
        </div>
        <p className="mt-1 text-xs text-white/45">{variant.description}</p>
        <p className="mt-0.5 text-[10px] text-cyan-400/50">{variant.mood}</p>
      </div>
    </Tag>
  );
}

export default function CyberBgLabPage() {
  const [active, setActive] = useState<CyberBgLabVariant>("nebula");
  const activeMeta = CYBER_BG_LAB_VARIANTS.find((v) => v.id === active)!;

  return (
    <main className="min-h-svh bg-[#020406] px-4 py-8 pb-24 text-white md:px-8">
      <header className="mx-auto mb-10 max-w-[1400px]">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-400/65",
          ].join(" ")}
        >
          Dev Lab · Cyber Backgrounds
        </p>
        <h1
          className={[
            nameRajdhani.className,
            "mt-1 text-2xl font-bold tracking-wide sm:text-[1.75rem]",
          ].join(" ")}
        >
          アプリ向け cyber 背景 — 全 {CYBER_BG_LAB_VARIANTS.length} パターン
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/50">
          UNITERZ のシアン・紫トーンに合わせた全新背景案。モック UI を重ねて
          実際の画面での見え方を確認できます。クリックで下の拡大プレビューが切り替わります。
        </p>
      </header>

      {/* 全パターン一覧 */}
      <section className="mx-auto mb-12 max-w-[1400px]">
        <h2
          className={[
            nameRajdhani.className,
            "mb-4 text-xs font-semibold tracking-[0.2em] text-white/40 uppercase",
          ].join(" ")}
        >
          一覧
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {CYBER_BG_LAB_VARIANTS.map((variant) => (
            <BgPreviewPanel
              key={variant.id}
              variant={variant}
              selected={active === variant.id}
              onSelect={() => setActive(variant.id)}
            />
          ))}
        </div>
      </section>

      {/* 選択中の拡大プレビュー */}
      <section className="mx-auto max-w-[1400px]">
        <h2
          className={[
            nameRajdhani.className,
            "mb-4 text-xs font-semibold tracking-[0.2em] text-white/40 uppercase",
          ].join(" ")}
        >
          拡大 — {activeMeta.label}
        </h2>
        <div className="grid gap-8 lg:grid-cols-2">
          <BgPreviewPanel variant={activeMeta} />
          <div className="flex flex-col justify-center space-y-4 px-2">
            <div>
              <span className="cyber-bg-lab-card-tag">{activeMeta.tag}</span>
              <h3
                className={[
                  nameRajdhani.className,
                  "mt-3 text-xl font-bold text-white",
                ].join(" ")}
              >
                {activeMeta.label}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {activeMeta.description}
              </p>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
                <dt className="text-white/35">ムード</dt>
                <dd className="mt-1 text-white/75">{activeMeta.mood}</dd>
              </div>
              <div className="rounded-lg border border-white/8 bg-white/[0.03] p-3">
                <dt className="text-white/35">ID</dt>
                <dd className="mt-1 font-mono text-cyan-300/70">{activeMeta.id}</dd>
              </div>
            </dl>
            <p className="text-xs text-white/35">
              気に入った案の名前を教えてください。Games 背景・スプラッシュ・プロフィールなど
              任意の画面に適用できます。
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
