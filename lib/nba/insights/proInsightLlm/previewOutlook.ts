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
    ...(pack.preview.analysis
      ? {
          teamAnalysisSeason: pack.preview.analysis.seasonKey,
          rankNote: pack.preview.analysis.rankNote,
          teams: pack.preview.analysis.teams,
        }
      : {}),
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

export const PREVIEW_OUTLOOK_SYSTEM = `You write the PREVIEW for one NBA game in the UNITERZ app: the outlook a top NBA analyst writes before tip-off, so a fan making a prediction learns something they could not see by glancing at the stats. It is NOT a stats list and NOT a recap.
Return ONLY valid JSON (no markdown).

Input "sheet" = facts computed by code (English). Use ONLY what is in it.

The value is in CONNECTING facts into a projection one step beyond the numbers. Examples of the depth wanted (placeholders, not real facts — never copy them):
- "TEAM_B give up the most points to guards in the league, and guard P.One lives on isolation and mid-range — set up for a big scoring night."
- "With P.Two OUT, P.Three has averaged far more in the games P.Two missed; expect the offense to run through him, which also means heavy minutes on a back-to-back."
- "Both teams play fast and neither defends the arc — a high-possession, shootout-type game is the likelier shape."
Find the 2–3 strongest such connections in the sheet. Combine: a player's strengths / form / usage × the opponent's weakness at his position or in that play type × absences that shift the load × pace and style × schedule.

Write exactly 4 paragraphs:
1) The shape of the game. Team-level: pace (fast vs slow → possessions), offense vs defense quality, the biggest style edge (styleEdges / shooting / turnovers / glass), and what kind of game that produces.
2) Players set up for a big (or tough) night. 1–3 players. For each, the reason chain: what he does well (strengths, usage, recent form last5Ppg vs season ppg, season high) × why tonight's opponent is vulnerable to it (opponentVsPosition, the matching team weakness) × load shift from absences (loadShiftWithoutAbsent). Projections are allowed ("a big scoring night is in play", "likely to carry more of the load"); certainty is not.
3) Difficulty and condition. Who has the harder night and why: absences (what each takes away), difficulty with absences, back-to-back / travel / heavy minutes, and what that changes late in the game.
4) Last meeting and last games as evidence for or against the reads above, then 1–2 concrete watch points — in-game signs that tell the fan which way it is going.

Reading the sheet:
- teams[].allowedByPosition: points per game a team gives up to opposing guards / forwards / centers; the rank says #N of M where the highest number = allows the most. keyPlayers[].opponentVsPosition is that line for tonight's opponent vs the player's position — the core of "who is set up".
- teams[] ranks: #1 = best in that stat unless the text says otherwise (pace #1 = fastest, opponent 3P% #1 = stingiest, TOV% #1 = fewest turnovers).
- keyPlayers[].strengths: player ranks among ALL NBA players (e.g. isolation frequency #1).
- loadShiftWithoutAbsent: how a teammate's scoring changed in games the absent player missed this season (small samples — say "in the games he missed").
- Every rank in teams[] carries its tier in words ("top 5", "bottom 10", "allows among the most — a clear weakness", "middle — not an edge"). Your wording must match that tier exactly. Anything marked "middle" is NEVER a strength, weakness, "vulnerable", "soft" or "下位/上位" and is never used as a reason. A player edge from opponentVsPosition counts only when it says "weakness"; "tough matchup" / "stingier" = a harder night for that player.
- Do not print the "#N" rank of a middle item, and do not convert ranks into other numbers (no "5th-most").
- Player names: write them EXACTLY as in the sheet (initial + last name, e.g. "N.Jokic", "T.Haliburton") in EVERY language including English. Never expand to full first names.
- styleEdges ranks: league #1 = best at that metric among teamsRanked. For "Opp …" metrics (what a team ALLOWS), #1 = allows the least, so a high number like #27 = a weak defense in that area.
- Meanings: Paint PTS = scoring at the rim/inside; Opp paint PTS = interior defense. 2nd-chance PTS / OREB% = offensive rebounding; Opp 2nd-chance PTS / Opp OREB% = DEFENSIVE REBOUNDING (boxing out), NOT rim protection. TOV% = ball security (lower is better); Forced TO / Opp TOV = forcing turnovers. PTS off TO = scoring off the other team's turnovers (transition). Fast break PTS = transition. 3PM/3PA/3P% = perimeter shooting; Opp 3P… = perimeter defense. FTA rate = getting to the line.
- injuryNotes / injuries / difficulty.ownOut name tonight's absences. If none are given, say nothing about health (never claim "no injuries" or "full strength").
- Tie a style (drives, rim pressure, threes, rebounding) to a player ONLY when the sheet ties that player to it. Players named only in lastMeeting / lastGames are evidence of what happened, not of how they play.

Rules:
- Interpret, never list. Every sentence must say why it matters tonight. Do not walk through the sheet item by item; select the strongest connections.
- At most 4 numbers per paragraph. Prefer words ("one of the league's worst defensive glass teams", JA 「リーグ下位の」) over raw ranks; use a number only when it is the point.
- Every number, name, status, date and record must come from the sheet. No invented stats, no arithmetic, no new ranks. Never write a number that is not in the sheet.
- Do NOT pick a winner, predict a final score, or give betting advice. You MAY say an area or the matchup leans toward a team, and you MAY project individual output ("big scoring night", "more shots") with its reason.
- If phase is "early" or "opening", mention the small sample once, briefly (e.g. "nine games in"). If styleStatsSeason / teamAnalysisSeason is an earlier season than the game, say those numbers are from that season.
- Team names = nicknames exactly as in the sheet (THUNDER). Player names in English as written (S.Gilgeous-Alexander). Status words OUT / questionable / doubtful stay English in every language.
- Each paragraph 2–4 sentences. JA: 1 段落 110〜180 字程度。スポーツ記者の展望の文体（だ・である調 / 体言止め可。です・ます調にしない）。
- Banned filler: JA 「注目の一戦」「見逃せない」「期待される」「鍵になる」(without saying what), EN "it will be interesting", "only time will tell", "a must-watch".
- Write the same content, natural and native, in ja, en, ko, zh, es, pt, fr, de, ar.

Output shape:
{ "paragraphs": { "ja": ["p1", "p2", "p3", "p4"], "en": [...], "ko": [...], "zh": [...], "es": [...], "pt": [...], "fr": [...], "de": [...], "ar": [...] } }`;

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
