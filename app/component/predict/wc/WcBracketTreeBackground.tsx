/** トーナメント表 — 参考 HUD 背景（中央の円形 HUD なし） */
export default function WcBracketTreeBackground() {
  return (
    <div className="wc-bracket-tree-bg" aria-hidden>
      <div className="wc-bracket-tree-bg__base" />
      <div className="wc-bracket-tree-bg__mist wc-bracket-tree-bg__mist--top" />
      <div className="wc-bracket-tree-bg__mist wc-bracket-tree-bg__mist--core" />
      <div className="wc-bracket-tree-bg__mist wc-bracket-tree-bg__mist--bottom" />
      <div className="wc-bracket-tree-bg__vignette" />
      <div className="wc-bracket-tree-bg__grid" />

      <svg
        className="wc-bracket-tree-bg__arcs"
        viewBox="0 0 600 780"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="wc-tree-arc-cyan" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(34,211,238,0)" />
            <stop offset="22%" stopColor="rgba(103,232,249,0.92)" />
            <stop offset="50%" stopColor="rgba(165,243,252,1)" />
            <stop offset="78%" stopColor="rgba(103,232,249,0.92)" />
            <stop offset="100%" stopColor="rgba(34,211,238,0)" />
          </linearGradient>
          <linearGradient id="wc-tree-arc-green" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(132,204,22,0)" />
            <stop offset="22%" stopColor="rgba(163,230,53,0.88)" />
            <stop offset="50%" stopColor="rgba(190,242,100,1)" />
            <stop offset="78%" stopColor="rgba(132,204,22,0.88)" />
            <stop offset="100%" stopColor="rgba(132,204,22,0)" />
          </linearGradient>
        </defs>
        {/* 円の上半分アークのみ（点線リング・数字は入れない） */}
        <path
          d="M 118 248 A 182 182 0 0 1 482 248"
          fill="none"
          stroke="url(#wc-tree-arc-cyan)"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.72"
        />
        <path
          d="M 132 532 A 168 168 0 0 0 468 532"
          fill="none"
          stroke="url(#wc-tree-arc-green)"
          strokeWidth="5"
          strokeLinecap="round"
          opacity="0.78"
        />
      </svg>

      <div className="wc-bracket-tree-bg__top">
        <div className="wc-bracket-tree-bg__top-line" />
        <div className="wc-bracket-tree-bg__top-copy">
          <span className="wc-bracket-tree-bg__title">GRID</span>
          <span className="wc-bracket-tree-bg__sub">SYSTEM REVISION 4.0.2</span>
        </div>
        <div className="wc-bracket-tree-bg__top-line" />
      </div>

      <div className="wc-bracket-tree-bg__bottom">
        <div className="wc-bracket-tree-bg__bottom-row">
          <span className="wc-bracket-tree-bg__label">SUCCESS</span>
          <span className="wc-bracket-tree-bg__meter">
            <span className="wc-bracket-tree-bg__meter-fill" style={{ width: "82%" }} />
          </span>
          <span className="wc-bracket-tree-bg__pct">82%</span>
        </div>
        <div className="wc-bracket-tree-bg__bottom-row">
          <span className="wc-bracket-tree-bg__label wc-bracket-tree-bg__label--active">
            READY
          </span>
          <span className="wc-bracket-tree-bg__meter">
            <span
              className="wc-bracket-tree-bg__meter-fill wc-bracket-tree-bg__meter-fill--cyan"
              style={{ width: "64%" }}
            />
          </span>
          <span className="wc-bracket-tree-bg__pct">64%</span>
        </div>
        <div className="wc-bracket-tree-bg__bottom-row">
          <span className="wc-bracket-tree-bg__label">RESILIENCE</span>
          <span className="wc-bracket-tree-bg__meter">
            <span className="wc-bracket-tree-bg__meter-fill" style={{ width: "91%" }} />
          </span>
          <span className="wc-bracket-tree-bg__pct">91%</span>
        </div>
      </div>
    </div>
  );
}
