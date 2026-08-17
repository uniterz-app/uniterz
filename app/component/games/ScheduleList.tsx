"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { createPortal } from "react-dom";
import { usePathname, useSearchParams } from "next/navigation";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import {
  safeViewTransitionToken,
  startDomViewTransition,
  supportsViewTransitionApi,
} from "@/lib/viewTransition";
import type { League } from "@/lib/leagues";
import { auth, db } from "@/lib/firebase";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

import MatchCard, { type MatchCardProps } from "./MatchCard";
import ScheduleSharedTransitionLayout from "./ScheduleSharedTransitionLayout";
import {
  GAMES_CYBER_EASE_SNAP,
  GAMES_DAY_SWITCH_EASE,
  GAMES_LIST_REST_CARDS_DELAY_SEC,
} from "./cyberMotion";
import { toMatchCardProps } from "@/lib/games/transform";
import { fetchPlayoffSeriesPeerGames } from "@/lib/games/fetchPlayoffSeriesPeerGames";
import { resolveTutorialPickupGameId } from "@/lib/tutorial/tutorialPickupGame";
import { MOBILE_PREDICT_OVERLAY_CARD_OUTER_CLASS } from "@/lib/games/mobileListCardLayout";
import { PREDICT_OVERLAY_BACKDROP } from "@/lib/ui/matchOverlayGlass";
import ProfileMenuEdgeHandle from "@/app/component/profile/ui/ProfileMenuEdgeHandle";
import dynamic from "next/dynamic";

const PredictionFormV2 = dynamic(() => import("../predict/PredictionFormV2"), {
  loading: () => null,
  ssr: false,
});
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import { CyberNoDataPage } from "@/app/component/common/CyberNoDataLabel";
import { nbaRegularSeasonWinsLosses } from "@/lib/nbaRegularSeasonRecord";
import { footballWinsLossesDraws } from "@/lib/teamRecordDisplay";
import { fetchWcTeamRecordMap } from "@/lib/legacyWcWebShims";
import {
  SCHEDULE_MY_POST_DELETED_EVENT,
  type ScheduleMyPostDeletedDetail,
} from "@/lib/games/scheduleMyPostSyncEvents";
import {
  mergeScheduleMyPostsCache,
  missingScheduleMyPostGameIds,
  peekScheduleMyPosts,
  removeScheduleMyPostFromCache,
} from "@/lib/games/scheduleMyPostsCache";
import {
  predictOverlayBackdrop,
  predictOverlayCard,
  predictOverlayContentOrch,
  predictOverlayPanel,
  predictOverlayRoot,
} from "@/lib/predict/predictPageMotion";
import { useLiveGameStats } from "@/lib/games/useLiveGameStats";
const LiveGameStatsPanel = dynamic(
  () => import("./live/LiveGameStatsPanel"),
  { loading: () => null, ssr: false }
);
const LiveGameStatsPlaceholder = dynamic(
  () => import("./live/LiveGameStatsPlaceholder"),
  { loading: () => null, ssr: false }
);

export type GameItemRaw = any;

type TeamRecord = {
  wins: number;
  losses: number;
  draws?: number;
  rank?: number;
  lastGames?: { at?: any; isWin?: boolean }[];
};

/** パースロジック変更時に上げてセッションキャッシュを無効化 */
const TEAM_RECORD_CACHE_KEY = "schedule_team_record_cache_v5";
const TEAM_RECORD_CACHE_TTL_MS = 1000 * 60 * 30;
/** in-memory は teamId 単体だと古い勝敗が残るためバージョン付きキー */
const TEAM_RECORD_MEM_VER = 4;
function teamRecordMemKey(teamId: string) {
  return `${teamId}:v${TEAM_RECORD_MEM_VER}`;
}

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

const SCHEDULE_STAGGER_EASE = GAMES_CYBER_EASE_SNAP;

/** page モードで 4 枚目以降をずらす間隔（秒） */
const PAGE_REST_CARD_STAGGER_SEC = 0.034;

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
  league: leagueProp,
  /** 絞り込み等で 0 件のときに表示する文言（未指定時は null のまま何も出さない） */
  emptyHint = null,
  /** page=先頭のみ派手入場。daySwitch=日付切替時は先頭カードから順に上方向からフェードイン */
  listShellIntro = "daySwitch",
  /**
   * 日付クエリの games 以外に、暦月一括取得分などを渡す。
   * プレーオフの「他日に開催した同シリーズ試合」を推定に含める（当日カードだけだと 0-0 のままになるのを防ぐ）。
   */
  extraPeerGamesForSeriesInference = null,
  /** 先頭試合カードにチュートリアル用 data 属性を付与 */
  tutorialMarkFirstCard = false,
  tutorialRegisterPickupLabel = false,
  /** 新規予想投稿成功時（親のチュートリアル完了など） */
  onPredictionPosted = null,
  tutorialModeGameId = null,
  onTutorialPredict,
  onOverlayGameIdChange,
  /** true のとき予想オーバーレイを即閉じ（チュートリアル投稿後など） */
  forceCloseOverlay = false,
  /** チーム詳細から戻る — 予想オーバーレイを開く */
  deepLinkOpenPredictGameId = null,
}: {
  games: GameItemRaw[];
  dense?: boolean;
  loading?: boolean;
  /** 入場アニメの区切り（リーグ切替で再スタッガー） */
  league?: League;
  emptyHint?: string | null;
  listShellIntro?: "page" | "daySwitch";
  extraPeerGamesForSeriesInference?: GameItemRaw[] | null;
  tutorialMarkFirstCard?: boolean;
  /** 実ピックアップ試合の左辺 `PICK UP` を `match-pickup-label` として登録 */
  tutorialRegisterPickupLabel?: boolean;
  onPredictionPosted?: (() => void) | null;
  /** チュートリアル試合 ID — この試合の予想は API をスキップ */
  tutorialModeGameId?: string | null;
  onTutorialPredict?: (
    payload: {
      winner: "home" | "away";
      scoreHome: number;
      scoreAway: number;
      goalScorer?: { playerId: string; teamId: string } | null;
    }
  ) => void;
  onOverlayGameIdChange?: (gameId: string | null) => void;
  forceCloseOverlay?: boolean;
  deepLinkOpenPredictGameId?: string | null;
}) {
  const searchParams = useSearchParams();
  const openPredictFromUrl = searchParams.get("openPredict");
  const [openGameId, setOpenGameId] = useState<string | null>(null);
  const [overlayFallbackProps, setOverlayFallbackProps] =
    useState<MatchCardProps | null>(null);

  useEffect(() => {
    const id = (deepLinkOpenPredictGameId ?? openPredictFromUrl)?.trim();
    if (!id || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return;
    setOpenGameId(id);
  }, [deepLinkOpenPredictGameId, openPredictFromUrl]);

  useEffect(() => {
    onOverlayGameIdChange?.(openGameId);
  }, [openGameId, onOverlayGameIdChange]);

  const [overlayResultPost, setOverlayResultPost] =
    useState<PredictionPostV2 | null>(null);
  const [overlayUserPredictionWinner, setOverlayUserPredictionWinner] =
    useState<"home" | "away" | "draw" | null>(null);
  const [predictEditTriggerNonce, setPredictEditTriggerNonce] = useState(0);
  const [overlayLiveMarketBias, setOverlayLiveMarketBias] = useState<{
    homePct: number;
    awayPct: number;
  } | null>(null);
  const [standingsOpenInOverlay, setStandingsOpenInOverlay] = useState(false);
  const [disableReturnLayout, setDisableReturnLayout] = useState(false);

  /** チュートリアル投稿後など — exit アニメ無しで即閉じ（backdrop-filter 前面化を防ぐ） */
  useEffect(() => {
    if (!forceCloseOverlay || !openGameId) return;
    setStandingsOpenInOverlay(false);
    setDisableReturnLayout(true);
    setOpenGameId(null);
  }, [forceCloseOverlay, openGameId]);

  const pathname = usePathname();
  const isMobile =
    pathname?.startsWith("/mobile") || pathname?.startsWith("/m/");

  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const scrollYRef = useRef(0);
  /** オープン直前の旧スナップショットで、共有要素名を付ける一覧カードはこの id のみ */
  const sharedVtListSourceRef = useRef<string | null>(null);
  /** クローズ後の新スナップショットで、一覧に戻す共有要素名を付けるカードはこの id のみ */
  const sharedVtListTargetRef = useRef<string | null>(null);
  /** ref のみ変えたあと一覧を再描画して VT 名を1枚に絞る */
  const [vtListTransitionNonce, setVtListTransitionNonce] = useState(0);

  const [myPostMap, setMyPostMap] = useState<Record<string, string>>({});
  const [teamRecordMap, setTeamRecordMap] = useState<Record<string, TeamRecord>>(
    {}
  );

  const propsList = useMemo<MatchCardProps[]>(() => {
    const list = games ?? [];
    const extra = extraPeerGamesForSeriesInference ?? [];
    const byId = new Map<string, any>();
    for (const row of extra) {
      const id = String((row as any)?.id ?? "");
      if (id) byId.set(id, row);
    }
    for (const row of list) {
      const id = String((row as any)?.id ?? "");
      if (id) byId.set(id, row);
    }
    const peerPool = Array.from(byId.values());
    return list.map(
      (g: any) =>
        toMatchCardProps(g, {
          dense,
          peerGamesForSeriesInference: peerPool,
        }) as MatchCardProps
    );
  }, [games, dense, extraPeerGamesForSeriesInference]);

  const gameIds = useMemo(() => {
    return propsList.map((p) => String(p.id));
  }, [propsList]);

  const tutorialPickupGameId = useMemo(
    () => resolveTutorialPickupGameId(propsList),
    [propsList]
  );

  /** 当日オーバーレイ内で、すでに予想済みの試合（次試合モーダルでスキップ） */
  const overlayPredictedGameIds = useMemo(
    () => gameIds.filter((id) => Boolean(myPostMap[id])),
    [gameIds, myPostMap]
  );

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

  const overlayGameProps = selectedProps ?? overlayFallbackProps;

  useEffect(() => {
    if (!openGameId || selectedProps) {
      setOverlayFallbackProps(null);
      return;
    }
    let alive = true;
    void (async () => {
      try {
        const snap = await getDoc(doc(db, "games", openGameId));
        if (!alive || !snap.exists()) return;
        const raw = { id: snap.id, ...snap.data() } as Record<string, unknown>;
        const peers = await fetchPlayoffSeriesPeerGames(raw);
        if (!alive) return;
        setOverlayFallbackProps(
          toMatchCardProps(raw, {
            dense,
            peerGamesForSeriesInference: peers,
          }) as MatchCardProps
        );
      } catch {
        if (alive) setOverlayFallbackProps(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [openGameId, selectedProps, dense]);

  const liveStatsEnabled = Boolean(
    openGameId &&
      overlayGameProps?.league === "nba" &&
      (overlayGameProps?.status === "live" || overlayGameProps?.status === "final")
  );
  const { report: liveStatsReport, loading: liveStatsLoading } = useLiveGameStats(
    liveStatsEnabled && openGameId ? String(openGameId) : null,
    liveStatsEnabled
  );

  const reduceMotion = useReducedMotion();
  /** デスクトップ Web／モバイル Web ともネイティブ試合一覧に揃えて入場スタッガーを有効化 */
  const listShellAnimations = !reduceMotion;
  /** 一覧→オーバーレイの View Transitions（モバイルは即切替・アニメ無し。Web のみ） */
  const vtUi = useMemo(
    () => Boolean(!isMobile && supportsViewTransitionApi() && !reduceMotion),
    [isMobile, reduceMotion]
  );

  const leagueAnimKey =
    leagueProp ?? (propsList[0]?.league as League | undefined) ?? "nba";

  const isDaySwitchShell = listShellIntro === "daySwitch";

  /** 子（行）へ variants を伝搬するだけのコンテナ。スタッガーは各行の delay で制御する */
  const scheduleContainer = useMemo(
    () => ({
      hidden: {},
      show: {},
    }),
    []
  );

  /**
   * 行レベルの入場。
   * - daySwitch: 先頭から順に上方向からフェードイン
   * - page: 先頭3枚はカード内部（MatchCard のグループ入場）が担うため行は動かさず、
   *   4枚目以降のみラッパー完了後にフェード＋上昇
   */
  const scheduleItem = useMemo(
    () => ({
      hidden: (i: number) => {
        if (!listShellAnimations) {
          return { opacity: 1, y: 0 };
        }
        if (isDaySwitchShell) {
          return { opacity: 0, y: -11 };
        }
        if (i >= 3) {
          return { opacity: 0, y: 12 };
        }
        return { opacity: 1, y: 0 };
      },
      show: (i: number) => {
        if (!listShellAnimations) {
          return { opacity: 1, y: 0, transition: { duration: 0 } };
        }
        if (isDaySwitchShell) {
          return {
            opacity: 1,
            y: 0,
            transition: {
              opacity: { duration: 0.52, ease: GAMES_DAY_SWITCH_EASE },
              y: { duration: 0.56, ease: GAMES_DAY_SWITCH_EASE },
              delay: Math.min(i * 0.038, 0.28),
            },
          };
        }
        if (i >= 3) {
          return {
            opacity: 1,
            y: 0,
            transition: {
              duration: 0.24,
              ease: SCHEDULE_STAGGER_EASE,
              delay:
                GAMES_LIST_REST_CARDS_DELAY_SEC +
                (i - 3) * PAGE_REST_CARD_STAGGER_SEC,
            },
          };
        }
        return { opacity: 1, y: 0, transition: { duration: 0 } };
      },
    }),
    [listShellAnimations, isDaySwitchShell]
  );

  const openOverlayDirect = useCallback(
    (gameId: string) => {
      scrollYRef.current = window.scrollY;
      setStandingsOpenInOverlay(false);
      setDisableReturnLayout(false);
      const gid = String(gameId);
      if (!vtUi) {
        setOpenGameId(gid);
        return;
      }
      sharedVtListSourceRef.current = gid;
      sharedVtListTargetRef.current = null;
      flushSync(() => setVtListTransitionNonce((n) => n + 1));
      startDomViewTransition(
        () => {
          flushSync(() => {
            sharedVtListSourceRef.current = null;
            setOpenGameId(gid);
          });
        },
        { skip: false }
      );
    },
    [vtUi]
  );

  const open = useCallback(
    (gameId: string) => {
      openOverlayDirect(String(gameId));
    },
    [openOverlayDirect]
  );

  const close = useCallback(() => {
    const closingId = openGameId;
    if (!vtUi) {
      setStandingsOpenInOverlay(false);
      setDisableReturnLayout(true);
      setOpenGameId(null);
      return;
    }
    startDomViewTransition(
      () => {
        flushSync(() => {
          setStandingsOpenInOverlay(false);
          setDisableReturnLayout(true);
          sharedVtListSourceRef.current = null;
          if (closingId) {
            sharedVtListTargetRef.current = String(closingId);
          }
          setOpenGameId(null);
        });
      },
      {
        skip: false,
        onFinished: () => {
          sharedVtListTargetRef.current = null;
          flushSync(() => setVtListTransitionNonce((n) => n + 1));
        },
      }
    );
  }, [vtUi, openGameId]);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      const uid = auth.currentUser?.uid ?? null;

      if (!uid || gameIds.length === 0) {
        setMyPostMap({});
        return;
      }

      const cached = peekScheduleMyPosts(uid, gameIds);
      const cachedMap: Record<string, string> = {};
      for (const [gid, row] of Object.entries(cached)) {
        cachedMap[gid] = row.postId;
      }
      if (alive) setMyPostMap(cachedMap);

      const need = missingScheduleMyPostGameIds(uid, gameIds);
      if (need.length === 0) return;

      try {
        const chunks: string[][] = [];
        for (let i = 0; i < need.length; i += 10) {
          chunks.push(need.slice(i, i + 10));
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

        const found: Record<string, { postId: string }> = {};
        snaps.forEach((snap) => {
          snap.docs.forEach((d) => {
            const data = d.data() as { gameId?: unknown };
            const gameId = String(data?.gameId ?? "");
            if (gameId) found[gameId] = { postId: d.id };
          });
        });

        mergeScheduleMyPostsCache(uid, need, found);
        const next = peekScheduleMyPosts(uid, gameIds);
        const nextMap: Record<string, string> = {};
        for (const [gid, row] of Object.entries(next)) {
          nextMap[gid] = row.postId;
        }
        setMyPostMap(nextMap);
      } catch {
        if (alive) setMyPostMap(cachedMap);
      }
    };

    void run();

    return () => {
      alive = false;
    };
  }, [gameIds]);

  /** リザルト一覧などで自分の投稿を削除したとき、試合一覧の「予想済み」表示を外す */
  useEffect(() => {
    const onDeleted = (e: Event) => {
      const d = (e as CustomEvent<ScheduleMyPostDeletedDetail>).detail;
      const gid = d?.gameId ? String(d.gameId) : "";
      if (!gid) return;
      const uid = auth.currentUser?.uid;
      if (uid) removeScheduleMyPostFromCache(uid, gid);
      setMyPostMap((prev) => {
        if (!prev[gid]) return prev;
        const next = { ...prev };
        delete next[gid];
        return next;
      });
    };
    window.addEventListener(SCHEDULE_MY_POST_DELETED_EVENT, onDeleted);
    return () =>
      window.removeEventListener(SCHEDULE_MY_POST_DELETED_EVENT, onDeleted);
  }, []);

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
        const mem = memoryTeamRecordCache.get(teamRecordMemKey(teamId));
        const ses = sessionCache[teamId];
        const cached = mem ?? ses ?? null;
        if (cached) immediateMap[teamId] = cached;
      }

      if (alive) setTeamRecordMap(immediateMap);

      const missingTeamIds = teamIds.filter(
        (teamId) =>
          !memoryTeamRecordCache.has(teamRecordMemKey(teamId)) &&
          !sessionCache[teamId]
      );

      let merged: Record<string, TeamRecord> = { ...immediateMap };
      let nextSessionCache: Record<string, TeamRecord> = { ...sessionCache };

      try {
        if (leagueAnimKey === "wc") {
          const wcMap = await fetchWcTeamRecordMap(db);
          if (!alive) return;
          merged = { ...immediateMap };
          nextSessionCache = { ...sessionCache };
          for (const teamId of teamIds) {
            const value = wcMap[teamId];
            if (!value) continue;
            memoryTeamRecordCache.set(teamRecordMemKey(teamId), value);
            nextSessionCache[teamId] = value;
            merged[teamId] = value;
          }
          writeTeamRecordCacheToSession(nextSessionCache);
          if (alive) setTeamRecordMap(merged);
        } else if (missingTeamIds.length > 0) {
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

          merged = { ...immediateMap };
          nextSessionCache = { ...sessionCache };

          snaps.forEach((snap) => {
            snap.docs.forEach((docSnap) => {
              const d = docSnap.data() as any;
              const teamId = docSnap.id;
              const isNbaTeam = String(d.league ?? "") === "nba";
              let value: TeamRecord;

              if (isNbaTeam) {
                const wl = nbaRegularSeasonWinsLosses(d);
                value = {
                  wins: wl.wins,
                  losses: wl.losses,
                  rank: typeof d.rank === "number" ? d.rank : undefined,
                  lastGames: Array.isArray(d.lastGames) ? d.lastGames : [],
                };
              } else {
                const wl = footballWinsLossesDraws(d);
                value = {
                  wins: wl.wins,
                  losses: wl.losses,
                  draws: wl.draws,
                  rank: typeof d.rank === "number" ? d.rank : undefined,
                  lastGames: Array.isArray(d.lastGames) ? d.lastGames : [],
                };
              }

              memoryTeamRecordCache.set(teamRecordMemKey(teamId), value);
              nextSessionCache[teamId] = value;
              merged[teamId] = value;
            });
          });

          writeTeamRecordCacheToSession(nextSessionCache);
          if (alive) setTeamRecordMap(merged);
        }
      } catch {
        if (alive) setTeamRecordMap(immediateMap);
      }
    };

    run();

    return () => {
      alive = false;
    };
  }, [teamIds, leagueAnimKey]);

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

  useEffect(() => {
    setOverlayResultPost(null);
    setOverlayUserPredictionWinner(null);
    setPredictEditTriggerNonce(0);
    setOverlayLiveMarketBias(null);
  }, [openGameId]);

  /** 既に表示できる試合があるときはスケルトンで隠さない */
  if (loading && !propsList.length) {
    return (
      <div className="grid gap-6 px-4 md:px-6 lg:px-8">
        <div className="skeleton-scan rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mx-auto mb-3 h-4 w-40 rounded bg-white/10" />
        </div>
        <div className="skeleton-scan rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mx-auto mb-3 h-4 w-40 rounded bg-white/10" />
        </div>
        <div className="skeleton-scan rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="mx-auto mb-3 h-4 w-40 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (!propsList.length) {
    return (
      <CyberNoDataPage
        variant="games"
        aria-label={emptyHint ?? m.games.noGames}
      />
    );
  }

  /** View Transition 時は Framer のパネル移動と二重になるためオフ */
  const overlayMotionEnabled = !reduceMotion && !vtUi;
  const overlayPresenceProps = overlayMotionEnabled
    ? {
        initial: "hidden" as const,
        animate: "show" as const,
        exit: "exit" as const,
      }
    : { initial: false as const };

  const overlayContent =
    openGameId && overlayGameProps ? (
      <motion.div
        key={String(openGameId)}
        className="fixed inset-0 z-[100000] overflow-hidden"
        variants={overlayMotionEnabled ? predictOverlayRoot : undefined}
        {...overlayPresenceProps}
      >
        <ProfileMenuEdgeHandle
          onOpen={close}
          label="BACK"
          tone="back"
          overlay
          ariaLabel={language === "en" ? "Back" : "戻る"}
        />
        <motion.div
          className={[
            `absolute inset-0 z-0 ${PREDICT_OVERLAY_BACKDROP}`,
            standingsOpenInOverlay
              ? "pointer-events-none"
              : "pointer-events-auto",
          ].join(" ")}
          variants={overlayMotionEnabled ? predictOverlayBackdrop : undefined}
          onClick={() => {
            if (standingsOpenInOverlay) return;
            close();
          }}
        />

        <motion.div
          className="relative z-10 h-dvh overflow-y-auto overflow-x-hidden pointer-events-auto pb-bottom-nav"
          variants={overlayMotionEnabled ? predictOverlayPanel : undefined}
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
                : overlayGameProps.league === "wc"
                  ? "max-w-7xl px-4 pb-24 pt-6 sm:px-8 md:px-10 lg:px-12"
                  : "max-w-5xl px-4 pb-24 pt-6 sm:px-6 md:px-8 lg:px-10",
            ].join(" ")}
            onClick={(e) => e.stopPropagation()}
          >
            <motion.div
              className="relative w-full overflow-x-hidden"
              variants={
                overlayMotionEnabled ? predictOverlayContentOrch : undefined
              }
              {...(overlayMotionEnabled
                ? { initial: "hidden" as const, animate: "show" as const }
                : {})}
            >
              <motion.div
                className="relative w-full"
                variants={
                  overlayMotionEnabled ? predictOverlayCard : undefined
                }
              >
                <MatchCard
                  {...overlayGameProps}
                  language={language}
                  resultPost={overlayResultPost}
                  userPredictionWinner={overlayUserPredictionWinner}
                  resultRatingBarsImmediate
                  marketBias={
                    overlayLiveMarketBias ?? overlayGameProps.marketBias
                  }
                  myPostId={myPostMap[String(overlayGameProps.id)] ?? null}
                  onRequestPredictEdit={
                    overlayResultPost
                      ? () => setPredictEditTriggerNonce((n) => n + 1)
                      : undefined
                  }
                  onClosePredictOverlay={close}
                  homeRecord={
                    overlayGameProps.home?.teamId
                      ? teamRecordMap[overlayGameProps.home.teamId] ?? null
                      : null
                  }
                  awayRecord={
                    overlayGameProps.away?.teamId
                      ? teamRecordMap[overlayGameProps.away.teamId] ?? null
                      : null
                  }
                  sharedLayoutId={undefined}
                  sharedTransitionBaseKey={
                    vtUi
                      ? safeViewTransitionToken(String(overlayGameProps.id))
                      : undefined
                  }
                  disableCardMotion
                  hideActions
                  showMarketBias
                  attachOverlayMarketBar
                  className={
                    isMobile ? MOBILE_PREDICT_OVERLAY_CARD_OUTER_CLASS : undefined
                  }
                />
              </motion.div>

              {liveStatsEnabled ? (
                <motion.div
                  className="mt-4"
                  variants={
                    overlayMotionEnabled ? predictOverlayCard : undefined
                  }
                >
                  {liveStatsReport ? (
                    <LiveGameStatsPanel
                      report={liveStatsReport}
                      language={language}
                      omitScoreHeader
                    />
                  ) : (
                    <LiveGameStatsPlaceholder
                      language={language}
                      loading={liveStatsLoading}
                    />
                  )}
                </motion.div>
              ) : (
              <PredictionFormV2
                key={String(openGameId)}
                dense={dense}
                game={overlayGameProps}
                user={{ name: "You" }}
                embedded
                inOverlay
                tutorialMode={
                  !!tutorialModeGameId &&
                  String(overlayGameProps.id) === String(tutorialModeGameId)
                }
                onTutorialSubmit={(payload) => {
                  if (
                    payload.winner !== "home" &&
                    payload.winner !== "away"
                  ) {
                    return;
                  }
                  onTutorialPredict?.({
                    winner: payload.winner,
                    scoreHome: payload.scoreHome,
                    scoreAway: payload.scoreAway,
                    goalScorer: payload.goalScorer ?? null,
                  });
                  /** VT / exit を待たず即閉じ（投稿後コーチがカードに隠れないように） */
                  setStandingsOpenInOverlay(false);
                  setDisableReturnLayout(true);
                  setOpenGameId(null);
                }}
                overlayHomeRecord={
                  overlayGameProps.home?.teamId
                    ? teamRecordMap[overlayGameProps.home.teamId] ?? null
                    : null
                }
                overlayAwayRecord={
                  overlayGameProps.away?.teamId
                    ? teamRecordMap[overlayGameProps.away.teamId] ?? null
                    : null
                }
                predictEditTriggerNonce={predictEditTriggerNonce}
                overlayExistingPostId={
                  myPostMap[String(overlayGameProps.id)] ?? null
                }
                onExistingResultPostChange={setOverlayResultPost}
                onUserPredictionWinnerChange={setOverlayUserPredictionWinner}
                onPredictEditEnd={() => setPredictEditTriggerNonce(0)}
                overlayScheduleGameIds={gameIds}
                overlayScheduleGames={propsList}
                overlayPredictedGameIds={overlayPredictedGameIds}
                onClosePredictOverlay={close}
                onSwitchOverlayGame={(id) => {
                  startDomViewTransition(
                    () => {
                      setOpenGameId(String(id));
                      setStandingsOpenInOverlay(false);
                      setDisableReturnLayout(false);
                    },
                    { skip: !vtUi }
                  );
                }}
                onStandingsOpenChange={(open) => {
                  setStandingsOpenInOverlay(open);
                  if (open) setDisableReturnLayout(true);
                }}
                onPostCreated={(payload) => {
                  const gameId = overlayGameProps?.id;
                  if (gameId && payload?.id) {
                    setMyPostMap((prev) => ({
                      ...prev,
                      [String(gameId)]: payload.id,
                    }));
                  }
                  onPredictionPosted?.();
                }}
                onMarketDistributionChange={setOverlayLiveMarketBias}
              />
              )}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    ) : null;

  const listRows = propsList.map((props, index) => {
    const isOverlaySourceRow =
      !!openGameId && String(openGameId) === String(props.id);
    const isVtGhostRow = vtUi && isOverlaySourceRow;
    /** オーバーレイ表示中は一覧側カードを隠す（ポータル内カードとの二重表示を防ぐ） */
    const hideListCardForOverlay = isOverlaySourceRow;

    /** Web VT 時：対象行以外を薄く（filter blur は全行合成が重いため opacity のみ） */
    const activeListTargetId =
      openGameId ?? sharedVtListSourceRef.current ?? null;
    const dimPeerRow =
      !isMobile &&
      activeListTargetId != null &&
      String(props.id) !== String(activeListTargetId);
    const peerBackdropClass = dimPeerRow ? "opacity-45" : "";

    const listSharedTransitionBaseKey =
      vtUi && !isVtGhostRow
        ? (() => {
            const pid = String(props.id);
            if (
              sharedVtListSourceRef.current &&
              pid === sharedVtListSourceRef.current
            ) {
              return safeViewTransitionToken(pid);
            }
            if (
              sharedVtListTargetRef.current &&
              pid === sharedVtListTargetRef.current
            ) {
              return safeViewTransitionToken(pid);
            }
            return undefined;
          })()
        : undefined;

    const forceViewTransitionNameNone =
      vtUi && listSharedTransitionBaseKey === undefined;

    const rowClass = [
      "relative",
      hideListCardForOverlay ? "pointer-events-none" : "",
      peerBackdropClass,
      dimPeerRow ? "transition-opacity duration-200" : "",
    ]
      .filter(Boolean)
      .join(" ");

    const card = (
      <MatchCard
        {...props}
        isPickup={Boolean(props.isPickup)}
        tutorialPickupLabelTarget={
          tutorialRegisterPickupLabel &&
          Boolean(props.isPickup) &&
          String(props.id) === tutorialPickupGameId
            ? "match-pickup-label"
            : undefined
        }
        language={language}
        className={
          hideListCardForOverlay ? "invisible select-none" : undefined
        }
        scheduleEntryIndex={index}
        heavyListEntry={!isDaySwitchShell}
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
          isMobile || vtUi || openGameId || disableReturnLayout
            ? undefined
            : `matchcard-${props.id}`
        }
        sharedTransitionBaseKey={listSharedTransitionBaseKey}
        forceViewTransitionNameNone={forceViewTransitionNameNone}
        onOpenPredict={open}
        disableCardMotion={!!openGameId}
      />
    );

    return (
      <motion.div
        key={props.id}
        layout={false}
        custom={index}
        variants={scheduleItem}
        className={rowClass}
        aria-hidden={hideListCardForOverlay ? true : undefined}
        data-tutorial-target={
          tutorialMarkFirstCard && index === 0 ? "match-card" : undefined
        }
      >
        {card}
      </motion.div>
    );
  });

  const scheduleGridClass = isMobile
    ? "grid gap-2.5 px-1"
    : "grid gap-6 px-4 md:px-6 lg:px-8";

  return (
    <>
      <LayoutGroup id="schedule-list">
        <ScheduleSharedTransitionLayout data-vt-nonce={vtListTransitionNonce}>
          <div className={openGameId ? "pointer-events-none" : ""}>
            <motion.div
              key={leagueAnimKey}
              className={scheduleGridClass}
              variants={scheduleContainer}
              initial={listShellAnimations ? "hidden" : false}
              animate="show"
            >
              {listRows}
            </motion.div>
          </div>
        </ScheduleSharedTransitionLayout>
      </LayoutGroup>

      {typeof document !== "undefined"
        ? createPortal(
            /*
             * View Transitions 利用時は AnimatePresence の exit 待ちでオーバーレイが DOM に残り、
             * 一覧カードと同じ view-transition-name が重複して InvalidStateError になるため即時アンマウント。
             * チュートリアル投稿後も同様に即アンマウント（exit 中のカードがコーチより前面に出るのを防ぐ）。
             */
            vtUi || forceCloseOverlay ? overlayContent : (
              <AnimatePresence>{overlayContent}</AnimatePresence>
            ),
            document.body,
          )
        : null}
    </>
  );
}
