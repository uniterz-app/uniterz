import { RANKINGS_NOISE_TEXTURE_URL } from "@/lib/rankings/rankingsCyberTheme";

/** 微細スキャンライン */
export function RankingsScanTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.022) 0px, rgba(255,255,255,0.022) 1px, transparent 1px, transparent 3px)",
      }}
    />
  );
}

/** ノイズ質感 */
export function RankingsNoiseTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1]"
      style={{
        backgroundImage: RANKINGS_NOISE_TEXTURE_URL,
        backgroundRepeat: "repeat",
        opacity: 0.04,
      }}
    />
  );
}

type GlowWireProps = {
  /** compact = 一覧行（左上ブラケットのみ） */
  variant?: "full" | "compact";
};

/** 上辺・左辺のシアン配線（MyRankCard 由来） */
export function RankingsGlowWireFrame({ variant = "full" }: GlowWireProps) {
  const wire =
    "linear-gradient(90deg, rgba(140,240,255,0.95), rgba(34,211,238,0.75), rgba(34,211,238,0.2))";
  const wireV =
    "linear-gradient(180deg, rgba(140,240,255,0.95), rgba(34,211,238,0.7), rgba(34,211,238,0.12))";
  const glow = "0 0 10px rgba(34,211,238,0.7), 0 0 22px rgba(34,211,238,0.22)";

  return (
    <div className="pointer-events-none absolute inset-0 z-[25]">
      <div
        className="absolute left-0 right-0 top-0 h-[1.5px]"
        style={{ background: wire, boxShadow: glow }}
      />
      <div
        className="absolute bottom-0 left-0 top-0 w-[1.5px]"
        style={{ background: wireV, boxShadow: glow }}
      />
      <div
        className="absolute left-0 top-0 h-3.5 w-3.5 border-l-2 border-t-2"
        style={{
          borderColor: "rgba(140,240,255,0.92)",
          boxShadow: "0 0 10px rgba(34,211,238,0.55)",
        }}
      />
      {variant === "full" ? (
        <div
          className="absolute bottom-2 right-2 h-3 w-3 border-b border-r"
          style={{
            borderColor: "rgba(140,240,255,0.45)",
            boxShadow: "0 0 8px rgba(34,211,238,0.25)",
          }}
        />
      ) : null}
    </div>
  );
}

type MedalBracketProps = {
  rank: 1 | 2 | 3;
  bracketColor: string;
  bracketGlow: string;
};

/** Top3 用 — メダル色の四隅ブラケット（特別感） */
export function RankingsPodiumMedalBrackets({
  rank,
  bracketColor,
  bracketGlow,
}: MedalBracketProps) {
  return (
    <div className="pointer-events-none absolute inset-0 z-[26]">
      <div
        className="absolute left-0 top-0 h-4 w-4 border-l-[2px] border-t-[2px]"
        style={{ borderColor: bracketColor, boxShadow: `0 0 8px ${bracketGlow}` }}
      />
      <div
        className="absolute right-0 top-0 h-4 w-4 border-r-[2px] border-t-[2px]"
        style={{ borderColor: bracketColor, boxShadow: `0 0 8px ${bracketGlow}` }}
      />
      <div
        className="absolute bottom-0 left-0 h-4 w-4 border-b-[2px] border-l-[2px]"
        style={{ borderColor: bracketColor, boxShadow: `0 0 8px ${bracketGlow}` }}
      />
      <div
        className="absolute bottom-0 right-0 h-4 w-4 border-b-[2px] border-r-[2px]"
        style={{ borderColor: bracketColor, boxShadow: `0 0 8px ${bracketGlow}` }}
      />
      {rank === 1 ? (
        <div
          className="pointer-events-none absolute left-3 right-3 top-0 h-px"
          style={{
            background: `linear-gradient(90deg, transparent, ${bracketColor}, transparent)`,
            opacity: 0.55,
          }}
        />
      ) : null}
    </div>
  );
}
