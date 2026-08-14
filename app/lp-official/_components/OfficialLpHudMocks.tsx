import OfficialLpRankingScreen from "./OfficialLpRankingScreen";

/** 実機スクショ前の HUD シルエット。チーム名・ロゴは使わない。 */

export function OfficialLpHudSchedule() {
  return (
    <div className="olp-hud olp-metric">
      <div className="olp-hud-top">
        <span>GAMES</span>
        <span>NBA</span>
      </div>
      {["HOME  ·  AWAY", "HOME  ·  AWAY", "HOME  ·  AWAY"].map((row, i) => (
        <div key={row + i} className="olp-match">
          <div className="olp-match-row">
            <span>HOME</span>
            <span className="olp-vs">VS</span>
            <span>AWAY</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export function OfficialLpHudPredict() {
  return (
    <div className="olp-hud olp-metric">
      <div className="olp-hud-top">
        <span>PREDICT</span>
        <span>LOCK BEFORE TIP</span>
      </div>
      <div className="olp-match">
        <div className="olp-match-row">
          <span>HOME</span>
          <span className="olp-vs">VS</span>
          <span>AWAY</span>
        </div>
      </div>
      <div className="olp-predict-grid">
        <span>WIN</span>
        <span>WIN</span>
      </div>
      <p className="mt-4 text-center text-[11px] tracking-[0.14em] text-[#8b97ad]">
        SCORE INPUT
      </p>
    </div>
  );
}

export function OfficialLpHudRanking() {
  return (
    <div className="olp-ranking-fit">
      <div className="olp-ranking-fit-inner">
        <OfficialLpRankingScreen notchPad maxRows={8} />
      </div>
    </div>
  );
}
