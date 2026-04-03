"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import { LayoutGroup, motion } from "framer-motion";
import { X } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Language } from "@/lib/i18n/language";

import ResultCard from "@/app/component/result/ResultCard";
import ResultDetail from "@/app/component/result/ResultDetail";
import MobileResultDetail from "@/app/component/result/mobile/MobileResultDetail";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";

type PostWithMillis = PredictionPostV2 & {
  createdAtMillis?: number | null;
  settledAtMillis?: number | null;
};

type DayGroup = {
  dateLabel: string;
  dateMs: number;
  pending: PostWithMillis[];
  final: PostWithMillis[];
};

type MarketData = {
  homeRate: number;
  awayRate: number;
  drawRate?: number;
  total?: number;
};

type Props = {
  grouped: DayGroup[];
  loading: boolean;
  hasMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  language: Language;
};

export default function ResultListWithOverlay({
  grouped,
  loading,
  hasMore,
  sentinelRef,
  language,
}: Props) {
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [market, setMarket] = useState<MarketData | null>(null);

  const pathname = usePathname();
  const isMobile = pathname?.startsWith("/mobile") || pathname?.startsWith("/m/");
  const scrollYRef = useRef(0);

  const selectedPost = useMemo(() => {
    if (!openPostId) return null;
    return (
      grouped
        .flatMap((d) => [...d.pending, ...d.final])
        .find((p) => p.id === openPostId) ?? null
    );
  }, [grouped, openPostId]);

  const open = useCallback((post: PredictionPostV2) => {
    scrollYRef.current = typeof window !== "undefined" ? window.scrollY : 0;
    /* ScheduleList 同様: body に splash-bg が残っているとオーバーレイ直前にスプラッシュ画像が一瞬見える */
    if (typeof document !== "undefined") {
      document.body.classList.remove("splash-bg");
    }
    setOpenPostId(post.id);
    setMarket(null);
  }, []);

  const close = useCallback(() => {
    setOpenPostId(null);
    setMarket(null);
  }, []);

  useEffect(() => {
    if (!openPostId || !selectedPost) return;

    let alive = true;

    (async () => {
      try {
        const gameSnap = await getDoc(doc(db, "games", selectedPost.gameId));
        if (!alive) return;
        if (gameSnap.exists()) {
          const gameData: any = gameSnap.data();
          setMarket({
            homeRate: gameData?.market?.homeRate ?? 0,
            awayRate: gameData?.market?.awayRate ?? 0,
            drawRate: gameData?.market?.drawRate ?? 0,
            total: gameData?.market?.total ?? 0,
          });
        }
      } catch (e) {
        console.error(e);
      }
    })();

    return () => {
      alive = false;
    };
  }, [openPostId, selectedPost?.gameId]);

  useLayoutEffect(() => {
    if (!openPostId) return;
    document.body.classList.remove("splash-bg");
  }, [openPostId]);

  useEffect(() => {
    if (!openPostId) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [openPostId]);

  useEffect(() => {
    if (!openPostId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openPostId, close]);

  useEffect(() => {
    if (openPostId !== null) return;

    requestAnimationFrame(() => {
      window.scrollTo({
        top: scrollYRef.current,
        behavior: "auto",
      });
    });
  }, [openPostId]);

  return (
    <LayoutGroup id="result-list">
      <motion.div
        className={[
          "space-y-6",
          openPostId ? "pointer-events-none" : "",
        ].join(" ")}
        animate={{
          scale: openPostId ? 0.988 : 1,
          opacity: openPostId ? 0.94 : 1,
        }}
        transition={{
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {grouped.map((day) => (
          <div key={day.dateLabel}>
            <div className="mb-3 flex items-center justify-center">
              <div
                className={[
                  "font-semibold tracking-wide text-white/80 bg-white/5 border border-white/15 rounded-full backdrop-blur-sm",
                  isMobile ? "px-3 py-1 text-[11px]" : "px-5 py-2 text-sm",
                ].join(" ")}
              >
                {day.dateLabel}
              </div>
            </div>

            <div className="space-y-4">
              {day.pending.length > 0 && (
                <div className="space-y-3">
                  {day.pending.map((post) => {
                    const isOpen = openPostId === post.id;
                    return (
                      <div
                        key={post.id}
                        className={isOpen ? "pointer-events-none opacity-0" : ""}
                        aria-hidden={isOpen}
                      >
                        <ResultCard post={post} onOpen={open} language={language} />
                      </div>
                    );
                  })}
                </div>
              )}

              {day.final.length > 0 && (
                <div className="space-y-3">
                  {day.final.map((post) => {
                    const isOpen = openPostId === post.id;
                    return (
                      <div
                        key={post.id}
                        className={isOpen ? "pointer-events-none opacity-0" : ""}
                        aria-hidden={isOpen}
                      >
                        <ResultCard post={post} onOpen={open} language={language} />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ))}

        <div ref={sentinelRef} className="h-10" />

        {loading && (
          <div className="py-6 text-center text-white/60 text-sm">
            Loading...
          </div>
        )}

        {!loading &&
          !hasMore &&
          grouped.reduce((a, d) => a + d.pending.length + d.final.length, 0) >
            0 && (
          <div className="py-6 text-center text-white/40 text-sm">
            {language === "en" ? "No more posts" : "これ以上ありません"}
          </div>
        )}
      </motion.div>

      {openPostId && selectedPost && (
        <motion.div
          key="result-overlay"
          className={[
            "fixed inset-0 overflow-hidden",
            isMobile ? "z-100000" : "z-99999",
          ].join(" ")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 0.2,
            ease: [0.22, 1, 0.36, 1],
          }}
        >
          <div
            className="absolute inset-0 z-0 bg-black/35 backdrop-blur-md pointer-events-auto"
            onClick={close}
          />

          <div
            className="relative z-10 h-dvh overflow-y-auto overflow-x-hidden pointer-events-auto pb-bottom-nav"
            style={{
              WebkitOverflowScrolling: "touch",
              overscrollBehaviorY: "contain",
              overscrollBehaviorX: "none",
              touchAction: "pan-y",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className={[
                "mx-auto w-full overflow-x-hidden",
                isMobile
                  ? "max-w-2xl px-3 pb-32 pt-4 sm:px-4 sm:pb-36 sm:pt-6 md:px-6"
                  : "max-w-5xl px-4 pb-24 pt-6 sm:px-6 md:px-8 lg:px-10",
              ].join(" ")}
            >
              <motion.div
                className="relative w-full overflow-x-hidden"
                initial={{
                  opacity: 0,
                  y: 18,
                  scale: 0.972,
                  filter: "blur(10px)",
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  filter: "blur(0px)",
                }}
                transition={{
                  duration: 0.42,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <button
                  type="button"
                  aria-label={language === "en" ? "Close" : "閉じる"}
                  className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/90 backdrop-blur-md transition hover:bg-black/55"
                  onClick={(e) => {
                    e.stopPropagation();
                    close();
                  }}
                >
                  <X size={18} strokeWidth={2.4} />
                </button>

                {isMobile ? (
                  <MobileResultDetail
                    post={selectedPost}
                    market={market ?? undefined}
                    language={language}
                    inOverlay
                  />
                ) : (
                  <ResultDetail
                    post={selectedPost}
                    market={market ?? undefined}
                    language={language}
                    inOverlay
                  />
                )}
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </LayoutGroup>
  );
}
