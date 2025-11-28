// app/component/games/ScheduleList.tsx
"use client";

import MatchCard from "./MatchCard";
import { toMatchCardProps } from "@/lib/games/transform";
import { db } from "@/lib/firebase"; // ★ 追加
import { doc, getDoc } from "firebase/firestore"; // ★ 追加

export type GameItemRaw = any;

/* ▼ Firestore の値ゆれを吸収（あなたの元コードそのまま） */
const toDate = (v: any): Date | null => {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate();
  if (typeof v === "number") return new Date(v);
  return null;
};

const toScore = (g: any): { home: number; away: number } | null => {
  if (g?.score && Number.isFinite(g.score.home) && Number.isFinite(g.score.away)) {
    return g.score;
  }
  if (
    g?.finalScore &&
    Number.isFinite(g.finalScore.home) &&
    Number.isFinite(g.finalScore.away)
  ) {
    return { home: g.finalScore.home, away: g.finalScore.away };
  }
  if (Number.isFinite(g?.homeScore) && Number.isFinite(g?.awayScore)) {
    return { home: g.homeScore, away: g.awayScore };
  }
  return null;
};

/* ▼ ★ 追加：teams/{teamId} から最新成績を取得 */
async function fetchTeamRecord(teamId?: string) {
  if (!teamId) return { w: 0, d: 0, l: 0 };
  const snap = await getDoc(doc(db, "teams", teamId));
  if (!snap.exists()) return { w: 0, d: 0, l: 0 };
  return snap.data().record ?? { w: 0, d: 0, l: 0 };
}

export default function ScheduleList({
  games,
  dense = false,
}: {
  games: GameItemRaw[];
  dense?: boolean;
}) {
  if (!games?.length) {
    return (
      <div className="text-center text-white/70 py-10 border border-dashed border-white/10 rounded-xl">
        この日に試合はありません
      </div>
    );
  }

  return (
    <div className="grid gap-6 px-4 md:px-6 lg:px-8">
      {games.map((g: any) => {
        // ★ 追加：home / away の record を取得
        const homeTeamId = g?.home?.teamId;
        const awayTeamId = g?.away?.teamId;

        // ★ React では同期取得できないので Promise を仕込む
        //   → MatchCard 側で Suspense 無しなので "とりあえず初期値0-0-0" で描画
        //   → その後 Firestore の record を差し替える方式にするなら useEffect が必要
        //   ここでは最小限：record を上書きするための "loader" を入れる
        const homeTeam = {
          ...g.home,
          recordLoader: fetchTeamRecord(homeTeamId), // ★ 追加
        };
        const awayTeam = {
          ...g.away,
          recordLoader: fetchTeamRecord(awayTeamId), // ★ 追加
        };

       const rawProps = {
  id: String(g.id),
  league: g.league,
  venue: g.venue,
  roundLabel: g.roundLabel,
  startAtJst: toDate(g.startAtJst ?? g.startAt),
  status: g.status,

  // この時点で recordLoader を保持
  home: homeTeam,
  away: awayTeam,

  score: toScore(g),
  liveMeta: g.liveMeta,
  finalMeta: g.finalMeta,
};

// toMatchCardProps を通した後でも recordLoader を残す
const props = {
  ...toMatchCardProps(rawProps, { dense }),
  home: { ...toMatchCardProps(rawProps, { dense }).home, recordLoader: homeTeam.recordLoader },
  away: { ...toMatchCardProps(rawProps, { dense }).away, recordLoader: awayTeam.recordLoader },
};


        return <MatchCard key={props.id} {...props} />;
      })}
    </div>
  );
}
