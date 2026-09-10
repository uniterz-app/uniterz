"use client";

/**
 * 本番: NBA シーズン順位予想
 * 締切前: 提出 / 提出後ビュー
 * 締切後: マーケット集計（Firestore スナップショット）
 * `/mobile/season-standings`
 */
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import GamesNbaSubpageShell from "@/app/component/games/GamesNbaSubpageShell";
import NbaSeasonStandingsPredictPanel from "@/app/component/predict/season/NbaSeasonStandingsPredictPanel";
import NbaSeasonStandingsViewPanel from "@/app/component/predict/season/NbaSeasonStandingsViewPanel";
import NbaSeasonStandingsMarketPanel from "@/app/component/predict/season/NbaSeasonStandingsMarketPanel";
import SeasonPredictRulesModal from "@/app/component/predict/season/SeasonPredictRulesModal";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import {
  fetchMeSeasonStandings,
  saveMeSeasonStandings,
} from "@/lib/api/fetchSeasonStandings";
import { fetchSeasonPredictMarket } from "@/lib/api/fetchSeasonPredictMarket";
import { auth } from "@/lib/firebase";
import { nameOxanium } from "@/lib/fonts";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  isSeasonPredictSubmitOpen,
  seasonPredictSubmitDeadlineLabel,
  seasonPredictSubmitLockedMessage,
} from "@/lib/predict/seasonPredictDeadline";
import type { SeasonStandingsMarketSnapshot } from "@/lib/predict/seasonPredictMarket";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  emptySeasonStandingsPrediction,
  isSeasonStandingsComplete,
  type NbaSeasonStandingsPrediction,
} from "@/lib/predict/nbaSeasonStandingsPredict";
import {
  seasonPredictInvalidSubmitError,
  seasonPredictMarketPendingBody,
  seasonPredictStandingsIncompleteError,
  seasonPredictStandingsPageSubtitle,
  resolveSeasonPredictUiLang,
  seasonPredictPageUiCopy,
} from "@/lib/predict/seasonPredictUiCopy";

type Mode = "loading" | "edit" | "view" | "market" | "market_pending";

export default function SeasonStandingsPage() {
  const router = useRouter();
  const season = CURRENT_NBA_SEASON_KEY;
  const submitOpen = isSeasonPredictSubmitOpen();
  const [mode, setMode] = useState<Mode>("loading");
  const [value, setValue] = useState<NbaSeasonStandingsPrediction>(() =>
    emptySeasonStandingsPrediction(season)
  );
  const [market, setMarket] = useState<SeasonStandingsMarketSnapshot | null>(
    null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
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
            kind: "standings",
          });
          if (cancelled) return;
          if (data.standings) {
            setMarket(data.standings);
            setMode("market");
          } else {
            setMarket(null);
            setMode("market_pending");
          }
        } catch (e) {
          console.error("fetchSeasonPredictMarket standings", e);
          if (!cancelled) {
            setError(e instanceof Error ? e.message : "market load failed");
            setMode("market_pending");
          }
        }
        return;
      }

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
    if (!isSeasonStandingsComplete(value)) {
      setError(seasonPredictStandingsIncompleteError(rulesLang));
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
        throw new Error(seasonPredictInvalidSubmitError(rulesLang));
      }
      setValue(data.prediction);
      setMode("view");
    } catch (e) {
      setError(e instanceof Error ? e.message : "submit failed");
    } finally {
      setSubmitting(false);
    }
  }, [value, submitting, submitOpen, rulesLang]);

  return (
    <GamesNbaSubpageShell
      eyebrow="NBA · SEASON"
      title={submitOpen ? "STANDINGS" : "MARKET"}
      subtitle={seasonPredictStandingsPageSubtitle(rulesLang, submitOpen)}
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
          <NbaSeasonStandingsMarketPanel
            market={market}
            language={rulesLang}
          />
        </div>
      ) : mode === "market_pending" ? (
        <div className="space-y-3 py-8 text-center">
          <p
            className={[
              nameOxanium.className,
              "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cyan-200/80",
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
          <NbaSeasonStandingsViewPanel prediction={value} />
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
            <NbaSeasonStandingsPredictPanel
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

      {typeof document !== "undefined"
        ? createPortal(
            <SeasonPredictRulesModal
              open={rulesOpen}
              kind="standings"
              language={rulesLang}
              onClose={() => setRulesOpen(false)}
            />,
            document.body
          )
        : null}
    </GamesNbaSubpageShell>
  );
}
