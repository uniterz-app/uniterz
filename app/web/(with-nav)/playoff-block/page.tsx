"use client";

import PlayoffFullBracketWeb from "@/app/component/predict/PlayoffFullBracketWeb";

export default function PlayoffBracketBlockPreviewPage() {
  return (
    <main className="min-h-screen bg-[#020611] px-8 py-10 flex justify-center">
      <PlayoffFullBracketWeb
        league="nba"
        score={84}

        leftRound1={[
          { teamId: "nba-cavaliers", wins: 4 },
          { teamId: "nba-heat", wins: 1 },

          { teamId: "nba-celtics", wins: 4 },
          { teamId: "nba-hawks", wins: 2 },

          { teamId: "nba-knicks", wins: 4 },
          { teamId: "nba-pistons", wins: 3 },

          { teamId: "nba-pacers", wins: 4 },
          { teamId: "nba-bucks", wins: 2 },
        ]}

        leftRound2={[
          { teamId: "nba-cavaliers", wins: 4 },
          { teamId: "nba-celtics", wins: 3 },

          { teamId: "nba-knicks", wins: 4 },
          { teamId: "nba-pacers", wins: 2 },
        ]}

        leftRound3={[
          { teamId: "nba-celtics", wins: 4 },
          { teamId: "nba-knicks", wins: 2 },
        ]}

        leftRound4={[
          { teamId: "nba-celtics", wins: 4 },
        ]}

        rightRound1={[
          { teamId: "nba-thunder", wins: 4 },
          { teamId: "nba-grizzlies", wins: 0 },

          { teamId: "nba-rockets", wins: 1 },
          { teamId: "nba-warriors", wins: 4 },

          { teamId: "nba-lakers", wins: 4 },
          { teamId: "nba-timberwolves", wins: 3 },

          { teamId: "nba-nuggets", wins: 4 },
          { teamId: "nba-clippers", wins: 2 },
        ]}

        rightRound2={[
          { teamId: "nba-thunder", wins: 4 },
          { teamId: "nba-warriors", wins: 2 },

          { teamId: "nba-lakers", wins: 4 },
          { teamId: "nba-nuggets", wins: 3 },
        ]}

        rightRound3={[
          { teamId: "nba-thunder", wins: 4 },
          { teamId: "nba-lakers", wins: 2 },
        ]}

        rightRound4={[
          { teamId: "nba-thunder", wins: 3 },
        ]}

        champion={{
          teamId: "nba-celtics",
        }}
      />
    </main>
  );
}