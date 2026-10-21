"use client";

import {
  CYBER_TAB_CYAN,
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import { nbaTopScorerSegmentLabel } from "@/lib/nba/topScorer";
import type { NbaTopScorerCandidate, NbaTopScorerPick } from "@/lib/nba/topScorer";

/** まとめて入力。両チーム合わせた得点上位4人を斜めセグメントで */
export default function BatchTopScorerSegments({
  players,
  loading,
  colorForTeam,
  selected,
  onSelect,
}: {
  players: NbaTopScorerCandidate[];
  loading: boolean;
  colorForTeam?: (teamId: string) => string;
  selected: NbaTopScorerPick | null;
  onSelect: (pick: NbaTopScorerPick | null) => void;
}) {
  if (!loading && players.length === 0) return null;
  const slots =
    players.length > 0
      ? players
      : Array.from({ length: 4 }, () => null);
  return (
    <div className="mt-2.5" onClick={(event) => event.stopPropagation()}>
      <CyberSlantedTabBar fill>
        {slots.map((player, index) => {
          if (!player) {
            return (
              <CyberSlantedTab
                key={`slot-${index}`}
                label="—"
                active={false}
                compact
                onClick={() => {}}
              />
            );
          }
          const on =
            selected?.playerId === player.playerId &&
            selected.teamId === player.teamId;
          const teamColor = colorForTeam?.(player.teamId) ?? CYBER_TAB_CYAN;
          return (
            <CyberSlantedTab
              key={`${player.teamId}:${player.playerId}`}
              label={nbaTopScorerSegmentLabel(player.name)}
              active={on}
              compact
              theme={{
                accent: CYBER_TAB_CYAN,
                inactiveText: CYBER_TAB_CYAN,
                inactiveBorder: teamColor,
              }}
              onClick={() =>
                onSelect(
                  on
                    ? null
                    : {
                        playerId: player.playerId,
                        teamId: player.teamId,
                        name: player.name,
                      }
                )
              }
            />
          );
        })}
      </CyberSlantedTabBar>
    </div>
  );
}
