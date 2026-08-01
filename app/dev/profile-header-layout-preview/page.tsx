"use client";

/**
 * /dev/profile-header-layout-preview
 * カード右上の Unit 表示 — 形・字体のバリエーション比較（8案）。
 * 本番ヘッダー構成（アバター左 / 閲覧下 / 名前行）にはめ込んだモック。API 未接続。
 */

import { Eye, Hexagon } from "lucide-react";
import {
  nameOxanium,
  nameBebas,
  nameRajdhani,
  nameSpace,
  jp,
} from "@/lib/fonts";
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

/* ---- ヘッダー骨格（Unit スロットだけ差し替え） ---- */

function HeaderMock({ unit }: { unit: React.ReactNode }) {
  return (
    <div className="profile-edit-kinetik-card relative w-full max-w-[420px] p-4">
      <div className="flex gap-3">
        <div className="flex w-[72px] shrink-0 flex-col">
          <div
            className="h-[72px] w-[72px] border border-cyan-400/60 bg-gradient-to-br from-cyan-900/40 to-slate-900 shadow-[0_0_14px_rgba(0,245,255,0.25)]"
            aria-hidden
          />
          <p className="profile-edit-kinetik-view-count mt-1.5 w-full justify-center">
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
            <div className="ml-auto shrink-0">{unit}</div>
          </div>
          <div className="profile-edit-kinetik-identity-join-id mt-1 flex w-fit max-w-full min-w-0 items-end gap-2">
            <p className="profile-edit-kinetik-footer-ref profile-edit-kinetik-footer-ref--identity shrink-0 whitespace-nowrap">
              {MOCK.join}
            </p>
            <p className="profile-edit-kinetik-footer-ref profile-edit-kinetik-footer-ref--identity profile-edit-kinetik-footer-ref--id shrink-0 whitespace-nowrap">
              {MOCK.id}
            </p>
          </div>
        </div>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-white/55">{MOCK.bio}</p>
    </div>
  );
}

/* ---- Unit 右上バリエーション ---- */

/** U1 現状 BLADE mini（比較用） */
function U1() {
  return (
    <div className="uc-blade">
      <span className="uc-blade__block" aria-hidden>
        <Hexagon className="uc-blade__hexicon" strokeWidth={1.8} />
        <span className="uc-blade__u">U</span>
      </span>
      <span className="uc-blade__meta">
        <span className="uc-blade__label">UNITS</span>
        <span className="uc-blade__value">{UNITS}</span>
      </span>
    </div>
  );
}

/** U2 スラント・タグ（-14deg 平行四辺形） */
function U2() {
  return (
    <div className="uc-slant">
      <span className="uc-slant__inner">
        <span className="uc-slant__label">UNITS</span>
        <span className={`${nameRajdhani.className} uc-slant__value`}>
          {UNITS}
        </span>
      </span>
    </div>
  );
}

/** U3 ヘックス・エンブレム（六角形コンテナ + 下に数字） */
function U3() {
  return (
    <div className="uc-hexem">
      <span className="uc-hexem__hex">
        <span className={`${nameBebas.className} uc-hexem__u`}>U</span>
      </span>
      <span className="uc-hexem__meta">
        <span className={`${nameBebas.className} uc-hexem__value`}>
          {UNITS}
        </span>
        <span className="uc-hexem__label">UNITS</span>
      </span>
    </div>
  );
}

/** U4 フレームレス・グラデ数字（タイポだけ） */
function U4() {
  return (
    <div className="uc-type">
      <span className={`${nameBebas.className} uc-type__value`}>{UNITS}</span>
      <span className="uc-type__unit">U</span>
      <span className="uc-type__scan" aria-hidden />
    </div>
  );
}

/** U5 コーナーブラケット（照準風） */
function U5() {
  return (
    <div className="uc-bracket">
      <span className="uc-bracket__c uc-bracket__c--tl" aria-hidden />
      <span className="uc-bracket__c uc-bracket__c--br" aria-hidden />
      <span className="uc-bracket__label">UNITS</span>
      <span className={`${nameSpace.className} uc-bracket__value`}>
        {UNITS}
      </span>
    </div>
  );
}

/** U6 ノッチ・プレート（ドッグタグ風 + リベット） */
function U6() {
  return (
    <div className="uc-plate">
      <span className="uc-plate__rivet uc-plate__rivet--l" aria-hidden />
      <span className="uc-plate__rivet uc-plate__rivet--r" aria-hidden />
      <span className={`${nameOxanium.className} uc-plate__value`}>
        {UNITS}
      </span>
      <span className="uc-plate__label">UNITS</span>
    </div>
  );
}

/** U7 チップ（回路ピン付き IC） */
function U7() {
  return (
    <div className="uc-chip">
      <span className="uc-chip__pins uc-chip__pins--top" aria-hidden />
      <span className="uc-chip__pins uc-chip__pins--bottom" aria-hidden />
      <span className="uc-chip__body">
        <span className="uc-chip__label">UNT</span>
        <span className="uc-chip__value">{UNITS}</span>
      </span>
    </div>
  );
}

/** U8 コイン・スタック（丸 + イタリック大数字） */
function U8() {
  return (
    <div className="uc-coin">
      <span className="uc-coin__disc" aria-hidden>
        <span className="uc-coin__discInner">U</span>
      </span>
      <span className={`${nameOxanium.className} uc-coin__value`}>
        {UNITS}
      </span>
    </div>
  );
}

const PATTERNS = [
  {
    code: "U1",
    title: "BLADE mini（現状・比較用）",
    note: "金の斜めブロック + 四角枠。",
    render: () => <U1 />,
  },
  {
    code: "U2",
    title: "スラント・タグ",
    note: "-14° の平行四辺形。ランキングのタブと同じ文法。字体は Rajdhani。",
    render: () => <U2 />,
  },
  {
    code: "U3",
    title: "ヘックス・エンブレム",
    note: "六角形の紋章 + 横に Bebas の大きい数字。ゲーム通貨感が強い。",
    render: () => <U3 />,
  },
  {
    code: "U4",
    title: "フレームレス・タイポ",
    note: "枠なし。ゴールドグラデの Bebas 数字 + 下にスキャンライン。最軽量。",
    render: () => <U4 />,
  },
  {
    code: "U5",
    title: "コーナーブラケット",
    note: "照準風の角カギ括弧だけで囲む。Space Grotesk の細身数字。",
    render: () => <U5 />,
  },
  {
    code: "U6",
    title: "ノッチ・プレート",
    note: "上辺ノッチ + リベットの金属プレート。刻印風。",
    render: () => <U6 />,
  },
  {
    code: "U7",
    title: "IC チップ",
    note: "回路ピンの生えた IC。mono 字体でデータ感。",
    render: () => <U7 />,
  },
  {
    code: "U8",
    title: "コイン",
    note: "金貨ディスク + イタリック数字。通貨の直喩。",
    render: () => <U8 />,
  },
];

export default function ProfileHeaderLayoutPreviewPage() {
  return (
    <div className="min-h-screen bg-[#050508] px-4 py-8">
      <style>{PREVIEW_CSS}</style>
      <div className="mx-auto max-w-2xl space-y-8">
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
            右上 Unit 表示 — 形 × 字体 8 案
          </h1>
          <p className="mt-1 text-xs text-white/45">
            位置はカード右上（名前行の右端）で固定。枠の形と字体だけ変えている。
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
            <HeaderMock unit={p.render()} />
          </section>
        ))}

        <p className="text-[11px] leading-relaxed text-white/35">
          プレビュー URL:{" "}
          <code className="text-cyan-300/70">
            /dev/profile-header-layout-preview
          </code>
        </p>
      </div>
    </div>
  );
}

/* ---- プレビュー専用 CSS ---- */

const PREVIEW_CSS = `
:root {
  --ucg: #f6c344;
  --ucg-soft: rgba(246, 195, 68, 0.85);
  --uc-mono: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}

/* ===== U1 BLADE mini ===== */
.uc-blade {
  display: flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  overflow: hidden;
  border: 1px solid rgba(246, 195, 68, 0.6);
  background: linear-gradient(100deg, rgba(30,22,5,.95), rgba(10,8,3,.92));
  box-shadow: 0 0 12px rgba(246,195,68,.18);
  padding-right: 10px;
}
.uc-blade__block {
  position: relative;
  display: grid;
  place-items: center;
  width: 34px;
  height: 100%;
  background: linear-gradient(160deg, #f9d576, #d9a125 60%, #8a6410);
  clip-path: polygon(0 0, 100% 0, calc(100% - 10px) 100%, 0 100%);
}
.uc-blade__hexicon { position: absolute; width: 18px; height: 18px; color: rgba(20,14,2,.85); }
.uc-blade__u { position: relative; font-family: var(--uc-mono); font-size: 9px; font-weight: 800; color: #1a1203; }
.uc-blade__meta { display: flex; flex-direction: column; gap: 1px; }
.uc-blade__label { font-family: var(--uc-mono); font-size: 6px; font-weight: 700; letter-spacing: .18em; color: var(--ucg-soft); }
.uc-blade__value { font-family: var(--uc-mono); font-size: 13px; font-weight: 800; color: #fff8e7; line-height: 1; text-shadow: 0 0 8px rgba(246,195,68,.5); }

/* ===== U2 スラント・タグ ===== */
.uc-slant {
  transform: skewX(-14deg);
  border: 1px solid rgba(246, 195, 68, 0.7);
  background: linear-gradient(115deg, rgba(60,42,8,.9), rgba(14,10,3,.92) 60%);
  box-shadow: 0 0 14px rgba(246,195,68,.22), inset 0 1px 0 rgba(255,236,170,.2);
  padding: 4px 14px 5px;
}
.uc-slant__inner { display: flex; align-items: baseline; gap: 7px; transform: skewX(14deg); }
.uc-slant__label { font-family: var(--uc-mono); font-size: 6.5px; font-weight: 700; letter-spacing: .22em; color: var(--ucg-soft); }
.uc-slant__value { font-size: 17px; font-weight: 700; line-height: 1; color: #ffe9a8; text-shadow: 0 0 10px rgba(246,195,68,.55); font-variant-numeric: tabular-nums; }

/* ===== U3 ヘックス・エンブレム ===== */
.uc-hexem { display: flex; align-items: center; gap: 8px; }
.uc-hexem__hex {
  display: grid;
  place-items: center;
  width: 32px;
  height: 36px;
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
  background: linear-gradient(160deg, #f9d576, #c8941e 55%, #7a5a0e);
  box-shadow: 0 0 14px rgba(246,195,68,.4);
}
.uc-hexem__u { font-size: 17px; line-height: 1; color: #211603; }
.uc-hexem__meta { display: flex; flex-direction: column; align-items: flex-start; gap: 0; }
.uc-hexem__value { font-size: 21px; line-height: 1; color: #ffe9a8; letter-spacing: .03em; text-shadow: 0 0 12px rgba(246,195,68,.5); }
.uc-hexem__label { font-family: var(--uc-mono); font-size: 5.5px; font-weight: 700; letter-spacing: .34em; color: rgba(246,195,68,.6); }

/* ===== U4 フレームレス・タイポ ===== */
.uc-type { position: relative; display: flex; align-items: baseline; gap: 4px; padding: 2px 2px 6px; }
.uc-type__value {
  font-size: 25px;
  line-height: 1;
  letter-spacing: .02em;
  background: linear-gradient(175deg, #fff3cf 10%, #f6c344 45%, #b8860b 90%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 10px rgba(246,195,68,.45));
}
.uc-type__unit { font-family: var(--uc-mono); font-size: 10px; font-weight: 800; color: rgba(246,195,68,.8); }
.uc-type__scan {
  position: absolute; left: 0; right: 0; bottom: 0; height: 2px;
  background: repeating-linear-gradient(90deg, rgba(246,195,68,.75) 0 8px, transparent 8px 12px);
}

/* ===== U5 コーナーブラケット ===== */
.uc-bracket { position: relative; display: flex; flex-direction: column; align-items: flex-end; gap: 1px; padding: 5px 10px; }
.uc-bracket__c { position: absolute; width: 9px; height: 9px; border-color: var(--ucg); border-style: solid; }
.uc-bracket__c--tl { top: 0; left: 0; border-width: 1.5px 0 0 1.5px; }
.uc-bracket__c--br { bottom: 0; right: 0; border-width: 0 1.5px 1.5px 0; }
.uc-bracket__label { font-family: var(--uc-mono); font-size: 5.5px; font-weight: 700; letter-spacing: .3em; color: rgba(246,195,68,.6); }
.uc-bracket__value { font-size: 18px; font-weight: 700; line-height: 1; color: #ffedb0; letter-spacing: .04em; text-shadow: 0 0 10px rgba(246,195,68,.5); font-variant-numeric: tabular-nums; }

/* ===== U6 ノッチ・プレート ===== */
.uc-plate {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  padding: 5px 16px 4px;
  clip-path: polygon(0 0, 38% 0, 44% 4px, 56% 4px, 62% 0, 100% 0, 100% 100%, 0 100%);
  border: 1px solid rgba(246, 195, 68, 0.55);
  background: linear-gradient(180deg, rgba(52,38,10,.95), rgba(16,12,4,.95));
  box-shadow: inset 0 1px 0 rgba(255,236,170,.25), 0 0 12px rgba(246,195,68,.18);
}
.uc-plate__rivet {
  position: absolute; top: 50%; width: 4px; height: 4px; border-radius: 999px;
  transform: translateY(-50%);
  background: radial-gradient(circle at 35% 35%, #ffe9a8, #8a6410);
}
.uc-plate__rivet--l { left: 5px; }
.uc-plate__rivet--r { right: 5px; }
.uc-plate__value { font-size: 15px; font-weight: 800; font-style: italic; line-height: 1.1; color: #ffe9a8; text-shadow: 0 1px 0 rgba(0,0,0,.6), 0 0 10px rgba(246,195,68,.4); font-variant-numeric: tabular-nums; }
.uc-plate__label { font-family: var(--uc-mono); font-size: 5px; font-weight: 700; letter-spacing: .4em; color: rgba(246,195,68,.55); }

/* ===== U7 IC チップ ===== */
.uc-chip { position: relative; padding: 4px 0; }
.uc-chip__pins {
  position: absolute; left: 8px; right: 8px; height: 4px;
  background: repeating-linear-gradient(90deg, rgba(246,195,68,.65) 0 2px, transparent 2px 8px);
}
.uc-chip__pins--top { top: 0; }
.uc-chip__pins--bottom { bottom: 0; }
.uc-chip__body {
  display: flex; align-items: center; gap: 8px;
  border: 1px solid rgba(246,195,68,.65);
  background: #0d0a04;
  box-shadow: inset 0 0 10px rgba(246,195,68,.1);
  padding: 4px 10px;
}
.uc-chip__label { font-family: var(--uc-mono); font-size: 7px; font-weight: 700; letter-spacing: .18em; color: rgba(246,195,68,.6); border-right: 1px solid rgba(246,195,68,.3); padding-right: 8px; }
.uc-chip__value { font-family: var(--uc-mono); font-size: 14px; font-weight: 800; color: #ffe9a8; text-shadow: 0 0 8px rgba(246,195,68,.45); font-variant-numeric: tabular-nums; }

/* ===== U8 コイン ===== */
.uc-coin { display: flex; align-items: center; gap: 7px; }
.uc-coin__disc {
  display: grid; place-items: center;
  width: 26px; height: 26px; border-radius: 999px;
  background: conic-gradient(from 210deg, #f9d576, #b8860b 40%, #f6c344 70%, #8a6410);
  box-shadow: 0 0 12px rgba(246,195,68,.45), inset 0 0 4px rgba(0,0,0,.5);
}
.uc-coin__discInner {
  display: grid; place-items: center;
  width: 19px; height: 19px; border-radius: 999px;
  background: radial-gradient(circle at 35% 30%, #ffedb0, #d9a125 70%);
  font-family: var(--uc-mono); font-size: 10px; font-weight: 800; color: #241902;
}
.uc-coin__value { font-size: 19px; font-weight: 800; font-style: italic; line-height: 1; color: #ffe9a8; letter-spacing: -0.01em; text-shadow: 0 0 12px rgba(246,195,68,.5); font-variant-numeric: tabular-nums; }
`;
