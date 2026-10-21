"use client";

/**
 * 本番: NBA シーズン順位予想
 * 締切前: 提出 / 提出後ビュー
 * 締切後: 自分の予想 / みんなの予想（確定集計）
 * `/mobile/season-standings`
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import GamesNbaSubpageShell from "@/app/component/games/GamesNbaSubpageShell";
import NbaSeasonStandingsPredictPanel from "@/app/component/predict/season/NbaSeasonStandingsPredictPanel";
import NbaSeasonStandingsViewPanel from "@/app/component/predict/season/NbaSeasonStandingsViewPanel";
import NbaSeasonStandingsMarketPanel from "@/app/component/predict/season/NbaSeasonStandingsMarketPanel";
import SeasonPredictRulesModal from "@/app/component/predict/season/SeasonPredictRulesModal";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import ReferralPreseasonInviteCard from "@/app/component/referral/ReferralPreseasonInviteCard";
import { isReferralPreseasonOpen } from "@/lib/referral/referralPreseasonBonus";
import SeasonPredictCrowdToggle from "@/app/component/predict/season/SeasonPredictCrowdToggle";
import SeasonPredictKindTabs from "@/app/component/predict/season/SeasonPredictKindTabs";
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
  seasonPredictAwardsNudgeCopy,
} from "@/lib/predict/seasonPredictUiCopy";
import { fetchMeSeasonAwards } from "@/lib/api/fetchSeasonAwards";

type Mode = "loading" | "edit" | "view" | "locked";

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
  const [hasMine, setHasMine] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [rulesAutoShown, setRulesAutoShown] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const inviteOfferedRef = useRef(false);
  /** 順位・アワードの両方を出し終えた直後に 1 回だけ招待カード */
  const offerPreseasonInvite = useCallback(() => {
    if (inviteOfferedRef.current || !isReferralPreseasonOpen()) return;
    inviteOfferedRef.current = true;
    setInviteOpen(true);
  }, []);
  const [awardsNudgeOpen, setAwardsNudgeOpen] = useState(false);
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
        const [marketRes, mineRes] = await Promise.allSettled([
          fetchSeasonPredictMarket({ season, kind: "standings" }),
          fetchMeSeasonStandings(season),
        ]);
        if (cancelled) return;
        if (marketRes.status === "fulfilled") {
          setMarket(marketRes.value.standings ?? null);
        } else {
          console.error("fetchSeasonPredictMarket standings", marketRes.reason);
          setMarket(null);
        }
        if (mineRes.status === "fulfilled" && mineRes.value.prediction) {
          setValue(mineRes.value.prediction);
          setHasMine(true);
        } else {
          if (mineRes.status === "rejected") {
            console.error("fetchMeSeasonStandings", mineRes.reason);
          }
          setHasMine(false);
        }
        setMode("locked");
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
      try {
        const existing = await fetchMeSeasonAwards(season);
        if (!existing.prediction) setAwardsNudgeOpen(true);
        else offerPreseasonInvite();
      } catch {
        setAwardsNudgeOpen(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "submit failed");
    } finally {
      setSubmitting(false);
    }
  }, [value, submitting, submitOpen, rulesLang, season, offerPreseasonInvite]);

  const nudge = seasonPredictAwardsNudgeCopy(rulesLang);

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
      ) : mode === "locked" ? (
        <div className="space-y-3">
          <p
            className={[
              nameOxanium.className,
              "text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200/70",
            ].join(" ")}
          >
            {pageUi.marketPassed}
          </p>
          <SeasonPredictKindTabs active="standings" />
          <SeasonPredictCrowdToggle
            kind="standings"
            season={season}
            language={rulesLang}
            initialTab={hasMine ? "mine" : "crowd"}
            mine={
              hasMine ? (
                <NbaSeasonStandingsViewPanel prediction={value} />
              ) : (
                <p className="py-8 text-center text-[13px] leading-relaxed text-white/50">
                  {pageUi.myPicksNotSubmitted}
                </p>
              )
            }
            crowd={
              market ? (
                <NbaSeasonStandingsMarketPanel market={market} language={rulesLang} />
              ) : (
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
                </div>
              )
            }
          />
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
          <SeasonPredictKindTabs active="standings" />
          {submitOpen ? (
            <SeasonPredictCrowdToggle
              kind="standings"
              season={season}
              language={rulesLang}
              mine={
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
                    {pageUi.editResubmit}
                  </button>
                </div>
              }
            />
          ) : (
            <NbaSeasonStandingsViewPanel prediction={value} />
          )}
          {submitOpen ? null : (
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
          <SeasonPredictKindTabs active="standings" />
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

      {awardsNudgeOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="awards-nudge-title"
        >
          <div className="w-full max-w-sm border border-cyan-300/30 bg-[rgba(6,10,16,0.98)] p-4 shadow-[0_0_40px_rgba(0,245,255,0.12)]">
            <h3
              id="awards-nudge-title"
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
                onClick={() => setAwardsNudgeOpen(false)}
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
                  setAwardsNudgeOpen(false);
                  router.push("/mobile/season-awards");
                }}
                className={[
                  nameOxanium.className,
                  "border border-cyan-300/50 bg-cyan-300/20 px-3 py-2 text-[10px] font-extrabold uppercase tracking-[0.12em] text-cyan-50",
                ].join(" ")}
              >
                {nudge.goAwards}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
      <ReferralPreseasonInviteCard
        open={inviteOpen}
        language={language}
        onClose={() => setInviteOpen(false)}
      />
    </GamesNbaSubpageShell>
  );
}
