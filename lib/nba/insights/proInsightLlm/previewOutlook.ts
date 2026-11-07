/**
 * PREVIEW（ピックアップの試合だけ）: 型の相性・欠場込みの厳しさ・日程・前回の対戦・前の試合を 1 枚にまとめ、
 * LLM が「今夜どこで決まるか」の展望を書く。数字はシートに有るものだけ（無い言語は捨てる）。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import type { ProInsightFactPack } from "@/lib/nba/insights/proInsightFacts/types";
import { proInsightTeamAbbr } from "@/lib/nba/insights/proInsightFacts/teamAbbr";
import { buildPreviewTemplate } from "@/lib/nba/insights/proInsightFacts/previewTemplate";
import { INJURY_DIFFICULTY_FACT_KIND } from "@/lib/nba/matchupDifficulty/injuryDifficultyNarrative";
import { allowedFromText, numbersIn } from "@/lib/nba/insights/proInsightLlm/numberGuard";
import { isOpenAiConfigured, openAiChatCompletionJson } from "@/lib/openai/openaiBatch";
import type { ProInsightNarrativeBrief } from "@/lib/predict/proInsightNarrativeTypes";

const LANGS = ["ja", "en", "ko", "zh", "es", "pt", "fr", "de", "ar"] as const;

export function getOpenAiProInsightPreviewModel(): string {
  return process.env.OPENAI_PRO_INSIGHT_PREVIEW_MODEL?.trim() || "gpt-4.1";
}

export function buildPreviewOutlookSheet(pack: ProInsightFactPack): Record<string, unknown> | null {
  if (!pack.preview) return null;
  const tpl = buildPreviewTemplate(pack.preview, pack.seasonKey ?? null);
  const abbr = (id: string) => proInsightTeamAbbr(id);
  const home = abbr(pack.homeTeamId);
  const away = abbr(pack.awayTeamId);

  const table = pack.matchupTable;
  const styleEdges = (table?.rows ?? []).map((r) => {
    const attack = r.home.teamId === r.edgeTeamId ? r.home : r.away;
    const defense = attack === r.home ? r.away : r.home;
    return {
      area: r.label.en,
      edge: abbr(r.edgeTeamId),
      attack: `${abbr(attack.teamId)} ${attack.metric.en} ${attack.value} (league #${attack.rank})`,
      defense: `${abbr(defense.teamId)} ${defense.metric.en} ${defense.value} (league #${defense.rank})`,
      ...(r.notes?.length ? { injuryNotes: r.notes.map((n) => n.en) } : {}),
    };
  });

  const difficultyFact = (pack.sections["INJURY IMPACT"] ?? []).find(
    (f) => f.kind === INJURY_DIFFICULTY_FACT_KIND
  );
  const difficulty = [pack.awayTeamId, pack.homeTeamId].map((teamId) => {
    const side = teamId === pack.homeTeamId ? pack.scheduleDifficulty?.home : pack.scheduleDifficulty?.away;
    const metric = (key: string) =>
      difficultyFact?.metrics.find((m) => m.key === key && m.teamId === teamId)?.value ?? null;
    return {
      team: abbr(teamId),
      venue: teamId === pack.homeTeamId ? "home" : "road",
      ...(side ? { difficulty: side.value, opponentStrength: side.base, smallSample: side.lowSample } : {}),
      ...(metric("difficultyAfter")
        ? {
            difficultyBeforeAbsences: metric("difficultyBefore"),
            difficultyWithAbsences: metric("difficultyAfter"),
            ownOut: metric("ownOut"),
            opponentOut: metric("oppOut"),
          }
        : {}),
    };
  });

  const factsOf = (kind: keyof ProInsightFactPack["sections"]) =>
    (pack.sections[kind] ?? [])
      .filter((f) => f.kind !== INJURY_DIFFICULTY_FACT_KIND)
      .map((f) => f.hintEn)
      .filter(Boolean);

  const b2b = (pack.preview?.prevGames ?? [])
    .filter((g) => g.daysBefore === 1)
    .map((g) => abbr(g.teamId));

  return {
    home,
    away,
    phase: pack.phase,
    ...(pack.phase === "early" && pack.gamesPlayed != null ? { gamesPlayedThisSeason: pack.gamesPlayed } : {}),
    ...(table?.seasonKey ? { styleStatsSeason: table.seasonKey, teamsRanked: table.teamCount } : {}),
    styleEdges,
    matchupReads: factsOf("MATCHUP"),
    difficultyScale: "0-100, higher = harder night for that team (opponent strength + venue, then absences)",
    difficulty,
    ...(difficultyFact ? { difficultyRead: difficultyFact.hintEn } : {}),
    injuries: factsOf("INJURY IMPACT"),
    schedule: factsOf("SCHEDULE"),
    ...(b2b.length ? { secondNightOfBackToBack: b2b } : {}),
    context: factsOf("CONTEXT"),
    ...(tpl?.meeting ? { lastMeeting: tpl.meeting.en } : {}),
    ...(tpl?.recent ? { lastGames: tpl.recent.en } : {}),
  };
}

export const PREVIEW_OUTLOOK_SYSTEM = `You write the PREVIEW for one NBA game in the UNITERZ app: the outlook a sharp NBA analyst gives before tip-off. It is NOT a stats list and NOT a recap.
Return ONLY valid JSON (no markdown).

Input "sheet" = facts computed by code (English). Use ONLY what is in it.

Write exactly 3 paragraphs:
1) Where tonight is decided. Pick the 1–2 style areas that matter most (styleEdges + matchupReads; weigh injuryNotes that thin a defense or an attack). Explain the mechanism: whose strength meets whose weakness, what that looks like on the floor (extra possessions, second chances, transition, rim pressure, spacing), and which player drives it when the sheet names one.
2) Difficulty and condition. Who has the harder night and why: difficulty (with absences when given), schedule load (secondNightOfBackToBack, travel, dense stretch), heavy minutes. Say what it changes in the game (late-game legs, rotation depth, pace, who carries the scoring load). When an absence moves difficulty, say what that absence takes away.
3) What the last meeting and last games tell us. Use them as evidence that supports or complicates paragraphs 1–2 (who carried it last time, how a team won or lost its last game, heavy minutes on a back-to-back). End with 1–2 concrete watch points for tonight — observable in-game signs (e.g. "if THUNDER win the turnover battle early, WIZARDS get few chances to run").

Reading the sheet:
- styleEdges ranks: league #1 = best at that metric among teamsRanked. For "Opp …" metrics (what a team ALLOWS), #1 = allows the least, so a high number like #27 = a weak defense in that area.
- Meanings: Paint PTS = scoring at the rim/inside; Opp paint PTS = interior defense. 2nd-chance PTS / OREB% = offensive rebounding; Opp 2nd-chance PTS / Opp OREB% = DEFENSIVE REBOUNDING (boxing out), NOT rim protection. TOV% = ball security (lower is better); Forced TO / Opp TOV = forcing turnovers. PTS off TO = scoring off the other team's turnovers (transition). Fast break PTS = transition. 3PM/3PA/3P% = perimeter shooting; Opp 3P… = perimeter defense. FTA rate = getting to the line.
- injuryNotes / injuries / difficulty.ownOut name tonight's absences. If none are given, say nothing about health (never claim "no injuries" or "full strength").
- Tie a style (drives, rim pressure, threes, rebounding) to a player ONLY when the sheet ties that player to it. Players named only in lastMeeting / lastGames are evidence of what happened, not of how they play.

Rules:
- Interpret, never list. Every sentence must say why it matters tonight. Do not walk through the sheet item by item; select.
- At most 3 numbers per paragraph. Prefer words ("one of the league's worst defensive glass teams", JA 「リーグ下位の」) over raw ranks; use a number only when it is the point.
- Every number, name, status, date and record must come from the sheet. No invented stats, no arithmetic, no new ranks. Never write a number that is not in the sheet.
- Do NOT pick a winner, predict a score, or give betting advice. You MAY say an area or the matchup leans toward a team.
- If phase is "early" or "opening", mention the small sample once, briefly. If styleStatsSeason is an earlier season than the game, say those numbers are from that season.
- Team names = nicknames exactly as in the sheet (THUNDER). Player names in English as written (S.Gilgeous-Alexander). Status words OUT / questionable / doubtful stay English in every language.
- Each paragraph 2–4 sentences. JA: 1 段落 100〜160 字程度。スポーツ記者の展望の文体（だ・である調 / 体言止め可。です・ます調にしない）。
- Banned filler: JA 「注目の一戦」「見逃せない」「期待される」「鍵になる」(without saying what), EN "it will be interesting", "only time will tell", "a must-watch".
- Write the same content, natural and native, in ja, en, ko, zh, es, pt, fr, de, ar.

Output shape:
{ "paragraphs": { "ja": ["p1", "p2", "p3"], "en": [...], "ko": [...], "zh": [...], "es": [...], "pt": [...], "fr": [...], "de": [...], "ar": [...] } }`;

function allowedNumbersFromSheet(sheet: Record<string, unknown>): Set<string> {
  const text = JSON.stringify(sheet);
  const allowed = new Set<string>(["1", "2"]);
  allowedFromText(allowed, text);
  for (const m of text.matchAll(/(\d{1,2})\/(\d{1,2})/g)) {
    allowed.add(String(Number(`${m[1]}.${m[2]}`)));
    allowed.add(String(Number(`${m[2]}.${m[1]}`)));
  }
  return allowed;
}

function paragraphsOf(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  const out = raw.filter((p): p is string => typeof p === "string").map((p) => p.trim()).filter(Boolean);
  return out.length >= 2 ? out : null;
}

function parseOutlook(content: string, allowed: Set<string>): { text: Partial<UiStrings>; bad: string[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { text: {}, bad: [...LANGS] };
  }
  const byLang = (parsed as { paragraphs?: Record<string, unknown> })?.paragraphs ?? {};
  const text: Partial<UiStrings> = {};
  const bad: string[] = [];
  for (const lang of LANGS) {
    const paras = paragraphsOf(byLang[lang]);
    const joined = paras?.join("\n");
    const stray = joined ? numbersIn(joined).filter((n) => !allowed.has(n)) : [];
    if (!joined || stray.length) {
      bad.push(stray.length ? `${lang}(${stray.join(",")})` : lang);
      continue;
    }
    text[lang] = joined;
  }
  return { text, bad };
}

export async function generatePreviewOutlook(pack: ProInsightFactPack): Promise<UiStrings | null> {
  const sheet = buildPreviewOutlookSheet(pack);
  if (!sheet || !isOpenAiConfigured()) return null;
  const allowed = allowedNumbersFromSheet(sheet);
  for (let attempt = 0; attempt < 2; attempt++) {
    let content: string;
    try {
      content = await openAiChatCompletionJson({
        model: getOpenAiProInsightPreviewModel(),
        system: PREVIEW_OUTLOOK_SYSTEM,
        user: JSON.stringify({ sheet }, null, 1),
        temperature: 0.4,
      });
    } catch (e) {
      console.warn("[pro-insight] preview outlook failed", e instanceof Error ? e.message : e);
      return null;
    }
    const { text, bad } = parseOutlook(content, allowed);
    if (bad.length) console.warn(`[pro-insight] preview outlook dropped: ${bad.join(" ")}`);
    if (!text.ja || !text.en) continue;
    const out = { ja: text.ja, en: text.en } as UiStrings;
    for (const lang of LANGS) (out as Record<string, string>)[lang] = text[lang] ?? text.en;
    return out;
  }
  return null;
}

/** ピックアップ（pack.preview あり）だけ展望を付ける。それ以外は preview を外す */
export async function withPreviewOutlook(
  brief: ProInsightNarrativeBrief,
  pack: ProInsightFactPack
): Promise<ProInsightNarrativeBrief> {
  const { preview: _old, ...rest } = brief;
  if (!pack.preview) return rest;
  const preview = await generatePreviewOutlook(pack);
  return preview ? { ...rest, preview } : rest;
}
