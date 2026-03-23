// lib/rankings/cardTone.ts

export function cardTone(rank: number) {
  if (rank === 1) {
    return {
      border: "rgba(255,255,255,0.18)",
      outerGlow: "rgba(255,215,90,0.07)",
    };
  }
  if (rank === 2) {
    return {
      border: "rgba(255,255,255,0.18)",
      outerGlow: "rgba(230,235,245,0.06)",
    };
  }
  if (rank === 3) {
    return {
      border: "rgba(255,255,255,0.18)",
      outerGlow: "rgba(205,127,50,0.055)",
    };
  }
  return {
    border: "rgba(255,255,255,0.14)",
    outerGlow: "rgba(255,255,255,0.035)",
  };
}