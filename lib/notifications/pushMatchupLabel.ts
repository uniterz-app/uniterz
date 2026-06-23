import { teamIdToCountryName, teamIdToWcCountry } from "@/lib/wc/wcCountry";

export type PushLanguage = "ja" | "en";

export type PushMatchupInput = {
  homeLabel: string;
  awayLabel: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number;
  awayScore?: number;
};

function resolvePushSideLabel(
  label: string,
  teamId: string | undefined,
  language: PushLanguage
): string {
  if (teamId) {
    const localized = teamIdToCountryName(teamId, language);
    if (localized) {
      if (language === "en" && teamIdToWcCountry(teamId)) {
        return localized.toUpperCase();
      }
      return localized;
    }
  }
  const trimmed = label.trim() || "?";
  return language === "en" ? trimmed.toUpperCase() : trimmed;
}

/** OS 通知用 — 言語ごとの対戦表記（フォントは OS 任せ、字義・区切りをブランド寄せ） */
export function formatPushMatchupLabel(
  input: PushMatchupInput,
  language: PushLanguage
): string {
  const home = resolvePushSideLabel(input.homeLabel, input.homeTeamId, language);
  const away = resolvePushSideLabel(input.awayLabel, input.awayTeamId, language);

  if (
    typeof input.homeScore === "number" &&
    typeof input.awayScore === "number"
  ) {
    const score = `${input.homeScore}–${input.awayScore}`;
    return language === "ja"
      ? `${home} ${input.homeScore}-${input.awayScore} ${away}`
      : `${home} ${score} ${away}`;
  }

  if (language === "ja") {
    return `${home} 対 ${away}`;
  }

  return `${home} · ${away}`;
}

export function resolvePushTeamId(side: unknown): string | undefined {
  if (side && typeof side === "object") {
    const teamId = (side as { teamId?: unknown }).teamId;
    if (typeof teamId === "string" && teamId.trim()) return teamId.trim();
  }
  return undefined;
}
