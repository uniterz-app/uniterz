import { resolveLocalizedLang, type LocalizedLang } from "../reports/localize";

export type PushLanguage = LocalizedLang;

export type PushMatchupInput = {
  homeLabel: string;
  awayLabel: string;
  homeTeamId?: string;
  awayTeamId?: string;
  homeScore?: number;
  awayScore?: number;
};

function matchupSeparator(language: LocalizedLang): string {
  switch (language) {
    case "ja":
      return " 対 ";
    case "zh":
      return " 对 ";
    case "ko":
      return " vs ";
    default:
      return " · ";
  }
}

export function formatPushMatchupLabel(
  input: PushMatchupInput,
  language: LocalizedLang | string
): string {
  const lang = resolveLocalizedLang(language);
  const home = input.homeLabel.trim() || "?";
  const away = input.awayLabel.trim() || "?";
  const sep = matchupSeparator(lang);

  if (
    typeof input.homeScore === "number" &&
    typeof input.awayScore === "number"
  ) {
    return `${home} ${input.homeScore}-${input.awayScore} ${away}`;
  }

  return `${home}${sep}${away}`;
}

export function resolvePushTeamId(side: unknown): string | undefined {
  if (side && typeof side === "object") {
    const teamId = (side as { teamId?: unknown }).teamId;
    if (typeof teamId === "string" && teamId.trim()) return teamId.trim();
  }
  return undefined;
}
