"use client";

/**
 * 本番: NBA シーズンアワード予想（提出 → Firestore 本人1通）
 * `/mobile/season-awards`
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import GamesNbaSubpageShell from "@/app/component/games/GamesNbaSubpageShell";
import NbaSeasonAwardsPredictPanel from "@/app/component/predict/season/NbaSeasonAwardsPredictPanel";
import NbaSeasonAwardsViewPanel from "@/app/component/predict/season/NbaSeasonAwardsViewPanel";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import {
  fetchMeSeasonAwards,
  saveMeSeasonAwards,
} from "@/lib/api/fetchSeasonAwards";
import { fetchMeSeasonStandings } from "@/lib/api/fetchSeasonStandings";
import { auth } from "@/lib/firebase";
import { nameOxanium } from "@/lib/fonts";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  emptySeasonAwardsPrediction,
  isSeasonAwardsComplete,
  type NbaAwardCandidate,
  type NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";

type Mode = "loading" | "edit" | "view";

export default function SeasonAwardsPage() {
  const router = useRouter();
  const season = CURRENT_NBA_SEASON_KEY;
  const [mode, setMode] = useState<Mode>("loading");
  const [value, setValue] = useState<NbaSeasonAwardsPrediction>(() =>
    emptySeasonAwardsPrediction(season)
  );
  const [candidates, setCandidates] = useState<NbaAwardCandidate[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [standingsNudgeOpen, setStandingsNudgeOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/mobile/signup");
        return;
      }
      setUid(user.uid);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchMeSeasonAwards(season);
        if (cancelled) return;
        if (data.prediction) {
          setValue(data.prediction);
          setCandidates(data.candidates ?? []);
          setMode("view");
        } else {
          setValue(emptySeasonAwardsPrediction(season));
          setCandidates([]);
          setMode("edit");
        }
      } catch (e) {
        console.error("fetchMeSeasonAwards", e);
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "load failed");
          setMode("edit");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid, season]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    if (!isSeasonAwardsComplete(value)) {
      setError("7つのアワードすべて選んでから提出してください。");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await saveMeSeasonAwards({
        season: value.season,
        picks: value.picks,
      });
      if (!data.prediction) {
        throw new Error("提出レスポンスが不正です");
      }
      setValue(data.prediction);
      setCandidates(data.candidates ?? []);
      setMode("view");
      try {
        const existing = await fetchMeSeasonStandings(season);
        if (!existing.prediction) setStandingsNudgeOpen(true);
      } catch {
        setStandingsNudgeOpen(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "submit failed");
    } finally {
      setSubmitting(false);
    }
  }, [value, submitting, season]);

  return (
    <GamesNbaSubpageShell
      eyebrow="NBA · SEASON"
      title="AWARDS"
      subtitle="MVP・DPOY など主要アワードを予想。候補は人気ピックから選び、名前検索でも絞り込めます。"
    >
      {mode === "loading" ? (
        <div className="flex justify-center py-16">
          <CandleChartLoader />
        </div>
      ) : mode === "view" ? (
        <div className="space-y-3">
          <NbaSeasonAwardsViewPanel
            prediction={value}
            catalog={candidates.length > 0 ? candidates : undefined}
          />
          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode("edit");
            }}
            className={[
              nameOxanium.className,
              "w-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/70 transition hover:bg-white/[0.08]",
            ].join(" ")}
          >
            Edit & resubmit
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {error ? (
            <p className="text-[12px] text-[#FF8AB4]/85">{error}</p>
          ) : null}
          <NbaSeasonAwardsPredictPanel
            value={value}
            onChange={setValue}
            onSubmit={() => void handleSubmit()}
            submitDisabled={submitting}
          />
          {submitting ? (
            <p
              className={[
                nameOxanium.className,
                "text-[10px] font-bold uppercase tracking-[0.12em] text-white/40",
              ].join(" ")}
            >
              Submitting…
            </p>
          ) : null}
        </div>
      )}

      {standingsNudgeOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="standings-nudge-title"
        >
          <div className="w-full max-w-sm border border-cyan-300/30 bg-[rgba(6,10,16,0.98)] p-4 shadow-[0_0_40px_rgba(0,245,255,0.12)]">
            <h3
              id="standings-nudge-title"
              className={[
                nameOxanium.className,
                "text-[13px] font-extrabold uppercase tracking-[0.14em] text-cyan-100",
              ].join(" ")}
            >
              順位予想もしますか？
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-white/55">
              アワード予想を提出しました。続けて East / West
              の順位予想もできます。
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setStandingsNudgeOpen(false)}
                className={[
                  nameOxanium.className,
                  "border border-white/15 bg-white/[0.04] px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-white/60",
                ].join(" ")}
              >
                あとで
              </button>
              <button
                type="button"
                onClick={() => {
                  setStandingsNudgeOpen(false);
                  router.push("/mobile/season-standings");
                }}
                className={[
                  nameOxanium.className,
                  "border border-cyan-300/50 bg-cyan-300/20 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cyan-50",
                ].join(" ")}
              >
                順位予想へ
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </GamesNbaSubpageShell>
  );
}
