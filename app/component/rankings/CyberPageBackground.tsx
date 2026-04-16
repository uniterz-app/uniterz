"use client";

import UniterzLogo3DBackground from "@/app/component/background/UniterzLogo3DBackground";

type CyberPageBackgroundProps = {
  /**
   * fixed: 単体でビューポート全面に張る（モバイルランキング等）
   * fill: 親が fixed でビューポート枠を張っているときに中身だけ塗る（Web ランキング layout 用）
   */
  positionMode?: "fixed" | "fill";
};

export default function CyberPageBackground({
  positionMode = "fixed",
}: CyberPageBackgroundProps) {
  const isFill = positionMode === "fill";

  return (
    <div
      className={[
        "pointer-events-none z-0 overflow-hidden bg-app",
        isFill
          ? "absolute inset-0 h-full min-h-full w-full"
          : "fixed inset-0 w-screen",
      ].join(" ")}
      style={
        isFill
          ? undefined
          : {
              /* スクロールしてもビューポートに張り付き、3D が常に画面中央基準で見える */
              height: "100dvh",
              minHeight: "100lvh",
            }
      }
    >
      <div className="absolute inset-0">
        <UniterzLogo3DBackground />
      </div>
    </div>
  );
}