// lib/conferenceGradient.ts
export function conferenceGradient(conference: "EAST" | "WEST") {
  if (conference === "EAST") {
    return "linear-gradient(90deg, rgba(56,189,248,0.35), rgba(14,165,233,0.15))";
  }
  return "linear-gradient(90deg, rgba(248,113,113,0.35), rgba(239,68,68,0.15))";
}
