"use client";

/**
 * /dev/rankings-title-preview
 * ランキングページヘッダー「RANKINGS」タイトルのサイバー/シンセウェーブ案（本番未接続）
 */

import { Menu } from "lucide-react";
import { nameOxanium } from "@/lib/fonts";
import {
  RankingsPageTitleCyber,
  RANKINGS_TITLE_VARIANT_META,
  type RankingsTitleCyberVariant,
} from "@/app/component/rankings/RankingsPageTitleCyber";

const BG = "#06080F";
const GRID =
  "linear-gradient(rgba(0,245,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.04) 1px, transparent 1px)";

const VARIANTS = Object.keys(RANKINGS_TITLE_VARIANT_META) as RankingsTitleCyberVariant[];

function MockHeaderBar({
  variant,
  title,
  ja = false,
}: {
  variant: RankingsTitleCyberVariant;
  title: string;
  ja?: boolean;
}) {
  const displayVariant = ja && variant !== "jp-chrome" ? variant : variant;
  const displayTitle = ja ? "ランキング" : title;

  return (
    <div className="flex items-center gap-2 px-1">
      <button
        type="button"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-white/85"
        aria-hidden
      >
        <Menu className="h-4 w-4" strokeWidth={2.25} />
      </button>
      <div className="flex min-w-0 flex-1 justify-center">
        {displayVariant === "jp-chrome" || ja ? (
          <RankingsPageTitleCyber variant="jp-chrome" title={displayTitle} size="sm" />
        ) : (
          <RankingsPageTitleCyber variant={displayVariant} title={displayTitle} size="sm" />
        )}
      </div>
      <div
        className="h-8 w-8 shrink-0 rounded-lg border border-cyan-400/20 bg-cyan-400/5"
        aria-hidden
      />
    </div>
  );
}

function VariantCard({ variant }: { variant: RankingsTitleCyberVariant }) {
  const meta = RANKINGS_TITLE_VARIANT_META[variant];

  return (
    <section
      className="overflow-hidden rounded-xl border border-white/10"
      style={{ background: "rgba(255,255,255,0.02)" }}
    >
      <div
        className="border-b border-white/8 px-4 py-3"
        style={{ background: "rgba(0,245,255,0.03)" }}
      >
        <div className="flex items-baseline gap-2">
          <span
            className={[nameOxanium.className, "text-[11px] font-bold text-cyan-300"].join(" ")}
          >
            案{meta.id}
          </span>
          <span className="text-sm font-semibold text-white/90">{meta.labelJa}</span>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-white/45">{meta.descJa}</p>
      </div>

      <div
        className="px-4 py-8"
        style={{
          backgroundColor: BG,
          backgroundImage: GRID,
          backgroundSize: "24px 24px",
        }}
      >
        <p className="mb-3 text-center text-[9px] uppercase tracking-[0.2em] text-white/30">
          Header mock — RANKINGS
        </p>
        <MockHeaderBar variant={variant} title="RANKINGS" />

        {variant === "jp-chrome" ? (
          <>
            <p className="mb-3 mt-8 text-center text-[9px] uppercase tracking-[0.2em] text-white/30">
              Header mock — ランキング
            </p>
            <MockHeaderBar variant="jp-chrome" title="ランキング" ja />
          </>
        ) : null}

        <div className="mt-10 flex justify-center">
          <RankingsPageTitleCyber
            variant={variant}
            title={variant === "jp-chrome" ? "ランキング" : "RANKINGS"}
            size="md"
          />
        </div>
      </div>
    </section>
  );
}

export default function RankingsTitlePreviewPage() {
  return (
    <div
      className="min-h-dvh px-4 py-8 text-white"
      style={{ background: BG }}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="space-y-2 border-b border-white/10 pb-6">
          <p className="text-[10px] uppercase tracking-[0.28em] text-cyan-400/70">
            /dev/rankings-title-preview
          </p>
          <h1 className="text-xl font-bold text-white/90">
            ランキングページ タイトル — サイバー/シンセウェーブ案
          </h1>
          <p className="text-sm leading-relaxed text-white/50">
            参照: CYBER 風クローム（上シアン / 下パープルの水平スプリット）。本番の{" "}
            <code className="text-cyan-300/80">WebRankingsShell</code> /{" "}
            <code className="text-cyan-300/80">mobile/rankings</code>{" "}
            ヘッダー中央テキスト差し替え用プレビュー。
          </p>
        </header>

        <div className="grid gap-5">
          {VARIANTS.map((v) => (
            <VariantCard key={v} variant={v} />
          ))}
        </div>

        <p className="text-center text-[11px] text-white/35">
          採用案が決まったら番号（A〜F）を教えてください。web / mobile 両方に配線します。
        </p>
      </div>
    </div>
  );
}
