"use client";

import {
  APP_MESH_BG_FALLBACK,
  APP_MESH_BG_PUBLIC_PATH,
  APP_MESH_BG_TILE_HEIGHT_PX,
  APP_MESH_BG_TILE_WIDTH_PX,
} from "@/lib/app/appMeshBackground";

/**
 * アプリ全体の固定背景（タイルメッシュ）。アニメーションなし。
 */
export default function MobileStaticPageBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      aria-hidden
      data-page-bg="mesh"
    >
      <div
        className="app-mesh-page-tile absolute inset-0"
        style={{
          backgroundColor: APP_MESH_BG_FALLBACK,
          backgroundImage: `url(${APP_MESH_BG_PUBLIC_PATH})`,
          backgroundRepeat: "repeat",
          backgroundSize: `${APP_MESH_BG_TILE_WIDTH_PX}px ${APP_MESH_BG_TILE_HEIGHT_PX}px`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.22) 0%, transparent 18%, transparent 78%, rgba(0,0,0,0.32) 100%)",
        }}
      />
    </div>
  );
}
