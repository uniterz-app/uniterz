type Team = {
  id: string;
  name: string;
  conference: "east" | "west";
  wins: number;
  losses: number;
};


type Props = {
  team: Team;
  attackPct: number;
  defensePct: number;
};

export default function TeamStatsBlocks({
  team,
  attackPct,
  defensePct,
}: Props) {
  return null;
}

