// app/component/predict/PredictionForm.tsx
"use client";

import { buildPredictOptions, type PredictOption } from "@/lib/predict-options";
import { useState, useEffect } from "react";
import MatchCard, { type MatchCardProps } from "@/app/component/games/MatchCard";
import { auth } from "@/lib/firebase";
import Tooltip from "../common/Tooltip";
/* イベントロガー */
import { logGameEvent } from "@/lib/analytics/logEvent";
import { toast } from "@/app/component/ui/toast";

import { usePredictionWalkthrough } from "./walkthrough/usePredictionWalkthrough";
import WalkthroughOverlay from "./walkthrough/WalkthroughOverlay";


import React, { forwardRef } from "react";


type Props = {
  dense?: boolean;
  game: MatchCardProps;
  user: { name: string; avatarUrl?: string; verified?: boolean };
  onPostCreated?: (payload: { id: string; at: Date }) => void;
};

type Slot = {
  optionId: string | null;
  odds: string; // 入力は文字列で保持
  pct: number;  // UI上は 0-100
};

/* ========= ユーティリティ ========= */


/** オッズを最小1.0、0.1刻みに丸めて文字列で返す（, → . も吸収） */
const coerceOdds = (raw: string) => {
  const s = String(raw ?? "").replace(",", ".").trim();
  const n = Number(s);
  if (!isFinite(n)) return "";
  const clamped = Math.max(1, n);
  return (Math.round(clamped * 10) / 10).toFixed(1);
};

/** 0.1刻み（浮動小数誤差許容）で >= 1.0 */
const oddsOk = (s: string) => {
  if (!s) return false;
  const n = Number(s);
  if (!isFinite(n) || n < 1) return false;
  return Math.abs(Math.round(n * 10) - n * 10) < 1e-6;
};

/** pct の配列を「整数0..100」に丸め、合計を 100 に強制調整する */
function normalizePct100(pcts: number[]) {
  const ints = pcts.map((v) => Math.max(0, Math.min(100, Math.round(v))));
  let sum = ints.reduce((a, b) => a + b, 0);
  if (sum === 100) return ints;

  // 調整先: 後ろから見て最初の非0。全て0なら末尾。
  const idx = (() => {
    for (let i = ints.length - 1; i >= 0; i--) if (ints[i] > 0) return i;
    return Math.max(0, ints.length - 1);
  })();
  const diff = 100 - sum;
  ints[idx] = Math.max(0, Math.min(100, ints[idx] + diff));
  return ints;
}

/** 数字専用キーボード＋安全にサニタイズする入力（Impact固定） */
const OddsInput = forwardRef<HTMLInputElement, {
  value: string;
  onChange: (v: string) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;   // ⭐追加
  onMouseDown?: (e: React.MouseEvent<HTMLInputElement>) => void;
  className?: string;
  placeholder?: string;
  ariaLabel?: string;
  style?: React.CSSProperties;
}>(

  (
    { value, onChange, onMouseDown, className, placeholder = "1.0", ariaLabel, style },
    ref
  ) => {
    return (
      <input
        ref={ref}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        enterKeyHint="done"
        pattern="[0-9]*[.,]?[0-9]*"
        className={className}
        value={value}
        onMouseDown={onMouseDown}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.,]/g, "");
          onChange(raw);
        }}
        onBlur={(e) => onChange(coerceOdds(e.target.value))}
        onWheel={(e) => (e.currentTarget as HTMLInputElement).blur()}
        placeholder={placeholder}
        aria-label={ariaLabel}
        style={{
          imeMode: "disabled",
          fontFamily:
            'Impact, "Arial Black", Anton, Inter, ui-sans-serif, system-ui, sans-serif',
          ...(style || {}),
        }}
      />
    );
  }
);

OddsInput.displayName = "OddsInput";

export { OddsInput };
/* ===================================== */

export default function PredictionForm({ dense = false, game, user, onPostCreated }: Props) {

  const {
  running,
  step,
  targetRect,
  refs,
  next,
  close,
  start,
} = usePredictionWalkthrough();

// 🔥 ここに追加する（①）
  // -------------------------------------------------
  const hasSeenGlobal =
  typeof window !== "undefined" &&
  localStorage.getItem("prediction_onboarding_done") === "1";
  // -------------------------------------------------

const [hasShown, setHasShown] = useState({
    mainOption: false,
    mainOdds: false,
    mainPct: false,
    secondaryOption: false,
  });

  const u = {
    name: user.name,
    avatarUrl: user.avatarUrl ?? "/avatar-placeholder.png",
    verified: !!user.verified,
  };

  const options: PredictOption[] = buildPredictOptions(
    game?.league ?? "bj",
    game?.home?.name ?? "Home",
    game?.away?.name ?? "Away"
  );

  const findLabelById = (id: string | null) =>
    (id && options.find((o) => o.id === id)?.label) || "";

  const calcUnits = (slot: Slot) => {
    const o = Number(slot.odds);
    const p = Number(slot.pct ?? 0) / 100; // UI表示用
    if (!isFinite(o) || o <= 0) return 0;
    return p * o;
  };

  const [reason, setReason] = useState("");
  const [main, setMain] = useState<Slot>({ optionId: null, odds: "", pct: 100 });
  const [secondary, setSecondary] = useState<Slot>({ optionId: null, odds: "", pct: 0 });
  const [tertiary, setTertiary] = useState<Slot>({ optionId: null, odds: "", pct: 0 });
  const [showTertiary, setShowTertiary] = useState(false);

  // トースト＆送信中
  const [submitting, setSubmitting] = useState(false);

  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
const [showTooltip, setShowTooltip] = useState(false);

  type ActiveKey = "main" | "secondary" | "tertiary";
  const clamp = (n: number, min = 0, max = 100) =>
    Math.min(max, Math.max(min, Math.round(n)));

  const getPct = (k: ActiveKey) =>
    k === "main" ? main.pct : k === "secondary" ? secondary.pct : tertiary.pct;

  const setPct = (k: ActiveKey, pct: number) => {
    const v = clamp(pct, 0, 100);
    if (k === "main") setMain((s) => ({ ...s, pct: v }));
    else if (k === "secondary") setSecondary((s) => ({ ...s, pct: v }));
    else setTertiary((s) => ({ ...s, pct: v }));
  };

  const redistribute3 = (active: ActiveKey, value: number) => {
    const p = clamp(value, 0, 100);
    const rest = 100 - p;

    const others: ActiveKey[] =
      active === "main" ? ["secondary", "tertiary"]
      : active === "secondary" ? ["main", "tertiary"]
      : ["main", "secondary"];

    const sum = getPct(others[0]) + getPct(others[1]);
    const r0 = sum > 0 ? getPct(others[0]) / sum : 0.5;
    const o0 = Math.round(rest * r0);
    const o1 = rest - o0;

    setPct(active, p);
    setPct(others[0], o0);
    setPct(others[1], o1);
  };

  const setMainPct = (p: number) => {
    const np = clamp(p, 0, 100);
    if (showTertiary) {
      redistribute3("main", np);
    } else {
      setMain((s) => ({ ...s, pct: np }));
      setSecondary((s) => ({ ...s, pct: 100 - np }));
    }
  };
  const setSecondaryPct = (p: number) => {
    const np = clamp(p, 0, 100);
    if (showTertiary) {
      redistribute3("secondary", np);
    } else {
      setSecondary((s) => ({ ...s, pct: np }));
      setMain((s) => ({ ...s, pct: 100 - np }));
    }
  };
  const setTertiaryPct = (p: number) => redistribute3("tertiary", p);

  const sumPct = main.pct + secondary.pct + (showTertiary ? tertiary.pct : 0);
  const slotNeedsInput = (s: Slot) => s.pct > 0;

  const selectedIds = [
    main.pct > 0 ? main.optionId : null,
    secondary.pct > 0 ? secondary.optionId : null,
    showTertiary && tertiary.pct > 0 ? tertiary.optionId : null,
  ].filter(Boolean) as string[];
  const noDuplicate = new Set(selectedIds).size === selectedIds.length;

  const formValid =
    sumPct === 100 &&
    !!main.optionId && oddsOk(main.odds) &&
    (!slotNeedsInput(secondary) || (!!secondary.optionId && oddsOk(secondary.odds))) &&
    (!showTertiary || !slotNeedsInput(tertiary) || (!!tertiary.optionId && oddsOk(tertiary.odds))) &&
    noDuplicate;

  const canSubmit = formValid && !submitting;

  const padX = dense ? "px-3" : "px-6";
  const padY = dense ? "py-3" : "py-6";

  const homeSafe = game?.home ?? { name: game?.home?.name ?? "Home", record: { w: 0, l: 0 }, number: 0, colorHex: "#ef4444" };
  const awaySafe = game?.away ?? { name: game?.away?.name ?? "Away", record: { w: 0, l: 0 }, number: 0, colorHex: "#3b82f6" };

  // 入力共通
  const fieldBase =
    "w-full h-11 md:h-14 rounded-xl px-3 md:px-4 " +
    "bg-white/10 text-white placeholder-white/60 " +
    "border border-white/10 " +
    "focus:outline-none focus:ring-2 focus:ring-white/20";

  // ------- 投稿処理 -------
  const handleSubmit = async () => {
    if (!canSubmit) return;

    const me = auth.currentUser;
    if (!me) {
      alert("ログインが必要です");
      return;
    }

    try {
      setSubmitting(true);
      const idToken = await me.getIdToken();

      // pct>0 の枠だけ採用、まずは raw 抜き出し
      const raw = [
        { kind: "main" as const, data: main },
        { kind: "secondary" as const, data: secondary },
        { kind: "tertiary" as const, data: tertiary },
      ].filter(({ data }) => data.pct > 0);

      // ---- pct を「必ず合計100」に正規化（整数） ----
      const fixedPcts = normalizePct100(raw.map(({ data }) => data.pct));

      // legs ペイロード：pct は 0..100 の整数のみ
      const legs = raw.map(({ kind, data }, i) => ({
        kind,
        optionId: data.optionId!,                 // 必須
        label: findLabelById(data.optionId),
        odds: Number(coerceOdds(data.odds)),      // 0.1刻み、最小1.0
        pct: fixedPcts[i],                        // 0..100（合計100）
        outcome: "pending" as const,
      }));

      console.log("DEBUG_LEGS", legs);

      // usedOdds は pct(0..1)換算で計算
      const usedOdds = legs.reduce((acc, l) => acc + (l.pct / 100) * (l.odds || 0), 0);

      const startAtIso =
        (game as any)?.startAtJst ? new Date((game as any).startAtJst as any).toISOString() : undefined;

      const body = {
        game: {
  league: game.league,   // ← これだけでOK
  home: game.home?.name ?? "",
  away: game.away?.name ?? "",
  status: (game as any).status ?? "scheduled",
  gameId: (game as any).id,
  startAtIso,
},
        legs,
        note: reason || "",
        usedOdds,
        stakeTotal: 1,
        splitSum: 100,
      };

      // 送信
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        console.error("POST /api/posts error:", res.status, text);
        throw new Error(text || `投稿に失敗しました（${res.status}）`);
      }

      const json = await res.json().catch(() => ({} as any));

      /* 成功したら predict イベント（3pt）を非同期送信 */
      try {
        const normalizedLeague = (game.league === "bj" ? "B1" : "J1") as "B1" | "J1";
        void logGameEvent({
          type: "predict",
          gameId: (game as any).id,
          league: normalizedLeague,
        });
      } catch (e) {
        console.warn("log predict failed", e);
      }

      // ✅ 成功トースト
      toast.success("分析を投稿しました");


      // ✅ フォームをリセット
      setReason("");
      setMain({ optionId: null, odds: "", pct: 100 });
      setSecondary({ optionId: null, odds: "", pct: 0 });
      setTertiary({ optionId: null, odds: "", pct: 0 });
      setShowTertiary(false);

      // ✅ 親へ即時通知（任意）
      if (onPostCreated) {
        onPostCreated({ id: json.id ?? "(local)", at: new Date() });
      }
    } catch (e: any) {
      alert(e?.message ?? "投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className={`${padX} ${padY} text-white`}>
      {/* ✅ 成功トースト */}


      {/* 上：簡略MatchCard */}
      <MatchCard
        {...game}
        startAtJst={game?.startAtJst ?? null}
        home={homeSafe}
        away={awaySafe}
        dense={dense}
        hideLine
        hideActions
      />

      {/* ===== モバイル：2列レイアウト ===== */}
      <div className="mt-3 grid gap-3 md:hidden">
        {/* 本命（Main） */}
        <section className="grid grid-cols-[2.5fr_1fr] gap-3 md:hidden">
          {/* Row1: セレクト / オッズ */}
          <div className="col-span-1 min-w-0">
            <div className="text-[13px] leading-none mb-1 font-bold">本命</div>
            <select
  ref={refs.mainOption}
  onMouseDown={(e) => {
  if (hasSeenGlobal) return;
  if (!running && !hasShown.mainOption) {
    e.preventDefault();
    start("mainOption");
    setHasShown((s) => ({ ...s, mainOption: true }));
  }
}}
  value={main.optionId ?? ""}
  onChange={(e) =>
  setMain((s) => ({ ...s, optionId: e.target.value || null }))
}

              className={fieldBase + " appearance-none text-[12px]"}
              style={{ fontFamily: '"Hiragino Kaku Gothic Std","Meiryo","Noto Sans JP",sans-serif' }}
            >
              <option value="" disabled>選択してください</option>
              {options.map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="col-span-1 min-w-0 justify-self-end">
            <div className="text-[13px] leading-none mb-1 font-bold flex items-center gap-1">
  オッズ
  <button
    type="button"
    className="w-4 h-4 rounded-full bg-white/20 text-white text-[11px] flex items-center justify-center"
    onClick={(e) => {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setTooltipRect(rect);
      setShowTooltip(true);
      e.stopPropagation();
    }}
  >
    ?
  </button>
</div>

            <div className="flex items-center gap-2">
              <OddsInput
  ref={refs.mainOdds}
  value={main.odds}
  onMouseDown={(e) => {
  if (hasSeenGlobal) return;
  if (!running && !hasShown.mainOdds) {
    e.preventDefault();
    start("mainOdds");
    setHasShown((s) => ({ ...s, mainOdds: true }));
  }
}}
  onChange={(v) => {
    setMain((prev) => ({ ...prev, odds: v }));
  }}
  className={fieldBase + " text-right tabular-nums text-[18px] max-w-[120px]"}
  placeholder="1.0"
  ariaLabel="オッズ（本命）"
/>



              <span className="text-white/70 text-sm">倍</span>
            </div>
          </div>

          {/* Row2: スライダー / 獲得Unit */}
          <div className="col-span-1 min-w-0">
            <div className="text-[13px] leading-none mb-1 font-bold">配分</div>
            <input
  ref={refs.mainPct}
  type="range"
  min={0}
  max={100}
  step={1}
  value={main.pct}
  onChange={(e) => {
  if (!hasSeenGlobal && !running && !hasShown.mainPct) {
    start("mainPct");
    setHasShown((s) => ({ ...s, mainPct: true }));
  }

  const v = Number(e.target.value);
  showTertiary ? redistribute3("main", v) : setMainPct(v);
}}
  className="pretty-range w-full"
  style={{
    ["--fill" as any]: "#3b82f6",
    ["--val" as any]: `${main.pct}%`,
    ["--track-bg" as any]: "#333333",
    ["--track" as any]: "8px",
    ["--thumb" as any]: "24px",
  }}
/>
            <div className="flex justify-between text-[12px] opacity-70 mt-1 tabular-nums">
              <span>0%</span><span>{main.pct}%</span>
            </div>
          </div>

          <div className="col-span-1 min-w-0 justify-self-end pr-5 md:pr-0">
            <div className="text-[13px] leading-none mb-1 font-bold">獲得Unit</div>
            <input
              type="text"
              readOnly
              value={calcUnits(main).toFixed(2)}
              className={fieldBase + " text-right tabular-nums text-[18px] select-none max-w-[120px]"}
              style={{ fontFamily: 'Impact, "Arial Black", Anton, Inter, ui-sans-serif, system-ui, sans-serif' }}
              aria-label="獲得Unit"
            />
          </div>
        </section>

        {/* 抑え（Secondary） */}
        <section className="grid grid-cols-[2.5fr_1fr] gap-3 md:hidden">
          <div className="col-span-1 min-w-0">
            <div className="text-[13px] leading-none mb-1 font-bold">抑え</div>
            <select
  ref={refs.secondaryOption}
  value={secondary.optionId ?? ""}
  onMouseDown={(e) => {
  if (hasSeenGlobal) return;
  if (!running && !hasShown.secondaryOption) {
    e.preventDefault();
    start("secondaryOption");
    setHasShown((s) => ({ ...s, secondaryOption: true }));
  }
}}
  onChange={(e) =>
    setSecondary((s) => ({ ...s, optionId: e.target.value || null }))
  }
  className={fieldBase + " appearance-none text-[12px]"}
  style={{
    fontFamily:
      '"Hiragino Kaku Gothic Std","Meiryo","Noto Sans JP",sans-serif',
  }}
>
  <option value="" disabled>選択してください</option>
  {options
    .filter((o) => o.id !== main.optionId)
    .map((o) => (
      <option key={o.id} value={o.id}>
        {o.label}
      </option>
    ))}
</select>
          </div>

          <div className="col-span-1 min-w-0 justify-self-end">
            <div className="text-[13px] leading-none mb-1 font-bold">オッズ</div>
            <div className="flex items-center gap-2">
              <OddsInput
                value={secondary.odds}
                onChange={(v) => setSecondary((prev) => ({ ...prev, odds: v }))}
                className={fieldBase + " text-right tabular-nums text-[18px] max-w-[120px]"}
                placeholder="1.0"
                ariaLabel="オッズ（抑え）"
              />
              <span className="text-white/70 text-sm">倍</span>
            </div>
          </div>

          <div className="col-span-1 min-w-0">
            <div className="text-[13px] leading-none mb-1 font-bold">配分</div>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={secondary.pct}
              onChange={(e) => setSecondaryPct(Number(e.target.value))}
              className="pretty-range w-full"
              style={{
                ["--fill" as any]: "#ec4899",
                ["--val" as any]: `${secondary.pct}%`,
                ["--track-bg" as any]: "#333333",
                ["--track" as any]: "8px",
                ["--thumb" as any]: "24px",
              }}
            />
            <div className="flex justify-between text-[12px] opacity-70 mt-1 tabular-nums">
              <span>0%</span><span>{secondary.pct}%</span>
            </div>
          </div>

          <div className="col-span-1 min-w-0 justify-self-end pr-5 md:pr-0">
            <div className="text-[13px] leading-none mb-1 font-bold">獲得Unit</div>
            <input
              type="text"
              readOnly
              value={calcUnits(secondary).toFixed(2)}
              className={fieldBase + " text-right tabular-nums text-[18px] select-none max-w-[120px]"}
              style={{ fontFamily: 'Impact, "Arial Black", Anton, Inter, ui-sans-serif, system-ui, sans-serif' }}
              aria-label="獲得Unit（抑え）"
            />
          </div>
        </section>

        {/* 穴 追加/削除 トグル */}
        <div className="flex justify-end">
          {!showTertiary ? (
            <button
              type="button"
              onClick={() => {
                setTertiary((s) => ({ ...s, pct: 0, optionId: null, odds: "" }));
                setShowTertiary(true);
              }}
              className="px-3 h-9 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15"
            >
              ＋ 穴を追加
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const give = tertiary.pct;
                setShowTertiary(false);
                setTertiary({ optionId: null, odds: "", pct: 0 });
                setMainPct(main.pct + give);
              }}
              className="px-3 h-9 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15"
            >
              － 穴を削除
            </button>
          )}
        </div>

        {/* 穴（Tertiary） */}
        {showTertiary && (
          <section className="grid grid-cols-[2.5fr_1fr] gap-3 md:hidden">
            <div className="col-span-1 min-w-0">
              <div className="text-[13px] leading-none mb-1 font-bold">穴</div>
              <select
                value={tertiary.optionId ?? ""}
                onChange={(e) => setTertiary((s) => ({ ...s, optionId: e.target.value || null }))}
                className={fieldBase + " appearance-none text-[12px]"}
                style={{ fontFamily: '"Hiragino Kaku Gothic Std","Meiryo","Noto Sans JP",sans-serif' }}
              >
                <option value="" disabled>選択してください</option>
                {options
                  .filter((o) => o.id !== main.optionId && o.id !== secondary.optionId)
                  .map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
              </select>
            </div>

            <div className="col-span-1 min-w-0 justify-self-end">
              <div className="text-[13px] leading-none mb-1 font-bold">オッズ</div>
              <div className="flex items-center gap-2">
                <OddsInput
                  value={tertiary.odds}
                  onChange={(v) => setTertiary((prev) => ({ ...prev, odds: v }))}
                  className={fieldBase + " text-right tabular-nums text-[18px] max-w-[120px]"}
                  placeholder="1.0"
                  ariaLabel="オッズ（穴）"
                />
                <span className="text-white/70 text-sm">倍</span>
              </div>
            </div>

            <div className="col-span-1 min-w-0">
              <div className="text-[13px] leading-none mb-1 font-bold">配分</div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={tertiary.pct}
                onChange={(e) => setTertiaryPct(Number(e.target.value))}
                className="pretty-range w-full"
                style={{
                  ["--fill" as any]: "#facc15",
                  ["--val" as any]: `${tertiary.pct}%`,
                  ["--track-bg" as any]: "#333333",
                  ["--track" as any]: "8px",
                  ["--thumb" as any]: "24px",
                }}
              />
              <div className="flex justify-between text-[12px] opacity-70 mt-1 tabular-nums">
                <span>0%</span><span>{tertiary.pct}%</span>
              </div>
            </div>

            <div className="col-span-1 min-w-0 justify-self-end pr-5 md:pr-0">
              <div className="text-[13px] leading-none mb-1 font-bold">獲得Unit</div>
              <input
                type="text"
                readOnly
                value={calcUnits(tertiary).toFixed(2)}
                className={fieldBase + " text-right tabular-nums text-[18px] select-none max-w-[120px]"}
                style={{ fontFamily: 'Impact, "Arial Black", Anton, Inter, ui-sans-serif, system-ui, sans-serif' }}
                aria-label="獲得Unit（穴）"
              />
            </div>
          </section>
        )}
      </div>

      {/* ===== Web（md+）従来の3列 + 下段スライダー ===== */}
      <div
        className={[
          "hidden md:grid",
          "grid-cols-[minmax(420px,1fr)_minmax(180px,220px)_minmax(180px,220px)]",
          "gap-x-8 gap-y-4",
          "items-center",
          "mt-4",
        ].join(" ")}
      >
        {/* 本命 */}
        <div className="min-w-0 flex flex-col">
          <div className="text-[18px] leading-none mb-1 font-bold">本命</div>
          <select
            value={main.optionId ?? ""}
            onChange={(e) => setMain((s) => ({ ...s, optionId: e.target.value || null }))}
            className={fieldBase + " appearance-none"}
            style={{ fontFamily: '"Hiragino Kaku Gothic Std","Meiryo","Noto Sans JP",sans-serif' }}
          >
            <option value="" disabled>選択してください</option>
            {options.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="min-w-0 flex flex-col">
          <div className="text-[18px] leading-none mb-1 font-bold">オッズ</div>
          <div className="flex items-center gap-2">
            <OddsInput
              value={main.odds}
              onChange={(v) => setMain((prev) => ({ ...prev, odds: v }))}
              className={fieldBase + " text-right tabular-nums text-[26px]"}
              placeholder="1.0"
              ariaLabel="オッズ（本命）"
            />
            <span className="text-white/70 md:text-base text-sm">倍</span>
          </div>
        </div>

        <div className="min-w-0 flex flex-col">
          <div className="text-[18px] leading-none mb-1 font-bold">獲得Unit</div>
          <input
            type="text"
            readOnly
            value={calcUnits(main).toFixed(2)}
            className={fieldBase + " text-right tabular-nums text-[26px] select-none"}
            style={{ fontFamily: 'Impact, "Arial Black", Anton, Inter, ui-sans-serif, system-ui, sans-serif' }}
            aria-label="獲得Unit"
          />
        </div>

        <div className="col-start-1 col-end-4">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={main.pct}
            onChange={(e) =>
              showTertiary
                ? redistribute3("main", Number(e.target.value))
                : setMainPct(Number(e.target.value))
            }
            className="pretty-range w-full"
            style={{
              ["--fill" as any]: "#3b82f6",
              ["--val" as any]: `${main.pct}%`,
              ["--track-bg" as any]: "#333333",
              ["--track" as any]: "10px",
              ["--thumb" as any]: "28px",
            }}
          />
          <div className="flex justify-between text-[16px] opacity-70 mt-2 tabular-nums">
            <span>0%</span><span>{main.pct}%</span>
          </div>
        </div>

        {/* 抑え */}
        <div className="min-w-0 flex flex-col">
          <div className="text-[18px] leading-none mb-1 font-bold">抑え</div>
          <select
            value={secondary.optionId ?? ""}
            onChange={(e) => setSecondary((s) => ({ ...s, optionId: e.target.value || null }))}
            className={fieldBase + " appearance-none"}
            style={{ fontFamily: '"Hiragino Kaku Gothic Std","Meiryo","Noto Sans JP",sans-serif' }}
          >
            <option value="" disabled>選択してください</option>
            {options
              .filter((o) => o.id !== main.optionId)
              .map((o) => (
                <option key={o.id} value={o.id}>{o.label}</option>
              ))}
          </select>
        </div>

        <div className="min-w-0 flex flex-col">
          <div className="text-[18px] leading-none mb-1 font-bold">オッズ</div>
          <div className="flex items-center gap-2">
            <OddsInput
              value={secondary.odds}
              onChange={(v) => setSecondary((prev) => ({ ...prev, odds: v }))}
              className={fieldBase + " text-right tabular-nums text-[26px]"}
              placeholder="1.0"
              ariaLabel="オッズ（抑え）"
            />
            <span className="text-white/70 md:text-base text-sm">倍</span>
          </div>
        </div>

        <div className="min-w-0 flex flex-col">
          <div className="text-[18px] leading-none mb-1 font-bold">獲得Unit</div>
          <input
            type="text"
            readOnly
            value={calcUnits(secondary).toFixed(2)}
            className={fieldBase + " text-right tabular-nums text-[26px] select-none"}
            style={{ fontFamily: 'Impact, "Arial Black", Anton, Inter, ui-sans-serif, system-ui, sans-serif' }}
            aria-label="獲得Unit（抑え）"
          />
        </div>

        <div className="col-start-1 col-end-4">
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={secondary.pct}
            onChange={(e) => setSecondaryPct(Number(e.target.value))}
            className="pretty-range w-full"
            style={{
              ["--fill" as any]: "#ec4899",
              ["--val" as any]: `${secondary.pct}%`,
              ["--track-bg" as any]: "#333333",
              ["--track" as any]: "10px",
              ["--thumb" as any]: "28px",
            }}
          />
          <div className="flex justify-between text-[16px] opacity-70 mt-2 tabular-nums">
            <span>0%</span><span>{secondary.pct}%</span>
          </div>
        </div>

        {/* 穴トグル */}
        <div className="col-start-1 col-end-4 flex justify-end mt-2">
          {!showTertiary ? (
            <button
              type="button"
              onClick={() => {
                setTertiary((s) => ({ ...s, pct: 0, optionId: null, odds: "" }));
                setShowTertiary(true);
              }}
              className="px-3 h-9 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15"
            >
              ＋ 穴を追加
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const give = tertiary.pct;
                setShowTertiary(false);
                setTertiary({ optionId: null, odds: "", pct: 0 });
                setMainPct(main.pct + give);
              }}
              className="px-3 h-9 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15"
            >
              － 穴を削除
            </button>
          )}
        </div>

        {/* 穴（Tertiary） */}
        {showTertiary && (
          <>
            <div className="min-w-0 flex flex-col">
              <div className="text-[18px] leading-none mb-1 font-bold">穴</div>
              <select
                value={tertiary.optionId ?? ""}
                onChange={(e) => setTertiary((s) => ({ ...s, optionId: e.target.value || null }))}
                className={fieldBase + " appearance-none"}
                style={{ fontFamily: '"Hiragino Kaku Gothic Std","Meiryo","Noto Sans JP",sans-serif' }}
              >
                <option value="" disabled>選択してください</option>
                {options
                  .filter((o) => o.id !== main.optionId && o.id !== secondary.optionId)
                  .map((o) => (
                    <option key={o.id} value={o.id}>{o.label}</option>
                  ))}
              </select>
            </div>

            <div className="min-w-0 flex flex-col">
              <div className="text-[18px] leading-none mb-1 font-bold">オッズ</div>
              <div className="flex items-center gap-2">
                <OddsInput
                  value={tertiary.odds}
                  onChange={(v) => setTertiary((prev) => ({ ...prev, odds: v }))}
                  className={fieldBase + " text-right tabular-nums text-[26px]"}
                  placeholder="1.0"
                  ariaLabel="オッズ（穴）"
                />
                <span className="text-white/70 md:text-base text-sm">倍</span>
              </div>
            </div>

            <div className="min-w-0 flex flex-col">
              <div className="text-[18px] leading-none mb-1 font-bold">獲得Unit</div>
              <input
                type="text"
                readOnly
                value={calcUnits(tertiary).toFixed(2)}
                className={fieldBase + " text-right tabular-nums text-[26px] select-none"}
                style={{ fontFamily: 'Impact, "Arial Black", Anton, Inter, ui-sans-serif, system-ui, sans-serif' }}
                aria-label="獲得Unit（穴）"
              />
            </div>

            <div className="col-start-1 col-end-4">
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={tertiary.pct}
                onChange={(e) => setTertiaryPct(Number(e.target.value))}
                className="pretty-range w-full"
                style={{
                  ["--fill" as any]: "#facc15",
                  ["--val" as any]: `${tertiary.pct}%`,
                  ["--track-bg" as any]: "#333333",
                  ["--track" as any]: "10px",
                  ["--thumb" as any]: "28px",
                }}
              />
              <div className="flex justify-between text-[16px] opacity-70 mt-2 tabular-nums">
                <span>0%</span><span>{tertiary.pct}%</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* X風：投稿カード */}
      <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4 md:p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/10 overflow-hidden">
  {u.avatarUrl ? (
    <img
      src={u.avatarUrl}
      alt=""
      className="w-full h-full object-cover"
      onError={(e) => {
        const t = e.currentTarget as HTMLImageElement;
        t.style.display = "none";   // 壊れた画像は非表示（丸背景のみ）
      }}
    />
  ) : null}
</div>
            <div className="flex items-center gap-2">
              <span
                className="font-bold text-[15px] md:text-[16px]"
                style={{ fontFamily: '"Hiragino Kaku Gothic Pro","Meiryo","Noto Sans JP",sans-serif' }}
              >
                {u.name}
              </span>
              {u.verified && (
                <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
                  <circle cx="12" cy="12" r="12" fill="#1d9bf0" />
                  <path d="M10.2 14.6l-2-2 1.2-1.2 0.8 0.8 3.6-3.6 1.2 1.2z" fill="white" />
                </svg>
              )}
            </div>
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            aria-disabled={!canSubmit}
            className={[
              "rounded-xl h-9 md:h-10 px-4 font-bold transition",
              canSubmit
                ? "bg-lime-400 text-black hover:bg-lime-300"
                : "bg-white/10 text-white/60 cursor-not-allowed",
            ].join(" ")}
            onClick={handleSubmit}
          >
            {submitting ? "投稿中…" : "投稿"}
          </button>
        </div>

        <div className="mt-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="根拠（分析・注目ポイント・情報源など）を入力…（任意）"
            className={[
              "w-full rounded-xl resize-none",
              "bg-white/8 border border-white/10",
              "p-3 md:p-4 leading-relaxed",
              "placeholder-white/50 text-white",
              "focus:outline-none focus:ring-2 focus:ring-white/20",
            ].join(" ")}
            style={{ fontFamily: '"Hiragino Kaku Gothic Pro","Meiryo","Noto Sans JP",sans-serif' }}
          />
        </div>
      </div>
    </div>
    {/* 🔥 Walkthrough Overlay（オンボーディング） */}
{running && (
  <WalkthroughOverlay
    targetRect={targetRect}
    step={step}
    onClose={() => {
  close(); // ← 先に必ず閉じる（重要）

  setHasShown((prev) => {
    const updated = { ...prev, [step.key]: true };

    const allDone = Object.values(updated).every(Boolean);
    if (allDone) {
      localStorage.setItem("prediction_onboarding_done", "1");
    }

    return updated;
  });
}}
  />
)}
{/* 🔥 オッズ補足ツールチップ */}
{showTooltip && tooltipRect && (
  <Tooltip
    anchorRect={tooltipRect}
    message="オッズはスポーツくじ Winner の公式サイトを参考にしてください"
    onClose={() => setShowTooltip(false)}
  />
)}
    </>
  );
}