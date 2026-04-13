"use client";

import { ComposableMap, Geographies, Marker } from "react-simple-maps";
import { motion, useReducedMotion } from "framer-motion";
import type {
  Dispatch,
  MutableRefObject,
  PointerEvent as ReactPointerEvent,
  ReactNode,
  RefObject,
  SetStateAction,
} from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  NBA_DIVISION_LABEL,
  NBA_DIVISION_ORDER,
  NBA_DIVISION_STATE_CODES,
  NBA_TEAM_US_GEO,
  type NbaDivisionId,
} from "@/lib/nba/nbaTeamUsGeo";
import {
  getTeamMarkerCoordinate,
  NBA_DIVISION_TEAM_IDS,
  NBA_MARKET_CALLOUTS,
  NBA_PREDICTION_MAP_PROJECTION,
  NBA_TEAM_MAP_COORDS,
  nbaCalloutSkipTeamIds,
} from "@/lib/nba/nbaTeamMapCoords";
import {
  useNbaPredictionMapData,
  type NbaPredictionMapAgg,
} from "@/lib/profile/useNbaPredictionMapData";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { TEAM_SHORT } from "@/lib/team-short";
import { nameRajdhani } from "@/lib/fonts";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import type { Language } from "@/lib/i18n/language";
import {
  NbaHudMapLayer,
  type NbaHudGeography,
} from "@/app/component/profile/ui/NbaHudMapLayer";
import uvStyles from "@/app/component/profile/ui/profileNbaMapUiverse.module.css";
import { postalFromUsAtlasFips } from "@/lib/nba/usStateFipsToPostal";
import { teamColorsNBA } from "@/lib/teams-nba";

const US_STATES_TOPO =
  "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

/** 本土＋DC のみ。AK / HI / 海外領土は描かない（左上インセット等を消す） */
const US_ATLAS_EXCLUDED_FIPS = new Set([
  "02", // Alaska
  "15", // Hawaii
  "60", // American Samoa
  "66", // Guam
  "69", // Northern Mariana Islands
  "72", // Puerto Rico
  "78", // U.S. Virgin Islands
]);

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function isHexBlack(hex: string): boolean {
  const n = hex.replace("#", "").toLowerCase();
  return n === "000" || n === "000000";
}

function isHexWhite(hex: string): boolean {
  const n = hex.replace("#", "").toLowerCase();
  return n === "fff" || n === "ffffff";
}

/** チームカラー（#000 主役は secondary で視認性を確保） */
function nbaMapDotHex(teamId: string): string {
  const c = teamColorsNBA[teamId];
  if (!c) return "#94a3b8";
  if (isHexBlack(c.primary)) {
    if (c.secondary && !isHexWhite(c.secondary)) return c.secondary;
    return "#cbd5e1";
  }
  return c.primary;
}

function parseHexRgb(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.trim().replace(/^#/, "");
  if (h.length === 3) {
    return {
      r: parseInt(h[0] + h[0], 16),
      g: parseInt(h[1] + h[1], 16),
      b: parseInt(h[2] + h[2], 16),
    };
  }
  if (h.length === 6 && /^[0-9a-f]+$/i.test(h)) {
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  return null;
}

/** WCAG 相対輝度（0〜1） */
function relativeLuminance(r: number, g: number, b: number): number {
  const lin = (c: number) => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  };
  const R = lin(r);
  const G = lin(g);
  const B = lin(b);
  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

function mixRgb(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number
) {
  return {
    r: Math.round(lerp(a.r, b.r, t)),
    g: Math.round(lerp(a.g, b.g, t)),
    b: Math.round(lerp(a.b, b.b, t)),
  };
}

function rgbToHex(c: { r: number; g: number; b: number }): string {
  const x = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  return `#${x(c.r)}${x(c.g)}${x(c.b)}`;
}

/**
 * 極端に暗い色だけごく弱く持ち上げ（チームカラーを薄くしすぎない）。
 */
function visibleNbaMapFillHex(baseHex: string): string {
  const rgb = parseHexRgb(baseHex);
  if (!rgb) return baseHex;
  const L = relativeLuminance(rgb.r, rgb.g, rgb.b);
  const hi = { r: 198, g: 236, b: 252 };
  if (L < 0.12) return rgbToHex(mixRgb(rgb, hi, 0.22));
  if (L < 0.2) return rgbToHex(mixRgb(rgb, hi, 0.14));
  if (L < 0.3) return rgbToHex(mixRgb(rgb, hi, 0.08));
  return baseHex;
}

/** チーム内訳の見出し色用（#000 主役は secondary） */
function selectionLinkColor(teamId: string | null): string | undefined {
  if (!teamId) return undefined;
  const c = teamColorsNBA[teamId];
  if (!c) return "#6EA8FE";
  if (isHexBlack(c.primary)) {
    if (c.secondary && !isHexWhite(c.secondary)) return c.secondary;
    return "#94a3b8";
  }
  return c.primary;
}

function dotStrokeForLuminance(
  lum: number,
  isSel: boolean,
  /** モバイルは白縁を避けシアン／スレート系にする */
  narrow: boolean
): {
  stroke: string;
  strokeWidth: number;
} {
  if (isSel) {
    return narrow
      ? { stroke: "rgba(34, 211, 238, 0.92)", strokeWidth: 2.75 }
      : { stroke: "rgba(255,255,255,0.95)", strokeWidth: 2.65 };
  }
  if (lum > 0.62) {
    return { stroke: "rgba(15, 23, 42, 0.78)", strokeWidth: 1.55 };
  }
  if (lum < 0.35) {
    return narrow
      ? { stroke: "rgba(56, 189, 248, 0.45)", strokeWidth: 1.45 }
      : { stroke: "rgba(255, 255, 255, 0.55)", strokeWidth: 1.45 };
  }
  return narrow
    ? { stroke: "rgba(100, 116, 139, 0.55)", strokeWidth: 1.3 }
    : { stroke: "rgba(255, 255, 255, 0.38)", strokeWidth: 1.3 };
}

/** 州ヒット用に geographies を親へ同期（参照が毎回変わるのでシグネチャで間引き） */
function SyncMapGeographies({
  geographies,
  onSynced,
}: {
  geographies: NbaHudGeography[];
  onSynced: (g: NbaHudGeography[]) => void;
}) {
  const prevSig = useRef<string>("");
  useLayoutEffect(() => {
    if (geographies.length === 0) return;
    const sig = `${geographies.length}:${geographies[0]?.rsmKey ?? ""}`;
    if (sig === prevSig.current) return;
    prevSig.current = sig;
    onSynced(geographies);
  }, [geographies, onSynced]);
  return null;
}

/** 州トポロジーが SVG に載ったあとで一度だけ通知（マーカーを遅らせる） */
function MapGeoReadyNotifier({
  geoCount,
  onReady,
}: {
  geoCount: number;
  onReady: () => void;
}) {
  const done = useRef(false);
  useEffect(() => {
    if (geoCount > 0 && !done.current) {
      done.current = true;
      queueMicrotask(() => onReady());
    }
  }, [geoCount, onReady]);
  useEffect(() => {
    return () => {
      done.current = false;
    };
  }, []);
  return null;
}

const profileMapStaggerParent = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.06 },
  },
};

function profileMapFadeUpItem(reduceMotion: boolean | null) {
  if (reduceMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    };
  }
  return {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] as const },
    },
  };
}

/** 地図ブロックだけ少しゆっくりフェードアップ */
function profileMapMapFadeItem(reduceMotion: boolean | null) {
  if (reduceMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    };
  }
  return {
    hidden: { opacity: 0, y: 22 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.84, ease: [0.2, 1, 0.38, 1] as const },
    },
  };
}

const NBA_MAP_DOT_STAGGER_MS = 52;

/**
 * ピン描画順（経度のみ・常に同じ順）。
 * ホバー／選択で並べ替えない → DOM 順が変わらず出現アニメが再発火しない。
 * 東側を上層（後描画）にし、重なり時は西寄りをやや下に。
 */
function sortTeamIdsStableLngPaintOrder(
  teamIds: readonly string[],
  skip: Set<string>
): string[] {
  const list = teamIds.filter((id) => !skip.has(id));
  list.sort((a, b) => {
    const ca = getTeamMarkerCoordinate(a);
    const cb = getTeamMarkerCoordinate(b);
    if (!ca || !cb) return 0;
    return ca.lng - cb.lng;
  });
  return list;
}

/** LA / NY コールアウト：アンカーから近い端を先に描き、先端ピンを上に（順固定） */
function sortCalloutEndpointsStable(
  endpoints: readonly { teamId: string; x: number; y: number }[]
) {
  return [...endpoints].sort(
    (ea, eb) => Math.hypot(ea.x, ea.y) - Math.hypot(eb.x, eb.y)
  );
}

function nbaMapDotBurstClass(show: boolean, reduceMotion: boolean): string {
  return [
    "nba-map-dot-burst",
    show ? "nba-map-dot-burst--in" : "",
    show && reduceMotion ? "nba-map-dot-burst--instant" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function CountUpStatValue({
  target,
  kind,
  durationMs,
  active,
  reduceMotion,
  sizeClassName = "",
}: {
  target: number;
  kind: "int" | "percent" | "float1";
  durationMs: number;
  active: boolean;
  reduceMotion: boolean;
  /** Web などで数値だけ大きくする用（例: lg:text-2xl lg:font-semibold） */
  sizeClassName?: string;
}) {
  const [v, setV] = useState(reduceMotion ? target : 0);

  useEffect(() => {
    if (!active) {
      setV(reduceMotion ? target : 0);
      return;
    }
    if (reduceMotion) {
      setV(target);
      return;
    }
    setV(0);
    let start: number | null = null;
    let raf = 0;
    const from = 0;
    const tick = (now: number) => {
      if (start === null) start = now;
      const t = Math.min((now - start) / durationMs, 1);
      const eased = 1 - (1 - t) ** 3;
      setV(from + (target - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, active, durationMs, reduceMotion]);

  const numCn = ["tabular-nums text-white/90", sizeClassName].filter(Boolean).join(" ");
  if (kind === "int") {
    return <span className={numCn}>{Math.round(v)}</span>;
  }
  if (kind === "percent") {
    return <span className={numCn}>{`${v.toFixed(1)}%`}</span>;
  }
  return <span className={numCn}>{v.toFixed(1)}</span>;
}

type Props = {
  uid: string | null;
  language: Language;
};

/** マップ集計のみ（プロフィール上部の期間タブとは独立） */
export type NbaMapRange = "7d" | "30d";

function DivisionTabBar({
  division,
  setDivision,
  setSelectedTeamId,
  labelFn,
  className,
  pillClassName,
}: {
  division: NbaDivisionId | "all";
  setDivision: (d: NbaDivisionId | "all") => void;
  setSelectedTeamId: Dispatch<SetStateAction<string | null>>;
  labelFn: (id: NbaDivisionId | "all") => string;
  className: string;
  pillClassName: string;
}) {
  const pill = (selected: boolean) =>
    [
      pillClassName,
      "font-medium transition-colors",
      selected
        ? "bg-[#6EA8FE]/25 text-white"
        : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/85",
    ].join(" ");

  return (
    <div
      className={[nameRajdhani.className, "flex flex-wrap", className].join(" ")}
    >
      <button
        type="button"
        onClick={() => {
          setDivision("all");
          setSelectedTeamId(null);
        }}
        className={pill(division === "all")}
      >
        {labelFn("all")}
      </button>
      {NBA_DIVISION_ORDER.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => {
            setDivision(id);
            setSelectedTeamId(null);
          }}
          className={pill(division === id)}
        >
          {labelFn(id)}
        </button>
      ))}
    </div>
  );
}

function teamLabel(teamId: string, language: Language): string {
  if (language === "en") {
    return NBA_TEAM_NAME_BY_ID[teamId] ?? teamId;
  }
  return TEAM_SHORT[teamId] ?? NBA_TEAM_NAME_BY_ID[teamId] ?? teamId;
}

/**
 * 狭い画面用の投影補正。
 * ディビジョン選択時は強めにズーム（NW / SE は寄りすぎたため控えめに据え置き）。
 * `all` は全米が収まるよう控えめ。
 */
function projectionForMobile(
  base: { center: [number, number]; scale: number },
  narrow: boolean,
  division: NbaDivisionId | "all"
): { center: [number, number]; scale: number } {
  if (!narrow) return base;
  const [lon, lat] = base.center;
  if (division === "all") {
    return {
      center: [lon, lat - 0.2],
      scale: Math.round(base.scale * 1.26),
    };
  }
  if (division === "atlantic") {
    return {
      center: [lon, lat - 0.2],
      scale: Math.round(base.scale * 1.54),
    };
  }
  if (division === "central" || division === "pacific") {
    return {
      center: [lon, lat - 0.36],
      scale: Math.round(base.scale * 1.52),
    };
  }
  if (division === "northwest") {
    return {
      center: [lon + 2.6, lat - 0.18],
      scale: Math.round(base.scale * 1.18),
    };
  }
  if (division === "southwest") {
    return {
      center: [lon + 1.45, lat - 0.65],
      scale: Math.round(base.scale * 1.48),
    };
  }
  /**
   * southeast — 縦に長い（DC〜FL）。北寄り＋強ズームだと南端（MIA/ORL 等）が枠外になるため、
   * 中心を南寄りにしつつズームを弱めてチームが収まるようにする。
   */
  return {
    center: [lon, lat - 0.58],
    scale: Math.round(base.scale * 1.12),
  };
}

/** 看板ホバー解除の猶予（ドット→看板へ移動しても消えにくくする） */
const NBA_MAP_SIGN_HOVER_CLEAR_MS = 110;

/** マップジェスチャー（CSS scale）の範囲 */
const NBA_MAP_GESTURE_ZOOM_MIN = 0.65;
const NBA_MAP_GESTURE_ZOOM_MAX = 3.25;
/** ガラスボタン1回あたりの拡大率 */
const NBA_MAP_GLASS_ZOOM_FACTOR = 1.14;
/** モバイル地図下のズーム行ぶん（読み込み min-height・HUD 継ぎ足しの目安高さ） */
const NBA_MAP_MOBILE_ZOOM_ROW_CHROME_PX = 52;

function clampMapGestureZoom(z: number) {
  return Math.min(NBA_MAP_GESTURE_ZOOM_MAX, Math.max(NBA_MAP_GESTURE_ZOOM_MIN, z));
}

/** モバイル：初期ズーム ≒ ガラス「+」を 5 回（毎回 NBA_MAP_GLASS_ZOOM_FACTOR 倍） */
const NBA_MAP_MOBILE_INITIAL_ZOOM = clampMapGestureZoom(
  NBA_MAP_GLASS_ZOOM_FACTOR ** 5
);

function clientDistance(
  a: { cx: number; cy: number },
  b: { cx: number; cy: number }
) {
  return Math.hypot(a.cx - b.cx, a.cy - b.cy);
}

/** ビューポート左上基準の焦点 (fx,fy) を固定してズーム */
function mapZoomAroundFocal(
  prev: { zoom: number; panX: number; panY: number },
  nextZoom: number,
  fx: number,
  fy: number
) {
  const z = clampMapGestureZoom(nextZoom);
  const wx = (fx - prev.panX) / prev.zoom;
  const wy = (fy - prev.panY) / prev.zoom;
  return { zoom: z, panX: fx - wx * z, panY: fy - wy * z };
}

/** ガラス風ズームボタン（corner=デスクトップ右下 / row=モバイル地図下） */
function NbaMapGlassZoomControls({
  dock,
  language,
  mapGestureRef,
  mapViewTransform,
  mapViewTransformRef,
  setMapViewTransform,
  className,
}: {
  dock: "corner" | "row";
  language: Language;
  mapGestureRef: RefObject<HTMLDivElement | null>;
  mapViewTransform: { zoom: number; panX: number; panY: number };
  mapViewTransformRef: MutableRefObject<{
    zoom: number;
    panX: number;
    panY: number;
  }>;
  setMapViewTransform: Dispatch<
    SetStateAction<{ zoom: number; panX: number; panY: number }>
  >;
  className?: string;
}) {
  const glassBtn = (() => {
    const isRow = dock === "row";
    return [
      "relative isolate flex shrink-0 items-center justify-center overflow-hidden",
      isRow
        ? [
            "rounded-xl border border-white/[0.28]",
            "bg-gradient-to-b from-white/[0.14] via-cyan-50/[0.06] to-white/[0.02]",
            "shadow-[inset_0_1px_0_rgba(255,255,255,0.42),inset_0_-1px_0_rgba(0,0,0,0.06),0_2px_14px_rgba(0,0,0,0.12)]",
            "text-cyan-50 backdrop-blur-2xl backdrop-saturate-[1.85]",
          ].join(" ")
        : [
            "border border-cyan-300/25 border-t-white/40",
            "bg-gradient-to-b from-white/[0.22] via-cyan-400/[0.06] to-[#030a12]/75",
          ].join(" "),
      isRow
        ? ""
        : "text-cyan-100 shadow-[0_4px_20px_rgba(0,0,0,0.55),inset_0_1px_0_rgba(255,255,255,0.32),inset_0_-1px_0_rgba(0,0,0,0.25)]",
      !isRow ? "backdrop-blur-xl backdrop-saturate-150" : "",
      "transition duration-200 ease-out",
      isRow
        ? "hover:border-white/35 hover:from-white/[0.2] hover:via-cyan-50/[0.1] hover:to-white/[0.04] hover:text-white"
        : "hover:border-cyan-200/45 hover:from-white/[0.3] hover:via-cyan-300/[0.12] hover:text-white",
      isRow
        ? "hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),0_4px_18px_rgba(0,0,0,0.14)]"
        : "hover:shadow-[0_6px_28px_rgba(0,0,0,0.5),0_0_24px_rgba(34,211,238,0.18),inset_0_1px_0_rgba(255,255,255,0.4)]",
      "active:scale-[0.92]",
      "disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none",
      isRow ? "h-8 w-8 rounded-xl" : "h-11 w-11 rounded-2xl",
    ]
      .filter(Boolean)
      .join(" ");
  })();

  const focalCenter = () => {
    const el = mapGestureRef.current;
    if (!el) return { fx: 0, fy: 0 };
    const r = el.getBoundingClientRect();
    return { fx: r.width / 2, fy: r.height / 2 };
  };

  return (
    <div
      className={[
        dock === "corner"
          ? [
              "pointer-events-auto absolute bottom-2.5 right-2.5 z-20 hidden flex-col gap-1.5 lg:flex",
              "rounded-2xl border border-cyan-500/20 bg-[#030810]/55 p-1.5",
              "shadow-[0_12px_40px_rgba(0,0,0,0.55),0_0_1px_rgba(34,211,238,0.2)]",
              "backdrop-blur-2xl",
            ].join(" ")
          : "pointer-events-auto flex w-full flex-row flex-wrap items-center justify-center gap-2 py-2 lg:hidden",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="group"
      aria-label={
        language === "en" ? "Map zoom controls" : "マップのズーム操作"
      }
    >
      <button
        type="button"
        className={glassBtn}
        disabled={mapViewTransform.zoom >= NBA_MAP_GESTURE_ZOOM_MAX - 0.02}
        aria-label={language === "en" ? "Zoom in" : "拡大"}
        title={language === "en" ? "Zoom in" : "拡大"}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => {
          const { fx, fy } = focalCenter();
          setMapViewTransform((p) =>
            mapZoomAroundFocal(p, p.zoom * NBA_MAP_GLASS_ZOOM_FACTOR, fx, fy)
          );
        }}
      >
        <Plus
          className={
            dock === "row"
              ? "h-4 w-4 text-cyan-50 drop-shadow-[0_0_8px_rgba(0,0,0,0.55)]"
              : "h-5 w-5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]"
          }
          strokeWidth={dock === "row" ? 2.45 : 2.45}
        />
      </button>
      <button
        type="button"
        className={glassBtn}
        disabled={mapViewTransform.zoom <= NBA_MAP_GESTURE_ZOOM_MIN + 0.02}
        aria-label={language === "en" ? "Zoom out" : "縮小"}
        title={language === "en" ? "Zoom out" : "縮小"}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => {
          const { fx, fy } = focalCenter();
          setMapViewTransform((p) =>
            mapZoomAroundFocal(p, p.zoom / NBA_MAP_GLASS_ZOOM_FACTOR, fx, fy)
          );
        }}
      >
        <Minus
          className={
            dock === "row"
              ? "h-4 w-4 text-cyan-50 drop-shadow-[0_0_8px_rgba(0,0,0,0.55)]"
              : "h-5 w-5 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]"
          }
          strokeWidth={dock === "row" ? 2.45 : 2.45}
        />
      </button>
      <button
        type="button"
        className={glassBtn}
        disabled={
          mapViewTransform.zoom === 1 &&
          mapViewTransform.panX === 0 &&
          mapViewTransform.panY === 0
        }
        aria-label={
          language === "en"
            ? "Reset pan and zoom"
            : "位置とズームをリセット"
        }
        title={
          language === "en"
            ? "Reset pan and zoom"
            : "位置とズームをリセット"
        }
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => {
          const next = { zoom: 1, panX: 0, panY: 0 };
          mapViewTransformRef.current = next;
          setMapViewTransform(next);
        }}
      >
        <RotateCcw
          className={
            dock === "row"
              ? "h-3.5 w-3.5 text-cyan-50 drop-shadow-[0_0_8px_rgba(0,0,0,0.55)]"
              : "h-4 w-4 text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]"
          }
          strokeWidth={dock === "row" ? 2.35 : 2.35}
        />
      </button>
    </div>
  );
}

function InteractiveTeamDot({
  teamId,
  selectedTeamId,
  setSelectedTeamId,
  narrowViewport,
  divisionMode,
  language,
  reduceMotion,
  mapLayer,
  mapHoveredTeamId,
  onMapHoverEnterTeam,
  onMapHoverScheduleClear,
  clearMapTeamHover,
}: {
  teamId: string;
  selectedTeamId: string | null;
  setSelectedTeamId: Dispatch<SetStateAction<string | null>>;
  narrowViewport: boolean;
  /** 単一ディビジョン表示時は円を大きく */
  divisionMode: boolean;
  language: Language;
  reduceMotion: boolean;
  /** dots=ヒット円のみ / sign=看板のみ（最上層で他チームのドットより上） */
  mapLayer: "dots" | "sign";
  mapHoveredTeamId: string | null;
  onMapHoverEnterTeam: (teamId: string) => void;
  onMapHoverScheduleClear: () => void;
  /** モバイル看板タップで選択解除するときにホバー状態も消す */
  clearMapTeamHover: () => void;
}) {
  const fill = visibleNbaMapFillHex(nbaMapDotHex(teamId));
  const fillRgb = parseHexRgb(fill);
  const fillLum = fillRgb
    ? relativeLuminance(fillRgb.r, fillRgb.g, fillRgb.b)
    : 0.35;
  const r = narrowViewport
    ? divisionMode
      ? 16.5
      : 7.5
    : divisionMode
      ? 11
      : 6.5;
  /** 透明ヒット円を大きく（近接チームでもタップ／ホバーしやすく） */
  const hitPad = narrowViewport ? 30 : 26;
  const hitFloor = narrowViewport ? 50 : 42;
  const hitCeil = narrowViewport ? 80 : 70;
  const hitR = Math.min(hitCeil, Math.max(hitFloor, r + hitPad));
  const isSel = selectedTeamId === teamId;
  const select = () =>
    setSelectedTeamId((prev) => (prev === teamId ? null : teamId));
  const { stroke, strokeWidth } = dotStrokeForLuminance(
    fillLum,
    isSel,
    narrowViewport
  );
  const sw = narrowViewport ? strokeWidth * 1.08 : strokeWidth;
  const rawLabel = teamLabel(teamId, language);
  const labelMax = narrowViewport ? 11 : 13;
  const signLabelText =
    rawLabel.length > labelMax
      ? `${rawLabel.slice(0, labelMax - 1)}…`
      : rawLabel;
  const signW = Math.min(
    168,
    Math.max(56, 16 + signLabelText.length * (narrowViewport ? 7.1 : 7.8))
  );
  const signLift = r + 34;

  if (mapLayer === "dots") {
    return (
      <g
        className="cursor-pointer touch-manipulation"
        onPointerEnter={() => onMapHoverEnterTeam(teamId)}
        onPointerLeave={() => onMapHoverScheduleClear()}
      >
        <circle
          r={hitR}
          fill="transparent"
          stroke="none"
          pointerEvents="all"
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            /** モバイル：看板は別ピンをタップするまで表示。同じピン再タップでは解除しない */
            if (narrowViewport) {
              clearMapTeamHover();
              setSelectedTeamId(teamId);
              return;
            }
            select();
          }}
        />
        {!isSel && fillLum < 0.32 ? (
          <circle
            r={r + 1.35}
            fill="none"
            stroke={
              narrowViewport
                ? "rgba(34, 211, 238, 0.14)"
                : "rgba(255,255,255,0.14)"
            }
            strokeWidth={narrowViewport ? 1.1 : 0.95}
            pointerEvents="none"
          />
        ) : null}
        <circle
          r={r}
          fill={fill}
          stroke={stroke}
          strokeWidth={sw}
          pointerEvents="none"
          style={{ transition: "stroke-width 0.15s ease" }}
        />
      </g>
    );
  }

  /**
   * モバイル: ピン選択中はそのチームの看板のみ表示（他ピン上のホバーが残っても消えない）。
   * 未選択時だけホバー中チームの看板を出す。デスクトップはホバーのみ。
   */
  const signActive = narrowViewport
    ? selectedTeamId === teamId ||
      (selectedTeamId == null && mapHoveredTeamId === teamId)
    : mapHoveredTeamId === teamId;
  const bridgePad = narrowViewport ? 12 : 14;
  const bridgeX = -signW / 2 - bridgePad;
  const bridgeY = -signLift - (narrowViewport ? 30 : 32);
  const bridgeW = signW + bridgePad * 2;
  const bridgeH = narrowViewport ? 42 : 46;

  return (
    <g
      className={reduceMotion ? uvStyles.signReduce : undefined}
      aria-hidden
    >
      {/* 下に置き pointer-events でホバー継続（看板より下なので透過で拾う） */}
      <rect
        x={bridgeX}
        y={bridgeY}
        width={bridgeW}
        height={bridgeH}
        fill="transparent"
        pointerEvents="all"
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onPointerEnter={() => onMapHoverEnterTeam(teamId)}
        onPointerLeave={() => onMapHoverScheduleClear()}
        onClick={(e) => {
          e.stopPropagation();
          if (narrowViewport && selectedTeamId === teamId) {
            setSelectedTeamId(null);
            clearMapTeamHover();
          }
        }}
      />
      <g
        className={[
          uvStyles.signGroup,
          signActive ? uvStyles.signGroupActive : "",
        ]
          .filter(Boolean)
          .join(" ")}
        transform={`translate(0,${-signLift})`}
        style={{
          pointerEvents:
            narrowViewport && selectedTeamId === teamId ? "auto" : "none",
        }}
        onClick={(e) => {
          if (!narrowViewport || selectedTeamId !== teamId) return;
          e.stopPropagation();
          setSelectedTeamId(null);
          clearMapTeamHover();
        }}
      >
        <rect
          x={-signW / 2}
          y={-22}
          width={signW}
          height={24}
          rx={4}
          className={[
            uvStyles.signRect,
            narrowViewport ? uvStyles.signRectNarrow : "",
          ]
            .filter(Boolean)
            .join(" ")}
          fill={fill}
          style={{
            filter: "drop-shadow(0 0 2px rgba(0,0,0,0.55))",
          }}
        />
        <text x={0} y={-10} className={uvStyles.signLabel}>
          {signLabelText}
        </text>
      </g>
    </g>
  );
}

export default function ProfileNbaPredictionMap({ uid, language }: Props) {
  const [mapRange, setMapRange] = useState<NbaMapRange>("30d");
  const { loading, agg } = useNbaPredictionMapData(uid, mapRange);
  const [division, setDivision] = useState<NbaDivisionId | "all">("all");
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  /** 看板レイヤー用：どのチームの看板を出すか（ドットより上に描くため状態管理） */
  const [mapHoveredTeamId, setMapHoveredTeamId] = useState<string | null>(null);
  const mapHoverClearTimerRef = useRef<number | null>(null);
  const [narrowViewport, setNarrowViewport] = useState(false);
  const [mapGeoReady, setMapGeoReady] = useState(false);
  const [mapGeographies, setMapGeographies] = useState<NbaHudGeography[]>([]);
  const [mapViewTransform, setMapViewTransform] = useState({
    zoom: 1,
    panX: 0,
    panY: 0,
  });
  const mapGestureRef = useRef<HTMLDivElement>(null);
  const mapViewTransformRef = useRef(mapViewTransform);
  mapViewTransformRef.current = mapViewTransform;
  const mapPointersRef = useRef(
    new Map<number, { cx: number; cy: number }>()
  );
  const mapPinchBaseRef = useRef<{
    d0: number;
    z0: number;
    panX0: number;
    panY0: number;
    mid0x: number;
    mid0y: number;
  } | null>(null);
  const mapPanLastClientRef = useRef<{ x: number; y: number } | null>(null);

  const onSyncedGeographies = useCallback((g: NbaHudGeography[]) => {
    setMapGeographies(g);
  }, []);

  const cancelMapHoverClearTimer = useCallback(() => {
    if (mapHoverClearTimerRef.current) {
      clearTimeout(mapHoverClearTimerRef.current);
      mapHoverClearTimerRef.current = null;
    }
  }, []);

  const onMapHoverEnterTeam = useCallback(
    (teamId: string) => {
      cancelMapHoverClearTimer();
      setMapHoveredTeamId(teamId);
    },
    [cancelMapHoverClearTimer]
  );

  const onMapHoverScheduleClear = useCallback(() => {
    cancelMapHoverClearTimer();
    mapHoverClearTimerRef.current = window.setTimeout(() => {
      setMapHoveredTeamId(null);
      mapHoverClearTimerRef.current = null;
    }, NBA_MAP_SIGN_HOVER_CLEAR_MS);
  }, [cancelMapHoverClearTimer]);

  const clearMapTeamHover = useCallback(() => {
    cancelMapHoverClearTimer();
    setMapHoveredTeamId(null);
  }, [cancelMapHoverClearTimer]);

  useEffect(() => () => cancelMapHoverClearTimer(), [cancelMapHoverClearTimer]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 1023px)");
    const apply = () => setNarrowViewport(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const stateAllow = useMemo(() => {
    if (division === "all") return null;
    return new Set(NBA_DIVISION_STATE_CODES[division]);
  }, [division]);

  const teamIdsInView = useMemo(() => {
    if (division === "all") return Object.keys(NBA_TEAM_MAP_COORDS);
    return NBA_DIVISION_TEAM_IDS[division];
  }, [division]);

  const calloutSkipIds = useMemo(
    () => nbaCalloutSkipTeamIds(teamIdsInView),
    [teamIdsInView]
  );

  const mapTeamDotPaintOrder = useMemo(
    () => sortTeamIdsStableLngPaintOrder(teamIdsInView, calloutSkipIds),
    [teamIdsInView, calloutSkipIds]
  );

  /**
   * Web：枠は 960×560 のまま scale だけ上げると確実に大きく見える。
   * モバイル：論理解像度を上げすぎない（投影の自動フィットで縮むのを防ぐ）。
   */
  const projectionCfg = useMemo(() => {
    const cfg = projectionForMobile(
      NBA_PREDICTION_MAP_PROJECTION[division],
      narrowViewport,
      division
    );
    if (narrowViewport) return cfg;
    return { ...cfg, scale: Math.round(cfg.scale * 1.14) };
  }, [division, narrowViewport]);

  /**
   * ALL 表示時のみ：ドット／グリッド背景は固定し、州線とマーカーを同じピクセル量で平行移動。
   * Web はやや上・右、モバイルは従来どおり。
   */
  const mapGeoPixelOffsetAll = useMemo(() => {
    if (division !== "all") return undefined;
    return narrowViewport
      ? { x: 32, y: 12 }
      : { x: 36, y: 2 };
  }, [division, narrowViewport]);

  const selectedRow = selectedTeamId ? agg.byTeam[selectedTeamId] : null;

  /** ディビジョンタブは常に英語（ALL / Atlantic 等） */
  const divisionTabLabel = (id: NbaDivisionId | "all") =>
    id === "all" ? "ALL" : NBA_DIVISION_LABEL[id].en;

  /** 論理幅・高さ（大きく見せたいときは projection の scale を上げる。W/H だけ上げると逆に縮むことがある） */
  const mapW = narrowViewport ? 1080 : 960;
  const mapH = narrowViewport
    ? Math.round((700 * mapW) / 960) + NBA_MAP_MOBILE_ZOOM_ROW_CHROME_PX
    : 560;
  const mapKey = `${division}-${narrowViewport ? "n" : "w"}`;

  const onMapTopologyReady = useCallback(() => {
    setMapGeoReady(true);
  }, []);

  useEffect(() => {
    setMapGeoReady(false);
  }, [mapKey]);

  useEffect(() => {
    setMapGeographies([]);
  }, [mapKey]);

  useEffect(() => {
    const next = narrowViewport
      ? { zoom: NBA_MAP_MOBILE_INITIAL_ZOOM, panX: 0, panY: 0 }
      : { zoom: 1, panX: 0, panY: 0 };
    mapViewTransformRef.current = next;
    setMapViewTransform(next);
    mapPointersRef.current.clear();
    mapPinchBaseRef.current = null;
    mapPanLastClientRef.current = null;
  }, [mapKey, narrowViewport]);

  useEffect(() => {
    cancelMapHoverClearTimer();
    setMapHoveredTeamId(null);
  }, [mapKey, cancelMapHoverClearTimer]);

  const onMapPointerDown = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    const el = mapGestureRef.current;
    if (!el) return;
    el.setPointerCapture(e.pointerId);
    mapPointersRef.current.set(e.pointerId, {
      cx: e.clientX,
      cy: e.clientY,
    });
    if (mapPointersRef.current.size === 2) {
      mapPinchBaseRef.current = null;
      mapPanLastClientRef.current = null;
    } else if (mapPointersRef.current.size === 1) {
      mapPanLastClientRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const onMapPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!mapPointersRef.current.has(e.pointerId)) return;
      mapPointersRef.current.set(e.pointerId, {
        cx: e.clientX,
        cy: e.clientY,
      });
      const el = mapGestureRef.current;
      if (!el) return;
      const vp = el.getBoundingClientRect();

      if (mapPointersRef.current.size >= 2) {
        const vals = Array.from(mapPointersRef.current.values());
        if (vals.length < 2) return;
        const d = clientDistance(vals[0]!, vals[1]!);
        if (!mapPinchBaseRef.current) {
          if (d < 12) return;
          const mid0x = (vals[0]!.cx + vals[1]!.cx) / 2 - vp.left;
          const mid0y = (vals[0]!.cy + vals[1]!.cy) / 2 - vp.top;
          const t = mapViewTransformRef.current;
          mapPinchBaseRef.current = {
            d0: d,
            z0: t.zoom,
            panX0: t.panX,
            panY0: t.panY,
            mid0x,
            mid0y,
          };
        }
        const b = mapPinchBaseRef.current;
        if (!b || b.d0 < 1) return;
        const newZoom = clampMapGestureZoom(b.z0 * (d / b.d0));
        const midx = (vals[0]!.cx + vals[1]!.cx) / 2 - vp.left;
        const midy = (vals[0]!.cy + vals[1]!.cy) / 2 - vp.top;
        const worldX = (b.mid0x - b.panX0) / b.z0;
        const worldY = (b.mid0y - b.panY0) / b.z0;
        setMapViewTransform({
          zoom: newZoom,
          panX: midx - worldX * newZoom,
          panY: midy - worldY * newZoom,
        });
        mapPanLastClientRef.current = null;
        return;
      }

      if (mapPointersRef.current.size === 1 && mapPanLastClientRef.current) {
        const last = mapPanLastClientRef.current;
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        mapPanLastClientRef.current = { x: e.clientX, y: e.clientY };
        if (dx !== 0 || dy !== 0) {
          setMapViewTransform((prev) => ({
            zoom: prev.zoom,
            panX: prev.panX + dx,
            panY: prev.panY + dy,
          }));
        }
      }
    },
    []
  );

  const onMapPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!mapPointersRef.current.has(e.pointerId)) return;
      mapPointersRef.current.delete(e.pointerId);
      try {
        mapGestureRef.current?.releasePointerCapture(e.pointerId);
      } catch {
        // キャプチャされていないことがある
      }
      if (mapPointersRef.current.size < 2) {
        mapPinchBaseRef.current = null;
      }
      if (mapPointersRef.current.size === 0) {
        mapPanLastClientRef.current = null;
      } else if (mapPointersRef.current.size === 1) {
        const rest = [...mapPointersRef.current.values()][0];
        if (rest) {
          mapPanLastClientRef.current = { x: rest.cx, y: rest.cy };
        }
      }
    },
    []
  );

  /** ホイール: 縦＝ズーム、横＝パン、Shift+縦＝縦パン、Ctrl+縦＝トラックパッドピンチ相当 */
  useEffect(() => {
    if (loading) return;
    const el = mapGestureRef.current;
    if (!el) return;
    const onWheel = (ev: WheelEvent) => {
      ev.preventDefault();
      const vp = el.getBoundingClientRect();
      const px = ev.clientX - vp.left;
      const py = ev.clientY - vp.top;
      const prev = mapViewTransformRef.current;
      const dx = ev.deltaX;
      const dy = ev.deltaY;
      let nextZoom = prev.zoom;
      let nextPanX = prev.panX;
      let nextPanY = prev.panY;

      if (ev.ctrlKey && Math.abs(dy) > 0.01) {
        const factor = Math.exp(-dy * 0.012);
        const nz = clampMapGestureZoom(prev.zoom * factor);
        const t = mapZoomAroundFocal(prev, nz, px, py);
        nextZoom = t.zoom;
        nextPanX = t.panX;
        nextPanY = t.panY;
      } else if (ev.shiftKey) {
        nextPanY -= dy * 0.45;
      } else if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 0.5) {
        nextPanX -= dx * 0.45;
      } else if (Math.abs(dy) > 0.5) {
        const factor = Math.exp(-dy * 0.001);
        const nz = clampMapGestureZoom(prev.zoom * factor);
        const t = mapZoomAroundFocal(prev, nz, px, py);
        nextZoom = t.zoom;
        nextPanX = t.panX;
        nextPanY = t.panY;
      }

      if (
        nextZoom === prev.zoom &&
        nextPanX === prev.panX &&
        nextPanY === prev.panY
      ) {
        return;
      }
      const next = { zoom: nextZoom, panX: nextPanX, panY: nextPanY };
      mapViewTransformRef.current = next;
      setMapViewTransform(next);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [loading, mapKey]);

  const singleTeamStateHits = useMemo(() => {
    if (division === "all") return [];
    const byState = new Map<string, string[]>();
    for (const tid of teamIdsInView) {
      const sc = NBA_TEAM_US_GEO[tid]?.stateCode;
      if (!sc) continue;
      if (!byState.has(sc)) byState.set(sc, []);
      byState.get(sc)!.push(tid);
    }
    const out: { postal: string; teamId: string }[] = [];
    for (const [postal, teams] of byState) {
      if (teams.length === 1) out.push({ postal, teamId: teams[0]! });
    }
    return out;
  }, [division, teamIdsInView]);

  const divisionMode = division !== "all";

  const cardAnimRef = useRef<HTMLDivElement>(null);
  const statsDetailRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  /** 出現アニメ後は false に戻さない（mapKey / loading 変更時のみリセット） */
  const [mapMarkerIntroDone, setMapMarkerIntroDone] = useState(false);

  const fadeItem = useMemo(
    () => profileMapFadeUpItem(!!reduceMotion),
    [reduceMotion]
  );

  const mapFadeItem = useMemo(
    () => profileMapMapFadeItem(!!reduceMotion),
    [reduceMotion]
  );

  const staggerInner = useMemo(
    () => ({
      hidden: {},
      visible: {
        transition: { staggerChildren: 0.085, delayChildren: 0.03 },
      },
    }),
    []
  );

  useEffect(() => {
    setMapMarkerIntroDone(false);
  }, [mapKey, loading]);

  useEffect(() => {
    if (!mapGeoReady || loading) return;
    if (narrowViewport || reduceMotion) {
      setMapMarkerIntroDone(true);
      return;
    }
    const id = window.setTimeout(() => setMapMarkerIntroDone(true), 520);
    return () => clearTimeout(id);
  }, [mapGeoReady, loading, mapKey, narrowViewport, reduceMotion]);

  /** チーム選択済みで成績行があるときは常にカウント（ビューポート外で止めない） */
  const statsCountActive = !!selectedRow;

  const linkColor = useMemo(
    () => selectionLinkColor(selectedTeamId),
    [selectedTeamId]
  );

  /** Web（lg〜）でチーム内訳の数値・ラベルを拡大 */
  const webLargeTeamStats = !narrowViewport;
  const webStatValueClass = webLargeTeamStats
    ? "lg:text-2xl lg:font-semibold"
    : "";

  useEffect(() => {
    if (!selectedTeamId || !narrowViewport) return;
    const id = window.setTimeout(() => {
      statsDetailRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }, 120);
    return () => clearTimeout(id);
  }, [selectedTeamId, narrowViewport]);

  return (
    <motion.div
      ref={cardAnimRef}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-[#050814]/80 shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.18, margin: "0px 0px -12% 0px" }}
      variants={profileMapStaggerParent}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.38]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <motion.div
        className="relative z-1 flex flex-col gap-3 p-3 max-lg:gap-2.5 max-lg:p-2 max-lg:pb-2 lg:flex-row lg:items-start"
        variants={profileMapStaggerParent}
      >
        <motion.div
          className={[
            "relative min-w-0 flex-1 overflow-x-hidden",
            "lg:rounded-2xl lg:border lg:border-cyan-500/20 lg:bg-[#040a10]/95 lg:p-2",
            "max-lg:rounded-none max-lg:border-0 max-lg:bg-transparent max-lg:p-0",
            "max-lg:-mx-2 max-lg:min-w-[calc(100%+1rem)]",
          ].join(" ")}
          variants={staggerInner}
        >
          <div className="relative">
          {loading ? (
            <motion.div
              className="flex items-center justify-center text-sm text-white/50"
              style={{ minHeight: mapH }}
              variants={fadeItem}
            >
              {language === "en" ? "Loading map…" : "読み込み中…"}
            </motion.div>
          ) : (
            <motion.div className="relative" variants={fadeItem}>
              <div
                ref={mapGestureRef}
                className={[
                  "relative overflow-hidden rounded-lg",
                  "cursor-grab touch-none active:cursor-grabbing",
                ].join(" ")}
                style={{ touchAction: "none" }}
                onPointerDown={onMapPointerDown}
                onPointerMove={onMapPointerMove}
                onPointerUp={onMapPointerUp}
                onPointerCancel={onMapPointerUp}
                onPointerLeave={(e) => {
                  if (e.pointerType === "mouse") {
                    onMapPointerUp(e);
                  }
                }}
              >
                <div
                  className="origin-top-left will-change-transform"
                  style={{
                    transform: `translate3d(${mapViewTransform.panX}px, ${mapViewTransform.panY}px, 0) scale(${mapViewTransform.zoom})`,
                  }}
                >
            <ComposableMap
              key={mapKey}
              projection="geoNaturalEarth1"
              projectionConfig={{
                center: projectionCfg.center,
                scale: projectionCfg.scale,
              }}
              width={mapW}
              height={mapH}
              className="h-auto w-full max-w-full [&_.rsm-svg]:block [&_.rsm-svg]:max-w-full"
            >
              <Geographies
                geography={US_STATES_TOPO}
                parseGeographies={(geos) =>
                  geos.filter((g) => {
                    const id = String((g as { id?: string }).id ?? "");
                    return !US_ATLAS_EXCLUDED_FIPS.has(id);
                  })
                }
              >
                {({ geographies }) => (
                  <>
                    <SyncMapGeographies
                      geographies={geographies as NbaHudGeography[]}
                      onSynced={onSyncedGeographies}
                    />
                    <MapGeoReadyNotifier
                      geoCount={geographies.length}
                      onReady={onMapTopologyReady}
                    />
                    <NbaHudMapLayer
                      geographies={geographies}
                      width={mapW}
                      height={mapH}
                      stateAllow={stateAllow}
                      narrowViewport={narrowViewport}
                      geoPathPixelOffset={mapGeoPixelOffsetAll}
                    />
                  </>
                )}
              </Geographies>

              {/* 州ヒットはマーカーより下に置く（ディビジョン拡大時もドット／看板のホバーが効く） */}
              {divisionMode &&
                mapGeographies.length > 0 &&
                singleTeamStateHits.length > 0 && (
                  <g
                    className="pointer-events-auto touch-manipulation"
                    style={{ isolation: "isolate" }}
                  >
                    {singleTeamStateHits.map(({ postal, teamId }) => {
                      const geo = mapGeographies.find(
                        (g) =>
                          postalFromUsAtlasFips(String(g.id)) === postal
                      );
                      if (!geo) return null;
                      return (
                        <path
                          key={`state-hit-${postal}`}
                          d={geo.svgPath}
                          fill="rgba(0,0,0,0.03)"
                          stroke="none"
                          className="cursor-pointer"
                          onPointerDown={(e) => {
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTeamId((p) =>
                              p === teamId ? null : teamId
                            );
                          }}
                        />
                      );
                    })}
                  </g>
                )}

              <g
                className="nba-map-markers-layer"
                {...(mapGeoPixelOffsetAll
                  ? {
                      transform: `translate(${mapGeoPixelOffsetAll.x}, ${mapGeoPixelOffsetAll.y})`,
                    }
                  : {})}
              >
                {(() => {
                  let dotStagger = 0;
                  let signStagger = 0;
                  /** 一度 --in を付けたら mapKey 変わるまで外さない（点滅防止） */
                  const showDots = mapGeoReady && mapMarkerIntroDone;
                  const hoverProps = {
                    mapHoveredTeamId,
                    onMapHoverEnterTeam,
                    onMapHoverScheduleClear,
                    clearMapTeamHover,
                  };
                  return (
                    <>
                      <g className="nba-map-markers-dots">
                        {mapTeamDotPaintOrder.map((teamId) => {
                          const coord = getTeamMarkerCoordinate(teamId);
                          if (!coord) return null;
                          const si = dotStagger++;
                          return (
                            <Marker
                              key={teamId}
                              coordinates={[coord.lng, coord.lat]}
                            >
                              <g
                                className={nbaMapDotBurstClass(
                                  showDots,
                                  !!reduceMotion
                                )}
                                style={
                                  !reduceMotion && showDots
                                    ? {
                                        animationDelay: `${si * NBA_MAP_DOT_STAGGER_MS}ms`,
                                      }
                                    : undefined
                                }
                              >
                                <InteractiveTeamDot
                                  teamId={teamId}
                                  selectedTeamId={selectedTeamId}
                                  setSelectedTeamId={setSelectedTeamId}
                                  narrowViewport={narrowViewport}
                                  divisionMode={divisionMode}
                                  language={language}
                                  reduceMotion={!!reduceMotion}
                                  mapLayer="dots"
                                  {...hoverProps}
                                />
                              </g>
                            </Marker>
                          );
                        })}

                        {NBA_MARKET_CALLOUTS.map((pair) => {
                          if (!pair.teamIds.every((id) => teamIdsInView.includes(id))) {
                            return null;
                          }
                          const k = narrowViewport ? 1.12 : 1;
                          const laShiftX =
                            pair.key === "la" && narrowViewport ? 28 : 0;
                          return (
                            <Marker
                              key={pair.key}
                              coordinates={[pair.anchor.lng, pair.anchor.lat]}
                              className="touch-manipulation"
                            >
                              <g>
                                <g pointerEvents="none">
                                  <circle
                                    cx={0}
                                    cy={0}
                                    r={3}
                                    fill="rgba(0, 230, 255, 0.45)"
                                  />
                                  {sortCalloutEndpointsStable(pair.endpoints).map(
                                    (ep) => {
                                    const x = ep.x * k + laShiftX;
                                    const y = ep.y * k;
                                    return (
                                      <line
                                        key={`${pair.key}-line-${ep.teamId}`}
                                        x1={0}
                                        y1={0}
                                        x2={x}
                                        y2={y}
                                        stroke="rgba(0, 220, 255, 0.5)"
                                        strokeWidth={narrowViewport ? 1.4 : 1.15}
                                        strokeLinecap="round"
                                        strokeDasharray="5 5"
                                      />
                                    );
                                  })}
                                </g>
                                {sortCalloutEndpointsStable(pair.endpoints).map(
                                  (ep) => {
                                  const x = ep.x * k + laShiftX;
                                  const y = ep.y * k;
                                  const si = dotStagger++;
                                  return (
                                    <g
                                      key={`${pair.key}-dot-${ep.teamId}`}
                                      transform={`translate(${x},${y})`}
                                    >
                                      <g
                                        className={nbaMapDotBurstClass(
                                          showDots,
                                          !!reduceMotion
                                        )}
                                        style={
                                          !reduceMotion && showDots
                                            ? {
                                                animationDelay: `${si * NBA_MAP_DOT_STAGGER_MS}ms`,
                                              }
                                            : undefined
                                        }
                                      >
                                        <InteractiveTeamDot
                                          teamId={ep.teamId}
                                          selectedTeamId={selectedTeamId}
                                          setSelectedTeamId={setSelectedTeamId}
                                          narrowViewport={narrowViewport}
                                          divisionMode={divisionMode}
                                          language={language}
                                          reduceMotion={!!reduceMotion}
                                          mapLayer="dots"
                                          {...hoverProps}
                                        />
                                      </g>
                                    </g>
                                  );
                                })}
                              </g>
                            </Marker>
                          );
                        })}
                      </g>

                      <g className="nba-map-markers-signs">
                        {mapTeamDotPaintOrder.map((teamId) => {
                          const coord = getTeamMarkerCoordinate(teamId);
                          if (!coord) return null;
                          const si = signStagger++;
                          return (
                            <Marker
                              key={`${teamId}-sign`}
                              coordinates={[coord.lng, coord.lat]}
                            >
                              <g
                                className={nbaMapDotBurstClass(
                                  showDots,
                                  !!reduceMotion
                                )}
                                style={
                                  !reduceMotion && showDots
                                    ? {
                                        animationDelay: `${si * NBA_MAP_DOT_STAGGER_MS}ms`,
                                      }
                                    : undefined
                                }
                              >
                                <InteractiveTeamDot
                                  teamId={teamId}
                                  selectedTeamId={selectedTeamId}
                                  setSelectedTeamId={setSelectedTeamId}
                                  narrowViewport={narrowViewport}
                                  divisionMode={divisionMode}
                                  language={language}
                                  reduceMotion={!!reduceMotion}
                                  mapLayer="sign"
                                  {...hoverProps}
                                />
                              </g>
                            </Marker>
                          );
                        })}

                        {NBA_MARKET_CALLOUTS.map((pair) => {
                          if (!pair.teamIds.every((id) => teamIdsInView.includes(id))) {
                            return null;
                          }
                          const k = narrowViewport ? 1.12 : 1;
                          const laShiftX =
                            pair.key === "la" && narrowViewport ? 28 : 0;
                          return (
                            <Marker
                              key={`${pair.key}-sign`}
                              coordinates={[pair.anchor.lng, pair.anchor.lat]}
                              className="touch-manipulation"
                            >
                              <g>
                                {sortCalloutEndpointsStable(pair.endpoints).map(
                                  (ep) => {
                                  const x = ep.x * k + laShiftX;
                                  const y = ep.y * k;
                                  const si = signStagger++;
                                  return (
                                    <g
                                      key={`${pair.key}-sign-${ep.teamId}`}
                                      transform={`translate(${x},${y})`}
                                    >
                                      <g
                                        className={nbaMapDotBurstClass(
                                          showDots,
                                          !!reduceMotion
                                        )}
                                        style={
                                          !reduceMotion && showDots
                                            ? {
                                                animationDelay: `${si * NBA_MAP_DOT_STAGGER_MS}ms`,
                                              }
                                            : undefined
                                        }
                                      >
                                        <InteractiveTeamDot
                                          teamId={ep.teamId}
                                          selectedTeamId={selectedTeamId}
                                          setSelectedTeamId={setSelectedTeamId}
                                          narrowViewport={narrowViewport}
                                          divisionMode={divisionMode}
                                          language={language}
                                          reduceMotion={!!reduceMotion}
                                          mapLayer="sign"
                                          {...hoverProps}
                                        />
                                      </g>
                                    </g>
                                  );
                                })}
                              </g>
                            </Marker>
                          );
                        })}
                      </g>
                    </>
                  );
                })()}
              </g>
            </ComposableMap>
                </div>
                <NbaMapGlassZoomControls
                  dock="corner"
                  language={language}
                  mapGestureRef={mapGestureRef}
                  mapViewTransform={mapViewTransform}
                  mapViewTransformRef={mapViewTransformRef}
                  setMapViewTransform={setMapViewTransform}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 lg:hidden">
                  <NbaMapGlassZoomControls
                    dock="row"
                    language={language}
                    mapGestureRef={mapGestureRef}
                    mapViewTransform={mapViewTransform}
                    mapViewTransformRef={mapViewTransformRef}
                    setMapViewTransform={setMapViewTransform}
                  />
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            className="pointer-events-none absolute inset-x-0 top-0 z-10 px-0.5 pt-0.5 max-lg:px-0 max-lg:pt-0.5 lg:px-1 lg:pt-1"
            variants={fadeItem}
          >
            <div
              className={[
                nameRajdhani.className,
                "pointer-events-auto rounded-xl border border-cyan-500/25 bg-[#050814]/78",
                "px-2 py-1.5 shadow-[0_8px_28px_rgba(0,0,0,0.55)] backdrop-blur-md max-lg:px-1.5 max-lg:py-1",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 max-lg:gap-x-1.5 max-lg:gap-y-1 lg:justify-between">
                <div
                  className={[
                    "shrink-0 font-semibold tracking-wide text-white/95",
                    narrowViewport ? "text-base" : "text-lg sm:text-xl",
                  ].join(" ")}
                >
                  NBA MAP
                </div>
                <div className="flex flex-1 flex-wrap items-center justify-end gap-1.5 lg:hidden">
                  <button
                    type="button"
                    onClick={() => {
                      setDivision("all");
                      setSelectedTeamId(null);
                    }}
                    className={[
                      "rounded-full px-3 py-1 text-[13px] font-medium transition-colors max-lg:px-2.5 max-lg:py-1 max-lg:text-[12px]",
                      division === "all"
                        ? "bg-[#6EA8FE]/25 text-white"
                        : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/85",
                    ].join(" ")}
                  >
                    {divisionTabLabel("all")}
                  </button>
                  {NBA_DIVISION_ORDER.map((id) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setDivision(id);
                        setSelectedTeamId(null);
                      }}
                      className={[
                        "rounded-full px-3 py-1 text-[13px] font-medium transition-colors max-lg:px-2.5 max-lg:py-1 max-lg:text-[12px]",
                        division === id
                          ? "bg-[#6EA8FE]/25 text-white"
                          : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/85",
                      ].join(" ")}
                    >
                      {divisionTabLabel(id)}
                    </button>
                  ))}
                </div>
                <DivisionTabBar
                  division={division}
                  setDivision={setDivision}
                  setSelectedTeamId={setSelectedTeamId}
                  labelFn={divisionTabLabel}
                  className="hidden max-w-full min-w-0 flex-1 justify-end gap-x-1.5 gap-y-1.5 lg:flex lg:items-center"
                  pillClassName="rounded-full px-2.5 py-1 text-[12px] sm:px-3 sm:py-1 sm:text-[13px] lg:px-4 lg:py-2 lg:text-base"
                />
              </div>
            </div>
          </motion.div>
          </div>
        </motion.div>

        <motion.aside
          className={[
            nameRajdhani.className,
            "w-full shrink-0 rounded-2xl border border-white/10 bg-black/35 p-4 lg:w-[300px]",
          ].join(" ")}
          variants={fadeItem}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2.5 max-lg:pb-3 lg:pb-3">
            <div
              className={[
                "font-medium uppercase tracking-[0.14em] text-white/45",
                "text-xs max-lg:text-[13px] lg:text-sm",
              ].join(" ")}
            >
              {language === "en" ? "Team detail" : "チーム内訳"}
            </div>
            <div className="flex shrink-0 gap-1 max-lg:gap-1 lg:gap-2">
              {(["7d", "30d"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setMapRange(r)}
                  className={[
                    "rounded-md font-semibold tabular-nums transition-colors duration-150 ease-out",
                    "px-2.5 py-1 text-[13px] max-lg:px-2.5 max-lg:py-1 max-lg:text-[13px]",
                    "lg:rounded-lg lg:px-4 lg:py-2 lg:text-base",
                    mapRange === r
                      ? "bg-sky-500/35 text-sky-100"
                      : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white/75",
                  ].join(" ")}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          {!selectedTeamId ? (
            <p className="mt-3 text-sm text-white/50">
              {language === "en"
                ? "Tap a team dot on the map."
                : "地図上のチームの点をタップしてください。"}
            </p>
          ) : (
            <div
              ref={statsDetailRef}
              className="mt-3 space-y-2 text-sm max-lg:mt-2 max-lg:space-y-1 lg:mt-4 lg:space-y-2.5 lg:text-base"
            >
              <div
                className={[
                  "text-base font-semibold leading-snug max-lg:text-lg max-lg:leading-tight lg:text-xl",
                  linkColor ? "" : "text-white",
                ].join(" ")}
                style={
                  linkColor
                    ? {
                        color: linkColor,
                        textShadow: `0 0 24px ${linkColor}44`,
                      }
                    : undefined
                }
              >
                {teamLabel(selectedTeamId, language)}
              </div>
              {selectedRow ? (
                <div className="max-lg:space-y-0">
                  <Row
                    label={language === "en" ? "Picks (as winner)" : "予想数（勝者）"}
                    largeValues={narrowViewport}
                    desktopLarge={webLargeTeamStats}
                    valueNode={
                      <CountUpStatValue
                        target={selectedRow.predictions}
                        kind="int"
                        durationMs={700}
                        active={statsCountActive}
                        reduceMotion={!!reduceMotion}
                        sizeClassName={webStatValueClass}
                      />
                    }
                  />
                  <Row
                    label={language === "en" ? "Hits" : "的中数"}
                    largeValues={narrowViewport}
                    desktopLarge={webLargeTeamStats}
                    valueNode={
                      <CountUpStatValue
                        target={selectedRow.wins}
                        kind="int"
                        durationMs={720}
                        active={statsCountActive}
                        reduceMotion={!!reduceMotion}
                        sizeClassName={webStatValueClass}
                      />
                    }
                  />
                  <Row
                    label={language === "en" ? "Hit rate" : "的中率"}
                    largeValues={narrowViewport}
                    desktopLarge={webLargeTeamStats}
                    valueNode={
                      selectedRow.predictions > 0 ? (
                        <CountUpStatValue
                          target={
                            (100 * selectedRow.wins) /
                            selectedRow.predictions
                          }
                          kind="percent"
                          durationMs={780}
                          active={statsCountActive}
                          reduceMotion={!!reduceMotion}
                          sizeClassName={webStatValueClass}
                        />
                      ) : (
                        <span
                          className={[
                            "tabular-nums text-white/90",
                            webStatValueClass,
                          ].join(" ")}
                        >
                          —
                        </span>
                      )
                    }
                  />
                  <Row
                    label={language === "en" ? "Points (sum)" : "得点合計"}
                    largeValues={narrowViewport}
                    desktopLarge={webLargeTeamStats}
                    valueNode={
                      Number.isFinite(selectedRow.pointsSum) ? (
                        <CountUpStatValue
                          target={selectedRow.pointsSum}
                          kind="float1"
                          durationMs={760}
                          active={statsCountActive}
                          reduceMotion={!!reduceMotion}
                          sizeClassName={webStatValueClass}
                        />
                      ) : (
                        <span
                          className={[
                            "tabular-nums text-white/90",
                            webStatValueClass,
                          ].join(" ")}
                        >
                          —
                        </span>
                      )
                    }
                  />
                </div>
              ) : (
                <p className="text-white/55">
                  {language === "en"
                    ? "No picks for this team as winner in the selected period."
                    : "この期間、このチームを勝者にした予想はありません。"}
                </p>
              )}
            </div>
          )}
        </motion.aside>
      </motion.div>
    </motion.div>
  );
}

function Row({
  label,
  value,
  valueNode,
  largeValues,
  desktopLarge,
}: {
  label: string;
  value?: string;
  valueNode?: ReactNode;
  largeValues?: boolean;
  /** lg 以上でラベル・数値を読みやすく拡大（NBA マップのチーム内訳用） */
  desktopLarge?: boolean;
}) {
  const display = valueNode ?? (
    <span
      className={[
        "tabular-nums text-white/90",
        largeValues ? "max-lg:text-lg max-lg:font-semibold" : "",
        desktopLarge ? "lg:text-2xl lg:font-semibold" : "",
      ].join(" ")}
    >
      {value}
    </span>
  );
  return (
    <div
      className={[
        "flex items-baseline justify-between gap-3 border-b border-white/5 py-1.5",
        largeValues ? "max-lg:py-1" : "max-lg:py-2",
        desktopLarge ? "lg:py-2.5" : "",
      ].join(" ")}
    >
      <span
        className={[
          "text-white/50",
          largeValues ? "max-lg:text-sm" : "",
          desktopLarge ? "lg:text-lg lg:leading-snug lg:text-white/60" : "",
        ].join(" ")}
      >
        {label}
      </span>
      <div
        className={[
          largeValues ? "max-lg:text-lg max-lg:font-semibold" : "",
        ].join(" ")}
      >
        {display}
      </div>
    </div>
  );
}
