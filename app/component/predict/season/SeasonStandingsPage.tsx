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
import {
  isSeasonPredictSubmitOpen,
  SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_JA,
  seasonPredictSubmitLockedMessage,
} from "@/lib/predict/seasonPredictDeadline";
import type { SeasonStandingsMarketSnapshot } from "@/lib/predict/seasonPredictMarket";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  emptySeasonStandingsPrediction,
  isSeasonStandingsComplete,
  type NbaSeasonStandingsPrediction,
} from "@/lib/predict/nbaSeasonStandingsPredict";

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
      setError(seasonPredictSubmitLockedMessage("ja"));
      return;
    }
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
  }, [value, submitting, submitOpen]);

  return (
    <GamesNbaSubpageShell
      eyebrow="NBA · SEASON"
      title={submitOpen ? "STANDINGS" : "MARKET"}
      subtitle={
        submitOpen
          ? "East / West 各 1〜15 位を予想。同じチームは同じカンファレンス内で一度だけ使えます。"
          : "締切後の提出集計。チームを押すと順位帯のシェアが見られます。"
      }
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
            Deadline passed · crowd market
          </p>
          <NbaSeasonStandingsMarketPanel market={market} />
        </div>
      ) : mode === "market_pending" ? (
        <div className="space-y-3 py-8 text-center">
          <p
            className={[
              nameOxanium.className,
              "text-[12px] font-extrabold uppercase tracking-[0.14em] text-cyan-200/80",
            ].join(" ")}
          >
            Market pending
          </p>
          <p className="text-[13px] leading-relaxed text-white/50">
            提出期限を過ぎました。集計が完了次第、ここにマーケットが表示されます。
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
            提出期限 · {SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_JA}
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
              Edit & resubmit
            </button>
          ) : (
            <p className="text-[12px] text-white/45">
              {seasonPredictSubmitLockedMessage("ja")}
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
            提出期限 · {SEASON_PREDICT_SUBMIT_DEADLINE_LABEL_JA}
          </p>
          {error ? (
            <p className="text-[12px] text-[#FF8AB4]/85">{error}</p>
          ) : null}
          {!submitOpen ? (
            <p className="text-[12px] text-white/45">
              {seasonPredictSubmitLockedMessage("ja")}
            </p>
          ) : (
            <NbaSeasonStandingsPredictPanel
              value={value}
              onChange={setValue}
              onSubmit={() => void handleSubmit()}
              submitDisabled={submitting}
            />
          )}
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

      {typeof document !== "undefined"
        ? createPortal(
            <SeasonPredictRulesModal
              open={rulesOpen}
              kind="standings"
              onClose={() => setRulesOpen(false)}
            />,
            document.body
          )
        : null}
    </GamesNbaSubpageShell>
  );
}
