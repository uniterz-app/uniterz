/**
 * 月間ランキングバッジ（2026-10 〜）。
 *
 * badgeId: `{pickup|pro}_monthly_{YYYY}_{MM}_{metricSlug}_rank{n}`（`rankingBadgeId.ts` と同じ書式）
 * 付与: 総合スコア 1〜3 位、アップセット・得点者的中・勝率は 1 位だけ。同値は同順位（全員に付与）。
 * 画像: `public/badges/monthly/{YYYY-MM}/` に表と裏面。画像が揃った月だけ付与する。
 * user_badges.meta に付与時点の名前と記録を固定し、アプリの裏面に刻む。
 *
 * Functions へは `npm run sync:monthly-ranking-badge` でコピーする（import を足さないこと）。
 */

export type MonthlyBadgeDivision = "pickup" | "pro";
export type MonthlyBadgeKind = "overall" | "upset" | "scorer" | "winrate";
export type MonthlyBadgeSnapshotMetric =
  | "totalPoints"
  | "totalUpset"
  | "totalGoalScorerHits"
  | "winRate";

export type MonthlyBadgeKindSpec = {
  kind: MonthlyBadgeKind;
  metricSlug: string;
  snapshotMetric: MonthlyBadgeSnapshotMetric;
  maxRank: number;
};

export const MONTHLY_BADGE_KINDS: readonly MonthlyBadgeKindSpec[] = [
  { kind: "overall", metricSlug: "total_points", snapshotMetric: "totalPoints", maxRank: 3 },
  { kind: "upset", metricSlug: "upset", snapshotMetric: "totalUpset", maxRank: 1 },
  { kind: "scorer", metricSlug: "goal_scorer", snapshotMetric: "totalGoalScorerHits", maxRank: 1 },
  { kind: "winrate", metricSlug: "win_rate", snapshotMetric: "winRate", maxRank: 1 },
];

export const MONTHLY_BADGE_DIVISIONS: readonly MonthlyBadgeDivision[] = ["pickup", "pro"];

/** 最初の月。これより前の月間ランキングには付与しない */
export const MONTHLY_BADGE_FIRST_LABEL = "2026-10";

export type MonthlyBadgeRef = {
  division: MonthlyBadgeDivision;
  /** YYYY-MM */
  label: string;
  kind: MonthlyBadgeKind;
  rank: number;
};

function specForKind(kind: MonthlyBadgeKind): MonthlyBadgeKindSpec {
  for (const s of MONTHLY_BADGE_KINDS) if (s.kind === kind) return s;
  throw new Error(`unknown monthly badge kind: ${kind}`);
}

export function monthlyRankingBadgeId(ref: MonthlyBadgeRef): string {
  const [y, m] = ref.label.split("-");
  return `${ref.division}_monthly_${y}_${m}_${specForKind(ref.kind).metricSlug}_rank${ref.rank}`;
}

const MONTHLY_BADGE_ID_RE =
  /^(pickup|pro)_monthly_(\d{4})_(\d{2})_(total_points|upset|goal_scorer|win_rate)_rank(\d+)$/;

export function parseMonthlyRankingBadgeId(badgeId: string): MonthlyBadgeRef | null {
  const m = MONTHLY_BADGE_ID_RE.exec(badgeId.trim());
  if (!m) return null;
  const label = `${m[2]}-${m[3]}`;
  if (label < MONTHLY_BADGE_FIRST_LABEL) return null;
  let kind: MonthlyBadgeKind | null = null;
  for (const s of MONTHLY_BADGE_KINDS) if (s.metricSlug === m[4]) kind = s.kind;
  const rank = Number(m[5]);
  if (!kind || !Number.isFinite(rank) || rank < 1) return null;
  return { division: m[1] as MonthlyBadgeDivision, label, kind, rank };
}

/** 付与対象の全バッジ（その月・両部門） */
export function monthlyBadgeRefsForLabel(label: string): MonthlyBadgeRef[] {
  const out: MonthlyBadgeRef[] = [];
  for (const division of MONTHLY_BADGE_DIVISIONS) {
    for (const spec of MONTHLY_BADGE_KINDS) {
      for (let rank = 1; rank <= spec.maxRank; rank++) {
        out.push({ division, label, kind: spec.kind, rank });
      }
    }
  }
  return out;
}

// ---------------------------------------------------------------- 画像

export const MONTHLY_BADGE_ART_ROOT = "/badges/monthly";

export type MonthlyBadgeArt = {
  /** 表（768px）。一覧・詳細・受け取り演出で共通。master_badges.icon */
  full: string;
  /** 裏面（768px）。刻印は `monthlyBadgeBackPanel` の範囲にアプリが重ねる */
  back: string;
};

export function monthlyBadgeArt(ref: MonthlyBadgeRef): MonthlyBadgeArt {
  const dir = `${MONTHLY_BADGE_ART_ROOT}/${ref.label}`;
  const name = `${ref.division}-${ref.kind}-${ref.rank}`;
  return {
    full: `${dir}/${name}.webp`,
    back: `${dir}/back-${ref.division}-${Math.min(ref.rank, 3)}.webp`,
  };
}

export type MonthlyBadgeBackPanel = { x: number; y: number; w: number; h: number };

/** 裏面の刻印パネル（画像の幅・高さに対する割合）。2026-10 の形 */
export const MONTHLY_BADGE_BACK_PANEL: Record<MonthlyBadgeDivision, MonthlyBadgeBackPanel> = {
  pickup: { x: 0.19, y: 0.21, w: 0.62, h: 0.49 },
  pro: { x: 0.23, y: 0.236, w: 0.54, h: 0.484 },
};

/** 月ごとに形を変えた月の刻印パネル。無い月は `MONTHLY_BADGE_BACK_PANEL` */
const MONTHLY_BADGE_BACK_PANEL_BY_LABEL: Record<string, Record<MonthlyBadgeDivision, MonthlyBadgeBackPanel>> = {
  "2026-11": {
    pickup: { x: 0.23, y: 0.262, w: 0.54, h: 0.456 },
    pro: { x: 0.22, y: 0.268, w: 0.56, h: 0.464 },
  },
};

export function monthlyBadgeBackPanel(ref: MonthlyBadgeRef): MonthlyBadgeBackPanel {
  return MONTHLY_BADGE_BACK_PANEL_BY_LABEL[ref.label]?.[ref.division] ?? MONTHLY_BADGE_BACK_PANEL[ref.division];
}

/** 裏面の文字色（黒いプレートの上に順位の金属の明るい色） */
export const MONTHLY_BADGE_ENGRAVE_INK: Record<number, string> = {
  1: "#f6dc96",
  2: "#eef2f6",
  3: "#efbf93",
};

// ---------------------------------------------------------------- 文言

export type MonthlyBadgeLang = "ja" | "en" | "ko" | "zh" | "es" | "pt" | "fr";

const KIND_LABEL: Record<MonthlyBadgeKind, Record<MonthlyBadgeLang, string>> = {
  overall: { ja: "総合スコア", en: "Overall Score", ko: "종합 점수", zh: "综合得分", es: "Puntuación total", pt: "Pontuação geral", fr: "Score total" },
  upset: { ja: "アップセット", en: "Upset", ko: "업셋", zh: "爆冷", es: "Sorpresa", pt: "Zebra", fr: "Exploit" },
  scorer: { ja: "得点者的中", en: "Scorer Hits", ko: "득점자 적중", zh: "得分手命中", es: "Aciertos de anotador", pt: "Acertos de cestinha", fr: "Marqueurs trouvés" },
  winrate: { ja: "勝率", en: "Win Rate", ko: "승률", zh: "胜率", es: "% de victorias", pt: "Taxa de vitórias", fr: "Taux de victoire" },
};

const KIND_LABEL_ART: Record<MonthlyBadgeKind, string> = {
  overall: "OVERALL SCORE",
  upset: "UPSET",
  scorer: "SCORER HITS",
  winrate: "WIN RATE",
};

const MONTH_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthlyBadgeDivisionLabel(division: MonthlyBadgeDivision): string {
  return division === "pro" ? "PRO LEAGUE" : "PICK UP";
}

export function monthlyBadgeKindLabel(kind: MonthlyBadgeKind, lang: MonthlyBadgeLang | string): string {
  return KIND_LABEL[kind][lang as MonthlyBadgeLang] ?? KIND_LABEL[kind].en;
}

/** 刻印用（英大文字） */
export function monthlyBadgeKindLabelArt(kind: MonthlyBadgeKind): string {
  return KIND_LABEL_ART[kind];
}

/** "2026-10" → "OCT 2026" */
export function monthlyBadgeMonthArt(label: string): string {
  const [y, m] = label.split("-");
  return `${(MONTH_EN[Number(m) - 1] ?? m).toUpperCase()} ${y}`;
}

function monthText(label: string, lang: MonthlyBadgeLang | string): string {
  const [y, m] = label.split("-");
  const mm = Number(m);
  if (lang === "ja" || lang === "zh") return `${y}年${mm}月`;
  if (lang === "ko") return `${y}년 ${mm}월`;
  if (lang === "en") return `${MONTH_EN[mm - 1] ?? m} ${y}`;
  return `${String(mm).padStart(2, "0")}/${y}`;
}

export function monthlyBadgeRankOrdinal(rank: number): string {
  const mod100 = rank % 100;
  const suffix =
    mod100 >= 11 && mod100 <= 13 ? "TH" : rank % 10 === 1 ? "ST" : rank % 10 === 2 ? "ND" : rank % 10 === 3 ? "RD" : "TH";
  return `${rank}${suffix}`;
}

/** 未対応の言語は英語 */
export function monthlyBadgeCopy(
  ref: MonthlyBadgeRef,
  lang: MonthlyBadgeLang | string
): { title: string; description: string } {
  const div = monthlyBadgeDivisionLabel(ref.division);
  const metric = monthlyBadgeKindLabel(ref.kind, lang);
  const month = monthText(ref.label, lang);
  const r = ref.rank;
  switch (lang) {
    case "ja":
      return {
        title: `${div} ${month} ${metric} ${r}位`,
        description: `${month}の ${div} 月間ランキングで${metric}${r}位になった人に贈られるバッジ。`,
      };
    case "ko":
      return {
        title: `${div} ${month} ${metric} ${r}위`,
        description: `${month} ${div} 월간 랭킹에서 ${metric} ${r}위를 기록한 사람에게 수여되는 배지.`,
      };
    case "zh":
      return {
        title: `${div} ${month} ${metric} 第${r}名`,
        description: `授予在${month} ${div} 月度排名中${metric}第${r}名的用户。`,
      };
    case "es":
      return {
        title: `${div} ${month} · ${metric} #${r}`,
        description: `Para quien terminó #${r} en ${metric} en la clasificación mensual de ${div} (${month}).`,
      };
    case "pt":
      return {
        title: `${div} ${month} · ${metric} #${r}`,
        description: `Para quem terminou em #${r} em ${metric} no ranking mensal do ${div} (${month}).`,
      };
    case "fr":
      return {
        title: `${div} ${month} · ${metric} #${r}`,
        description: `Décerné au #${r} en ${metric} du classement mensuel ${div} (${month}).`,
      };
    default:
      return {
        title: `${div} ${month} · ${metric} #${r}`,
        description: `Awarded for finishing #${r} in ${metric} in the ${div} monthly ranking for ${month}.`,
      };
  }
}

/** master_badges/{badgeId} に書く内容 */
export function monthlyBadgeMasterDoc(ref: MonthlyBadgeRef): Record<string, unknown> {
  const ja = monthlyBadgeCopy(ref, "ja");
  const en = monthlyBadgeCopy(ref, "en");
  return {
    title: ja.title,
    description: ja.description,
    titleEn: en.title,
    descriptionEn: en.description,
    icon: monthlyBadgeArt(ref).full,
    league: "nba",
    type: "ranking",
    period: "monthly",
    label: ref.label,
    division: ref.division,
    kind: ref.kind,
    rank: ref.rank,
  };
}

/** 刻印する記録の表示（例: 262.4 PTS / 71.4% WIN RATE） */
export function formatMonthlyBadgeValue(
  kind: MonthlyBadgeKind,
  value: number | null | undefined
): { value: string; unit: string } | null {
  if (value == null || !Number.isFinite(value)) return null;
  const one = (n: number) => {
    const r = Math.round(n * 10) / 10;
    return Number.isInteger(r) ? String(r) : r.toFixed(1);
  };
  switch (kind) {
    case "winrate":
      return { value: `${one(value * 100)}%`, unit: "WIN RATE" };
    case "scorer":
      return { value: String(Math.round(value)), unit: value === 1 ? "HIT" : "HITS" };
    case "upset":
      return { value: one(value), unit: "UPSET PTS" };
    default:
      return { value: one(value), unit: "PTS" };
  }
}

// ---------------------------------------------------------------- 付与対象

export type MonthlyBadgeSnapshotRow = {
  uid?: unknown;
  rank?: unknown;
  displayName?: unknown;
  handle?: unknown;
  totalPoints?: unknown;
  totalUpset?: unknown;
  totalGoalScorerHits?: unknown;
  winRate?: unknown;
  totalPosts?: unknown;
};

export type MonthlyBadgeSnapshot = {
  rows?: MonthlyBadgeSnapshotRow[];
  rewardableMaxRank?: unknown;
  participantCount?: unknown;
};

export type MonthlyBadgeGrant = {
  uid: string;
  badgeId: string;
  ref: MonthlyBadgeRef;
  /** 記録（総合・アップセットは pt、得点者は回数、勝率は 0–1） */
  value: number | null;
  /** 付与時点の表示名（刻印） */
  engravedName: string;
  handle: string | null;
  posts: number | null;
  participantCount: number | null;
};

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
};

/**
 * スナップショット（その月・部門・指標）から付与対象を出す。
 * 値 0 以下の同率（rewardableMaxRank より下）には付与しない。
 */
export function monthlyBadgeGrantsFromSnapshot(opts: {
  label: string;
  division: MonthlyBadgeDivision;
  kind: MonthlyBadgeKind;
  snapshot: MonthlyBadgeSnapshot;
}): MonthlyBadgeGrant[] {
  const spec = specForKind(opts.kind);
  const cap = num(opts.snapshot.rewardableMaxRank);
  const maxRank = cap != null ? Math.min(spec.maxRank, cap) : spec.maxRank;
  const participantCount = num(opts.snapshot.participantCount);
  const out: MonthlyBadgeGrant[] = [];
  for (const row of opts.snapshot.rows ?? []) {
    const uid = typeof row.uid === "string" ? row.uid.trim() : "";
    const rank = num(row.rank);
    if (!uid || rank == null || rank < 1 || rank > maxRank) continue;
    const ref: MonthlyBadgeRef = { division: opts.division, label: opts.label, kind: opts.kind, rank };
    const name = typeof row.displayName === "string" ? row.displayName.trim() : "";
    const handle = typeof row.handle === "string" && row.handle.trim() ? row.handle.trim() : null;
    out.push({
      uid,
      badgeId: monthlyRankingBadgeId(ref),
      ref,
      value: num(row[spec.snapshotMetric]),
      engravedName: name || (handle ? `@${handle}` : "UNITERZ"),
      handle,
      posts: num(row.totalPosts),
      participantCount: participantCount != null && participantCount > 0 ? Math.floor(participantCount) : null,
    });
  }
  return out;
}

/** period_ranking_snapshots の doc ID（standard = Pick Up / open = PRO LEAGUE） */
export function monthlyBadgeSnapshotDocId(
  division: MonthlyBadgeDivision,
  label: string,
  kind: MonthlyBadgeKind
): string {
  const prefix = division === "pro" ? "nba_open" : "nba";
  return `${prefix}_monthly_${label}_${specForKind(kind).snapshotMetric}`;
}

/** 裏面に刻む記録（user_badges.meta から） */
export type MonthlyBadgeRecord = {
  engravedName: string;
  handle: string | null;
  value: number | null;
  participantCount: number | null;
};

export function readMonthlyBadgeRecord(meta: unknown): MonthlyBadgeRecord | null {
  if (!meta || typeof meta !== "object") return null;
  const m = meta as Record<string, unknown>;
  if (m.source !== "monthly_ranking") return null;
  const name = typeof m.engravedName === "string" ? m.engravedName.trim() : "";
  const handle = typeof m.handle === "string" && m.handle.trim() ? m.handle.trim() : null;
  const pc = num(m.participantCount);
  return {
    engravedName: name || (handle ? `@${handle}` : "UNITERZ"),
    handle,
    value: num(m.value),
    participantCount: pc != null && pc > 0 ? Math.floor(pc) : null,
  };
}

/** user_badges/{uid}/badges/{badgeId} の meta（grantedAt は呼び出し側で付ける） */
export function monthlyBadgeUserMeta(g: MonthlyBadgeGrant): Record<string, unknown> {
  const meta: Record<string, unknown> = {
    source: "monthly_ranking",
    division: g.ref.division,
    yearMonth: g.ref.label,
    metric: g.ref.kind,
    rank: g.ref.rank,
    engravedName: g.engravedName,
  };
  if (g.value != null) meta.value = g.value;
  if (g.handle) meta.handle = g.handle;
  if (g.posts != null) meta.posts = g.posts;
  if (g.participantCount != null) meta.participantCount = g.participantCount;
  return meta;
}
