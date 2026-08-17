"use client";

/**
 * 新規ユーザー向けチュートリアル比較 + 本番ライブツアー起動。
 */

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import cn from "clsx";
import { nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import CyberSubpageShell from "@/app/component/common/CyberSubpageShell";
import TutorialSlidesOverlay from "@/app/component/tutorial/TutorialSlidesOverlay";
import TutorialSpotlightTour from "@/app/component/tutorial/TutorialSpotlightTour";
import TutorialPracticeTour from "@/app/component/tutorial/TutorialPracticeTour";
import TutorialMockAppShell from "@/app/component/tutorial/TutorialMockAppShell";
import {
  TUTORIAL_PREVIEW_PATTERNS,
  type TutorialPreviewPattern,
} from "@/lib/tutorial/tutorialCopy";
import { TUTORIAL_CYAN } from "@/lib/tutorial/tutorialMotion";
import { clearAppTutorialSeen } from "@/lib/tutorial/tutorialSeen";
import { writeTutorialLivePhase } from "@/lib/tutorial/tutorialLivePhase";
import { useFirebaseUser } from "@/lib/useFirebaseUser";

const CYBER_CHAMFER_CLIP =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";

type Props = {
  variant: "web" | "mobile";
};

export default function TutorialPreviewPage({ variant }: Props) {
  const router = useRouter();
  const { fUser: user } = useFirebaseUser();
  const gamesHref = variant === "web" ? "/web/games" : "/mobile/games";
  const [pattern, setPattern] =
    useState<TutorialPreviewPattern>("hybrid");
  const [slidesOpen, setSlidesOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(
    "本番ツアーは Games 上で始まります。「本番ツアーを開始」を押してください"
  );

  const mockRootRef = useRef<HTMLDivElement>(null);

  const stopAll = useCallback(() => {
    setSlidesOpen(false);
    setSpotlightOpen(false);
    setPracticeOpen(false);
  }, []);

  const resetSeen = useCallback(async () => {
    await clearAppTutorialSeen(user?.uid ?? null);
    writeTutorialLivePhase(null);
  }, [user?.uid]);

  const startLiveTour = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    stopAll();
    try {
      await resetSeen();
      writeTutorialLivePhase("welcome");
      setStatus(`既読を消し、${gamesHref} へ移動します…`);
      router.push(gamesHref);
    } catch {
      setStatus("リセットに失敗しました。ログイン状態を確認してください");
      setBusy(false);
    }
  }, [busy, gamesHref, resetSeen, router, stopAll]);

  const play = useCallback(() => {
    stopAll();
    setResetKey((k) => k + 1);
    if (pattern === "slides") {
      setSlidesOpen(true);
      setStatus("A · スライドを再生中（比較用）");
    } else if (pattern === "spotlight") {
      window.setTimeout(() => {
        setSpotlightOpen(true);
        setStatus("B · スポットライトを再生中（比較用）");
      }, 60);
    } else {
      setPracticeOpen(true);
      setStatus(
        "C · 旧フルスクリーン練習（比較用）。本番は「本番ツアーを開始」"
      );
    }
  }, [pattern, stopAll]);

  return (
    <div className="relative min-h-screen text-white">
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(0,245,255,0.1), transparent 55%), #04070c",
        }}
      />

      <CyberSubpageShell
        eyebrow="DEV"
        title="Tutorial Preview"
        subtitle="本番ツアーは Games 画面上。既読クリア後に起動します。"
        onBack={() => router.push(gamesHref)}
        backAriaLabel="Games に戻る"
        contentClassName={
          variant === "web" ? "max-w-3xl px-6 py-8" : "max-w-lg px-3 py-4"
        }
      >
        <p
          className={cn(
            jp.className,
            "mb-4 text-[13px] leading-relaxed text-white/60"
          )}
        >
          本番の初回ツアーは Games の画面上で進行します。下のボタンで既読（local
          + Firestore）を消して起動できます。ログイン必須です。
        </p>

        <div className="mb-4 flex flex-wrap gap-2">
          {TUTORIAL_PREVIEW_PATTERNS.map((p) => {
            const on = pattern === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  stopAll();
                  setPattern(p.id);
                }}
                className={cn(
                  nameOxanium.className,
                  "border px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition",
                  on
                    ? "border-cyan-300/50 text-[#050508]"
                    : "border-white/15 text-white/55"
                )}
                style={
                  on
                    ? {
                        background: TUTORIAL_CYAN,
                        clipPath: CYBER_CHAMFER_CLIP,
                        WebkitClipPath: CYBER_CHAMFER_CLIP,
                      }
                    : {
                        clipPath: CYBER_CHAMFER_CLIP,
                        WebkitClipPath: CYBER_CHAMFER_CLIP,
                      }
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="mb-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void startLiveTour()}
            className={cn(
              nameOxanium.className,
              "border px-4 py-2.5 text-[12px] font-black uppercase tracking-wider disabled:opacity-50"
            )}
            style={{
              background: TUTORIAL_CYAN,
              color: "#050508",
              borderColor: "transparent",
              clipPath: CYBER_CHAMFER_CLIP,
              WebkitClipPath: CYBER_CHAMFER_CLIP,
            }}
          >
            本番ツアーを開始
          </button>
          <button
            type="button"
            onClick={play}
            className={cn(
              nameOxanium.className,
              "border border-white/25 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-white/80"
            )}
            style={{
              clipPath: CYBER_CHAMFER_CLIP,
              WebkitClipPath: CYBER_CHAMFER_CLIP,
            }}
          >
            比較用を再生
          </button>
          <button
            type="button"
            onClick={stopAll}
            className={cn(
              nameOxanium.className,
              "border border-white/20 px-4 py-2.5 text-[12px] font-bold uppercase tracking-wider text-white/70"
            )}
            style={{
              clipPath: CYBER_CHAMFER_CLIP,
              WebkitClipPath: CYBER_CHAMFER_CLIP,
            }}
          >
            停止
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => {
              void (async () => {
                setBusy(true);
                await resetSeen();
                setBusy(false);
                setStatus(
                  `既読をクリアしました（Firestore含む）。ログインした状態で ${gamesHref} を開いてください`
                );
              })();
            }}
            className={cn(
              nameOxanium.className,
              "border border-amber-400/30 px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-amber-200/80 disabled:opacity-50"
            )}
            style={{
              clipPath: CYBER_CHAMFER_CLIP,
              WebkitClipPath: CYBER_CHAMFER_CLIP,
            }}
          >
            既読クリア
          </button>
        </div>

        <p className={cn(jp.className, "mb-4 text-[13px] text-white/55")}>
          {status}
          {!user ? (
            <span className="mt-1 block text-rose-300/80">
              未ログインです。先にログインしてから開始してください。
            </span>
          ) : null}
        </p>

        {pattern === "spotlight" ? (
          <div ref={mockRootRef} className="relative">
            <TutorialMockAppShell showPredict />
          </div>
        ) : null}

        {pattern === "slides" || pattern === "hybrid" ? (
          <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-10 text-center">
            <p className={cn(nameRajdhani.className, "text-[13px] text-white/45")}>
              「本番ツアーを開始」→ Games 上のライブコーチ。
              「比較用を再生」は旧オーバーレイです。
            </p>
          </div>
        ) : null}
      </CyberSubpageShell>

      <TutorialSlidesOverlay
        open={slidesOpen}
        resetKey={resetKey}
        onClose={() => {
          setSlidesOpen(false);
          setStatus("A · スライドを閉じました");
        }}
      />

      <TutorialSpotlightTour
        open={spotlightOpen}
        resetKey={resetKey}
        rootRef={mockRootRef}
        onClose={() => {
          setSpotlightOpen(false);
          setStatus("B · スポットライトを閉じました");
        }}
      />

      <TutorialPracticeTour
        open={practiceOpen}
        resetKey={resetKey}
        language="ja"
        onFinish={() => {
          setPracticeOpen(false);
          setStatus("C · 比較用ツアー完了（既読は付けません）");
        }}
      />
    </div>
  );
}
