"use client";

/**
 * 本番: NBA シーズン順位予想（提出 → Firestore 本人1通）
 * `/mobile/season-standings`
 */
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import GamesNbaSubpageShell from "@/app/component/games/GamesNbaSubpageShell";
import NbaSeasonStandingsPredictPanel from "@/app/component/predict/season/NbaSeasonStandingsPredictPanel";
import NbaSeasonStandingsViewPanel from "@/app/component/predict/season/NbaSeasonStandingsViewPanel";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import {
  fetchMeSeasonStandings,
  saveMeSeasonStandings,
} from "@/lib/api/fetchSeasonStandings";
import { auth } from "@/lib/firebase";
import { nameOxanium } from "@/lib/fonts";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  emptySeasonStandingsPrediction,
  isSeasonStandingsComplete,
  type NbaSeasonStandingsPrediction,
} from "@/lib/predict/nbaSeasonStandingsPredict";

type Mode = "loading" | "edit" | "view";

export default function SeasonStandingsPage() {
  const router = useRouter();
  const season = CURRENT_NBA_SEASON_KEY;
  const [mode, setMode] = useState<Mode>("loading");
  const [value, setValue] = useState<NbaSeasonStandingsPrediction>(() =>
    emptySeasonStandingsPrediction(season)
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);

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
        const data = await fetchMeSeasonStandings(season);
        if (cancelled) return;
        if (data.prediction) {
          setValue(data.prediction);
          setMode("view");
        } else {
          setValue(emptySeasonStandingsPrediction(season));
          setMode("edit");
        }
      } catch (e) {
        console.error("fetchMeSeasonStandings", e);
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
    if (!isSeasonStandingsComplete(value)) {
      setError("East / West それぞれ 1〜15 位を埋めてから提出してください。");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await saveMeSeasonStandings({
        season: value.season,
        east: value.east,
        west: value.west,
      });
      if (!data.prediction) {
        throw new Error("提出レスポンスが不正です");
      }
      setValue(data.prediction);
      setMode("view");
    } catch (e) {
      setError(e instanceof Error ? e.message : "submit failed");
    } finally {
      setSubmitting(false);
    }
  }, [value, submitting]);

  return (
    <GamesNbaSubpageShell
      eyebrow="NBA · SEASON"
      title="STANDINGS"
      subtitle="East / West 各 1〜15 位を予想。同じチームは同じカンファレンス内で一度だけ使えます。"
    >
      {mode === "loading" ? (
        <div className="flex justify-center py-16">
          <CandleChartLoader />
        </div>
      ) : mode === "view" ? (
        <div className="space-y-3">
          <NbaSeasonStandingsViewPanel prediction={value} />
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
          <NbaSeasonStandingsPredictPanel
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
    </GamesNbaSubpageShell>
  );
}
