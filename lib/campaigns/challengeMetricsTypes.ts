import type { PickupScoreRow } from "./aggregatePickupScores";
import type {
  December2026CostInputs,
  December2026PlannedPhysical,
} from "./december2026Campaign";

export type ChallengeBoard = {
  id: string;
  labelJa: string;
  status: string;
  gameCount: number;
  settledCount: number;
  participantCount: number;
  top: Array<PickupScoreRow & { displayName?: string }>;
};

export type ChallengeAdMobSlice = {
  completions: number;
  uniqueUids: number;
};

export type ChallengeMetricsPayload = {
  ok: true;
  asOfMs: number;
  monthKey: string;
  boards: {
    monthly: ChallengeBoard;
    cup: ChallengeBoard;
    christmas: ChallengeBoard;
  };
  admob: {
    noteJa: string;
    proPick: ChallengeAdMobSlice;
    tradeBuzz: ChallengeAdMobSlice;
    yenActual: number;
  };
  units: {
    plannedIfFull: number;
    granted: number;
    yenPerUnit: number;
    yenActual: number;
  };
  physical: {
    planned: December2026PlannedPhysical;
    costs: December2026CostInputs;
    yenActual: number;
  };
  notice: {
    id: string;
    published: boolean;
    publishedAtMs: number | null;
  };
};
