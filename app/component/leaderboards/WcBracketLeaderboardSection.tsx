"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { nameBebas, jp } from "@/lib/fonts";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import {
  CYBER_MENU_ICON_CLASS,
  CYBER_MENU_ICON_STROKE,
  cyberChamferButtonClasses,
} from "@/lib/ui/cyberMenuButton";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import WcBracketSubmitModal from "@/app/component/predict/wc/WcBracketSubmitModal";
import WcBracketUserCard from "./WcBracketUserCard";
import useWcBracketLeaderboard, {
  type WcBracketLeaderboardRow,
} from "@/lib/leaderboards/useWcBracketLeaderboard";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";
import { isWcKnockoutBracketSubmissionOpen } from "@/lib/wc/wc-knockout-config";
import {
  saveWcBracket,
  loadWcBracket,
} from "@/lib/wc/wc-bracket-firestore";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import { isWcBracketComplete } from "@/lib/wc/wc-knockout-bracket";
import WcFullBracketMobile from "@/app/component/predict/wc/WcFullBracketMobile";
import WcBracketInputMobile from "@/app/component/predict/wc/WcBracketInputMobile";
import WcBracketStartPromptModal from "@/app/component/predict/wc/WcBracketStartPromptModal";
import WcBracketViewTabs, {
  type WcBracketViewMode,
} from "@/app/component/leaderboards/WcBracketViewTabs";
import WcBracketMarket from "@/app/component/predict/market/WcBracketMarket";
import { useWcKnockoutAdvancement } from "@/lib/wc/useWcKnockoutAdvancement";
import { useWcBracketResults } from "@/lib/wc/useWcBracketResults";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { profileHrefWithRankingsReturn } from "@/lib/navigation/rankingsProfileFrom";
import { profilePathKeyFromRow } from "@/lib/profile/profilePathKey";
import {
  RANKINGS_WC_BRACKET_INPUT_PARAM,
} from "@/lib/navigation/rankingsProfileFrom";

type Props = {
  season?: string;
};

const CARD_STAGGER = 0.05;
const CARD_DURATION = 0.4;

function cardDelay(index: number) {
  return index * CARD_STAGGER;
}

export default function WcBracketLeaderboardSection({
  season: propSeason,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMobile =
    pathname?.startsWith("/mobile") || pathname?.startsWith("/m/");

  const season = propSeason ?? WC_KNOCKOUT_SEASON;
  const { advancement: knockoutAdvancement } = useWcKnockoutAdvancement(season);
  const submissionOpen = isWcKnockoutBracketSubmissionOpen(season);
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const { loading, error, rows, myRow, refetch } =
    useWcBracketLeaderboard({
      season,
      uid,
    });

  const [savedLoading, setSavedLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [draftBracket, setDraftBracket] = useState<WcBracketState>({});
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submissionPromptOpen, setSubmissionPromptOpen] = useState(false);
  const [inputPageOpen, setInputPageOpen] = useState(false);
  const [viewMode, setViewMode] = useState<WcBracketViewMode>("survivor");
  const { winners: officialWinners } = useWcBracketResults(season, {
    pollIntervalMs: viewMode === "survivor" ? 30_000 : 0,
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadMine() {
      if (!uid) {
        if (!cancelled) {
          setHasSubmitted(false);
          setDraftBracket({});
          setSavedLoading(false);
        }
        return;
      }
      setSavedLoading(true);
      try {
        const doc = await loadWcBracket(uid, season);
        if (cancelled) return;
        if (doc?.isSubmitted && doc.bracket) {
          setHasSubmitted(true);
          setDraftBracket(doc.bracket);
        } else {
          setHasSubmitted(false);
          setDraftBracket(doc?.bracket ?? {});
        }
      } catch {
        if (!cancelled) {
          setHasSubmitted(false);
        }
      } finally {
        if (!cancelled) setSavedLoading(false);
      }
    }
    void loadMine();
    return () => {
      cancelled = true;
    };
  }, [uid, season]);

  const { language } = useUserLanguage(uid);
  const isJa = language === "ja";

  const showInputGate = submissionOpen && !savedLoading && !hasSubmitted;
  const canReeditBracket = submissionOpen && !savedLoading && hasSubmitted;
  const inputOverlayOpen = inputPageOpen && submissionOpen && !savedLoading;

  useEffect(() => {
    if (searchParams.get(RANKINGS_WC_BRACKET_INPUT_PARAM) !== "1") return;
    if (!submissionOpen || savedLoading || hasSubmitted) return;
    setInputPageOpen(true);
    const next = new URLSearchParams(searchParams.toString());
    next.delete(RANKINGS_WC_BRACKET_INPUT_PARAM);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [
    searchParams,
    submissionOpen,
    savedLoading,
    hasSubmitted,
    pathname,
    router,
  ]);

  const [selectedRow, setSelectedRow] = useState<WcBracketLeaderboardRow | null>(
    null
  );
  const [bracketLoading, setBracketLoading] = useState(false);
  const [overlayBracket, setOverlayBracket] = useState<WcBracketState | null>(
    null
  );

  const [overlayPortalReady, setOverlayPortalReady] = useState(false);
  const overlayScrollRef = useRef<HTMLDivElement>(null);
  const inputScrollRef = useRef<HTMLDivElement>(null);
  const lockedDocumentScrollYRef = useRef(0);

  useEffect(() => {
    setOverlayPortalReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!selectedRow) return;
    overlayScrollRef.current?.scrollTo(0, 0);
  }, [selectedRow, bracketLoading, overlayBracket]);

  useEffect(() => {
    if (!selectedRow && !submissionPromptOpen && !inputPageOpen) return;

    lockedDocumentScrollYRef.current = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    const prevBody = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    const prevHtmlOverflow = html.style.overflow;

    body.style.position = "fixed";
    body.style.top = `-${lockedDocumentScrollYRef.current}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    return () => {
      body.style.position = prevBody.position;
      body.style.top = prevBody.top;
      body.style.left = prevBody.left;
      body.style.right = prevBody.right;
      body.style.width = prevBody.width;
      body.style.overflow = prevBody.overflow;
      html.style.overflow = prevHtmlOverflow;
      window.scrollTo(0, lockedDocumentScrollYRef.current);
    };
  }, [selectedRow, submissionPromptOpen, inputPageOpen]);

  const loadBracketForUser = useCallback(
    async (row: WcBracketLeaderboardRow) => {
      setBracketLoading(true);
      setOverlayBracket(null);
      try {
        const doc = await loadWcBracket(row.uid, season);
        if (doc?.bracket) {
          setOverlayBracket(doc.bracket);
        }
      } catch (e) {
        console.error("failed to load wc bracket", e);
      } finally {
        setBracketLoading(false);
      }
    },
    [season]
  );

  const openDetail = useCallback(
    (row: WcBracketLeaderboardRow) => {
      if (showInputGate) return;
      setSelectedRow(row);
      void loadBracketForUser(row);
    },
    [loadBracketForUser, showInputGate]
  );

  const closeDetail = useCallback(() => {
    setSelectedRow(null);
    setOverlayBracket(null);
  }, []);

  const openProfileFromSheet = useCallback(
    (row: WcBracketLeaderboardRow) => {
      const handleOrUid = profilePathKeyFromRow(row);
      const base = isMobile ? "/mobile" : "/web";
      const href = profileHrefWithRankingsReturn(
        pathname,
        base,
        handleOrUid,
        {
          metric: "totalScore",
          phase: "playoffs",
        }
      );
      router.push(href);
    },
    [isMobile, pathname, router]
  );

  const handleSubmitConfirm = useCallback(async () => {
    if (!submissionOpen) return;
    if (!uid) {
      setSubmitError(isJa ? "ログインが必要です" : "Sign in required");
      return;
    }
    if (!isWcBracketComplete(draftBracket)) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      await saveWcBracket(uid, draftBracket, season);
      setHasSubmitted(true);
      setSubmitOpen(false);
      setInputPageOpen(false);
      setSubmissionPromptOpen(false);
      await refetch();
    } catch (e) {
      setSubmitError(
        e instanceof Error
          ? e.message
          : isJa
            ? "提出に失敗しました"
            : "Submit failed"
      );
    } finally {
      setSubmitting(false);
    }
  }, [uid, draftBracket, season, refetch, isJa, submissionOpen]);

  const listBusy = loading || savedLoading;

  const listRows =
    myRow && hasSubmitted
      ? rows.filter((row) => row.uid !== myRow.uid)
      : rows;

  const survivorTitleBlock = (
    <div className="px-1 text-center">
      <p
        className={[
          "text-[12px] leading-relaxed text-white/72 sm:text-[13px]",
          jp.className,
        ].join(" ")}
      >
        {isJa
          ? "外れたブラケットから脱落"
          : "Miss a pick, you're out"}
      </p>
    </div>
  );

  const myCardBlock =
    myRow && hasSubmitted ? (
      <div className="pt-0.5">
        <WcBracketUserCard
          row={myRow}
          language={language}
          onClick={() => openDetail(myRow)}
          onEditClick={
            canReeditBracket && !inputOverlayOpen
              ? () => setInputPageOpen(true)
              : undefined
          }
        />
      </div>
    ) : null;

  const survivorListBody =
    listBusy ? (
      <div className="flex items-center justify-center py-16">
        <CandleChartLoader label={isJa ? "読み込み中" : "Loading"} />
      </div>
    ) : error ? (
      <div className="py-16 text-center text-white/60">{error}</div>
    ) : listRows.length === 0 && !(myRow && hasSubmitted) ? (
      <div
        role="status"
        className="flex min-h-[min(50dvh,480px)] flex-col items-center justify-center px-4 text-center"
      >
        <p
          className={[
            nameBebas.className,
            "text-[clamp(1.75rem,6vw,3rem)] leading-none tracking-[0.22em]",
          ].join(" ")}
          style={cyberNoDataLabelStyle}
        >
          NO DATA
        </p>
      </div>
    ) : (
      <div className="space-y-2 pb-bottom-nav pt-2">
        {listRows.map((row, index) => (
          <motion.div
            key={row.uid}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: CARD_DURATION,
              delay: cardDelay(index),
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <WcBracketUserCard
              row={row}
              language={language}
              onClick={() => openDetail(row)}
            />
          </motion.div>
        ))}
      </div>
    );

  const leaderboardBody = (
    <>
      {myCardBlock}
      <div className="pt-1">
        <WcBracketViewTabs
          mode={viewMode}
          onChange={setViewMode}
        />
      </div>
      {viewMode === "survivor" ? (
        <>
          {survivorTitleBlock}
          {survivorListBody}
        </>
      ) : (
        <WcBracketMarket season={season} language={language} />
      )}
    </>
  );

  return (
    <>
      <div className="relative space-y-2 px-3 pt-2">
        <div
          className={[
            "transition-[filter,opacity] duration-300",
            showInputGate
              ? "pointer-events-none select-none blur-[16px] brightness-[0.42] saturate-[0.65]"
              : "",
          ].join(" ")}
          aria-hidden={showInputGate}
        >
          {leaderboardBody}
        </div>

        {showInputGate && !submissionPromptOpen && !inputPageOpen ? (
          <div className="pointer-events-auto absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-center px-6">
            <button
              type="button"
              onClick={() => setSubmissionPromptOpen(true)}
              className="rounded-xl border border-cyan-400/35 bg-[#0a1528]/90 px-6 py-3.5 text-sm font-bold text-cyan-100 shadow-[0_8px_32px_rgba(0,0,0,0.45)] backdrop-blur-md transition hover:border-cyan-300/55 hover:bg-[#0f1d38]/95 active:scale-[0.99]"
            >
              {isJa ? "ブラケットを提出する" : "Submit bracket"}
            </button>
          </div>
        ) : null}
      </div>

      {overlayPortalReady && showInputGate ? (
        <WcBracketStartPromptModal
          open={submissionPromptOpen}
          language={language}
          season={season}
          onClose={() => setSubmissionPromptOpen(false)}
          onStart={() => {
            setSubmissionPromptOpen(false);
            setInputPageOpen(true);
          }}
        />
      ) : null}

      {overlayPortalReady && inputOverlayOpen
        ? createPortal(
            <motion.div
              key="wc-bracket-input-page"
              className="fixed inset-0 z-99990 flex flex-col"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                className="absolute inset-0 bg-black/20 backdrop-blur-xl backdrop-saturate-150"
                aria-hidden
              />
              <div className="relative z-10 flex min-h-0 flex-1 flex-col bg-transparent">
                <div className="shrink-0 border-b border-white/10 bg-black/20 px-4 py-3 backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInputPageOpen(false);
                        if (showInputGate) {
                          setSubmissionPromptOpen(false);
                        }
                      }}
                      className="text-[12px] font-medium text-white/55 transition hover:text-white/80"
                    >
                      {isJa ? "← 戻る" : "← Back"}
                    </button>
                    <p className="text-center text-[13px] font-semibold text-white">
                      {hasSubmitted
                        ? isJa
                          ? "ブラケット編集"
                          : "Edit bracket"
                        : isJa
                          ? "ブラケット入力"
                          : "Bracket picks"}
                    </p>
                    <span className="w-10" aria-hidden />
                  </div>
                  <p className="mt-1 text-center text-[11px] text-white/55">
                    {isJa
                      ? "ラウンドごとに勝者を選んでください"
                      : "Pick winners round by round"}
                  </p>
                  {submitError ? (
                    <p className="mt-2 text-center text-[11px] text-red-300">
                      {submitError}
                    </p>
                  ) : null}
                </div>
                <div
                  ref={inputScrollRef}
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-bottom-nav"
                >
                  <WcBracketInputMobile
                    bracket={draftBracket}
                    advancement={knockoutAdvancement}
                    onBracketChange={setDraftBracket}
                    onSubmitClick={() => setSubmitOpen(true)}
                    language={language}
                    submitDisabled={!uid || submitting}
                    submitButtonLabel={
                      hasSubmitted ? "BRACKET UPDATE" : undefined
                    }
                  />
                </div>
              </div>
            </motion.div>,
            document.body
          )
        : null}

      {overlayPortalReady
        ? createPortal(
            <WcBracketSubmitModal
              open={submitOpen}
              isResubmit={hasSubmitted}
              language={language}
              loading={submitting}
              onClose={() => {
                if (submitting) return;
                setSubmitOpen(false);
              }}
              onConfirm={() => void handleSubmitConfirm()}
            />,
            document.body
          )
        : null}

      {overlayPortalReady
        ? createPortal(
            <AnimatePresence>
              {selectedRow && !showInputGate && (
                <motion.div
                  key="wc-bracket-detail-overlay"
                  className="fixed inset-0 z-99999 flex min-h-0 flex-col"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <motion.div
                    className="absolute inset-0 bg-black/20 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={closeDetail}
                    aria-hidden
                  />

                  <motion.div
                    className="relative z-10 flex h-full min-h-0 max-h-dvh flex-col overflow-hidden rounded-t-2xl bg-transparent pb-4"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{
                      type: "spring",
                      damping: 28,
                      stiffness: 300,
                    }}
                  >
                    <div
                      ref={overlayScrollRef}
                      className="min-h-0 flex-1 touch-pan-y overflow-y-auto overscroll-y-auto px-1 pb-bottom-nav [-webkit-overflow-scrolling:touch]"
                    >
                      <div className="flex justify-end px-3 pb-1 pt-2">
                        <button
                          type="button"
                          onClick={closeDetail}
                          aria-label={isJa ? "閉じる" : "Close"}
                          className={cyberChamferButtonClasses(
                            "sm",
                            "close",
                            "h-9 w-9 shadow-[0_0_16px_rgba(0,245,255,0.18)]"
                          )}
                        >
                          <X
                            className={CYBER_MENU_ICON_CLASS.sm}
                            strokeWidth={CYBER_MENU_ICON_STROKE}
                            aria-hidden
                          />
                        </button>
                      </div>
                      <div className="px-4 pb-3 pt-0.5">
                        <WcBracketUserCard
                          row={selectedRow}
                          language={language}
                          onClick={() => openProfileFromSheet(selectedRow)}
                        />
                      </div>

                      {bracketLoading ? (
                        <div className="flex items-center justify-center py-16">
                          <CandleChartLoader
                            label={isJa ? "読み込み中" : "Loading"}
                          />
                        </div>
                      ) : overlayBracket ? (
                        <div className="relative z-20 px-2 pb-4">
                          <WcFullBracketMobile
                            bracket={overlayBracket}
                            advancement={knockoutAdvancement}
                            officialWinners={officialWinners}
                            firstMissMatchId={
                              selectedRow.firstMissMatchId ?? null
                            }
                            language={language}
                            showGlassShell={false}
                          />
                        </div>
                      ) : (
                        <div className="py-16 text-center text-white/60">
                          {isJa
                            ? "ブラケットを読み込めませんでした"
                            : "Could not load bracket"}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}
