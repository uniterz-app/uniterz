"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

import { nameBebas, jp } from "@/lib/fonts";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import BracketUserCard from "./BracketUserCard";
import useBracketLeaderboard, {
  type BracketLeaderboardRow,
} from "@/lib/leaderboards/useBracketLeaderboard";
import { getCurrentPlayoffSeason } from "@/lib/playoff-bracket-config";
import { loadPlayoffBracket } from "@/lib/playoff-bracket-firestore";
import { buildPlayoffDisplayData } from "@/lib/playoff-bracket-display";
import PlayoffFullBracketWeb from "@/app/component/predict/PlayoffFullBracketWeb";
import PlayoffFullBracketMobile from "@/app/component/predict/PlayoffFullBracketMobile";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";

type Props = {
  season?: string;
};

export default function BracketLeaderboardSection({ season: propSeason }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const isMobile =
    pathname?.startsWith("/mobile") || pathname?.startsWith("/m/");

  const season = propSeason ?? getCurrentPlayoffSeason();
  const { loading, error, rows } = useBracketLeaderboard({ season });

  const [uid, setUid] = useState<string | null>(auth.currentUser?.uid ?? null);
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

  const loadBracketForUser = useCallback(
    async (uid: string) => {
      setBracketLoading(true);
      setPlayoffDisplayData(null);
      try {
        const doc = await loadPlayoffBracket(uid, season);
        if (doc?.bracket && doc?.season) {
          setPlayoffDisplayData(buildPlayoffDisplayData(doc.bracket, doc.season));
          setPlayoffScore(doc.totalScore ?? 0);
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
  }, []);

  const openProfileFromSheet = useCallback(
    (row: BracketLeaderboardRow) => {
      const handleOrUid = row.handle || row.uid;
      router.push(`${isMobile ? "/mobile" : "/web"}/u/${handleOrUid}`);
    },
    [isMobile, router]
  );

  const PlayoffBracket = isMobile ? PlayoffFullBracketMobile : PlayoffFullBracketWeb;

  const titleBlock = (
    <div className="text-center">
      <h1
        className={[
          "text-[36px] leading-none tracking-[0.04em]",
          nameBebas.className,
        ].join(" ")}
        style={{
          color: "#38bdf8",
          textShadow:
            "0 0 8px rgba(56,189,248,0.35), 0 0 18px rgba(56,189,248,0.25), 0 0 34px rgba(56,189,248,0.15)",
        }}
      >
        PLAYOFFS BRACKET
      </h1>
      <p className={["mt-1 text-[12px] text-white/60", jp.className].join(" ")}>
        {language === "en"
          ? "Showing bracket scores in descending order"
          : "生き残ったブラケットの得点が高い順に表示"}
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
        <div className="py-16 text-center text-white/60">
          {language === "en"
            ? "No remaining users."
            : "生き残りユーザーはいません"}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 px-3 pt-2">
        {titleBlock}
        <div className="space-y-3 pb-bottom-nav pt-2">
          {rows.map((row) => (
            <BracketUserCard
              key={row.uid}
              row={row}
              onClick={() => openDetail(row)}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {selectedRow && (
          <motion.div
            key="bracket-detail-overlay"
            className="fixed inset-0 z-99999 flex flex-col"
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
              className="relative z-10 flex h-full flex-col rounded-t-2xl bg-black/10 pb-4 backdrop-blur-xl"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 300,
              }}
            >
              <button
                type="button"
                aria-label={language === "en" ? "Close" : "閉じる"}
                className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/90 backdrop-blur-md transition hover:bg-black/55"
                onClick={closeDetail}
              >
                <X size={18} strokeWidth={2.4} />
              </button>

              <div className="sticky top-0 z-10 shrink-0 border-b border-white/10 bg-black/10 px-4 py-3 backdrop-blur-xl">
                <BracketUserCard
                  row={selectedRow}
                  onClick={() => openProfileFromSheet(selectedRow)}
                />
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-6 pb-bottom-nav">
                {bracketLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-white/60">
                      {language === "en" ? "Loading..." : "読み込み中..."}
                    </div>
                  </div>
                ) : playoffDisplayData ? (
                  <div className="mx-auto max-w-2xl">
                    <PlayoffBracket
                      league="nba"
                      score={playoffScore}
                      {...playoffDisplayData}
                    />
                  </div>
                ) : (
                  <div className="py-16 text-center text-white/60">
                    {language === "en"
                      ? "Couldn't load the bracket"
                      : "ブラケットを読み込めませんでした"}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
