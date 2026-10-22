"use client";

/** ASK の見た目候補。本番のチャットは触らない。`/mobile/ask/ui` だけで切り替える。 */
import { useEffect, useState, type ReactNode } from "react";
import { SendHorizontal } from "lucide-react";
import cn from "clsx";
import { nameOxanium } from "@/lib/fonts";

const VARIANTS = [
  { id: "steps", label: "照合ステップ" },
  { id: "live", label: "LIVE" },
  { id: "log", label: "取得ログ" },
  { id: "skeleton", label: "骨格" },
  { id: "sheet", label: "下シート" },
  { id: "scorebug", label: "スコアボード" },
  { id: "type", label: "タイプライター" },
  { id: "card", label: "1枚カード" },
  { id: "table", label: "表" },
] as const;

type VariantId = (typeof VARIANTS)[number]["id"];

const DOTS =
  "radial-gradient(circle, rgba(255,255,255,0.16) 1px, transparent 1.2px)";

export default function NbaAskUiPreview() {
  const [id, setId] = useState<VariantId>("steps");
  return (
    <div className="min-h-dvh bg-black text-white">
      <div className="sticky top-0 z-20 flex gap-1.5 overflow-x-auto border-b border-white/10 bg-black/90 px-3 py-2 backdrop-blur">
        {VARIANTS.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setId(v.id)}
            className={cn(
              "shrink-0 px-2.5 py-1.5 text-[12px]",
              id === v.id ? "bg-[#00F5FF] text-[#041014]" : "text-white/70",
            )}
          >
            {v.label}
          </button>
        ))}
      </div>
      <Frame key={id}>
        <Variant id={id} />
      </Frame>
    </div>
  );
}

function Frame({ children }: { children: ReactNode }) {
  return (
    <div
      className="relative mx-auto flex min-h-[calc(100dvh-49px)] max-w-lg flex-col"
      style={{ backgroundImage: DOTS, backgroundSize: "18px 18px", backgroundColor: "#07080d" }}
    >
      {children}
    </div>
  );
}

function Variant({ id }: { id: VariantId }) {
  if (id === "scorebug") return <Scorebug />;
  if (id === "type") return <Typewriter />;
  if (id === "card") return <OneCard />;
  if (id === "table") return <StatTable />;
  return (
    <>
      <AskHeader align="center" />
      <div className="flex flex-1 flex-col px-4 pt-6">
        {id === "sheet" ? <SheetThread /> : <UserBubble text={questionFor(id)} />}
        <div className="mt-5">{id === "steps" ? <Steps /> : null}</div>
        <div className="mt-5">{id === "live" ? <LiveRow /> : null}</div>
        <div className="mt-5">{id === "log" ? <FetchLog /> : null}</div>
        <div className="mt-5">{id === "skeleton" ? <Skeleton /> : null}</div>
        <div className="mt-auto">
          {id === "sheet" ? <BottomSheet /> : null}
          <Quota />
          <Input filled />
        </div>
      </div>
      <TabBar />
    </>
  );
}

function questionFor(id: VariantId): string {
  if (id === "live" || id === "sheet") return "昨日の試合結果は？";
  if (id === "log") return "エンビードの今季平均は？";
  if (id === "skeleton") return "カリーの直近5試合";
  return "今の売り上げは？";
}

function AskHeader({ align }: { align: "center" | "left" | "bar" }) {
  if (align === "bar") {
    return (
      <div className="flex items-center justify-between border-b border-[#00F5FF]/40 px-4 py-3">
        <span className={`${nameOxanium.className} text-[18px] italic tracking-wide text-[#00F5FF]`}>ASK</span>
        <span className={`${nameOxanium.className} text-[11px] tracking-[0.22em] text-[#00F5FF]/80`}>UNITERZ</span>
      </div>
    );
  }
  return (
    <div className={cn("px-4 pt-4", align === "center" ? "text-center" : "text-left")}>
      <p className={`${nameOxanium.className} text-[10px] tracking-[0.28em] text-[#00F5FF]/80`}>UNITERZ AI</p>
      <p className={`${nameOxanium.className} text-[34px] italic leading-none tracking-wide text-[#00F5FF]`}>ASK</p>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="ml-auto max-w-[78%] bg-[#00F5FF] px-3.5 py-2.5 text-[15px] text-[#041014]">{text}</div>
  );
}

function Quota() {
  return <p className="mb-2 text-[11px] text-white/45">スタッツの質問 無料であと 2 回</p>;
}

function Input({ filled, underline }: { filled?: boolean; underline?: boolean }) {
  if (underline) {
    return (
      <div className="flex items-end gap-3 border-b border-[#00F5FF] pb-2">
        <span className="flex-1 text-[16px] text-white/40">質問する</span>
        <SendHorizontal className="h-4 w-4 text-[#00F5FF]" />
      </div>
    );
  }
  return (
    <div className={cn("mb-3 flex items-center", filled ? "bg-white/[0.06]" : "")}>
      <span className="flex-1 px-3.5 py-3 text-[16px] text-white/40">質問する</span>
      <span className="flex h-[46px] w-[46px] items-center justify-center bg-[#00F5FF] text-[#041014]">
        <SendHorizontal className="h-[18px] w-[18px]" />
      </span>
    </div>
  );
}

function TabBar() {
  return (
    <div className="mx-3 mb-3 flex h-14 items-center justify-around rounded-2xl border border-white/15 bg-black/50 text-white/70">
      <span className="text-[18px]">⚔</span>
      <span className="text-[18px]">🌐</span>
      <span className="text-[18px]">🏆</span>
      <span className="text-[18px]">👥</span>
      <span className="text-[18px]">👤</span>
    </div>
  );
}

function Steps() {
  const labels = ["試合", "選手", "順位"];
  const [on, setOn] = useState(1);
  useEffect(() => {
    const t = window.setInterval(() => setOn((n) => (n + 1) % 3), 900);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div>
      <p className="mb-4 border-l-2 border-[#00F5FF] pl-2 text-[13px] text-[#00F5FF]">データを照合中</p>
      <div className="flex items-center justify-between px-2">
        {labels.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div
              className={cn(
                "grid h-[72px] w-[72px] place-items-center text-[15px]",
                i === on
                  ? "bg-[#00F5FF] text-[#041014] shadow-[0_0_18px_rgba(0,245,255,0.45)]"
                  : "border border-white/50 text-white",
              )}
            >
              {label}
            </div>
            {i < 2 ? <div className="mx-1 h-px flex-1 bg-[#00F5FF]/70" /> : null}
          </div>
        ))}
      </div>
    </div>
  );
}

function LiveRow() {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className={`${nameOxanium.className} bg-[#00F5FF] px-1.5 py-0.5 text-[11px] font-bold text-[#041014]`}>
          LIVE
        </span>
        <span className="text-[14px]">試合データを見ています</span>
        <span className="ml-auto flex h-4 items-end gap-0.5">
          {[8, 14, 10].map((h, i) => (
            <span
              key={i}
              className="w-1 origin-bottom bg-[#00F5FF]"
              style={{ height: h, animation: `askBar 0.8s ${i * 0.15}s ease-in-out infinite` }}
            />
          ))}
        </span>
      </div>
      <div className="mt-2 h-px bg-white/20">
        <div className="h-px w-2/3 bg-[#00F5FF]" style={{ animation: "askGrow 1.6s ease-in-out infinite" }} />
      </div>
      <style>{`@keyframes askBar{0%,100%{transform:scaleY(0.4)}50%{transform:scaleY(1)}}@keyframes askGrow{0%{width:12%}100%{width:88%}}`}</style>
    </div>
  );
}

function FetchLog() {
  const lines = ["選手を特定", "今季の平均を取得", "数字を確認"];
  const [n, setN] = useState(1);
  useEffect(() => {
    const t = window.setInterval(() => setN((v) => (v >= 3 ? 1 : v + 1)), 800);
    return () => window.clearInterval(t);
  }, []);
  return (
    <div>
      <p className="mb-2 text-[13px] text-[#00F5FF]">取得ログ</p>
      <div className="border-l-2 border-[#00F5FF] bg-white/[0.04] py-2 pl-3">
        {lines.slice(0, n).map((line, i) => (
          <p key={line} className={cn("py-0.5 font-mono text-[14px]", i === n - 1 ? "text-white" : "text-white/45")}>
            <span className="text-[#00F5FF]">{">"} </span>
            {line}
            {i === n - 1 ? <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 bg-[#00F5FF]" /> : null}
          </p>
        ))}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div>
      <p className="mb-3 text-[13px] text-[#00F5FF]">回答を組んでいます</p>
      <div className="relative space-y-2.5">
        <div className="h-2 w-[78%] bg-white/20" />
        <div className="relative h-2 w-[92%] overflow-hidden bg-white/15">
          <div className="absolute inset-y-0 w-1/3 bg-[#00F5FF]" style={{ animation: "askScan 1.4s linear infinite" }} />
        </div>
        <div className="h-2 w-[64%] bg-white/15" />
      </div>
      <style>{`@keyframes askScan{from{left:-30%}to{left:100%}}`}</style>
    </div>
  );
}

function SheetThread() {
  return (
    <>
      <UserBubble text="昨日の試合結果は？" />
      <p className="mr-auto mt-4 max-w-[88%] bg-white/[0.06] px-3.5 py-2.5 text-[15px] leading-relaxed text-white/90">
        レイカーズが 112-108 で勝ちました。
      </p>
    </>
  );
}

function BottomSheet() {
  return (
    <div className="mb-3 border-t-2 border-[#00F5FF] bg-black px-4 py-3 text-center text-[14px]">
      順位を見ています <span className="text-[#00F5FF]">•••</span>
    </div>
  );
}

function Scorebug() {
  return (
    <>
      <AskHeader align="bar" />
      <div className="flex flex-1 flex-col px-4 pt-8">
        <p className="ml-auto text-[15px] text-[#00F5FF]">昨日の試合結果は？</p>
        <div className="mt-6 border-t border-white/25 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-[15px]">試合データ</span>
            <div className="h-2 w-36 overflow-hidden bg-white/20">
              <div className="h-full bg-[#00F5FF]" style={{ width: "68%", animation: "askGrow 1.6s ease-in-out infinite" }} />
            </div>
          </div>
        </div>
        <style>{`@keyframes askGrow{0%{width:18%}100%{width:86%}}`}</style>
        <div className="mt-auto">
          <Quota />
          <Input filled />
        </div>
      </div>
      <TabBar />
    </>
  );
}

function Typewriter() {
  const full = "今季の平均を見ています";
  const [n, setN] = useState(6);
  useEffect(() => {
    const t = window.setInterval(() => setN((v) => (v >= full.length ? 4 : v + 1)), 120);
    return () => window.clearInterval(t);
  }, [full.length]);
  return (
    <>
      <AskHeader align="left" />
      <div className="flex flex-1 flex-col px-4 pt-8">
        <p className="ml-auto text-[15px] text-[#00F5FF]">エンビードの今季平均は？</p>
        <p className="mt-6 text-[12px] text-[#00F5FF]">確認中</p>
        <p className="mt-1 text-[18px]">
          {full.slice(0, n)}
          <span className="ml-0.5 inline-block h-5 w-0.5 translate-y-0.5 bg-[#00F5FF]" />
        </p>
        <div className="mt-auto pb-4">
          <p className="mb-3 text-[11px] text-white/45">無料のスタッツあと 2 回</p>
          <Input underline />
        </div>
      </div>
      <TabBar />
    </>
  );
}

function OneCard() {
  const rows = [
    { done: true, label: "質問の種類" },
    { done: false, active: true, label: "公開情報を確認" },
    { done: false, label: "回答" },
  ];
  return (
    <>
      <div className="pt-5 text-center">
        <p className={`${nameOxanium.className} text-[18px] tracking-[0.2em] text-[#00F5FF]`}>ASK</p>
      </div>
      <div className="flex flex-1 flex-col px-6 pt-6">
        <div className="relative border border-white/10 bg-black/70 px-5 py-6">
          <span className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2 border-[#00F5FF]" />
          <span className="absolute right-0 top-0 h-4 w-4 border-r-2 border-t-2 border-[#00F5FF]" />
          <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-[#00F5FF]" />
          <span className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-[#00F5FF]" />
          <p className="text-[13px] text-white/45">質問</p>
          <p className="mt-2 text-[16px]">今の売り上げは？</p>
          <div className="my-4 h-px bg-white/20" />
          <p className="text-[13px] text-[#00F5FF]">照合中</p>
          <ul className="mt-3 space-y-3">
            {rows.map((row) => (
              <li key={row.label} className="flex items-center gap-2 text-[14px]">
                {row.done ? (
                  <span className="text-[#00F5FF]">✓</span>
                ) : row.active ? (
                  <span className="inline-block h-3 w-3 bg-[#00F5FF]" />
                ) : (
                  <span className="inline-block h-3 w-3" />
                )}
                <span className={row.done || row.active ? "text-white" : "text-white/35"}>{row.label}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-auto">
          <Input filled />
        </div>
      </div>
      <TabBar />
    </>
  );
}

function StatTable() {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const t = window.setInterval(() => setFilled((v) => !v), 1200);
    return () => window.clearInterval(t);
  }, []);
  const cells = filled ? ["26.4", "7.8", "8.2"] : ["—", "—", "—"];
  return (
    <>
      <AskHeader align="center" />
      <div className="flex flex-1 flex-col px-4 pt-6">
        <p className="inline-block self-start border border-[#00F5FF] px-3 py-2 text-[15px]">レブロンの今季平均</p>
        <p className="mt-4 text-[13px] text-[#00F5FF]">表を準備中</p>
        <div className="mt-3 grid grid-cols-4 gap-y-3 text-center text-[12px] text-white/55">
          <span />
          <span>得点</span>
          <span>リバウンド</span>
          <span>アシスト</span>
          <span className="text-left text-white">
            <span className="mr-1 text-[#00F5FF]">✓</span>今季
          </span>
          {cells.map((c, i) => (
            <span key={i} className="text-white">
              {c}
            </span>
          ))}
        </div>
        <div className="mt-auto">
          <Input filled />
        </div>
      </div>
      <TabBar />
    </>
  );
}
