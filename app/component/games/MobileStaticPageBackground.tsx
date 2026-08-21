"use client";

import {
  APP_MESH_BG_FALLBACK,
  APP_MESH_BG_PUBLIC_PATH,
  APP_MESH_BG_TILE_HEIGHT_PX,
  APP_MESH_BG_TILE_WIDTH_PX,
} from "@/lib/app/appMeshBackground";
import {
  PRO_LEAGUE_MESH_BG_FALLBACK,
  PRO_LEAGUE_MESH_BG_PUBLIC_PATH,
  PRO_LEAGUE_MESH_BG_TILE_HEIGHT_PX,
  PRO_LEAGUE_MESH_BG_TILE_WIDTH_PX,
} from "@/lib/rankings/proLeagueMeshBackground";
import { useAppPageAtmosphere } from "@/lib/ui/useAppPageAtmosphere";

/**
 * アプリ全体の固定背景。アニメーションなし。
 * PRO LEAGUE 中は穴あきメタルに差し替え（ヘッダー下まで統一）。
 */
export default function MobileStaticPageBackground() {
  const atmosphere = useAppPageAtmosphere();
  const pro = atmosphere === "pro-league";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
      data-page-bg={pro ? "pro-league" : "ring-grid"}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: pro ? PRO_LEAGUE_MESH_BG_FALLBACK : APP_MESH_BG_FALLBACK,
          backgroundImage: `url(${
            pro ? PRO_LEAGUE_MESH_BG_PUBLIC_PATH : APP_MESH_BG_PUBLIC_PATH
          })`,
          backgroundRepeat: "repeat",
          backgroundPosition: "center",
          backgroundSize: pro
            ? `${PRO_LEAGUE_MESH_BG_TILE_WIDTH_PX}px ${PRO_LEAGUE_MESH_BG_TILE_HEIGHT_PX}px`
            : `${APP_MESH_BG_TILE_WIDTH_PX}px ${APP_MESH_BG_TILE_HEIGHT_PX}px`,
        }}
      />
      {pro ? (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0.28) 0%, transparent 16%, transparent 78%, rgba(0,0,0,0.38) 100%)",
          }}
        />
      ) : null}
    </div>
  );
}
