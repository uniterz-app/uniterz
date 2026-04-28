"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Undo2 } from "lucide-react";

import { nameBebas, jp } from "@/lib/fonts";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { useScrambleDecode } from "@/lib/hooks/useScrambleDecode";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import BracketUserCard from "./BracketUserCard";
import useBracketLeaderboard, {
  type BracketLeaderboardRow,
} from "@/lib/leaderboards/useBracketLeaderboard";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";
import {
  loadPlayoffBracket,
  type BracketState,
} from "@/lib/playoff-bracket-firestore";
import { buildPlayoffDisplayData } from "@/lib/playoff-bracket-display";
import { usePlayoffOfficialResults } from "@/lib/playoff/usePlayoffOfficialResults";
import PlayoffFullBracketWeb from "@/app/component/predict/PlayoffFullBracketWeb";
import PlayoffFullBracketMobile from "@/app/component/predict/PlayoffFullBracketMobile";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { profileHrefWithRankingsReturn } from "@/lib/navigation/rankingsProfileFrom";

type Props = {
  season?: string;
};

/** Top50 render stagger. */
const BRACKET_CARD_STAGGER_STEP = 0.05;
const BRACKET_CARD_ENTER_DURATION = 0.4;

function bracketCardEnterDelay(index: number): number {
  return index * BRACKET_CARD_STAGGER_STEP;
}

export default function BracketLeaderboardSection({ season: propSeason }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile =
    pathname?.startsWith("/mobile") || pathname?.startsWith("/m/");

  const season = propSeason ?? getCurrentPlayoffSeason();
  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
  const { loading, error, rows, myRow, totalCount } = useBracketLeaderboard({
    season,
    uid,
  });
  const officialResults = usePlayoffOfficialResults(season);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? null);
    });
    return () => unsub();
  }, []);
  const { language } = useUserLanguage(uid);

  const [selectedRow, setSelectedRow] = useState<BracketLeaderboardRow | null>(
    null
  );
  const [bracketLoading, setBracketLoading] = useState(false);
  const [playoffDisplayData, setPlayoffDisplayData] = useState<ReturnType<
    typeof buildPlayoffDisplayData
  > | null>(null);
  const [playoffScore, setPlayoffScore] = useState(0);
  const [overlayBracket, setOverlayBracket] = useState<BracketState | null>(
    null
  );

  const [overlayPortalReady, setOverlayPortalReady] = useState(false);
  const overlayScrollRef = useRef<HTMLDivElement>(null);
  const lockedDocumentScrollYRef = useRef(0);

  useEffect(() => {
    setOverlayPortalReady(true);
  }, []);

  useLayoutEffect(() => {
    if (!selectedRow) return;
    overlayScrollRef.current?.scrollTo(0, 0);
  }, [selectedRow, bracketLoading, playoffDisplayData]);

  useEffect(() => {
    if (!selectedRow) return;

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

    overlayScrollRef.current?.scrollTo(0, 0);
    requestAnimationFrame(() => {
      overlayScrollRef.current?.scrollTo(0, 0);
    });

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
  }, [selectedRow]);

  const loadBracketForUser = useCallback(
    async (uid: string) => {
      setBracketLoading(true);
      setPlayoffDisplayData(null);
      setOverlayBracket(null);
      try {
        const doc = await loadPlayoffBracket(uid, season);
        if (doc?.bracket && doc?.season) {
          setPlayoffDisplayData(buildPlayoffDisplayData(doc.bracket, doc.season));
          setPlayoffScore(doc.totalScore ?? 0);
          setOverlayBracket(doc.bracket);
        }
      } catch (e) {
        console.error("failed to load bracket", e);
      } finally {
        setBracketLoading(false);
      }
    },
    [season]
  );

  const openDetail = useCallback(
    (row: BracketLeaderboardRow) => {
      setSelectedRow(row);
      loadBracketForUser(row.uid);
    },
    [loadBracketForUser]
  );

  const closeDetail = useCallback(() => {
    setSelectedRow(null);
    setPlayoffDisplayData(null);
    setOverlayBracket(null);
  }, []);

  const openProfileFromSheet = useCallback(
    (row: BracketLeaderboardRow) => {
      const handleOrUid = row.handle || row.uid;
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

  const PlayoffBracket = isMobile ? PlayoffFullBracketMobile : PlayoffFullBracketWeb;

  const titleDisplay = useScrambleDecode("PLAYOFFS BRACKET", true);

  const titleBlock = (
    <div className="text-center">
      <h1
        className={[
          "text-[30px] leading-none tracking-[0.04em] sm:text-[34px]",
          nameBebas.className,
        ].join(" ")}
        style={{
          color: "#38bdf8",
          textShadow:
            "0 0 8px rgba(56,189,248,0.35), 0 0 18px rgba(56,189,248,0.25), 0 0 34px rgba(56,189,248,0.15)",
        }}
      >
        {titleDisplay}
      </h1>
      <p className={["mt-1 text-[11px] text-white/60 sm:text-[12px]", jp.className].join(" ")}>
        {language === "en"
          ? "Bracket scores, highest first"
          : "ブラケットの得点が高い順に表示しています"}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-2 px-3 pt-2">
        {titleBlock}
        <div className="flex items-center justify-center py-16">
          <div className="text-white/60">
            {language === "en" ? "Loading..." : "読み込み中..."}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2 px-3 pt-2">
        {titleBlock}
        <div className="py-16 text-center text-white/60">{error}</div>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="space-y-2 px-3 pt-2">
        {titleBlock}
        <div
          role="status"
          className="flex min-h-[min(70dvh,620px)] flex-col items-center justify-center px-4 text-center"
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
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 px-3 pt-2">
        {myRow ? (
          <div className="pt-0.5">
            <BracketUserCard row={myRow} totalCount={totalCount} language={language} />
          </div>
        ) : null}
        {titleBlock}
        <div className="space-y-2 pb-bottom-nav pt-2">
          {rows.map((row, index) => (
            <motion.div
              key={row.uid}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: BRACKET_CARD_ENTER_DURATION,
                delay: bracketCardEnterDelay(index),
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <BracketUserCard
                row={row}
                totalCount={totalCount}
                language={language}
                onClick={() => openDetail(row)}
              />
            </motion.div>
          ))}
        </div>
      </div>

      {overlayPortalReady
        ? createPortal(
            <AnimatePresence>
              {selectedRow && (
                <motion.div
                  key="bracket-detail-overlay"
                  className="fixed inset-0 z-99999 flex flex-col"
                  style={{ top: 0, left: 0, right: 0, bottom: 0 }}
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
                    className="relative z-10 flex h-full max-h-dvh flex-col rounded-t-2xl bg-transparent pb-4"
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{
                      type: "spring",
                      damping: 28,
                      stiffness: 300,
                    }}
                  >
                    <div className="sticky top-0 z-10 shrink-0 border-b border-white/12 bg-black/25 px-4 py-3 backdrop-blur-md">
                      <BracketUserCard
                        row={selectedRow}
                        language={language}
                        onClick={() => openProfileFromSheet(selectedRow)}
                      />
                    </div>

                    <div
                      ref={overlayScrollRef}
                      className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-5 pb-bottom-nav sm:px-4 sm:py-6"
                    >
                      {bracketLoading ? (
                        <div className="flex items-center justify-center py-16">
                          <div className="text-white/60">
                            {language === "en" ? "Loading..." : "読み込み中..."}
                          </div>
                        </div>
                      ) : playoffDisplayData ? (
                        <>
                          <div className="mx-auto flex w-full max-w-[1200px] justify-center">
                            <PlayoffBracket
                              league="nba"
                              score={playoffScore}
                              {...playoffDisplayData}
                              bracket={overlayBracket ?? undefined}
                              results={officialResults ?? undefined}
                              hitLegend={{ language }}
                              showGlassShell={false}
                            />
                          </div>
                          {isMobile ? (
                            <div className="mt-6 flex w-full justify-end px-1 pb-2">
                              <button
                                type="button"
                                onClick={closeDetail}
                                aria-label={
                                  language === "en" ? "Close" : "閉じる"
                                }
                                className={[
                                  "inline-flex items-center justify-center rounded-full border-2 border-white",
                                  "bg-black/50 p-2.5 text-white",
                                  "backdrop-blur-md transition hover:border-white/90 hover:bg-black/60 active:scale-[0.99]",
                                ].join(" ")}
                              >
                                <Undo2
                                  className="shrink-0"
                                  size={17}
                                  strokeWidth={2.4}
                                  aria-hidden
                                />
                              </button>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="py-16 text-center text-white/60">
                          {language === "en"
                            ? "Couldn't load the bracket"
                            : "ブラケットを読み込めませんでした"}
                        </div>
                      )}
                    </div>
                  </motion.div>

                  {!isMobile ? (
                    <button
                      type="button"
                      onClick={closeDetail}
                      aria-label={language === "en" ? "Close" : "閉じる"}
                      className={[
                        "pointer-events-auto fixed z-100000 inline-flex items-center justify-center",
                        "rounded-full border-2 border-white bg-black/45 p-4 text-white",
                        "shadow-lg shadow-black/35 backdrop-blur-md",
                        "transition hover:border-white/90 hover:bg-black/55 active:scale-[0.99]",
                      ].join(" ")}
                      style={{
                        bottom: "var(--bottom-nav-clearance)",
                        right: "max(1.5rem, env(safe-area-inset-right, 0px))",
                      }}
                    >
                      <Undo2
                        className="shrink-0"
                        size={28}
                        strokeWidth={2.6}
                        aria-hidden
                      />
                    </button>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>,
            document.body
          )
        : null}
    </>
  );
}
