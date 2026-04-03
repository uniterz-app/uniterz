"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { X } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

import MatchCard, { type MatchCardProps } from "./MatchCard";
import { toMatchCardProps } from "@/lib/games/transform";
import PredictionFormV2 from "../predict/PredictionFormV2";
import PredictionRulesIntroModal from "../predict/PredictionRulesIntroModal";
import {
  readPredictionRulesIntroSeen,
  writePredictionRulesIntroSeen,
} from "@/lib/predict/predictionRulesIntroPrefs";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

export type GameItemRaw = any;

type TeamRecord = {
  wins: number;
  losses: number;
  rank?: number;
  lastGames?: { at?: any; isWin?: boolean }[];
};

const TEAM_RECORD_CACHE_KEY = "schedule_team_record_cache_v2";
const TEAM_RECORD_CACHE_TTL_MS = 1000 * 60 * 30;

const memoryTeamRecordCache = new Map<string, TeamRecord>();

function readTeamRecordCacheFromSession(): Record<string, TeamRecord> {
  if (typeof window === "undefined") return {};

  try {
    const raw = window.sessionStorage.getItem(TEAM_RECORD_CACHE_KEY);
    if (!raw) return {};

    const parsed = JSON.parse(raw) as {
      savedAt: number;
      records: Record<string, TeamRecord>;
    };

    if (!parsed?.savedAt || !parsed?.records) return {};

    if (Date.now() - parsed.savedAt > TEAM_RECORD_CACHE_TTL_MS) {
      window.sessionStorage.removeItem(TEAM_RECORD_CACHE_KEY);
      return {};
    }

    return parsed.records;
  } catch {
    return {};
  }
}

function writeTeamRecordCacheToSession(next: Record<string, TeamRecord>) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(
      TEAM_RECORD_CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        records: next,
      })
    );
  } catch {}
}

export default function ScheduleList({
  games,
  dense = false,
  loading = false,
}: {
  games: GameItemRaw[];
  dense?: boolean;
  loading?: boolean;
}) {
  const [openGameId, setOpenGameId] = useState<string | null>(null);
  const [standingsOpenInOverlay, setStandingsOpenInOverlay] = useState(false);
  const [disableReturnLayout, setDisableReturnLayout] = useState(false);
  const [rulesIntroOpen, setRulesIntroOpen] = useState(false);
  const [pendingGameIdForRules, setPendingGameIdForRules] = useState<
    string | null
  >(null);

  const pathname = usePathname();
  const isMobile =
    pathname?.startsWith("/mobile") || pathname?.startsWith("/m/");

  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isEn = language === "en";

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const scrollYRef = useRef(0);

  const [myPostMap, setMyPostMap] = useState<Record<string, string>>({});
  const [teamRecordMap, setTeamRecordMap] = useState<Record<string, TeamRecord>>(
    {}
  );

  const propsList = useMemo<MatchCardProps[]>(() => {
    return (games ?? []).map(
      (g: any) => toMatchCardProps(g, { dense }) as MatchCardProps
    );
  }, [games, dense]);

  const gameIds = useMemo(() => {
    return propsList.map((p) => String(p.id));
  }, [propsList]);

  const teamIds = useMemo(() => {
    return Array.from(
      new Set(
        propsList
          .flatMap((p) => [p.home?.teamId, p.away?.teamId])
          .filter(Boolean)
      )
    ) as string[];
  }, [propsList]);

  const selectedProps = useMemo<MatchCardProps | null>(() => {
    if (!openGameId) return null;
    return propsList.find((p) => String(p.id) === String(openGameId)) ?? null;
  }, [propsList, openGameId]);

  const open = useCallback((gameId: string) => {
    scrollYRef.current = window.scrollY;
    setStandingsOpenInOverlay(false);
    setDisableReturnLayout(false);
    if (!readPredictionRulesIntroSeen()) {
      setPendingGameIdForRules(String(gameId));
      setRulesIntroOpen(true);
      return;
    }
    setOpenGameId(String(gameId));
  }, []);

  const handleRulesIntroStart = useCallback(() => {
    writePredictionRulesIntroSeen();
    setRulesIntroOpen(false);
    const id = pendingGameIdForRules;
    setPendingGameIdForRules(null);
    if (id) setOpenGameId(id);
  }, [pendingGameIdForRules]);

  const handleRulesIntroCancel = useCallback(() => {
    setRulesIntroOpen(false);
    setPendingGameIdForRules(null);
  }, []);

  const close = useCallback(() => {
    setStandingsOpenInOverlay(false);
    setDisableReturnLayout(true);
    setOpenGameId(null);
  }, []);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      const uid = auth.currentUser?.uid ?? null;

      if (!uid || gameIds.length === 0) {
        setMyPostMap({});
        return;
      }

      try {
        const chunks: string[][] = [];
        for (let i = 0; i < gameIds.length; i += 10) {
          chunks.push(gameIds.slice(i, i + 10));
        }

        const snaps = await Promise.all(
          chunks.map((chunk) =>
            getDocs(
              query(
                collection(db, "posts"),
                where("authorUid", "==", uid),
                where("schemaVersion", "==", 2),
                where("gameId", "in", chunk)
              )
            )
          )
        );

        if (!alive) return;

        const nextMap: Record<string, string> = {};
        snaps.forEach((snap) => {
          snap.docs.forEach((d) => {
            const data = d.data() as any;
            const gameId = String(data?.gameId ?? "");
            if (gameId) nextMap[gameId] = d.id;
          });
        });

        setMyPostMap(nextMap);
      } catch {
        if (alive) setMyPostMap({});
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [gameIds]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      if (teamIds.length === 0) {
        setTeamRecordMap({});
        return;
      }

      const sessionCache = readTeamRecordCacheFromSession();

      const immediateMap: Record<string, TeamRecord> = {};
      for (const teamId of teamIds) {
        const mem = memoryTeamRecordCache.get(teamId);
        const ses = sessionCache[teamId];
        const cached = mem ?? ses ?? null;
        if (cached) immediateMap[teamId] = cached;
      }

      if (alive) setTeamRecordMap(immediateMap);

      const missingTeamIds = teamIds.filter(
        (teamId) => !memoryTeamRecordCache.has(teamId) && !sessionCache[teamId]
      );

      if (missingTeamIds.length === 0) return;

      try {
        const chunks: string[][] = [];
        for (let i = 0; i < missingTeamIds.length; i += 10) {
          chunks.push(missingTeamIds.slice(i, i + 10));
        }

        const snaps = await Promise.all(
          chunks.map((chunk) =>
            getDocs(
              query(collection(db, "teams"), where("__name__", "in", chunk))
            )
          )
        );

        if (!alive) return;

        const merged: Record<string, TeamRecord> = { ...immediateMap };
        const nextSessionCache: Record<string, TeamRecord> = { ...sessionCache };

        snaps.forEach((snap) => {
          snap.docs.forEach((docSnap) => {
            const d = docSnap.data() as any;

            const value: TeamRecord = {
              wins: d.wins ?? 0,
              losses: d.losses ?? 0,
              rank: d.rank,
              lastGames: Array.isArray(d.lastGames) ? d.lastGames : [],
            };

            const teamId = docSnap.id;

            memoryTeamRecordCache.set(teamId, value);
            nextSessionCache[teamId] = value;
            merged[teamId] = value;
          });
        });

        writeTeamRecordCacheToSession(nextSessionCache);
        setTeamRecordMap(merged);
      } catch {
        if (alive) setTeamRecordMap(immediateMap);
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [teamIds]);

  useEffect(() => {
    if (!openGameId) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [openGameId]);

  /* オーバーレイ直前に splash 用 body クラスが残っていると画像が一瞬見える */
  useEffect(() => {
    if (!openGameId) return;
    document.body.classList.remove("splash-bg");
  }, [openGameId]);

  useEffect(() => {
    if (!openGameId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (standingsOpenInOverlay) return;
        close();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openGameId, standingsOpenInOverlay, close]);

  useEffect(() => {
    if (openGameId !== null) return;

    requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollYRef.current,
        behavior: "auto",
      });
    });
  }, [openGameId]);

  useEffect(() => {
    if (!openGameId) {
      setDisableReturnLayout(false);
    }
  }, [openGameId]);

  if (loading) {
    return (
      <div className="grid gap-6 px-4 md:px-6 lg:px-8">
        <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mx-auto mb-3 h-4 w-40 rounded bg-white/10" />
        </div>
        <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mx-auto mb-3 h-4 w-40 rounded bg-white/10" />
        </div>
        <div className="animate-pulse rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mx-auto mb-3 h-4 w-40 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (!propsList.length) {
    return null;
  }

  const overlayContent =
    openGameId && selectedProps ? (
      <div
        key="prediction-page"
        className={[
          "fixed inset-0 overflow-hidden",
          isMobile ? "z-100000" : "z-99999",
        ].join(" ")}
      >
        <div
          className={[
            "absolute inset-0 z-0 bg-black/35 backdrop-blur-md",
            standingsOpenInOverlay
              ? "pointer-events-none"
              : "pointer-events-auto",
          ].join(" ")}
          onClick={() => {
            if (standingsOpenInOverlay) return;
            close();
          }}
        />

        <div
          className="relative z-10 h-dvh overflow-y-auto overflow-x-hidden pointer-events-auto pb-bottom-nav"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehaviorY: "contain",
            overscrollBehaviorX: "none",
            touchAction: "pan-y",
          }}
          onTouchStartCapture={(e) => {
            const t = e.touches[0];
            if (!t) return;
            touchStartRef.current = { x: t.clientX, y: t.clientY };
          }}
          onTouchMoveCapture={(e) => {
            const start = touchStartRef.current;
            const t = e.touches[0];
            if (!start || !t) return;

            const dx = Math.abs(t.clientX - start.x);
            const dy = Math.abs(t.clientY - start.y);

            if (dx > dy && dx > 8) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          onTouchEndCapture={() => {
            touchStartRef.current = null;
          }}
          onTouchCancelCapture={() => {
            touchStartRef.current = null;
          }}
        >
          <div
            className={[
              "mx-auto w-full overflow-x-hidden",
              isMobile
                ? "max-w-2xl px-3 pb-32 pt-4 sm:px-4 sm:pb-36 sm:pt-6 md:px-6"
                : "max-w-5xl px-4 pb-24 pt-6 sm:px-6 md:px-8 lg:px-10",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full overflow-x-hidden">
              <button
                type="button"
                aria-label={isEn ? "Close" : "閉じる"}
                className={[
                  "absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/90 backdrop-blur-md transition hover:bg-black/55",
                  standingsOpenInOverlay
                    ? "pointer-events-none opacity-0"
                    : "",
                ].join(" ")}
                onClick={(e) => {
                  e.stopPropagation();
                  if (standingsOpenInOverlay) return;
                  close();
                }}
              >
                <X size={18} strokeWidth={2.4} />
              </button>

              <MatchCard
                {...selectedProps}
                myPostId={myPostMap[String(selectedProps.id)] ?? null}
                homeRecord={
                  selectedProps.home?.teamId
                    ? teamRecordMap[selectedProps.home.teamId] ?? null
                    : null
                }
                awayRecord={
                  selectedProps.away?.teamId
                    ? teamRecordMap[selectedProps.away.teamId] ?? null
                    : null
                }
                sharedLayoutId={
                  disableReturnLayout || isMobile
                    ? undefined
                    : `matchcard-${selectedProps.id}`
                }
                disableCardMotion={isMobile}
                hideActions
                showMarketBias
                inPredictOverlay
              />

              {isMobile ? (
                <div className="mt-2 overflow-x-hidden px-0 py-0">
                  <PredictionFormV2
                    dense={dense}
                    game={selectedProps}
                    user={{ name: "You" }}
                    embedded
                    inOverlay
                    overlayScheduleGameIds={gameIds}
                    overlayScheduleGames={propsList}
                    onClosePredictOverlay={close}
                    onSwitchOverlayGame={(id) => {
                      setOpenGameId(String(id));
                      setStandingsOpenInOverlay(false);
                      setDisableReturnLayout(false);
                    }}
                    onStandingsOpenChange={(open) => {
                      setStandingsOpenInOverlay(open);
                      if (open) setDisableReturnLayout(true);
                    }}
                    onPostCreated={(payload) => {
                      const gameId = selectedProps?.id;
                      if (gameId && payload?.id) {
                        setMyPostMap((prev) => ({
                          ...prev,
                          [String(gameId)]: payload.id,
                        }));
                      }
                    }}
                  />
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 1, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.32,
                    delay: 0.08,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="mt-2 overflow-x-hidden px-0 py-0"
                >
                  <PredictionFormV2
                    dense={dense}
                    game={selectedProps}
                    user={{ name: "You" }}
                    embedded
                    inOverlay
                    overlayScheduleGameIds={gameIds}
                    overlayScheduleGames={propsList}
                    onClosePredictOverlay={close}
                    onSwitchOverlayGame={(id) => {
                      setOpenGameId(String(id));
                      setStandingsOpenInOverlay(false);
                      setDisableReturnLayout(false);
                    }}
                    onStandingsOpenChange={(open) => {
                      setStandingsOpenInOverlay(open);
                      if (open) setDisableReturnLayout(true);
                    }}
                    onPostCreated={(payload) => {
                      const gameId = selectedProps?.id;
                      if (gameId && payload?.id) {
                        setMyPostMap((prev) => ({
                          ...prev,
                          [String(gameId)]: payload.id,
                        }));
                      }
                    }}
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <LayoutGroup id="schedule-list">
      <motion.div
        className={[
          "grid gap-6 px-4 md:px-6 lg:px-8",
          openGameId ? "pointer-events-none" : "",
        ].join(" ")}
        animate={{
          scale: openGameId && !isMobile ? 0.985 : 1,
          opacity: 1,
        }}
        transition={{
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {propsList.map((props) => {
          const isOpen = !!selectedProps && String(selectedProps.id) === String(props.id);

          return (
            <div
              key={props.id}
              className={isOpen ? "pointer-events-none" : ""}
              aria-hidden={isOpen}
            >
              <MatchCard
                {...props}
                myPostId={myPostMap[String(props.id)] ?? null}
                homeRecord={
                  props.home?.teamId
                    ? teamRecordMap[props.home.teamId] ?? null
                    : null
                }
                awayRecord={
                  props.away?.teamId
                    ? teamRecordMap[props.away.teamId] ?? null
                    : null
                }
                sharedLayoutId={
                  disableReturnLayout || isMobile
                    ? undefined
                    : `matchcard-${props.id}`
                }
                onOpenPredict={open}
                showMarketBias={isMobile ? isOpen : false}
                hideActions={isMobile ? isOpen : false}
                inPredictOverlay={isMobile ? isOpen : false}
                disableCardMotion={
                  isMobile || (!!openGameId && !isOpen)
                }
              />
            </div>
          );
        })}
      </motion.div>

      {overlayContent &&
        (isMobile && typeof document !== "undefined"
          ? createPortal(overlayContent, document.body)
          : !isMobile
            ? overlayContent
            : null)}

      {rulesIntroOpen && typeof document !== "undefined"
        ? createPortal(
            <PredictionRulesIntroModal
              open={rulesIntroOpen}
              isEn={isEn}
              onStart={handleRulesIntroStart}
              onCancel={handleRulesIntroCancel}
            />,
            document.body
          )
        : null}
    </LayoutGroup>
  );
}