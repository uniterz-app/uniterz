"use client";

import { useEffect, useMemo, useState } from "react";
import {
  isPlayoffBracketComplete,
  type SeriesId,
} from "@/lib/playoff-bracket";
import SubmitBracketModal from "@/app/component/common/SubmitBracketModal";
import PlayoffBracketBoard from "@/app/component/predict/PlayoffBracketBoard";
import PlayoffFullBracketMobile from "@/app/component/predict/PlayoffFullBracketMobile";
import { auth } from "@/lib/firebase";
import {
  createPlayoffBracket,
  loadPlayoffBracket,
  type BracketState,
} from "@/lib/playoff-bracket-firestore";
import { getSeriesTeams, pruneBracket } from "@/lib/playoff-bracket-utils";
import { buildPlayoffDisplayData } from "@/lib/playoff-bracket-display";

type Team = {
  code: string;
  seed: number;
};

const EAST_R1: { id: SeriesId; teams: [Team, Team] }[] = [
  { id: "R1_E1", teams: [{ code: "BOS", seed: 1 }, { code: "MIA", seed: 8 }] },
  { id: "R1_E2", teams: [{ code: "MIL", seed: 2 }, { code: "IND", seed: 7 }] },
  { id: "R1_E3", teams: [{ code: "NYK", seed: 3 }, { code: "PHI", seed: 6 }] },
  { id: "R1_E4", teams: [{ code: "CLE", seed: 4 }, { code: "ORL", seed: 5 }] },
];

const WEST_R1: { id: SeriesId; teams: [Team, Team] }[] = [
  { id: "R1_W1", teams: [{ code: "OKC", seed: 1 }, { code: "NOP", seed: 8 }] },
  { id: "R1_W2", teams: [{ code: "DEN", seed: 2 }, { code: "LAL", seed: 7 }] },
  { id: "R1_W3", teams: [{ code: "MIN", seed: 3 }, { code: "PHX", seed: 6 }] },
  { id: "R1_W4", teams: [{ code: "LAC", seed: 4 }, { code: "DAL", seed: 5 }] },
];

export default function PlayoffBracketPredict() {
  const [bracket, setBracket] = useState<BracketState>({});

  const [showR2E1, setShowR2E1] = useState(false);
  const [showR2E2, setShowR2E2] = useState(false);
  const [showR2W1, setShowR2W1] = useState(false);
  const [showR2W2, setShowR2W2] = useState(false);
  const [showCFE, setShowCFE] = useState(false);
  const [showCFW, setShowCFW] = useState(false);
  const [showFinals, setShowFinals] = useState(false);

  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [savedBracketLoading, setSavedBracketLoading] = useState(true);
  const [hasSubmittedBracket, setHasSubmittedBracket] = useState(false);
  const [canEditBracket, setCanEditBracket] = useState(true);

  const isComplete = isPlayoffBracketComplete(bracket as any);

  useEffect(() => {
    let cancelled = false;

    async function loadSavedBracket() {
      const me = auth.currentUser;

      if (!me) {
        if (cancelled) return;
        setHasSubmittedBracket(false);
        setCanEditBracket(true);
        setSavedBracketLoading(false);
        return;
      }

      try {
        const data = await loadPlayoffBracket(me.uid);

        if (!data) {
          if (cancelled) return;
          setHasSubmittedBracket(false);
          setCanEditBracket(true);
          setSavedBracketLoading(false);
          return;
        }

        if (cancelled) return;

        setBracket(data.bracket ?? {});
        setHasSubmittedBracket(true);
        setCanEditBracket(true);
        setSavedBracketLoading(false);
      } catch (e) {
        if (cancelled) return;
        console.error("failed to load playoff bracket", e);
        setHasSubmittedBracket(false);
        setCanEditBracket(true);
        setSavedBracketLoading(false);
      }
    }

    loadSavedBracket();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit() {
    const me = auth.currentUser;

    if (!me) {
      alert("ログインが必要です");
      return;
    }

    if (!isComplete || submitting) return;

    try {
      setSubmitting(true);

      const existing = await loadPlayoffBracket(me.uid);

      if (existing) {
        alert("ブラケットはすでに提出済みです");
        setHasSubmittedBracket(true);
        setSubmitOpen(false);
        return;
      }

      await createPlayoffBracket(me.uid, bracket, "2026");

      setHasSubmittedBracket(true);
      setSubmitOpen(false);
      alert("ブラケットを提出しました");
    } catch (e: any) {
      alert(e?.message ?? "提出に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  function setWinner(seriesId: SeriesId, team: string) {
    if (!canEditBracket) return;

    setBracket((prev) => {
      const currentWinner = prev[seriesId]?.winner;
      const nextWinner = currentWinner === team ? undefined : team;

      const next: BracketState = {
        ...prev,
        [seriesId]: {
          ...prev[seriesId],
          winner: nextWinner,
        },
      };

      return pruneBracket(next);
    });
  }

  function setGames(seriesId: SeriesId, games: number) {
    if (!canEditBracket) return;

    setBracket((prev) => {
      const currentGames = prev[seriesId]?.games;

      return {
        ...prev,
        [seriesId]: {
          ...prev[seriesId],
          games: currentGames === games ? undefined : games,
        },
      };
    });
  }

  const teamMap = useMemo(() => {
    const map: Record<string, Team> = {};

    [...EAST_R1, ...WEST_R1].forEach((series) => {
      series.teams.forEach((team) => {
        map[team.code] = team;
      });
    });

    return map;
  }, []);

  const eastR2Top = getSeriesTeams(bracket, teamMap, "R1_E1", "R1_E2");
  const eastR2Bottom = getSeriesTeams(bracket, teamMap, "R1_E3", "R1_E4");
  const westR2Top = getSeriesTeams(bracket, teamMap, "R1_W1", "R1_W2");
  const westR2Bottom = getSeriesTeams(bracket, teamMap, "R1_W3", "R1_W4");

  const eastCF = getSeriesTeams(bracket, teamMap, "R2_E1", "R2_E2");
  const westCF = getSeriesTeams(bracket, teamMap, "R2_W1", "R2_W2");
  const finalsTeams = getSeriesTeams(bracket, teamMap, "CF_E", "CF_W");

  const displayData = useMemo(() => buildPlayoffDisplayData(bracket), [bracket]);

  useEffect(() => {
    if (eastR2Top) {
      const id = window.setTimeout(() => setShowR2E1(true), 20);
      return () => window.clearTimeout(id);
    }
    setShowR2E1(false);
  }, [eastR2Top]);

  useEffect(() => {
    if (eastR2Bottom) {
      const id = window.setTimeout(() => setShowR2E2(true), 20);
      return () => window.clearTimeout(id);
    }
    setShowR2E2(false);
  }, [eastR2Bottom]);

  useEffect(() => {
    if (westR2Top) {
      const id = window.setTimeout(() => setShowR2W1(true), 20);
      return () => window.clearTimeout(id);
    }
    setShowR2W1(false);
  }, [westR2Top]);

  useEffect(() => {
    if (westR2Bottom) {
      const id = window.setTimeout(() => setShowR2W2(true), 20);
      return () => window.clearTimeout(id);
    }
    setShowR2W2(false);
  }, [westR2Bottom]);

  useEffect(() => {
    if (eastCF) {
      const id = window.setTimeout(() => setShowCFE(true), 20);
      return () => window.clearTimeout(id);
    }
    setShowCFE(false);
  }, [eastCF]);

  useEffect(() => {
    if (westCF) {
      const id = window.setTimeout(() => setShowCFW(true), 20);
      return () => window.clearTimeout(id);
    }
    setShowCFW(false);
  }, [westCF]);

  useEffect(() => {
    if (finalsTeams) {
      const id = window.setTimeout(() => setShowFinals(true), 20);
      return () => window.clearTimeout(id);
    }
    setShowFinals(false);
  }, [finalsTeams]);

  return (
    <div className="min-h-screen bg-[#050b14] text-white">
      <div className="border-b border-white/10 px-4 pt-4">
        <div className="flex items-center justify-center overflow-x-auto whitespace-nowrap pb-4 text-[18px] font-semibold">
          NBA Playoff Bracket
        </div>
      </div>

      <PlayoffBracketBoard
        bracket={bracket}
        eastR1={EAST_R1}
        westR1={WEST_R1}
        eastR2Top={eastR2Top}
        eastR2Bottom={eastR2Bottom}
        westR2Top={westR2Top}
        westR2Bottom={westR2Bottom}
        eastCF={eastCF}
        westCF={westCF}
        finalsTeams={finalsTeams}
        showR2E1={showR2E1}
        showR2E2={showR2E2}
        showR2W1={showR2W1}
        showR2W2={showR2W2}
        showCFE={showCFE}
        showCFW={showCFW}
        showFinals={showFinals}
        isComplete={isComplete}
        hasSubmittedBracket={hasSubmittedBracket}
        savedBracketLoading={savedBracketLoading}
        canEditBracket={canEditBracket}
        onSelectWinner={setWinner}
        onSelectGames={setGames}
        onSubmitClick={() => setSubmitOpen(true)}
      />

      <SubmitBracketModal
        open={submitOpen}
        onClose={() => {
          if (submitting) return;
          setSubmitOpen(false);
        }}
        onConfirm={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}