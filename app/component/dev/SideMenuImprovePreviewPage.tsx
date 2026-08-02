/**
 * サイドメニュー（試合ドロワー）改善案プレビュー — 選定用・本番未接続。
 * 行デザイン（スキューチップ型）は確定のまま、
 * パネルの存在感 / 階層表現 / 選択状態 / 縦空間の使い方 を比較する。
 * カードをタップすると実寸相当で確認できる。
 */
"use client";

import { useState, type ReactNode } from "react";
import cn from "clsx";
import { CyberSideMenuSectionTitle } from "@/app/component/common/CyberSideMenuSectionTitle";
import { bracketMarketTeamTypography } from "@/lib/games/teamDisplayTypography";
import { nameOxanium, jp } from "@/lib/fonts";
import { formatCyberSideMenuDate } from "@/lib/ui/cyberSideMenuDate";
import "./sideMenuImprovePreview.css";

type Props = {
  variant?: "web" | "mobile";
};

type Flags = {
  /** A: パネル境界の明示（透明化の下げ止め + 右端発光エッジ + 微グリッド） */
  edge?: boolean;
  /** B: 階層の明確化（枝線強調 + サブ行を短く小さく） */
  hier?: boolean;
  /** C: 選択状態の強調（左レール + 面発光 + ▸、非選択は静かに） */
  activeFx?: boolean;
  /** D: 縦空間の分節（ミニヘッダー + HUD フッター） */
  frame?: boolean;
};

type VariantDef = {
  id: string;
  name: string;
  desc: string;
  flags: Flags;
};

const VARIANTS: VariantDef[] = [
  {
    id: "current",
    name: "現状（比較用）",
    desc: "パネルが右へ完全に透けて境界が消える。選択中の NBA と非選択の差が薄く、下 6 割が空洞",
    flags: {},
  },
  {
    id: "edge",
    name: "A. パネル境界の明示",
    desc: "背景の透明化を途中で下げ止め、右端に発光エッジライン。ドロワーが「面」として立つ",
    flags: { edge: true },
  },
  {
    id: "hier",
    name: "B. 階層の明確化",
    desc: "枝線を 2px + 明るめアンバーにしてジョイントノード追加。サブ行は右端を短く・一回り小さく",
    flags: { hier: true },
  },
  {
    id: "activefx",
    name: "C. 選択状態の強調",
    desc: "選択行に左レール + 面の発光 + ▸。非選択行はトーンを落としてコントラストを選択に集中",
    flags: { activeFx: true },
  },
  {
    id: "frame",
    name: "D. 縦空間の分節",
    desc: "上にミニヘッダー（UNITERZ // GAMES）、下に HUD フッター。空洞だった下部に「枠組み」を与える",
    flags: { frame: true },
  },
  {
    id: "all",
    name: "E. 統合案（推奨）",
    desc: "A + B + C + D 全部入り。境界・階層・選択・空間の 4 課題を同時に解消",
    flags: { edge: true, hier: true, activeFx: true, frame: true },
  },
];

const noop = () => {};

function PreviewItem({
  iconSrc,
  active,
  dense,
  showCaret,
  children,
}: {
  iconSrc: string;
  active?: boolean;
  dense?: boolean;
  /** activeFx バリアントで選択行の右端に出す ▸ */
  showCaret?: boolean;
  children: ReactNode;
}) {
  const imgSz = dense ? 26 : 30;
  return (
    <button
      type="button"
      onClick={noop}
      className={cn("smip-item", active && "is-active", dense && "is-dense")}
    >
      <span className="smip-item__icon">
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
      <span className="smip-item__label" style={bracketMarketTeamTypography(true)}>
        {children}
      </span>
      {active && showCaret ? (
        <span className="smip-active-caret" aria-hidden>
          ▸
        </span>
      ) : null}
    </button>
  );
}

function BranchRow({ last, children }: { last?: boolean; children: ReactNode }) {
  return (
    <div className="smip-branch">
      <span aria-hidden className={cn("smip-branch__v", last && "is-last")} />
      <span aria-hidden className="smip-branch__h" />
      <span aria-hidden className="smip-branch__joint" />
      <div className="smip-branch-content">{children}</div>
    </div>
  );
}

/** メニュー中身（現行 GamesDrawerMenu と同じ項目構成） */
function PreviewMenu({ flags }: { flags: Flags }) {
  return (
    <nav
      className={cn(
        "smip-menu relative flex flex-col text-white",
        flags.hier && "has-hier",
        flags.activeFx && "has-activefx"
      )}
    >
      <CyberSideMenuSectionTitle first>試合</CyberSideMenuSectionTitle>
      <div className="flex flex-col gap-2">
        <div className="flex flex-col">
          <PreviewItem
            iconSrc="/games-drawer/nba.png"
            active
            showCaret={flags.activeFx}
          >
            NBA
          </PreviewItem>
          <div className="relative mt-1 flex flex-col gap-1.5">
            <span aria-hidden className="smip-trunk pointer-events-none" />
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
        <PreviewItem iconSrc="/games-drawer/wc.png">
          <span className="uppercase">World Cup</span>
        </PreviewItem>
      </div>
    </nav>
  );
}

/** ドロワーパネル（背景・エッジ・ヘッダー/フッターをフラグで切替） */
function DrawerPanel({ flags }: { flags: Flags }) {
  const hudDate = formatCyberSideMenuDate();
  return (
    <div className={cn("smip-panel", flags.edge && "has-edge")}>
      {flags.edge ? (
        <>
          <span aria-hidden className="smip-panel__grid" />
          <span aria-hidden className="smip-panel__edge-line" />
        </>
      ) : null}
      <div className="smip-panel__body">
        {flags.frame ? (
          <div className="smip-header smip-header--row">
            <div>
              <p className={cn(nameOxanium.className, "smip-header__title")}>
                UNITERZ
              </p>
              <p className={cn(nameOxanium.className, "smip-header__sub")}>
                GAMES // DRAWER
              </p>
            </div>
            <div className="smip-header__date">
              <p className={cn(nameOxanium.className, "smip-header__date-num")}>
                {hudDate.date}
              </p>
              <p className={cn(nameOxanium.className, "smip-header__date-wd")}>
                {hudDate.weekday}
              </p>
            </div>
          </div>
        ) : null}

        <PreviewMenu flags={flags} />

        {flags.frame ? (
          <div className="smip-footer">
            <div aria-hidden className="smip-footer__rule" />
            <div className={cn(nameOxanium.className, "smip-footer__row")}>
              <span aria-hidden className="smip-footer__dot" />
              <span>SYS ONLINE</span>
              <span className="smip-footer__ver">v1.0 // UNITERZ</span>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

/** スマホモック（背後の試合画面 + 暗幕 + ドロワー） */
function PhoneMock({
  flags,
  zoom,
  className,
}: {
  flags: Flags;
  zoom?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn("smip-phone", className)}
      style={
        zoom
          ? {
              aspectRatio: "auto",
              height: "100dvh",
              width: "min(100vw, 420px)",
              borderRadius: 0,
              borderWidth: 0,
            }
          : undefined
      }
    >
      <div aria-hidden className="smip-backdrop">
        <p className={cn(nameOxanium.className, "smip-backdrop__logo")}>
          UNITERZ
        </p>
        <span className="smip-backdrop__card" style={{ top: "12%" }} />
        <span className="smip-backdrop__card" style={{ top: "23%" }} />
        <span className="smip-backdrop__card" style={{ top: "34%" }} />
      </div>
      <div aria-hidden className="smip-dim" />
      <DrawerPanel flags={flags} />
    </div>
  );
}

export default function SideMenuImprovePreviewPage({ variant = "mobile" }: Props) {
  const [zoomId, setZoomId] = useState<string | null>(null);
  const isMobile = variant === "mobile";
  const zoomVariant = VARIANTS.find((x) => x.id === zoomId) ?? null;

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
            DEV PREVIEW // SIDE MENU IMPROVE
          </p>
          <h1 className="mt-1 text-xl font-black">サイドメニュー 改善案</h1>
          <p className="mt-1.5 text-[13px] leading-relaxed text-white/55">
            行デザイン（スキューチップ型）は確定のまま、4 つの課題別に改善案を比較。
            カードをタップすると実寸相当で確認できます（本番未接続）。
          </p>
        </header>

        <div className="smip-grid">
          {VARIANTS.map((item) => (
            <section key={item.id} className="flex flex-col">
              <button
                type="button"
                onClick={() => setZoomId(item.id)}
                className="group block w-full text-left focus:outline-none"
              >
                <PhoneMock
                  flags={item.flags}
                  className="transition-transform duration-200 group-hover:scale-[1.01]"
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

      {/* 実寸相当の確認オーバーレイ */}
      {zoomVariant !== null && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/70 backdrop-blur-[3px]"
          onClick={() => setZoomId(null)}
        >
          <PhoneMock flags={zoomVariant.flags} zoom />
          <div className="pointer-events-none fixed bottom-6 right-5 max-w-[40vw] text-right">
            <p className={cn(nameOxanium.className, "text-sm font-bold text-cyan-200")}>
              {zoomVariant.name}
            </p>
            <p className="mt-1 text-[11px] text-white/55">タップで閉じる</p>
          </div>
        </div>
      )}
    </div>
  );
}
