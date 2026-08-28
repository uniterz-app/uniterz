import { normalizeLeague } from "../../../../../lib/leagues";
import type { JerseyDotDensity } from "../../../../../lib/jersey/jerseyDensity";
import CountryFlagNative, { type CountryFlagVariant } from "./CountryFlagNative";
import DeferredJerseyMarkNative from "./DeferredJerseyMarkNative";
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
  /** 試合一覧など多数並ぶ面は coarse（既定） */
  density?: JerseyDotDensity;
  /**
   * ScrollVisibilityProvider 配下で画面外の Skia を載せずサイズだけ確保。
   * Provider が無い画面では常に描画（既定 true でも安全）。
   */
  deferOffscreen?: boolean;
};

/** リーグに応じてジャージまたは WC 国旗を表示（Web `MatchCard` 相当） */
export default function MatchTeamMarkNative({
  leagueRaw,
  side,
  palette,
  jerseySize = 62,
  flagVariant = "card",
  density = "coarse",
  deferOffscreen = true,
}: MatchTeamMarkNativeProps) {
  if (normalizeLeague(leagueRaw) === "wc") {
    const teamId = rawTeamIdFromGameSide(side);
    return <CountryFlagNative teamId={teamId} variant={flagVariant} />;
  }

  if (!deferOffscreen) {
    return (
      <JerseyMarkAdaptive
        accent={palette.primary}
        accentEnd={palette.secondary}
        size={jerseySize}
        density={density}
      />
    );
  }

  return (
    <DeferredJerseyMarkNative
      accent={palette.primary}
      accentEnd={palette.secondary}
      size={jerseySize}
      density={density}
    />
  );
}
