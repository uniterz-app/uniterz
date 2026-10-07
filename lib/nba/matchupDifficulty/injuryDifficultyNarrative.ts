/**
 * Pro Insight INJURY IMPACT 先頭 — 欠場込みの厳しさ「LAL は厳しさ 82 → 65（相手 S.Gilgeous-Alexander 欠場）。それでも厳しい相手。」
 * SCHEDULE の厳しさ（欠場なし）に、選手ごとの欠場の影響（nbaPlayerOutImpact、点）を足して取り直す。
 * 数字の行はコード、続く読みは LLM（`injuryDifficultyFact` → `buildInjuryDifficultyItem`）。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import type { ProInsightNarrativeItem } from "@/lib/predict/proInsightNarrativeTypes";
import type {
  ProInsightFact,
  ProInsightFactMetric,
} from "@/lib/nba/insights/proInsightFacts/types";
import {
  byLang,
  earlySuffix,
  isCjk,
  signed,
  valueText,
  type Lang,
} from "@/lib/nba/matchupDifficulty/difficultyBriefLine";
import {
  combinedTeamNetDelta,
  injuryAdjustedDifficulty,
  type InjuryAdjustedDifficulty,
  type NbaInjuryOutImpact,
} from "@/lib/nba/matchupDifficulty/injuryAdjustedDifficulty";
import type { NbaUpcomingMatchupDifficulty } from "@/lib/nba/matchupDifficulty/upcomingMatchupDifficulty";

/** 「一段厳しく / 戦いやすく」と言う変化幅 */
const BIG_CHANGE = 8;
/** 「影響は小さい」と言う得失点差の変化（点）。厳しさの端は 0/100 に張り付くので点差で見る */
const SMALL_NET_DELTA = 1.5;

type Qualifier = "stillTough" | "muchTougher" | "smallImpact" | "muchEasier";

type Copy = {
  own: (name: string) => string;
  opp: (name: string) => string;
  line: (abbr: string, before: string, after: string, reasons: string) => string;
  ifOut: (abbr: string, names: string, before: string, after: string) => string;
  qualifier: Record<Qualifier, string>;
};

const COPY: Record<Lang, Copy> = {
  ja: {
    own: (n) => `${n} 欠場`,
    opp: (n) => `相手 ${n} 欠場`,
    line: (t, b, a, r) => `${t} は厳しさ ${b} → ${a}（${r}）。`,
    ifOut: (t, n, b, a) => `${t} は ${n} が欠場なら厳しさ ${b} → ${a}。`,
    qualifier: {
      stillTough: "それでも厳しい相手。",
      muchTougher: "主力欠場で一段厳しくなる。",
      smallImpact: "欠場の影響は小さい。",
      muchEasier: "相手の欠場で戦いやすくなる。",
    },
  },
  en: {
    own: (n) => `${n} out`,
    opp: (n) => `opp ${n} out`,
    line: (t, b, a, r) => `${t} Difficulty ${b} → ${a} (${r}).`,
    ifOut: (t, n, b, a) => `${t} Difficulty ${b} → ${a} if ${n} sits.`,
    qualifier: {
      stillTough: "Still a tough opponent.",
      muchTougher: "Losing him makes it clearly harder.",
      smallImpact: "The absence barely moves it.",
      muchEasier: "The opponent's absence makes it clearly easier.",
    },
  },
  ko: {
    own: (n) => `${n} 결장`,
    opp: (n) => `상대 ${n} 결장`,
    line: (t, b, a, r) => `${t} 난이도 ${b} → ${a} (${r}).`,
    ifOut: (t, n, b, a) => `${t}: ${n} 결장 시 난이도 ${b} → ${a}.`,
    qualifier: {
      stillTough: "그래도 까다로운 상대.",
      muchTougher: "주축 결장으로 한층 어려워진다.",
      smallImpact: "결장 영향은 작다.",
      muchEasier: "상대 결장으로 한결 수월해진다.",
    },
  },
  zh: {
    own: (n) => `${n} 缺阵`,
    opp: (n) => `对手 ${n} 缺阵`,
    line: (t, b, a, r) => `${t} 难度 ${b} → ${a}（${r}）。`,
    ifOut: (t, n, b, a) => `${t} 若 ${n} 缺阵，难度 ${b} → ${a}。`,
    qualifier: {
      stillTough: "对手依然难缠。",
      muchTougher: "核心缺阵让比赛明显更难。",
      smallImpact: "缺阵影响不大。",
      muchEasier: "对手缺阵让比赛明显更好打。",
    },
  },
  es: {
    own: (n) => `baja de ${n}`,
    opp: (n) => `baja rival de ${n}`,
    line: (t, b, a, r) => `${t} dificultad ${b} → ${a} (${r}).`,
    ifOut: (t, n, b, a) => `${t}: dificultad ${b} → ${a} si ${n} no juega.`,
    qualifier: {
      stillTough: "Aun así, rival exigente.",
      muchTougher: "La baja lo complica bastante.",
      smallImpact: "La baja apenas pesa.",
      muchEasier: "La baja rival lo facilita bastante.",
    },
  },
  pt: {
    own: (n) => `${n} fora`,
    opp: (n) => `adversário sem ${n}`,
    line: (t, b, a, r) => `${t} dificuldade ${b} → ${a} (${r}).`,
    ifOut: (t, n, b, a) => `${t}: dificuldade ${b} → ${a} se ${n} não jogar.`,
    qualifier: {
      stillTough: "Ainda assim, rival duro.",
      muchTougher: "A baixa pesa bastante.",
      smallImpact: "A baixa pesa pouco.",
      muchEasier: "A baixa rival facilita bastante.",
    },
  },
  fr: {
    own: (n) => `${n} absent`,
    opp: (n) => `adversaire sans ${n}`,
    line: (t, b, a, r) => `${t} difficulté ${b} → ${a} (${r}).`,
    ifOut: (t, n, b, a) => `${t} : difficulté ${b} → ${a} si ${n} est absent.`,
    qualifier: {
      stillTough: "Reste un adversaire coriace.",
      muchTougher: "L'absence alourdit nettement la tâche.",
      smallImpact: "L'absence pèse peu.",
      muchEasier: "L'absence adverse facilite nettement la tâche.",
    },
  },
  de: {
    own: (n) => `${n} fehlt`,
    opp: (n) => `Gegner ohne ${n}`,
    line: (t, b, a, r) => `${t} Schwierigkeit ${b} → ${a} (${r}).`,
    ifOut: (t, n, b, a) => `${t}: Schwierigkeit ${b} → ${a}, falls ${n} fehlt.`,
    qualifier: {
      stillTough: "Trotzdem ein harter Gegner.",
      muchTougher: "Der Ausfall macht es deutlich schwerer.",
      smallImpact: "Der Ausfall wiegt wenig.",
      muchEasier: "Der gegnerische Ausfall erleichtert es deutlich.",
    },
  },
  ar: {
    own: (n) => `غياب ${n}`,
    opp: (n) => `غياب ${n} عن الخصم`,
    line: (t, b, a, r) => `${t} الصعوبة ${b} ← ${a} (${r}).`,
    ifOut: (t, n, b, a) => `${t}: الصعوبة ${b} ← ${a} إذا غاب ${n}.`,
    qualifier: {
      stillTough: "يبقى خصمًا صعبًا.",
      muchTougher: "الغياب يزيد الصعوبة بوضوح.",
      smallImpact: "تأثير الغياب محدود.",
      muchEasier: "غياب الخصم يسهّل المهمة بوضوح.",
    },
  },
};

export type InjuryDifficultySide = {
  teamId: string;
  teamAbbr: string;
  difficulty: NbaUpcomingMatchupDifficulty;
};

type SideRead = {
  side: InjuryDifficultySide;
  adj: InjuryAdjustedDifficulty;
  own: NbaInjuryOutImpact[];
  opp: NbaInjuryOutImpact[];
  conditional: boolean;
};

function qualifierOf(r: SideRead): Qualifier | null {
  if (r.conditional) return null;
  const change = r.adj.after - r.adj.before;
  if (r.opp.length > 0 && change < 0 && r.adj.tierAfter === "tough") return "stillTough";
  if (r.own.length > 0 && change >= BIG_CHANGE) return "muchTougher";
  if (
    r.own.length > 0 &&
    r.opp.length === 0 &&
    Math.abs(combinedTeamNetDelta(r.own.map((i) => i.netDelta))) <= SMALL_NET_DELTA
  ) {
    return "smallImpact";
  }
  if (r.opp.length > 0 && r.own.length === 0 && change <= -BIG_CHANGE) return "muchEasier";
  return null;
}

function readSide(
  side: InjuryDifficultySide,
  impacts: NbaInjuryOutImpact[]
): SideRead | null {
  const pick = (status: NbaInjuryOutImpact["status"], own: boolean) =>
    impacts.filter((i) => i.status === status && (i.teamId === side.teamId) === own);
  let own = pick("out", true);
  let opp = pick("out", false);
  let conditional = false;
  if (own.length === 0 && opp.length === 0) {
    own = pick("questionable", true);
    opp = pick("questionable", false);
    conditional = true;
  }
  if (own.length === 0 && opp.length === 0) return null;
  const adj = injuryAdjustedDifficulty(
    side.difficulty.value,
    combinedTeamNetDelta(own.map((i) => i.netDelta)),
    combinedTeamNetDelta(opp.map((i) => i.netDelta))
  );
  // 「欠場なら 66 → 66」は読みにならない（LLM が向きを捏造する）
  if (conditional && adj.after === adj.before) return null;
  return { side, adj, own, opp, conditional };
}

/** 数字の行「LAL は厳しさ 82 → 65（相手 X 欠場）。」— 常にコードで書く */
function numberLine(r: SideRead, lang: Lang): string {
  const c = COPY[lang];
  const lowSample = r.side.difficulty.lowSample;
  const before = valueText({ value: r.adj.before, lowSample });
  const after = valueText({ value: r.adj.after, lowSample });
  if (r.conditional) {
    const names = [...r.own, ...r.opp].map((i) => i.playerName).join(" / ");
    return c.ifOut(r.side.teamAbbr, names, before, after);
  }
  const reasons = [
    ...r.own.map((i) => c.own(i.playerName)),
    ...r.opp.map((i) => c.opp(i.playerName)),
  ].join(" · ");
  return c.line(r.side.teamAbbr, before, after, reasons);
}

function sentence(r: SideRead, lang: Lang): string {
  const q = qualifierOf(r);
  const qual = q ? `${isCjk(lang) ? "" : " "}${COPY[lang].qualifier[q]}` : "";
  return `${numberLine(r, lang)}${qual}`;
}

/** "2025-26" → "25-26" */
function shortSeason(seasonKey: string): string {
  return seasonKey.replace(/^20(\d{2})-/, "$1-");
}

function evidenceLine(i: NbaInjuryOutImpact, lang: Lang, showWl: boolean): string {
  const status = i.status.toUpperCase();
  const reduced = i.fullDelta !== i.netDelta;
  if (lang === "ja") {
    const wl = showWl && i.whenOutWl ? ` · 欠場時 ${i.whenOutWl}` : "";
    const priced = reduced
      ? ` · ${i.longTerm ? "長期離脱 · " : ""}満額 ${signed(i.fullDelta)} から織り込み済みを除く`
      : "";
    return `${i.playerName} ${status} · 欠場影響 ${signed(i.netDelta)}点（${shortSeason(i.seasonKey)} · 欠場${i.gamesOut}試合）${priced}${wl}`;
  }
  const wl = showWl && i.whenOutWl ? ` · when out ${i.whenOutWl}` : "";
  const priced = reduced
    ? ` · ${i.longTerm ? "long-term · " : ""}full ${signed(i.fullDelta)}, excl. priced-in`
    : "";
  return `${i.playerName} ${status} · impact ${signed(i.netDelta)} pts (${i.seasonKey} · ${i.gamesOut} g out)${priced}${wl}`;
}

/** 長期離脱でほぼ織り込み済み（−0.5 点未満）は文に出さない */
const LONG_TERM_MIN_DELTA = -0.5;

type InjuryDifficultyRead = {
  reads: SideRead[];
  impacts: NbaInjuryOutImpact[];
  lowSample: boolean;
};

function readInjuryDifficulty(
  sides: InjuryDifficultySide[],
  allImpacts: NbaInjuryOutImpact[]
): InjuryDifficultyRead | null {
  const candidates = allImpacts.filter(
    (i) => !(i.longTerm && i.netDelta > LONG_TERM_MIN_DELTA)
  );
  if (candidates.length === 0) return null;
  const reads = sides
    .map((s) => readSide(s, candidates))
    .filter((r): r is SideRead => r != null)
    .sort((a, b) => b.adj.after - a.adj.after);
  if (reads.length === 0) return null;
  const used = new Set(reads.flatMap((r) => [...r.own, ...r.opp]));
  return {
    reads,
    impacts: candidates.filter((i) => used.has(i)),
    lowSample: reads.some((r) => r.side.difficulty.lowSample),
  };
}

/**
 * 欠場影響（点）はこの項目の根拠。欠場時 W–L は選手の項目（2つ目以降）の根拠なので、
 * その選手に自分の項目があるときは出さない。
 */
function templateEvidence(
  read: InjuryDifficultyRead,
  playersWithOwnItem: ReadonlySet<string> = new Set()
): UiStrings[] {
  return read.impacts.map((i) => {
    const showWl = !playersWithOwnItem.has(i.playerName);
    return byLang((lang) => evidenceLine(i, lang === "ja" ? "ja" : "en", showWl));
  });
}

export const INJURY_DIFFICULTY_FACT_KIND = "injury_difficulty";

/** LLM に渡す読みの骨格（英語・数字なし）。主語チームと誰が欠けるかを取り違えないよう平文で書く */
function readHintEn(r: SideRead, oppAbbr: string): string {
  const t = r.side.teamAbbr;
  const own = r.own.map((i) => i.playerName).join(" / ");
  const opp = r.opp.map((i) => i.playerName).join(" / ");
  const harder = r.adj.after > r.adj.before;
  const shift =
    r.adj.after === r.adj.before
      ? "it barely moves"
      : `a modest shift, slightly ${harder ? "harder" : "easier"} for ${t}`;
  if (r.conditional) {
    const who = own ? `${t}'s ${own}` : `${oppAbbr}'s ${opp}`;
    return `${t}: if ${who} sits (questionable), tonight gets ${harder ? "harder" : "easier"} for ${t}.`;
  }
  switch (qualifierOf(r)) {
    case "stillTough":
      return `${t}: ${oppAbbr} are without ${opp} but stay tough — still a hard game for ${t}.`;
    case "muchTougher":
      return `${t}: without their own ${own}, ${t} face a clearly harder game.`;
    case "smallImpact":
      return `${t}: ${t} hold up without their own ${own} — it barely moves.`;
    case "muchEasier":
      return `${t}: ${oppAbbr} are without ${opp} — clearly easier for ${t}.`;
    default: {
      const parts = [
        own ? `${t} without their own ${own}` : "",
        opp ? `${oppAbbr} without ${opp}` : "",
      ].filter(Boolean);
      return `${t}: ${parts.join("; ")} — ${shift}.`;
    }
  }
}

/**
 * INJURY IMPACT 先頭の厳しさファクト。数字の行はコードが書き、LLM は「今夜どう読むか」だけ
 * （payload の injuryDifficulty → 出力の injuryDifficultyRead）。
 */
export function injuryDifficultyFact(
  sides: InjuryDifficultySide[],
  allImpacts: NbaInjuryOutImpact[]
): ProInsightFact | null {
  const read = readInjuryDifficulty(sides, allImpacts);
  if (!read) return null;
  const oppAbbrOf = (r: SideRead) =>
    sides.find((s) => s.teamId !== r.side.teamId)?.teamAbbr ?? "the opponent";
  const metrics: ProInsightFactMetric[] = read.reads.flatMap((r) => {
    const teamId = r.side.teamId;
    const lowSample = r.side.difficulty.lowSample;
    return [
      { key: "difficultyBefore", value: valueText({ value: r.adj.before, lowSample }), teamId },
      { key: "difficultyAfter", value: valueText({ value: r.adj.after, lowSample }), teamId },
      { key: "ownOut", value: r.own.map((i) => i.playerName).join(" · "), teamId },
      { key: "oppOut", value: r.opp.map((i) => i.playerName).join(" · "), teamId },
      {
        key: "difficultyRead",
        value: r.conditional ? "conditional" : qualifierOf(r) ?? "neutral",
        teamId,
      },
    ];
  });
  return {
    id: "injury_difficulty",
    section: "INJURY IMPACT",
    kind: INJURY_DIFFICULTY_FACT_KIND,
    score: 1000,
    teamIds: read.reads.map((r) => r.side.teamId),
    label: "injury_adjusted_difficulty",
    metrics,
    players: read.impacts.map((i) => ({
      playerId: "",
      playerName: i.playerName,
      status: i.status,
    })),
    dedupeKeys: [],
    hintEn: read.reads.map((r) => readHintEn(r, oppAbbrOf(r))).join(" "),
    injuryDifficultyImpacts: read.impacts,
  };
}

/**
 * 厳しさ項目を組み立てる: コードの数字の行 + LLM の読み（injuryDifficultyRead）。
 * 読みに数字・矢印が入っている言語、英語の写し、読みが無いときはテンプレの一言に戻す。
 * evidence は常にコードで作る。
 */
export function buildInjuryDifficultyItem(
  llmRead: UiStrings | undefined,
  sides: InjuryDifficultySide[],
  impacts: NbaInjuryOutImpact[],
  playersWithOwnItem: ReadonlySet<string> = new Set()
): ProInsightNarrativeItem | null {
  const read = readInjuryDifficulty(sides, impacts);
  if (!read) return null;
  const en = llmRead?.en?.trim() ?? "";
  const body = byLang((lang) => {
    const gap = isCjk(lang) ? "" : " ";
    const text = llmRead?.[lang]?.trim() ?? "";
    const usable = text !== "" && !/\d|[→←]/.test(text) && (lang === "en" || text !== en);
    const core = usable
      ? `${read.reads.map((r) => numberLine(r, lang)).join(gap)}${gap}${text}`
      : read.reads.map((r) => sentence(r, lang)).join(gap);
    return `${core}${earlySuffix(read.lowSample, lang)}`.trim();
  });
  return {
    body,
    evidence: templateEvidence(read, playersWithOwnItem),
    template: "injury_difficulty",
  };
}

/** 厳しさ項目の根拠に欠場影響（点）が載る選手名 */
export function injuryDifficultyEvidencePlayers(
  sides: InjuryDifficultySide[],
  impacts: NbaInjuryOutImpact[]
): Set<string> {
  return new Set(readInjuryDifficulty(sides, impacts)?.impacts.map((i) => i.playerName) ?? []);
}
