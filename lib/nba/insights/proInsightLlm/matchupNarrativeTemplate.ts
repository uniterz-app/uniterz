/**
 * MATCHUP 本文・evidence をコードで組み立てる（LLM に書かせない）。
 * 段ごとの守備文言・ラベル・欠場の書き方はここが正。ja / en のみ（他言語は en フォールバック）。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import type {
  ProInsightFact,
  ProInsightMatchupOwner,
} from "@/lib/nba/insights/proInsightFacts/types";
import type { ProInsightNarrativeItem } from "@/lib/predict/proInsightNarrativeTypes";
import { proInsightTeamAbbr } from "@/lib/nba/insights/proInsightFacts/teamAbbr";

type Pair = { ja: string; en: string };

/** clash kind → 攻め / 守り / 場所 */
const CLASH_PHRASES: Record<string, { attack: Pair; defense: Pair; where: Pair }> = {
  paint: {
    attack: { ja: "ペイント得点", en: "paint scoring" },
    defense: { ja: "ペイント守備", en: "paint defense" },
    where: { ja: "ペイント", en: "in the paint" },
  },
  fb: {
    attack: { ja: "速攻の得点", en: "fast-break scoring" },
    defense: { ja: "トランジション守備", en: "transition defense" },
    where: { ja: "トランジション", en: "in transition" },
  },
  off_tov: {
    attack: { ja: "ターンオーバーからの得点", en: "points off turnovers" },
    defense: { ja: "ターンオーバー後の守り", en: "defense after turnovers" },
    where: { ja: "ターンオーバー絡み", en: "off turnovers" },
  },
  second: {
    attack: { ja: "セカンドチャンス得点", en: "second-chance scoring" },
    defense: { ja: "セカンドチャンスの守り", en: "second-chance defense" },
    where: { ja: "セカンドチャンス", en: "on second chances" },
  },
  three: {
    attack: { ja: "3P の試投量", en: "three-point volume" },
    defense: { ja: "3P 守備", en: "three-point defense" },
    where: { ja: "外角", en: "on the perimeter" },
  },
  glass: {
    attack: { ja: "オフェンスリバウンド", en: "offensive rebounding" },
    defense: { ja: "リバウンド守備", en: "defensive rebounding" },
    where: { ja: "ボード", en: "on the boards" },
  },
  tov: {
    attack: { ja: "ボールの安定", en: "ball security" },
    defense: { ja: "ターンオーバーを奪う守り", en: "turnover forcing" },
    where: { ja: "ターンオーバー争い", en: "in the turnover battle" },
  },
  fta: {
    attack: { ja: "フリースロー獲得", en: "getting to the line" },
    defense: { ja: "ファウル管理", en: "foul discipline" },
    where: { ja: "フリースローライン", en: "at the free-throw line" },
  },
};

/** チーム指標 key → evidence ラベル（opp* は「被」= 許した側） */
const TEAM_METRIC_LABELS: Record<string, Pair> = {
  ptsPaint: { ja: "ペイント得点", en: "Paint PTS" },
  oppPtsPaint: { ja: "被ペイント得点", en: "Opp Paint PTS" },
  ptsFb: { ja: "速攻得点", en: "Fast-break PTS" },
  oppPtsFb: { ja: "被速攻得点", en: "Opp Fast-break PTS" },
  ptsTov: { ja: "TO後得点", en: "PTS off TO" },
  oppPtsOffTov: { ja: "被TO後得点", en: "Opp PTS off TO" },
  ptsSecondChance: { ja: "セカンドチャンス得点", en: "2nd-chance PTS" },
  oppPtsSecondChance: { ja: "被セカンドチャンス得点", en: "Opp 2nd-chance PTS" },
  fg3a: { ja: "3PA", en: "3PA" },
  oppFg3Pct: { ja: "被3P%", en: "Opp 3P%" },
  orebPct: { ja: "OREB%", en: "OREB%" },
  oppOrebPct: { ja: "被OREB%", en: "Opp OREB%" },
  tovPct: { ja: "TOV%", en: "TOV%" },
  oppTov: { ja: "強制TO", en: "Forced TO" },
  ftaRate: { ja: "FTA率", en: "FTA rate" },
  oppFtaRate: { ja: "被FTA率", en: "Opp FTA rate" },
};

/** 型オーナー指標 → ラベル */
const OWNER_METRIC_LABELS: Record<string, Pair> = {
  pts_paint: { ja: "ペイント得点", en: "paint PTS" },
  pct_pts_paint: { ja: "ペイント得点比率", en: "paint PTS share" },
  restricted_pts: { ja: "リム付近の得点", en: "restricted-area PTS" },
  paint_touch_pts: { ja: "ペイントタッチ得点", en: "paint-touch PTS" },
  drive_pts: { ja: "ドライブ得点", en: "drive PTS" },
  pts_fb: { ja: "速攻得点", en: "fast-break PTS" },
  trans_pts: { ja: "トランジション得点", en: "transition PTS" },
  trans_freq: { ja: "トランジション頻度", en: "transition freq" },
  pts_tov: { ja: "TO後得点", en: "PTS off TO" },
  stl: { ja: "スティール", en: "STL" },
  oreb: { ja: "オフェンスリバウンド", en: "OREB" },
  oreb_pts: { ja: "プットバック得点", en: "putback PTS" },
  fg3m: { ja: "3P 成功数", en: "3PM" },
  fg3a: { ja: "3P 試投数", en: "3PA" },
  pts_3: { ja: "3P 得点", en: "3P PTS" },
  cns_pts: { ja: "キャッチ&シュート得点", en: "catch-and-shoot PTS" },
  oreb_pct: { ja: "OREB%", en: "OREB%" },
  ast: { ja: "アシスト", en: "AST" },
  ast_pct: { ja: "AST%", en: "AST%" },
  fta: { ja: "FT 試投数", en: "FTA" },
  pts_ft: { ja: "FT 得点", en: "FT PTS" },
  fta_rate: { ja: "FTA率", en: "FTA rate" },
  iso_freq: { ja: "ISO 頻度", en: "ISO freq" },
  iso_pts: { ja: "ISO 得点", en: "ISO PTS" },
  pnr_bh_freq: { ja: "PnR ハンドラー頻度", en: "PnR handler freq" },
  pnr_bh_pts: { ja: "PnR ハンドラー得点", en: "PnR handler PTS" },
  post_freq: { ja: "ポストアップ頻度", en: "post-up freq" },
  post_pts: { ja: "ポストアップ得点", en: "post-up PTS" },
  spotup_freq: { ja: "スポットアップ頻度", en: "spot-up freq" },
  spotup_pts: { ja: "スポットアップ得点", en: "spot-up PTS" },
  blk: { ja: "ブロック", en: "BLK" },
  contested_shots: { ja: "コンテスト数", en: "contested shots" },
  dreb: { ja: "ディフェンスリバウンド", en: "DREB" },
  reb: { ja: "リバウンド", en: "REB" },
  reb_pct: { ja: "REB%", en: "REB%" },
  deflections: { ja: "ディフレクション", en: "deflections" },
};

const PLAYTYPE_LABELS: Record<string, Pair> = {
  iso: { ja: "アイソレーション", en: "isolation" },
  pnr: { ja: "PnR（ハンドラー）", en: "pick-and-roll (handler)" },
  post: { ja: "ポストアップ", en: "post-ups" },
  spotup: { ja: "スポットアップ", en: "spot-ups" },
};

function statusWord(status: string): string {
  const s = status.toLowerCase();
  if (s === "out") return "OUT";
  return s;
}

function teamMetricLabel(key: string): Pair {
  return TEAM_METRIC_LABELS[key] ?? { ja: key, en: key };
}

function ownerLabel(owner: ProInsightMatchupOwner): Pair {
  return OWNER_METRIC_LABELS[owner.metricId] ?? { ja: owner.label, en: owner.label };
}

function ownerNote(owner: ProInsightMatchupOwner): Pair {
  const l = ownerLabel(owner);
  return {
    ja: `${l.ja} ${owner.formatted}・チーム${owner.teamRank}位`,
    en: `${l.en} ${owner.formatted}, #${owner.teamRank} on team`,
  };
}

function ownerEvidence(owner: ProInsightMatchupOwner): Pair {
  const l = ownerLabel(owner);
  return {
    ja: `${owner.playerName} ${l.ja} ${owner.formatted}（チーム#${owner.teamRank}）`,
    en: `${owner.playerName} ${l.en} ${owner.formatted} (#${owner.teamRank} on team)`,
  };
}

function poss(team: string): string {
  return /s$/i.test(team) ? `${team}'` : `${team}'s`;
}

function pair(ja: string, en: string): UiStrings {
  return { ja, en };
}

function renderClash(
  d: Extract<NonNullable<ProInsightFact["matchup"]>, { type: "clash" }>
): ProInsightNarrativeItem | null {
  const p = CLASH_PHRASES[d.clashKind];
  if (!p) return null;
  const A = proInsightTeamAbbr(d.attackTeamId);
  const B = proInsightTeamAbbr(d.defendTeamId);

  let ja: string;
  let en: string;
  if (d.tier === 1) {
    ja = `${A} は${p.attack.ja}が武器。${B} の${p.defense.ja}は脆く、${p.where.ja}は ${A} 有利。`;
    en = `${A} lean on ${p.attack.en}. ${poss(B)} ${p.defense.en} looks vulnerable — edge ${A} ${p.where.en}.`;
  } else if (d.tier === 2) {
    ja = `${A} は${p.attack.ja}が武器。${B} は${p.where.ja}で多く許しており、${A} 有利。`;
    en = `${A} lean on ${p.attack.en}. ${B} give up a lot ${p.where.en} — edge ${A}.`;
  } else {
    ja = `今夜いちばん読みやすいのは${p.where.ja}。${A} の${p.attack.ja}と ${B} の${p.defense.ja}の差が最も大きく、${A} 有利。`;
    en = `Clearest read tonight is ${p.where.en}: ${poss(A)} ${p.attack.en} vs ${poss(B)} ${p.defense.en} is the widest gap — edge ${A}.`;
  }

  if (d.attackOwner) {
    const o = d.attackOwner;
    const n = ownerNote(o);
    const wlJa = d.attackOwnerWhenOutWl ? `（${A} は欠場時 ${d.attackOwnerWhenOutWl}）` : "";
    const wlEn = d.attackOwnerWhenOutWl ? ` (${A} ${d.attackOwnerWhenOutWl} without him)` : "";
    ja += `ただし担い手の ${o.playerName}（${n.ja}）が ${statusWord(o.status)}${wlJa}で、この優位は不確実。`;
    en += ` But ${o.playerName} (${n.en}) is ${statusWord(o.status)}${wlEn}, so that edge is less certain.`;
  }
  if (d.defendOwner) {
    const o = d.defendOwner;
    const n = ownerNote(o);
    ja +=
      d.tier === 3
        ? `さらに ${B} は ${o.playerName}（${n.ja}）が ${statusWord(o.status)} で、差は開きやすい。`
        : `さらに ${B} は ${o.playerName}（${n.ja}）が ${statusWord(o.status)} で、穴は広がりやすい。`;
    en +=
      d.tier === 3
        ? ` With ${o.playerName} (${n.en}) ${statusWord(o.status)} for ${B}, the gap can widen.`
        : ` With ${o.playerName} (${n.en}) ${statusWord(o.status)} for ${B}, that hole opens wider.`;
  }

  const my = teamMetricLabel(d.myKey);
  const opp = teamMetricLabel(d.oppKey);
  let evJa = `${A} ${my.ja} #${d.myRank} · ${B} ${opp.ja} #${d.oppRank}`;
  let evEn = `${A} ${my.en} #${d.myRank} · ${B} ${opp.en} #${d.oppRank}`;
  for (const o of [d.attackOwner, d.defendOwner]) {
    if (!o) continue;
    const e = ownerEvidence(o);
    evJa += ` · ${e.ja}`;
    evEn += ` · ${e.en}`;
  }

  return { body: pair(ja, en), evidence: [pair(evJa, evEn)] };
}

function renderPlaytype(
  d: Extract<NonNullable<ProInsightFact["matchup"]>, { type: "playtype" }>
): ProInsightNarrativeItem {
  const T = proInsightTeamAbbr(d.teamId);
  const pt = PLAYTYPE_LABELS[d.playtypeKind] ?? { ja: d.label, en: d.label };
  const o = d.owner;
  const n = ownerNote(o);
  const ja = `${T} は${pt.ja}が多いチーム（頻度 ${d.freqRank} 位・効率 ${d.pppRank} 位）。その中心の ${o.playerName}（${n.ja}）が ${statusWord(o.status)} で、この形は薄くなりやすい。`;
  const en = `${T} run a lot of ${pt.en} (freq #${d.freqRank}, PPP #${d.pppRank}). ${o.playerName} (${n.en}) carries it and is ${statusWord(o.status)} — that look may thin out.`;
  const e = ownerEvidence(o);
  return {
    body: pair(ja, en),
    evidence: [
      pair(
        `${T} ${d.label} 頻度 #${d.freqRank} · PPP #${d.pppRank} · ${e.ja}`,
        `${T} ${d.label} freq #${d.freqRank} · PPP #${d.pppRank} · ${e.en}`
      ),
    ],
  };
}

export function renderMatchupNarrativeItem(
  fact: ProInsightFact
): ProInsightNarrativeItem | null {
  const d = fact.matchup;
  if (!d) return null;
  return d.type === "clash" ? renderClash(d) : renderPlaytype(d);
}
