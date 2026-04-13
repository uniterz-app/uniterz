"use client";

import { ComposableMap, Geographies, Marker } from "react-simple-maps";
import { motion, useReducedMotion } from "framer-motion";
import type { Dispatch, ReactNode, SetStateAction } from "react";
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

function dotStrokeForLuminance(lum: number, isSel: boolean): {
  stroke: string;
  strokeWidth: number;
} {
  if (isSel) return { stroke: "rgba(255,255,255,0.95)", strokeWidth: 2.65 };
  if (lum > 0.62) {
    return { stroke: "rgba(15, 23, 42, 0.78)", strokeWidth: 1.55 };
  }
  if (lum < 0.35) {
    return { stroke: "rgba(255, 255, 255, 0.55)", strokeWidth: 1.45 };
  }
  return { stroke: "rgba(255, 255, 255, 0.38)", strokeWidth: 1.3 };
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
      scale: Math.round(base.scale * 1.07),
    };
  }
  if (division === "atlantic") {
    return {
      center: [lon, lat - 0.2],
      scale: Math.round(base.scale * 1.52),
    };
  }
  if (division === "central" || division === "pacific") {
    return {
      center: [lon, lat - 0.36],
      scale: Math.round(base.scale * 1.5),
    };
  }
  if (division === "northwest") {
    return {
      center: [lon + 2.6, lat - 0.18],
      scale: Math.round(base.scale * 1.06),
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
    scale: Math.round(base.scale * 0.96),
  };
}

/** 看板ホバー解除の猶予（ドット→看板へ移動しても消えにくくする） */
const NBA_MAP_SIGN_HOVER_CLEAR_MS = 110;

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
  const hitR = narrowViewport
    ? Math.max(28, r + 18)
    : Math.max(20, r + 14);
  const isSel = selectedTeamId === teamId;
  const select = () =>
    setSelectedTeamId((prev) => (prev === teamId ? null : teamId));
  const { stroke, strokeWidth } = dotStrokeForLuminance(fillLum, isSel);
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
          onClick={(e) => {
            e.stopPropagation();
            select();
          }}
        />
        {!isSel && fillLum < 0.32 ? (
          <circle
            r={r + 1.35}
            fill="none"
            stroke="rgba(255,255,255,0.14)"
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

  const signActive = mapHoveredTeamId === teamId;
  const bridgePad = 8;
  const bridgeX = -signW / 2 - bridgePad;
  const bridgeY = -signLift - 26;
  const bridgeW = signW + bridgePad * 2;
  const bridgeH = 30;

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
        onPointerEnter={() => onMapHoverEnterTeam(teamId)}
        onPointerLeave={() => onMapHoverScheduleClear()}
      />
      <g
        className={[
          uvStyles.signGroup,
          signActive ? uvStyles.signGroupActive : "",
        ]
          .filter(Boolean)
          .join(" ")}
        transform={`translate(0,${-signLift})`}
        style={{ pointerEvents: "none" }}
      >
        <rect
          x={-signW / 2}
          y={-22}
          width={signW}
          height={24}
          rx={4}
          className={uvStyles.signRect}
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

  const projectionCfg = useMemo(
    () =>
      projectionForMobile(
        NBA_PREDICTION_MAP_PROJECTION[division],
        narrowViewport,
        division
      ),
    [division, narrowViewport]
  );

  const selectedRow = selectedTeamId ? agg.byTeam[selectedTeamId] : null;

  /** ディビジョンタブは常に英語（ALL / Atlantic 等） */
  const divisionTabLabel = (id: NbaDivisionId | "all") =>
    id === "all" ? "ALL" : NBA_DIVISION_LABEL[id].en;

  const mapW = 960;
  /** モバイルは縦をやや伸ばして同じ投影でも見やすく（アスペクトのみ変更） */
  const mapH = narrowViewport ? 600 : 560;
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
    cancelMapHoverClearTimer();
    setMapHoveredTeamId(null);
  }, [mapKey, cancelMapHoverClearTimer]);

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
  const [markersReveal, setMarkersReveal] = useState(false);

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
    setMarkersReveal(false);
  }, [mapKey, loading]);

  useEffect(() => {
    if (!mapGeoReady || loading) {
      if (!mapGeoReady) setMarkersReveal(false);
      return;
    }
    if (reduceMotion) {
      setMarkersReveal(true);
      return;
    }
    const id = window.setTimeout(() => setMarkersReveal(true), 520);
    return () => clearTimeout(id);
  }, [mapGeoReady, loading, mapKey, reduceMotion]);

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
          className="min-w-0 flex-1 overflow-x-hidden rounded-2xl border border-cyan-500/20 bg-[#040a10]/95 p-2 max-lg:p-1.5"
          variants={staggerInner}
        >
          <motion.div
            className="mb-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-0.5 max-lg:mb-0 max-lg:justify-start max-lg:leading-none"
            variants={fadeItem}
          >
            <div
              className={[
                nameRajdhani.className,
                "shrink-0 font-semibold tracking-wide text-white/95",
                narrowViewport
                  ? "text-lg"
                  : "text-xl sm:text-[1.55rem]",
              ].join(" ")}
            >
              NBA MAP
            </div>
            <DivisionTabBar
              division={division}
              setDivision={setDivision}
              setSelectedTeamId={setSelectedTeamId}
              labelFn={divisionTabLabel}
              className="hidden max-w-full min-w-0 flex-1 justify-end gap-x-1.5 gap-y-1.5 lg:flex lg:items-center"
              pillClassName="rounded-full px-2.5 py-1 text-[12px] sm:px-3 sm:py-1 sm:text-[13px] lg:px-4 lg:py-2 lg:text-base"
            />
          </motion.div>
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

              <g className="nba-map-markers-layer">
                {(() => {
                  let dotStagger = 0;
                  let signStagger = 0;
                  const showDots = markersReveal && mapGeoReady;
                  const hoverProps = {
                    mapHoveredTeamId,
                    onMapHoverEnterTeam,
                    onMapHoverScheduleClear,
                  };
                  return (
                    <>
                      <g className="nba-map-markers-dots">
                        {teamIdsInView.map((teamId) => {
                          if (calloutSkipIds.has(teamId)) return null;
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
                                  {pair.endpoints.map((ep) => {
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
                                {pair.endpoints.map((ep) => {
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
                        {teamIdsInView.map((teamId) => {
                          if (calloutSkipIds.has(teamId)) return null;
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
                                {pair.endpoints.map((ep) => {
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
            </motion.div>
          )}

          <motion.div
            className={[
              nameRajdhani.className,
              "mt-1.5 flex flex-wrap gap-2 border-t border-white/10 pt-2 max-lg:mt-1 max-lg:gap-2 max-lg:pt-1.5 lg:hidden",
            ].join(" ")}
            variants={fadeItem}
          >
            <button
              type="button"
              onClick={() => {
                setDivision("all");
                setSelectedTeamId(null);
              }}
              className={[
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
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
                  "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                  division === id
                    ? "bg-[#6EA8FE]/25 text-white"
                    : "bg-white/5 text-white/55 hover:bg-white/10 hover:text-white/85",
                ].join(" ")}
              >
                {divisionTabLabel(id)}
              </button>
            ))}
          </motion.div>
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
