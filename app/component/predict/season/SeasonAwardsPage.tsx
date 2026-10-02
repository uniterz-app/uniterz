"use client";

/**
 * 本番: NBA シーズンアワード予想
 * 締切前: 提出 / 提出後ビュー
 * 締切後: マーケット集計
 * `/mobile/season-awards`
 */
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import GamesNbaSubpageShell from "@/app/component/games/GamesNbaSubpageShell";
import NbaSeasonAwardsPredictPanel from "@/app/component/predict/season/NbaSeasonAwardsPredictPanel";
import NbaSeasonAwardsViewPanel from "@/app/component/predict/season/NbaSeasonAwardsViewPanel";
import NbaSeasonAwardsMarketPanel from "@/app/component/predict/season/NbaSeasonAwardsMarketPanel";
import SeasonPredictRulesModal from "@/app/component/predict/season/SeasonPredictRulesModal";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import {
  fetchMeSeasonAwards,
  saveMeSeasonAwards,
} from "@/lib/api/fetchSeasonAwards";
import { fetchMeSeasonStandings } from "@/lib/api/fetchSeasonStandings";
import { fetchSeasonPredictMarket } from "@/lib/api/fetchSeasonPredictMarket";
import { auth } from "@/lib/firebase";
import { nameOxanium } from "@/lib/fonts";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  isSeasonPredictSubmitOpen,
  seasonPredictSubmitDeadlineLabel,
  seasonPredictSubmitLockedMessage,
} from "@/lib/predict/seasonPredictDeadline";
import type { SeasonAwardsMarketSnapshot } from "@/lib/predict/seasonPredictMarket";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  emptySeasonAwardsPrediction,
  isSeasonAwardsComplete,
  type NbaAwardCandidate,
  type NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import {
  seasonPredictAwardsIncompleteError,
  seasonPredictAwardsPageSubtitle,
  seasonPredictInvalidSubmitError,
  seasonPredictMarketPendingBody,
  seasonPredictNudgeCopy,
  resolveSeasonPredictUiLang,
  seasonPredictPageUiCopy,
} from "@/lib/predict/seasonPredictUiCopy";

type Mode = "loading" | "edit" | "view" | "market" | "market_pending";

export default function SeasonAwardsPage() {
  const router = useRouter();
  const season = CURRENT_NBA_SEASON_KEY;
  const submitOpen = isSeasonPredictSubmitOpen();
  const [mode, setMode] = useState<Mode>("loading");
  const [value, setValue] = useState<NbaSeasonAwardsPrediction>(() =>
    emptySeasonAwardsPrediction(season)
  );
  const [candidates, setCandidates] = useState<NbaAwardCandidate[]>([]);
  const [market, setMarket] = useState<SeasonAwardsMarketSnapshot | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [standingsNudgeOpen, setStandingsNudgeOpen] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesAutoShown, setRulesAutoShown] = useState(false);
  const { language } = useUserLanguage(uid);
  const rulesLang = resolveSeasonPredictUiLang(language);
  const deadlineLabel = seasonPredictSubmitDeadlineLabel(rulesLang);
  const pageUi = seasonPredictPageUiCopy(rulesLang);

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
      if (!submitOpen) {
        try {
          const data = await fetchSeasonPredictMarket({
            season,
            kind: "awards",
          });
          if (cancelled) return;
          if (data.awards) {
            setMarket(data.awards);
            setMode("market");
          } else {
            setMarket(null);
            setMode("market_pending");
          }
        } catch (e) {
          console.error("fetchSeasonPredictMarket awards", e);
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "market load failed");
            setMode("market_pending");
          }
        }
        return;
      }

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
  }, [uid, season, submitOpen]);

  useEffect(() => {
    if (mode !== "edit" || rulesAutoShown) return;
    setRulesOpen(true);
    setRulesAutoShown(true);
  }, [mode, rulesAutoShown]);

  const handleSubmit = useCallback(async () => {
    if (submitting) return;
    if (!submitOpen) {
      setError(seasonPredictSubmitLockedMessage(rulesLang));
      return;
    }
    if (!isSeasonAwardsComplete(value)) {
      setError(seasonPredictAwardsIncompleteError(rulesLang));
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
        throw new Error(seasonPredictInvalidSubmitError(rulesLang));
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
  }, [value, submitting, season, submitOpen, rulesLang]);

  const nudge = seasonPredictNudgeCopy(rulesLang);

  return (
    <GamesNbaSubpageShell
      eyebrow="NBA · SEASON"
      title={submitOpen ? "AWARDS" : "MARKET"}
      subtitle={seasonPredictAwardsPageSubtitle(rulesLang, submitOpen)}
      onHelpPress={() => setRulesOpen(true)}
    >
      {mode === "loading" ? (
        <div className="flex justify-center py-16">
          <CandleChartLoader />
        </div>
      ) : mode === "market" && market ? (
        <div className="space-y-3">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200/70",
            ].join(" ")}
          >
            {pageUi.marketPassed}
          </p>
          <NbaSeasonAwardsMarketPanel
            market={market}
            language={rulesLang}
          />
        </div>
      ) : mode === "market_pending" ? (
        <div className="space-y-3 py-8 text-center">
          <p
            className={[
              nameOxanium.className,
              "text-[12px] font-extrabold uppercase tracking-[0.14em] text-amber-200/80",
            ].join(" ")}
          >
            {pageUi.marketPending}
          </p>
          <p className="text-[13px] leading-relaxed text-white/50">
            {seasonPredictMarketPendingBody(rulesLang)}
          </p>
          {error ? (
            <p className="text-[12px] text-[#FF8AB4]/85">{error}</p>
          ) : null}
        </div>
      ) : mode === "view" ? (
        <div className="space-y-3">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.12em] text-white/40",
            ].join(" ")}
          >
            {pageUi.deadlineLabel} · {deadlineLabel}
          </p>
          <NbaSeasonAwardsViewPanel
            prediction={value}
            catalog={candidates.length > 0 ? candidates : undefined}
          />
          {submitOpen ? (
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
              {pageUi.editResubmit}
            </button>
          ) : (
            <p className="text-[12px] text-white/45">
              {seasonPredictSubmitLockedMessage(rulesLang)}
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.12em] text-white/40",
            ].join(" ")}
          >
            {pageUi.deadlineLabel} · {deadlineLabel}
          </p>
          {error ? (
            <p className="text-[12px] text-[#FF8AB4]/85">{error}</p>
          ) : null}
          {!submitOpen ? (
            <p className="text-[12px] text-white/45">
              {seasonPredictSubmitLockedMessage(rulesLang)}
            </p>
          ) : (
            <NbaSeasonAwardsPredictPanel
              value={value}
              onChange={setValue}
              onSubmit={() => void handleSubmit()}
              submitDisabled={submitting}
              language={rulesLang}
            />
          )}
          {submitting ? (
            <p
              className={[
                nameOxanium.className,
                "text-[10px] font-bold uppercase tracking-[0.12em] text-white/40",
              ].join(" ")}
            >
              {pageUi.submitting}
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
              {nudge.title}
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-white/55">
              {nudge.body}
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
                {nudge.later}
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
                {nudge.goStandings}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {typeof document !== "undefined"
        ? createPortal(
            <SeasonPredictRulesModal
              open={rulesOpen}
              kind="awards"
              language={rulesLang}
              onClose={() => setRulesOpen(false)}
            />,
            document.body
          )
        : null}
    </GamesNbaSubpageShell>
  );
}
