"use client";

import type { CyberBgLabVariant } from "@/lib/ui/cyberBgLabVariants";
import "./cyberBgLab.css";

type Props = {
  variant: CyberBgLabVariant;
  animate?: boolean;
  className?: string;
};

/** dev / ラボ用 — アプリ向け cyber 背景 FX */
export default function CyberBgLabFx({
  variant,
  animate = true,
  className = "",
}: Props) {
  const root = [
    "cyber-bg-lab",
    `cyber-bg-lab--${variant}`,
    animate ? "cyber-bg-lab--animate" : "cyber-bg-lab--static",
    className,
  ].join(" ");

  const base = <div className="cyber-bg-lab__base" aria-hidden />;

  switch (variant) {
    case "nebula":
      return (
        <div className={root} aria-hidden>
          {base}
          <div className="cyber-bg-lab__nebula cyber-bg-lab__nebula--cyan" />
          <div className="cyber-bg-lab__nebula cyber-bg-lab__nebula--purple" />
          <div className="cyber-bg-lab__nebula cyber-bg-lab__nebula--magenta" />
          <div className="cyber-bg-lab__vignette" />
        </div>
      );

    case "hex-hive":
      return (
        <div className={root} aria-hidden>
          {base}
          <div className="cyber-bg-lab__hex" />
          <span className="cyber-bg-lab__hud-corner cyber-bg-lab__hud-corner--tl" />
          <span className="cyber-bg-lab__hud-corner cyber-bg-lab__hud-corner--tr" />
          <span className="cyber-bg-lab__hud-corner cyber-bg-lab__hud-corner--bl" />
          <span className="cyber-bg-lab__hud-corner cyber-bg-lab__hud-corner--br" />
          <div className="cyber-bg-lab__vignette cyber-bg-lab__vignette--soft" />
        </div>
      );

    case "signal":
      return (
        <div className={root} aria-hidden>
          {base}
          <div className="cyber-bg-lab__signal cyber-bg-lab__signal--a" />
          <div className="cyber-bg-lab__signal cyber-bg-lab__signal--b" />
          <div className="cyber-bg-lab__signal cyber-bg-lab__signal--c" />
          <div className="cyber-bg-lab__signal-grid" />
          <div className="cyber-bg-lab__vignette" />
        </div>
      );

    case "tunnel":
      return (
        <div className={root} aria-hidden>
          {base}
          <div className="cyber-bg-lab__tunnel">
            <div className="cyber-bg-lab__tunnel-plane" />
          </div>
          <div className="cyber-bg-lab__vignette cyber-bg-lab__vignette--tunnel" />
        </div>
      );

    case "radar":
      return (
        <div className={root} aria-hidden>
          {base}
          <div className="cyber-bg-lab__radar-ring cyber-bg-lab__radar-ring--1" />
          <div className="cyber-bg-lab__radar-ring cyber-bg-lab__radar-ring--2" />
          <div className="cyber-bg-lab__radar-ring cyber-bg-lab__radar-ring--3" />
          <div className="cyber-bg-lab__radar-sweep" />
          <div className="cyber-bg-lab__vignette" />
        </div>
      );

    case "data-stream":
      return (
        <div className={root} aria-hidden>
          {base}
          <div className="cyber-bg-lab__stream cyber-bg-lab__stream--1" />
          <div className="cyber-bg-lab__stream cyber-bg-lab__stream--2" />
          <div className="cyber-bg-lab__stream cyber-bg-lab__stream--3" />
          <div className="cyber-bg-lab__stream cyber-bg-lab__stream--4" />
          <div className="cyber-bg-lab__stream cyber-bg-lab__stream--5" />
          <div className="cyber-bg-lab__vignette" />
        </div>
      );

    case "circuit":
      return (
        <div className={root} aria-hidden>
          {base}
          <div className="cyber-bg-lab__circuit cyber-bg-lab__circuit--h1" />
          <div className="cyber-bg-lab__circuit cyber-bg-lab__circuit--h2" />
          <div className="cyber-bg-lab__circuit cyber-bg-lab__circuit--v1" />
          <div className="cyber-bg-lab__circuit cyber-bg-lab__circuit--v2" />
          <span className="cyber-bg-lab__node cyber-bg-lab__node--1" />
          <span className="cyber-bg-lab__node cyber-bg-lab__node--2" />
          <span className="cyber-bg-lab__node cyber-bg-lab__node--3" />
          <span className="cyber-bg-lab__node cyber-bg-lab__node--4" />
          <div className="cyber-bg-lab__vignette" />
        </div>
      );

    case "prism-split":
      return (
        <div className={root} aria-hidden>
          {base}
          <div className="cyber-bg-lab__prism cyber-bg-lab__prism--cyan" />
          <div className="cyber-bg-lab__prism cyber-bg-lab__prism--purple" />
          <div className="cyber-bg-lab__prism-edge" />
          <div className="cyber-bg-lab__vignette cyber-bg-lab__vignette--soft" />
        </div>
      );

    default:
      return (
        <div className={root} aria-hidden>
          {base}
        </div>
      );
  }
}
