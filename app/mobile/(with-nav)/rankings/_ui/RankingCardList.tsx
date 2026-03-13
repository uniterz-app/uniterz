"use client";

import { useMemo } from "react";
import RankingCard from "./RankingCard";
import type { RankingRowWithCountry, MobileMetric } from "../_data/mockRows";

export default function RankingCardList({
  rows,
  metric,
  onTopCountDone,
}: {
  rows: RankingRowWithCountry[];
  metric: MobileMetric;
  onTopCountDone?: () => void;
}) {
  const top3 = useMemo(() => rows.slice(0, 3), [rows]);
  const rest = useMemo(() => rows.slice(3), [rows]);

  return (
    <div className="px-3 pt-3 pb-6">
      <div className="flex flex-col">
        {top3.map((row, index) => (
          <RankingCard
            key={row.uid}
            row={row}
            rank={index + 1}
            metric={metric}
            onCountDone={index === 0 ? onTopCountDone : undefined}
          />
        ))}

        {rest.length > 0 && (
          <div className="pt-2">
            {rest.map((row, index) => (
              <RankingCard
                key={row.uid}
                row={row}
                rank={index + 4}
                metric={metric}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}