/**
 * サイドメニュー（試合ドロワー）デザイン改善案プレビュー — 選定用・本番未接続。
 * 行デザインは確定（スキューチップ型）。背景のバリエーションを比較する。
 * カードをタップすると実寸ドロワーで確認できる。
 */
"use client";

import { useState, type ReactNode } from "react";
import cn from "clsx";
import { CyberSideMenuSectionTitle } from "@/app/component/common/CyberSideMenuSectionTitle";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import { nameOxanium, jp } from "@/lib/fonts";
import "./sideMenuDesignPreview.css";

import {
  CYBER_SIDE_MENU_BRANCH,
  CYBER_SIDE_MENU_BRANCH_GLOW,
} from "@/lib/ui/cyberSideMenu";

type Props = {
  variant?: "web" | "mobile";
};

type BgId =
  | "stream"
  | "hex"
  | "aurora"
  | "horizon"
  | "topo"
  | "armor"
  | "deep";

const BACKGROUNDS: { id: BgId; name: string; desc: string }[] = [
  {
    id: "hex",
    name: "A. ヘックスコム",
    desc: "ハニカム模様 + 上部グロー。斜めの光沢がゆっくり流れる",
  },
  {
    id: "aurora",
    name: "B. オーロラヴェール",
    desc: "シアン→ブルー→バイオレットの光がゆっくり漂う。極細グリッドで cyber 感を維持",
  },
  {
    id: "horizon",
    name: "C. ホライゾングリッド",
    desc: "下半分にパースの床グリッドが奥へ流れる。地平線の発光ライン付き",
  },
  {
    id: "topo",
    name: "D. トポグラフィレーダー",
    desc: "等高線 + 回転するレーダースイープ。戦況マップのような雰囲気",
  },
  {
    id: "armor",
    name: "E. アーマーパネル",
    desc: "金属パネルの継ぎ目 + ヘアライン + ハザードストライプ。硬質でメカ寄り",
  },
  {
    id: "deep",
    name: "F. ディープミニマル",
    desc: "ほぼ無地 + 左上グロー + 微細ノイズ。呼吸する右端ビームだけの最小構成",
  },
  {
    id: "stream",
    name: "参考: データストリーム",
    desc: "前回案 E の背景（行デザインの出どころ）。比較用",
  },
];

const noop = () => {};

/** NBA 下の枝分かれ行（本番 GamesDrawerMenu と同構造） */
function BranchRow({ last, children }: { last?: boolean; children: ReactNode }) {
  return (
    <div className="relative flex min-h-9 items-stretch">
      <span
        aria-hidden
        className="absolute left-[9px] w-px"
        style={{
          top: 0,
          bottom: last ? "50%" : 0,
          backgroundColor: CYBER_SIDE_MENU_BRANCH,
          boxShadow: CYBER_SIDE_MENU_BRANCH_GLOW,
        }}
      />
      <span
        aria-hidden
        className="absolute left-[9px] top-1/2 h-px w-[14px] -translate-y-1/2"
        style={{
          backgroundColor: CYBER_SIDE_MENU_BRANCH,
          boxShadow: CYBER_SIDE_MENU_BRANCH_GLOW,
        }}
      />
      <div className="min-w-0 flex-1 pl-[28px]">{children}</div>
    </div>
  );
}

function PreviewItem({
  iconSrc,
  active,
  dense,
  children,
}: {
  iconSrc: string;
  active?: boolean;
  dense?: boolean;
  children: ReactNode;
}) {
  const imgSz = dense ? 32 : 36;
  return (
    <button
      type="button"
      onClick={noop}
      className={cn("smdp-item", active && "is-active", dense && "is-dense")}
    >
      <span className="smdp-item__icon">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconSrc}
          alt=""
          width={imgSz}
          height={imgSz}
          className="shrink-0 object-contain"
          draggable={false}
        />
      </span>
      <span
        className="smdp-item__label"
        style={bracketMarketTeamTypography(true)}
      >
        {children}
      </span>
    </button>
  );
}

/** メニュー中身（現行と同じ項目構成・行デザイン確定版） */
function PreviewMenu() {
  return (
    <nav className="relative flex flex-col p-4 text-white">
      <CyberSideMenuSectionTitle first>試合</CyberSideMenuSectionTitle>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <PreviewItem iconSrc="/games-drawer/nba.png">NBA</PreviewItem>
          <div className="relative mt-1 flex flex-col gap-1.5">
            <span
              aria-hidden
              className="pointer-events-none absolute left-[9px] top-[-4px] h-1 w-px"
              style={{
                backgroundColor: CYBER_SIDE_MENU_BRANCH,
                boxShadow: CYBER_SIDE_MENU_BRANCH_GLOW,
              }}
            />
            <BranchRow>
              <PreviewItem iconSrc="/games-drawer/awards.png" dense>
                アワード予想
              </PreviewItem>
            </BranchRow>
            <BranchRow last>
              <PreviewItem iconSrc="/games-drawer/standings.png" dense>
                順位予想
              </PreviewItem>
            </BranchRow>
          </div>
        </div>
      </div>
    </nav>
  );
}

function BgPanel({
  bg,
  className,
  style,
}: {
  bg: BgId;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div className={cn("smdp-panel", `smdp-bg-${bg}`, className)} style={style}>
      <div
        aria-hidden
        className="cyber-side-menu-scanlines pointer-events-none absolute inset-0 z-[1] opacity-40"
      />
      <div className="relative z-10 h-full overflow-y-auto overflow-x-hidden">
        <PreviewMenu />
      </div>
    </div>
  );
}

export default function SideMenuDesignPreviewPage({
  variant = "mobile",
}: Props) {
  const [zoom, setZoom] = useState<BgId | null>(null);
  const isMobile = variant === "mobile";

  return (
    <div className={cn(jp.className, "min-h-dvh bg-[#04060a] text-white")}>
      <div
        className={cn(
          "mx-auto w-full",
          isMobile ? "max-w-[720px] px-4 py-6" : "max-w-[1180px] px-6 py-8"
        )}
      >
        <header className="mb-6">
          <p
            className={cn(
              nameOxanium.className,
              "text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-300/70"
            )}
          >
            DEV PREVIEW // SIDE MENU BG
          </p>
          <h1 className="mt-1 text-xl font-black">
            サイドメニュー 背景バリエーション
          </h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">
            行デザインは確定（スキューチップ型）。背景のみ新規 6 案。カードをタップすると実寸ドロワーで確認できます（本番未接続）。
          </p>
        </header>

        <div className="smdp-grid">
          {BACKGROUNDS.map((item) => (
            <section key={item.id} className="flex flex-col">
              <button
                type="button"
                onClick={() => setZoom(item.id)}
                className="group block w-full text-left focus:outline-none"
              >
                <BgPanel
                  bg={item.id}
                  className="h-[520px] w-full transition-transform duration-200 group-hover:scale-[1.01]"
                />
              </button>
              <h2
                className={cn(
                  nameOxanium.className,
                  "mt-3 text-sm font-bold tracking-wide text-cyan-200"
                )}
              >
                {item.name}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-white/50">
                {item.desc}
              </p>
            </section>
          ))}
        </div>
      </div>

      {/* 実寸ドロワー確認オーバーレイ */}
      {zoom !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px]"
          onClick={() => setZoom(null)}
        >
          <div className="fixed left-0 top-0 flex h-[100dvh] flex-col py-4">
            <BgPanel
              bg={zoom}
              className="w-[74vw] min-w-[260px] max-w-[300px]"
              style={{ height: "min(92dvh, calc(100dvh - 2rem))" }}
            />
          </div>
          <div className="pointer-events-none fixed bottom-6 right-5 max-w-[40vw] text-right">
            <p
              className={cn(
                nameOxanium.className,
                "text-sm font-bold text-cyan-200"
              )}
            >
              {BACKGROUNDS.find((x) => x.id === zoom)?.name}
            </p>
            <p className="mt-1 text-[11px] text-white/55">タップで閉じる</p>
          </div>
        </div>
      )}
    </div>
  );
}
