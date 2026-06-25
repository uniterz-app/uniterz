"use client";

import CountryFlag from "@/app/component/games/CountryFlag";
import {
  WC_TREE_FLAG_GAP,
  WC_TREE_FLAG_H,
  WC_TREE_FLAG_W,
  WC_TREE_SLOT_H,
  WC_TREE_SLOT_W,
} from "@/lib/wc/wc-bracket-tree-layout";

type Slot = { teamId: string | null; label: string };

type Props = {
  home: Slot;
  away: Slot;
  pickedWinner: string | null;
};

function FlagDot({
  teamId,
  selected = false,
  dimmed = false,
}: {
  teamId: string;
  selected?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div
      className={[
        "shrink-0 overflow-hidden rounded-[2px]",
        selected ? "ring-2 ring-inset ring-cyan-400/90" : "",
        dimmed ? "opacity-35" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ width: WC_TREE_FLAG_W, height: WC_TREE_FLAG_H }}
    >
      <CountryFlag
        teamId={teamId}
        variant="inline"
        className="block! h-full! w-full! ring-0!"
      />
    </div>
  );
}

export { WC_TREE_SLOT_W as WC_TREE_FLAG_PAIR_W, WC_TREE_SLOT_H as WC_TREE_FLAG_PAIR_H };

export function WcBracketTreeWinnerFlag({ teamId }: { teamId: string }) {
  return (
    <div
      className="shrink-0 overflow-hidden rounded-[2px] ring-2 ring-inset ring-cyan-400/90"
      style={{ width: WC_TREE_FLAG_W, height: WC_TREE_FLAG_H }}
    >
      <CountryFlag
        teamId={teamId}
        variant="inline"
        className="block! h-full! w-full! ring-0!"
      />
    </div>
  );
}

export default function WcBracketTreeFlagPair({
  home,
  away,
  pickedWinner,
}: Props) {
  const empty = !home.teamId && !away.teamId;

  if (empty) {
    return (
      <div
        className="border border-dashed border-cyan-400/15"
        style={{ width: WC_TREE_SLOT_W, height: WC_TREE_SLOT_H }}
        aria-hidden
      />
    );
  }

  return (
    <div
      className="flex flex-col items-center"
      style={{
        width: WC_TREE_SLOT_W,
        height: WC_TREE_SLOT_H,
        gap: WC_TREE_FLAG_GAP,
      }}
    >
      {home.teamId ? (
        <FlagDot
          teamId={home.teamId}
          selected={pickedWinner === home.teamId}
          dimmed={Boolean(pickedWinner && pickedWinner !== home.teamId)}
        />
      ) : (
        <span
          className="block shrink-0"
          style={{ width: WC_TREE_FLAG_W, height: WC_TREE_FLAG_H }}
          aria-hidden
        />
      )}
      {away.teamId ? (
        <FlagDot
          teamId={away.teamId}
          selected={pickedWinner === away.teamId}
          dimmed={Boolean(pickedWinner && pickedWinner !== away.teamId)}
        />
      ) : (
        <span
          className="block shrink-0"
          style={{ width: WC_TREE_FLAG_W, height: WC_TREE_FLAG_H }}
          aria-hidden
        />
      )}
    </div>
  );
}
