// lib/team-symbol.ts

export function teamSymbol(teamId: string): string {
  const colors: Record<string, string> = {
    lakers: "#FDB927",
    warriors: "#1D428A",
    celtics: "#007A33",
    bulls: "#CE1141",
    heat: "#98002E",
    suns: "#E56020",
    spurs: "#C4CED4",
    nuggets: "#0E2240",
    thunder: "#007AC1",
    rockets: "#CE1141",
    timberwolves: "#236192",
    blazers: "#E03A3E",
    clippers: "#1D428A",
    kings: "#5A2D81",
    mavericks: "#00538C",
    grizzlies: "#5D76A9",
    pelicans: "#0C2340",
    jazz: "#002B5C",
    nets: "#000000",
    knicks: "#F58426",
    sixers: "#006BB6",
    raptors: "#CE1141",
    hawks: "#E03A3E",
    cavaliers: "#860038",
    pistons: "#C8102E",
    pacers: "#002D62",
    magic: "#0077C0",
    hornets: "#1D1160",
    wizards: "#002B5C",
  };

  const c = colors[teamId] ?? "#ffffff";

  return `
    radial-gradient(
      circle at 30% 50%,
      ${c}88 0%,
      ${c}55 35%,
      ${c}22 55%,
      transparent 70%
    )
  `;
}
