import { normalizeLeague } from "../../../../../lib/leagues";
import CountryFlagNative, { type CountryFlagVariant } from "./CountryFlagNative";
import JerseyMarkAdaptive from "./JerseyMarkAdaptive";
import { rawTeamIdFromGameSide } from "./resolveNativeSeriesStanding";

type Palette = { primary: string; secondary: string };

type MatchTeamMarkNativeProps = {
  leagueRaw: unknown;
  side: unknown;
  palette: Palette;
  /** ジャージ時のサイズ（国旗は variant で決まる） */
  jerseySize?: number;
  flagVariant?: CountryFlagVariant;
};

/** リーグに応じてジャージまたは WC 国旗を表示（Web `MatchCard` 相当） */
export default function MatchTeamMarkNative({
  leagueRaw,
  side,
  palette,
  jerseySize = 62,
  flagVariant = "card",
}: MatchTeamMarkNativeProps) {
  if (normalizeLeague(leagueRaw) === "wc") {
    const teamId = rawTeamIdFromGameSide(side);
    return <CountryFlagNative teamId={teamId} variant={flagVariant} />;
  }
  return (
    <JerseyMarkAdaptive
      accent={palette.primary}
      accentEnd={palette.secondary}
      size={jerseySize}
    />
  );
}
