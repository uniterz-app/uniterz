"use client";

/**
 * /dev/profile-menu-entry-preview
 * プロフィールカードからバーガーを消す場合のメニュー導線案。
 * スマホ画面モック（カード + 下部ナビ）で 5 パターン。API 未接続。
 */

import {
  Eye,
  Menu,
  Hexagon,
  Settings,
  Gamepad2,
  Trophy,
  Users,
  BarChart3,
  User,
} from "lucide-react";
import { nameOxanium, jp } from "@/lib/fonts";
import { ProCyberBadge } from "@/app/component/common/ProCyberBadge";

const MOCK = {
  name: "MPJ",
  join: "2025/12 JOIN",
  id: "ID: @3PJVG4Y9",
  views: 128,
  units: 1240,
  bio: "Win now",
};

const UNITS = MOCK.units.toLocaleString("en-US");

/* ---- プロフィールカード（バーガーなし） ---- */

function MockAvatar({ gearBadge }: { gearBadge?: boolean }) {
  return (
    <div className="relative h-[72px] w-[72px] shrink-0">
      <div
        className="h-full w-full border border-cyan-400/60 bg-gradient-to-br from-cyan-900/40 to-slate-900 shadow-[0_0_14px_rgba(0,245,255,0.25)]"
        aria-hidden
      />
      {gearBadge ? (
        <button
          type="button"
          className="mep-avatar-gear"
          aria-label="メニュー"
        >
          <Settings className="h-[13px] w-[13px]" strokeWidth={2.2} />
        </button>
      ) : null}
    </div>
  );
}

function ProfileCard({ avatarGear }: { avatarGear?: boolean }) {
  return (
    <div className="profile-edit-kinetik-card relative w-full p-4">
      <div className="flex gap-3">
        <MockAvatar gearBadge={avatarGear} />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h2
              className={[
                nameOxanium.className,
                "text-[16px] leading-none font-bold italic tracking-tight text-white",
              ].join(" ")}
            >
              {MOCK.name}
            </h2>
            <span className="text-[13px] leading-none" aria-hidden>
              🇯🇵
            </span>
            <ProCyberBadge premium ariaLabel="PRO" />
          </div>
          <div className="profile-edit-kinetik-identity-join-id mt-1 flex w-full max-w-full min-w-0 items-end justify-start gap-2">
            <p className="profile-edit-kinetik-footer-ref profile-edit-kinetik-footer-ref--identity shrink-0 whitespace-nowrap">
              {MOCK.join}
            </p>
            <p className="profile-edit-kinetik-footer-ref profile-edit-kinetik-footer-ref--identity profile-edit-kinetik-footer-ref--id shrink-0 whitespace-nowrap">
              {MOCK.id}
            </p>
            <p className="profile-edit-kinetik-view-count shrink-0">
              <Eye
                className="profile-edit-kinetik-view-count__icon"
                aria-hidden
                strokeWidth={2.5}
              />
              <span className="profile-edit-kinetik-view-count__num">
                {MOCK.views.toLocaleString("en-US")}
              </span>
            </p>
          </div>
          <div className="mt-2 w-full">
            <div
              className="profile-edit-kinetik-unit-vault"
              aria-label={`${UNITS} Units`}
            >
              <span
                className="profile-edit-kinetik-unit-vault__block"
                aria-hidden
              >
                <Hexagon
                  className="profile-edit-kinetik-unit-vault__hex"
                  strokeWidth={1.8}
                />
                <span className="profile-edit-kinetik-unit-vault__u">U</span>
              </span>
              <span className="profile-edit-kinetik-unit-vault__meta">
                <span className="profile-edit-kinetik-unit-vault__label">
                  UNITS
                </span>
                <span className="profile-edit-kinetik-unit-vault__value">
                  {UNITS}
                </span>
              </span>
              <span
                className="profile-edit-kinetik-unit-vault__sheen"
                aria-hidden
              />
            </div>
          </div>
        </div>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-white/55">{MOCK.bio}</p>
    </div>
  );
}

/* ---- 画面パーツ ---- */

function BottomNav({ menuSlot }: { menuSlot?: boolean }) {
  const items = [
    { icon: Gamepad2, label: "GAMES" },
    { icon: Trophy, label: "RESULT" },
    { icon: BarChart3, label: "RANK" },
    { icon: Users, label: "GROUP" },
  ];
  return (
    <div className="mep-navbar">
      {items.map((it) => (
        <div key={it.label} className="mep-navbar__item">
          <it.icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <span>{it.label}</span>
        </div>
      ))}
      {menuSlot ? (
        <div className="mep-navbar__item mep-navbar__item--menu">
          <Menu className="h-[18px] w-[18px]" strokeWidth={2} />
          <span>MENU</span>
        </div>
      ) : (
        <div className="mep-navbar__item mep-navbar__item--active">
          <User className="h-[18px] w-[18px]" strokeWidth={1.8} />
          <span>PROFILE</span>
        </div>
      )}
    </div>
  );
}

function Phone({
  children,
  topBar,
  navMenuSlot,
}: {
  children: React.ReactNode;
  topBar?: React.ReactNode;
  navMenuSlot?: boolean;
}) {
  return (
    <div className="mep-phone">
      {topBar}
      <div className="mep-phone__body">{children}</div>
      <BottomNav menuSlot={navMenuSlot} />
    </div>
  );
}

/* ---- 5 パターン ---- */

/** M1 FAB — 画面右下（ナビの上）にフローティング */
function M1() {
  return (
    <Phone>
      <ProfileCard />
      <button type="button" className="mep-fab" aria-label="メニュー">
        <Menu className="h-[20px] w-[20px]" strokeWidth={2.2} />
      </button>
    </Phone>
  );
}

/** M2 ページヘッダー — カードの外・画面上部バーの右端 */
function M2() {
  return (
    <Phone
      topBar={
        <div className="mep-topbar">
          <span
            className={[
              nameOxanium.className,
              "text-[11px] font-bold uppercase tracking-[0.28em] text-white/70",
            ].join(" ")}
          >
            Profile
          </span>
          <button
            type="button"
            className="mep-topbar__menu"
            aria-label="メニュー"
          >
            <Menu className="h-[16px] w-[16px]" strokeWidth={2.2} />
          </button>
        </div>
      }
    >
      <ProfileCard />
    </Phone>
  );
}

/** M3 エッジハンドル — 画面左端の縦タブ + スワイプ */
function M3() {
  return (
    <Phone>
      <ProfileCard />
      <button type="button" className="mep-edge" aria-label="メニュー">
        {"MENU".split("").map((ch) => (
          <span key={ch} className="mep-edge__ch">
            {ch}
          </span>
        ))}
      </button>
    </Phone>
  );
}

/** M4 アバターバッジ — アバター右下の歯車 */
function M4() {
  return (
    <Phone>
      <ProfileCard avatarGear />
    </Phone>
  );
}

/** M5 下部ナビ統合 — ナビ右端を MENU 枠に */
function M5() {
  return (
    <Phone navMenuSlot>
      <ProfileCard />
    </Phone>
  );
}

const PATTERNS = [
  {
    code: "M1",
    title: "フローティングボタン（FAB）",
    note: "画面右下・ナビの上に常駐。カードは完全にクリーン。親指が届きやすい。",
    render: () => <M1 />,
  },
  {
    code: "M2",
    title: "ページ上部バー（カードの外）",
    note: "画面ヘッダー右端にバーガ。他画面（Games / ランキング）の作法と揃う。",
    render: () => <M2 />,
  },
  {
    code: "M3",
    title: "左端エッジハンドル + スワイプ",
    note: "左端の縦タブ。スワイプでも開ける。省スペースだが発見性は低め。",
    render: () => <M3 />,
  },
  {
    code: "M4",
    title: "アバター右下の歯車バッジ",
    note: "「自分の設定＝自分のアイコン」の直感。カード内だが専有面積は最小。",
    render: () => <M4 />,
  },
  {
    code: "M5",
    title: "下部ナビに MENU を統合",
    note: "プロフィールタブの位置を MENU に。導線は最強だがナビ構成の変更になる。",
    render: () => <M5 />,
  },
];

export default function ProfileMenuEntryPreviewPage() {
  return (
    <div className="min-h-screen bg-[#050508] px-4 py-8">
      <style>{PREVIEW_CSS}</style>
      <div className="mx-auto max-w-2xl space-y-10">
        <header>
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400/60",
            ].join(" ")}
          >
            Dev preview
          </p>
          <h1 className={`${jp.className} mt-1 text-xl font-bold text-white`}>
            バーガーをカードから消す — メニュー導線 5 案
          </h1>
          <p className="mt-1 text-xs text-white/45">
            プロフィールカードはバーガーなしの状態で固定。メニューの入り口だけ
            5 パターン。枠はスマホ画面の想定（下は既存ボトムナビ）。
          </p>
        </header>

        {PATTERNS.map((p) => (
          <section key={p.code} className="space-y-2">
            <div className="flex items-baseline gap-2">
              <span
                className={[
                  nameOxanium.className,
                  "text-[15px] font-bold text-cyan-300",
                ].join(" ")}
              >
                {p.code}
              </span>
              <h2 className={`${jp.className} text-sm font-bold text-white`}>
                {p.title}
              </h2>
            </div>
            <p className="text-[11px] leading-relaxed text-white/40">
              {p.note}
            </p>
            {p.render()}
          </section>
        ))}

        <p className="text-[11px] leading-relaxed text-white/35">
          プレビュー URL:{" "}
          <code className="text-cyan-300/70">
            /dev/profile-menu-entry-preview
          </code>
        </p>
      </div>
    </div>
  );
}

/* ---- プレビュー専用 CSS ---- */

const PREVIEW_CSS = `
.mep-phone {
  position: relative;
  width: 100%;
  max-width: 390px;
  height: 460px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 18px;
  background:
    radial-gradient(120% 80% at 50% 0%, rgba(0, 60, 60, 0.25) 0%, transparent 60%),
    #060a0c;
}
.mep-phone__body {
  position: relative;
  flex: 1;
  min-height: 0;
  padding: 14px 12px 0;
  overflow: hidden;
}

/* ボトムナビ */
.mep-navbar {
  display: flex;
  align-items: stretch;
  border-top: 1px solid rgba(0, 245, 255, 0.18);
  background: rgba(3, 8, 10, 0.96);
  padding: 8px 4px 10px;
}
.mep-navbar__item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  color: rgba(255, 255, 255, 0.35);
  font-family: ui-monospace, Menlo, monospace;
  font-size: 7px;
  letter-spacing: 0.14em;
}
.mep-navbar__item--active {
  color: #00f5ff;
}
.mep-navbar__item--menu {
  color: #facc15;
}

/* M1 FAB */
.mep-fab {
  position: absolute;
  right: 14px;
  bottom: 58px;
  z-index: 5;
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  clip-path: polygon(6px 0%, 100% 0%, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0% 100%, 0% 6px);
  border: 1px solid rgba(250, 204, 21, 0.7);
  background: rgba(8, 12, 6, 0.92);
  color: #facc15;
  box-shadow: 0 0 18px rgba(250, 204, 21, 0.3), 0 4px 14px rgba(0, 0, 0, 0.5);
}

/* M2 トップバー */
.mep-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}
.mep-topbar__menu {
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  clip-path: polygon(4px 0%, 100% 0%, 100% calc(100% - 4px), calc(100% - 4px) 100%, 0% 100%, 0% 4px);
  border: 1px solid rgba(250, 204, 21, 0.55);
  background: rgba(4, 10, 18, 0.72);
  color: #facc15;
}

/* M3 エッジハンドル */
.mep-edge {
  position: absolute;
  left: 0;
  top: 50%;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  width: 18px;
  min-height: 74px;
  padding: 10px 0;
  transform: translateY(-50%);
  border: 1px solid rgba(250, 204, 21, 0.55);
  border-left: none;
  background: rgba(8, 12, 6, 0.9);
  color: #facc15;
  box-shadow: 0 0 12px rgba(250, 204, 21, 0.2);
}
.mep-edge__ch {
  display: block;
  font-family: ui-monospace, Menlo, monospace;
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
  color: #facc15;
}

/* M4 アバター歯車 */
.mep-avatar-gear {
  position: absolute;
  right: -7px;
  bottom: -7px;
  z-index: 3;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  clip-path: polygon(3px 0%, 100% 0%, 100% calc(100% - 3px), calc(100% - 3px) 100%, 0% 100%, 0% 3px);
  border: 1px solid rgba(250, 204, 21, 0.7);
  background: rgba(8, 12, 6, 0.95);
  color: #facc15;
  box-shadow: 0 0 10px rgba(250, 204, 21, 0.3);
}
`;
