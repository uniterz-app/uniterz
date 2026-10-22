"use client";

/**
 * 「自分の予想 / みんなの予想」切替。
 * 締切前: みんなの予想は提出者だけが読める途中集計（初回切替時に 1 回だけ取得）。
 * 締切後: 親が読み込んだ確定集計を `crowd` で渡す。
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { nameOxanium } from "@/lib/fonts";
import NbaSeasonStandingsMarketPanel from "@/app/component/predict/season/NbaSeasonStandingsMarketPanel";
import NbaSeasonAwardsMarketPanel from "@/app/component/predict/season/NbaSeasonAwardsMarketPanel";
import CandleChartLoader from "@/app/component/common/CandleChartLoader";
import { fetchSeasonPredictMarket } from "@/lib/api/fetchSeasonPredictMarket";
import type {
  SeasonAwardsMarketSnapshot,
  SeasonStandingsMarketSnapshot,
} from "@/lib/predict/seasonPredictMarket";
import type {
  NbaAwardCandidate,
  NbaSeasonAwardsPrediction,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import {
  seasonPredictPageUiCopy,
  type SeasonPredictUiLang,
} from "@/lib/predict/seasonPredictUiCopy";

type Props = {
  kind: "standings" | "awards";
  season: string;
  language: SeasonPredictUiLang;
  /** 自分の予想タブの中身（ビュー + 編集ボタン） */
  mine: ReactNode;
  /** 渡したときは途中集計を取りに行かず、これをみんなの予想タブに出す */
  crowd?: ReactNode;
  initialTab?: "mine" | "crowd";
  /** アワードのみんなの予想に重ねる自分の提出 */
  awardsMine?: {
    prediction: NbaSeasonAwardsPrediction | null;
    candidates?: readonly NbaAwardCandidate[];
  } | null;
};

type Market =
  | { kind: "standings"; data: SeasonStandingsMarketSnapshot }
  | { kind: "awards"; data: SeasonAwardsMarketSnapshot };

export default function SeasonPredictCrowdToggle({
  kind,
  season,
  language,
  mine,
  crowd,
  initialTab = "mine",
  awardsMine,
}: Props) {
  const pageUi = seasonPredictPageUiCopy(language);
  const [tab, setTab] = useState<"mine" | "crowd">(initialTab);
  const hasCrowd = crowd !== undefined;
  const [state, setState] = useState<"idle" | "loading" | "ready" | "pending">(
    "idle"
  );
  const [market, setMarket] = useState<Market | null>(null);
  const requestedRef = useRef(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("view") === "crowd") {
      setTab("crowd");
    }
  }, []);

  useEffect(() => {
    if (hasCrowd || tab !== "crowd" || requestedRef.current) return;
    requestedRef.current = true;
    setState("loading");
    (async () => {
      let ready = false;
      try {
        const res = await fetchSeasonPredictMarket({ season, kind, preview: true });
        if (kind === "standings" && res.standings) {
          setMarket({ kind, data: res.standings });
          ready = true;
        } else if (kind === "awards" && res.awards) {
          setMarket({ kind, data: res.awards });
          ready = true;
        }
      } catch (e) {
        console.error("fetchSeasonPredictMarket preview", e);
      }
      setState(ready ? "ready" : "pending");
      // 未提出・失敗は次にタブを開いたとき（提出後など）取り直す
      if (!ready) requestedRef.current = false;
    })();
  }, [hasCrowd, kind, season, tab]);

  return (
    <div className="space-y-3">
      <div className="flex border border-cyan-300/35" role="tablist">
        {(["mine", "crowd"] as const).map((id) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(id)}
              className={[
                "flex-1 py-2 text-[12px] font-bold transition",
                active
                  ? "bg-cyan-300/15 text-cyan-50"
                  : "text-white/50 hover:text-white/70",
              ].join(" ")}
            >
              {id === "mine" ? pageUi.myPicksTab : pageUi.crowdTab}
            </button>
          );
        })}
      </div>

      {tab === "mine" ? (
        mine
      ) : hasCrowd ? (
        crowd
      ) : state === "ready" && market ? (
        <div className="space-y-3">
          <p className="text-[12px] text-white/45">{pageUi.marketPreviewNote}</p>
          {market.kind === "standings" ? (
            <NbaSeasonStandingsMarketPanel market={market.data} language={language} />
          ) : (
            <NbaSeasonAwardsMarketPanel
              market={market.data}
              language={language}
              mine={awardsMine}
            />
          )}
        </div>
      ) : state === "pending" ? (
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
            {pageUi.marketPreviewPendingBody}
          </p>
        </div>
      ) : (
        <div className="flex justify-center py-16">
          <CandleChartLoader />
        </div>
      )}
    </div>
  );
}
