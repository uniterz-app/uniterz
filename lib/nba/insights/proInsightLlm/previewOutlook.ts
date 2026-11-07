/**
 * PREVIEW（ピックアップの試合だけ）: 型の相性・欠場込みの厳しさ・日程・前回の対戦・前の試合を 1 枚にまとめ、
 * LLM が「今夜どこで決まるか」の展望を書く。数字はシートに有るものだけ（無い言語は捨てる）。
 */
import type { UiStrings } from "@/lib/i18n/ui";
import type { ProInsightFactPack } from "@/lib/nba/insights/proInsightFacts/types";
import { proInsightTeamAbbr } from "@/lib/nba/insights/proInsightFacts/teamAbbr";
import { buildPreviewTemplate } from "@/lib/nba/insights/proInsightFacts/previewTemplate";
import { INJURY_DIFFICULTY_FACT_KIND } from "@/lib/nba/matchupDifficulty/injuryDifficultyNarrative";
import { rankTier, type OutlookPos } from "@/lib/nba/insights/proInsightFacts/buildOutlookAnalysis";
import { allowedFromText, numbersIn } from "@/lib/nba/insights/proInsightLlm/numberGuard";
import { isOpenAiConfigured, openAiChatCompletionJson } from "@/lib/openai/openaiBatch";
import type {
  ProInsightNarrativeBrief,
  ProInsightPreviewName,
} from "@/lib/predict/proInsightNarrativeTypes";

/** ja / en だけ書かせる（出力が費用の大半）。ほかの言語は表示側が en にフォールバック */
const LANGS = ["ja", "en"] as const;
/** 書き直しは 1 回まで（1 回目 + 再生成 1 回） */
const PREVIEW_MAX_ATTEMPTS = 2;

export function getOpenAiProInsightPreviewModel(): string {
  return process.env.OPENAI_PRO_INSIGHT_PREVIEW_MODEL?.trim() || "gpt-4.1";
}

/** 相性の表の行 → チームを主語にした強み・弱みの言い方（LLM がどちらの弱点かを取り違えないように） */
const STYLE_PHRASES: Record<string, { strong: string; weak: string }> = {
  paint: { strong: "scores a lot in the paint", weak: "gives up a lot of paint points (weak interior defense)" },
  fb: { strong: "scores a lot on fast breaks", weak: "gives up a lot of fast-break points" },
  off_tov: { strong: "scores a lot off turnovers", weak: "gives up a lot of points off its own turnovers" },
  second: {
    strong: "scores a lot of second-chance points",
    weak: "gives up a lot of second-chance points (weak defensive rebounding)",
  },
  three: { strong: "takes a lot of threes", weak: "allows a high opponent 3P% (weak perimeter defense)" },
  glass: { strong: "crashes the offensive glass", weak: "gives up a lot of offensive rebounds (weak defensive rebounding)" },
  tov: { strong: "protects the ball (few turnovers)", weak: "rarely forces turnovers" },
  fta: { strong: "gets to the free-throw line a lot", weak: "sends opponents to the free-throw line a lot" },
};

export function buildPreviewOutlookSheet(pack: ProInsightFactPack): Record<string, unknown> | null {
  if (!pack.preview) return null;
  const tpl = buildPreviewTemplate(pack.preview, pack.seasonKey ?? null);
  const abbr = (id: string) => proInsightTeamAbbr(id);
  const home = abbr(pack.homeTeamId);
  const away = abbr(pack.awayTeamId);

  const table = pack.matchupTable;
  const of = table?.teamCount ?? 30;
  const styleStrengths = new Map<string, string[]>();
  const styleWeaknesses = new Map<string, string[]>();
  const push = (m: Map<string, string[]>, team: string, line: string) => m.set(team, [...(m.get(team) ?? []), line]);
  const styleEdges = (table?.rows ?? []).flatMap((r) => {
    const attack = r.home.teamId === r.edgeTeamId ? r.home : r.away;
    const defense = attack === r.home ? r.away : r.home;
    const attackStrong = attack.rank <= 10;
    const defenseWeak = defense.rank > of - 10;
    // 順位差だけで拾われた行（攻めも守りも中位）は強み・弱みの根拠にならない
    if (!attackStrong && !defenseWeak) return [];
    const A = abbr(attack.teamId);
    const D = abbr(defense.teamId);
    const phrase = STYLE_PHRASES[r.kind] ?? { strong: `strong at ${attack.metric.en}`, weak: `weak at ${defense.metric.en}` };
    const strongLine = `${A} ${phrase.strong} (${attack.metric.en} ${attack.value}, league #${attack.rank}, ${rankTier(attack.rank, of)})`;
    const weakLine = `${D} ${phrase.weak} (${defense.metric.en} ${defense.value}, league #${defense.rank}, ${rankTier(defense.rank, of)})`;
    if (attackStrong) push(styleStrengths, A, strongLine);
    if (defenseWeak) push(styleWeaknesses, D, weakLine);
    const why =
      attackStrong && defenseWeak
        ? `${strongLine}, and ${weakLine}.`
        : attackStrong
          ? `${strongLine}. (Say nothing about ${D}'s side of this area.)`
          : `${weakLine} — this is ${D}'s weakness, not ${A}'s. (Say nothing about ${A}'s side of this area.)`;
    return [
      {
        area: r.label.en,
        favors: A,
        why,
        ...(r.notes?.length ? { injuryNotes: r.notes.map((n) => n.en) } : {}),
      },
    ];
  });
  const teams = pack.preview.analysis?.teams.map((t) => ({
    ...t,
    ...(styleStrengths.get(t.team) ? { styleStrengths: styleStrengths.get(t.team) } : {}),
    ...(styleWeaknesses.get(t.team) ? { styleWeaknesses: styleWeaknesses.get(t.team) } : {}),
  }));

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
          teams,
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
2) Players set up for a big (or tough) night. 2–3 players, and ALWAYS each team's top scorer (teams[].keyPlayers[0]) — a star is never left out just because the opponent has no weakness at his position. For each, the reason chain: what he does well (strengths, usage, recent form last5Ppg vs season ppg, season high) × why tonight's opponent is vulnerable to it (opponentVsPosition, the matching team weakness) × load shift from absences (loadShiftWithoutAbsent). Give each top scorer the full picture: season ppg, last5Ppg, season high, his top 1–2 strengths. If he has no opponentVsPosition, his case rests on his own form, usage and strengths alone — state it with confidence and say nothing about the opponent's defense at his position; never hedge with "how far it works" / 「どこまで通用するか」「どこまで押し切れるか」. When teams[].defensiveReads is present, paragraph 2 MUST include it (the defender vs the named opposing scorer, e.g. "his rim protection makes it a tough night for the opposing center"). Projections are allowed ("a big scoring night is in play", "likely to carry more of the load"); certainty is not.
3) Difficulty and condition. Who has the harder night and why: absences (what each takes away), difficulty with absences, back-to-back / travel / heavy minutes, and what that changes late in the game.
4) Last meeting and last games as evidence for or against the reads above, then 1–2 concrete watch points — in-game signs that tell the fan which way it is going.

Reading the sheet:
- teams[].allowedByPosition: points per game a team gives up to opposing guards / forwards / centers, listed ONLY where the team is top 10 or bottom 10; the rank says #N of M where the highest number = allows the most. keyPlayers[].opponentVsPosition is that line for tonight's opponent vs the player's position — the core of "who is set up". A player without opponentVsPosition has no matchup angle — do not mention the opponent's defense at his position at all.
- teams[] ranks: #1 = best in that stat unless the text says otherwise (pace #1 = fastest, opponent 3P% #1 = stingiest, TOV% #1 = fewest turnovers).
- keyPlayers[].strengths: player ranks among ALL NBA players (e.g. isolation frequency #1).
- teams[].defensiveReads (also on the defender's keyPlayers[].defensiveRead): code-built matchup — the named defender's team is stingy at a position, against the opposing scorer at that position (with his load shift if any). The stingy defense belongs to the defender's team; write it with the defender as the subject (e.g. "V.Wembanyama's rim protection makes it a tough night for D.Clingan").
- loadShiftWithoutAbsent: how a teammate's scoring changed in games the absent player missed this season (small samples — say "in the games he missed").
- Every rank in teams[] carries its tier in words ("top 5", "bottom 10", "allows among the most — a clear weakness", "middle — not a strength or weakness"). Your wording must match that tier exactly. Anything marked "middle" is NEVER a strength, weakness, "vulnerable", "soft" or "下位/上位" and is never used as a reason. A player edge from opponentVsPosition counts only when it says "weakness"; "tough matchup" / "stingier" = a harder night for that player.
- Never write a sentence or clause whose only content is that something is average or has no particular weakness (no "BLAZERS' center defense is average, but…", 「センター守備は平均レベルだが」「特別な弱点はない」「ガード守備は中位で」). Leave average items out entirely.
- Do not print the "#N" rank of a middle item, and do not convert ranks into other numbers (no "5th-most").
- When the opponent side is middle, the player's case rests only on his own strengths, form and load shift. Do not fill the gap with an invented opponent reason (no "their defense tends to break down", "the current lineup may struggle", 「守備の連携が乱れやすい」).
- JA for points allowed: write 「多く許している」「失点が多い」/「少ない」「堅い」. Never 「下位の得点を許す」「上位の失点」 — 上位/下位 is ambiguous for allowed stats.
- Player names: write them EXACTLY as in the sheet (initial + last name, e.g. "N.Jokic", "T.Haliburton") in EVERY language including English. Never expand to full first names.
- styleEdges[]: favors = the team the area leans to; why = the reason, always written with the team that OWNS each strength / weakness as the subject. teams[].styleStrengths / styleWeaknesses repeat the same lines under the owning team. A weakness belongs only to the team it is listed under — never move it to the other team (e.g. "PACERS give up a lot of second-chance points" must never become "NUGGETS give up second-chance points"). When why says a team is average in that area, do not describe that team's side at all (no "weak", "vulnerable", "struggles", "脆弱", "弱さ", "苦しむ"). League #1 = best; for "Opp …" metrics #1 = allows the least.
- Meanings: Paint PTS = scoring at the rim/inside; Opp paint PTS = interior defense. 2nd-chance PTS / OREB% = offensive rebounding; Opp 2nd-chance PTS / Opp OREB% = DEFENSIVE REBOUNDING (boxing out), NOT rim protection. TOV% = ball security (lower is better); Forced TO / Opp TOV = forcing turnovers. PTS off TO = scoring off the other team's turnovers (transition). Fast break PTS = transition. 3PM/3PA/3P% = perimeter shooting; Opp 3P… = perimeter defense. FTA rate = getting to the line.
- injuryNotes / injuries / teams[].absences / difficulty.ownOut name tonight's absences. Never write that a team has no absences or no major absences (no "full strength", 「大きな離脱はない」「主力の離脱はない」) — if a team has none listed, say nothing about its health.
- context[] lines are shown to the fan right below your preview. Never contradict them; when a line has a "Tonight:" clause, any mention of it must keep that lean (no lean = do not tilt it).
- Tie a style (drives, rim pressure, threes, rebounding) to a player ONLY when the sheet ties that player to it. Players named only in lastMeeting / lastGames are evidence of what happened, not of how they play.

Rules:
- Interpret, never list. Every sentence must say why it matters tonight. Do not walk through the sheet item by item; select the strongest connections.
- At most 3 numbers per paragraph. Prefer words ("one of the league's worst defensive glass teams", JA 「リーグ下位の」) over raw ranks; use a number only when it is the point.
- Every number, name, status, date and record must come from the sheet. No invented stats, no arithmetic, no new ranks. Never write a number that is not in the sheet.
- Do NOT pick a winner, predict a final score, or give betting advice. You MAY say an area or the matchup leans toward a team, and you MAY project individual output ("big scoring night", "more shots") with its reason.
- If phase is "early" or "opening", mention the small sample once, briefly (e.g. "nine games in"). If styleStatsSeason / teamAnalysisSeason is an earlier season than the game, say those numbers are from that season.
- Team names = nicknames exactly as in the sheet (THUNDER). Player names in English as written (S.Gilgeous-Alexander). Status words OUT / questionable / doubtful stay English in every language.
- Each paragraph 2–3 sentences — keep only the strongest reads, cut the rest. JA: 1 段落 90〜130 字（超えない）。EN: 1 paragraph 45–75 words. スポーツ記者の展望の文体（だ・である調 / 体言止め可。です・ます調にしない）。
- Paragraph 2 obeys the same length cap: one sentence per player (season ppg / last5 / one strength / tonight's reason). Add a third player only if it still fits in 130 字 — otherwise leave him out.
- JA player names: the sheet form only ("A.Edwards", "L.Markkanen") at EVERY mention, including repeats. Never katakana or a bare surname (bad 「エドワーズ」「マルッカネン」「Edwards不在時」).
- A player facing a stingy defense: state it as a tougher night (JA 「堅い守備に苦しみやすい」). Never ask how far he can go (bad 「どこまで出せるか」「どこまで通用するか」).
- Banned filler: JA 「注目の一戦」「見逃せない」「期待される」「鍵になる」(without saying what), EN "it will be interesting", "only time will tell", "a must-watch".
- Write the same content, natural and native, in ja and en only.

Headlines ("heads"): one per paragraph, same order. The takeaway of that paragraph, so a fan who reads only the 4 headlines gets the whole read.
- JA 10〜22 字、句点なし、体言止めか短い言い切り（例 「NUGGETS のインサイド守備が狙われる」「N.Jokic はペイントで大きな夜に」）。EN at most 8 words, no period.
- NO digits. Names and nicknames exactly as in the paragraph. Only what the paragraph says — no new claims, no winner.
- Do not restate the paragraph's role ("Game shape", 「試合の形」「見どころ」) — the app prints that label itself.
- Headline 2 names the player(s) set up for a big night; headline 4 names the watch point.

Output shape:
{ "paragraphs": { "ja": ["p1", "p2", "p3", "p4"], "en": ["p1", "p2", "p3", "p4"] },
  "heads": { "ja": ["h1", "h2", "h3", "h4"], "en": ["h1", "h2", "h3", "h4"] } }`;

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

/** 「欠場なし」の言い切り（injury の取り込み遅れで誤りになる）。プロンプトだけでは止まらない */
const NO_ABSENCE_CLAIM: Partial<Record<(typeof LANGS)[number], RegExp>> = {
  ja: /(離脱|欠場)(は|が)(な|無)[くい]|大量離脱|万全/,
  en: /\bno (major |key |significant )?(absences|injuries)\b|full strength|fully healthy|healthy roster/i,
};

/** 「平均的で弱点はない」だけの一言。誤りではないので 1 回だけ書き直させ、2 回目は受け入れる */
const AVERAGE_FILLER: Partial<Record<(typeof LANGS)[number], RegExp>> = {
  ja: /弱点[はがも](な|無)|穴[はがも](な|無)|(守備|守り|ディフェンス)[はがも]?(平均的|平均レベル|中位|並み|中庸)|(上位|下位)の(得点|失点)を許/,
  en: /\b(defen[cs]e|defending)\b[^.]{0,40}\b(is|are|has been) (only |merely )?(average|middling|mid-pack)\b|\bno (\w+ ){0,2}weakness(es)?\b|\bwithout (a |any )?(\w+ )?weakness/i,
};

type PosDefense = Map<string, Partial<Record<OutlookPos, "stingy" | "weak">>>;

/** シートのポジション別失点（上位 10 = stingy / 下位 10 = weak）。中位は載っていない */
function positionDefenseOf(pack: ProInsightFactPack): PosDefense {
  const out: PosDefense = new Map();
  for (const t of pack.preview?.analysis?.teams ?? []) {
    const row: Partial<Record<OutlookPos, "stingy" | "weak">> = {};
    for (const [pos, line] of Object.entries(t.allowedByPosition) as Array<[OutlookPos, string]>) {
      if (/stingi/.test(line)) row[pos] = "stingy";
      else if (/weakness/.test(line)) row[pos] = "weak";
    }
    out.set(t.team, row);
  }
  return out;
}

const POS_WORDS: Record<"ja" | "en", Array<[RegExp, OutlookPos]>> = {
  ja: [
    [/ガード/, "G"],
    [/フォワード/, "F"],
    [/センター/, "C"],
  ],
  en: [
    [/\bguards?\b/i, "G"],
    [/\bforwards?\b/i, "F"],
    [/\bcenters?\b/i, "C"],
  ],
};
const STINGY_WORD = { ja: /堅|強固|屈指|少な|最少|手強|壁/, en: /stingy|stingiest|stout|elite|fewest|among the best|\btough\b|\bwall\b/i };
const WEAK_WORD = { ja: /弱|脆|多く許|失点が多|緩|穴/, en: /\bweak|vulnerab|\bsoft\b|leaky|porous|struggl|the most points|a lot of points|more than most/i };

/**
 * 「X のセンター守備は堅い」をシートと照合し、持ち主のチームを取り違えた文を返す。
 * 対比の書き方（エースは強い、だが相手の守備は…）で相手チームの守りの評価を入れ替える誤りが半々で出るため。
 */
function wrongPositionClaims(lang: "ja" | "en", text: string, facts: PosDefense): string[] {
  const teams = [...facts.keys()];
  const sentences = lang === "ja" ? text.split(/(?<=[。\n])/) : text.split(/(?<=[.!?\n])\s*/);
  const wrong: string[] = [];
  for (const s of sentences) {
    for (const team of teams) {
      const at = lang === "ja" ? s.indexOf(team) : s.search(new RegExp(`\\b${team}\\b`, "i"));
      if (at < 0) continue;
      let seg = s.slice(at + team.length);
      for (const other of teams) {
        if (other === team) continue;
        const cut = lang === "ja" ? seg.indexOf(other) : seg.search(new RegExp(`\\b${other}\\b`, "i"));
        if (cut >= 0) seg = seg.slice(0, cut);
      }
      const posHit = POS_WORDS[lang]
        .map(([re, pos]) => ({ pos, i: seg.search(re) }))
        .filter((h) => h.i >= 0 && h.i <= (lang === "ja" ? 12 : 30))
        .sort((a, b) => a.i - b.i)[0];
      if (!posHit) continue;
      const tail = seg.slice(posHit.i, posHit.i + (lang === "ja" ? 30 : 60));
      const claim = STINGY_WORD[lang].test(tail) ? "stingy" : WEAK_WORD[lang].test(tail) ? "weak" : null;
      if (claim && facts.get(team)?.[posHit.pos] !== claim) wrong.push(s.trim());
    }
  }
  return [...new Set(wrong)];
}

function stripSentences(text: string, sentences: string[]): string {
  let out = text;
  for (const s of sentences) out = out.replace(s, "");
  return out
    .split("\n")
    .map((p) => p.replace(/\s{2,}/g, " ").trim())
    .filter(Boolean)
    .join("\n");
}

/** 見出しは段落と同数・数字なし・短いものだけ。崩れていたらその言語は見出しなし */
function headsOf(raw: unknown, count: number, lang: (typeof LANGS)[number]): string | null {
  if (!Array.isArray(raw)) return null;
  const heads = raw
    .filter((h): h is string => typeof h === "string")
    .map((h) => h.trim().replace(/[。.]+$/, ""))
    .filter(Boolean);
  const max = lang === "ja" ? 30 : 90;
  if (heads.length !== count || heads.some((h) => /\d/.test(h) || h.length > max)) return null;
  const joined = heads.join("\n");
  if (NO_ABSENCE_CLAIM[lang]?.test(joined)) return null;
  return joined;
}

function parseOutlook(
  content: string,
  allowed: Set<string>,
  facts: PosDefense
): {
  text: Partial<UiStrings>;
  heads: Partial<UiStrings>;
  bad: string[];
  filler: string[];
  wrongPos: Partial<Record<"ja" | "en", string[]>>;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    return { text: {}, heads: {}, bad: [...LANGS], filler: [], wrongPos: {} };
  }
  const byLang = (parsed as { paragraphs?: Record<string, unknown> })?.paragraphs ?? {};
  const headsByLang = (parsed as { heads?: Record<string, unknown> })?.heads ?? {};
  const text: Partial<UiStrings> = {};
  const heads: Partial<UiStrings> = {};
  const bad: string[] = [];
  const filler: string[] = [];
  const wrongPos: Partial<Record<"ja" | "en", string[]>> = {};
  for (const lang of LANGS) {
    const paras = paragraphsOf(byLang[lang]);
    const joined = paras?.join("\n");
    const stray = joined ? numbersIn(joined).filter((n) => !allowed.has(n)) : [];
    const claim = joined ? NO_ABSENCE_CLAIM[lang]?.exec(joined)?.[0] : undefined;
    if (!joined || stray.length || claim) {
      bad.push(stray.length ? `${lang}(${stray.join(",")})` : claim ? `${lang}(${claim})` : lang);
      continue;
    }
    const avg = AVERAGE_FILLER[lang]?.exec(joined)?.[0];
    if (avg) filler.push(`${lang}(${avg})`);
    if (lang === "ja" || lang === "en") {
      const wrong = wrongPositionClaims(lang, joined, facts);
      if (wrong.length) wrongPos[lang] = wrong;
    }
    text[lang] = joined;
    const h = headsOf(headsByLang[lang], paras!.length, lang);
    if (h) heads[lang] = h;
  }
  return { text, heads, bad, filler, wrongPos };
}

export type PreviewOutlookResult = { preview: UiStrings; heads: UiStrings | null };

/** ja / en の見出しが揃わなければ見出しごと無し */
function headsFor(heads: Partial<UiStrings>): UiStrings | null {
  return heads.ja && heads.en ? { ja: heads.ja, en: heads.en } : null;
}

export async function generatePreviewOutlook(pack: ProInsightFactPack): Promise<PreviewOutlookResult | null> {
  const sheet = buildPreviewOutlookSheet(pack);
  if (!sheet || !isOpenAiConfigured()) return null;
  const allowed = allowedNumbersFromSheet(sheet);
  const facts = positionDefenseOf(pack);
  let rejected: string[] = [];
  let fallback: PreviewOutlookResult | null = null;
  let stripped: PreviewOutlookResult | null = null;
  for (let attempt = 0; attempt < PREVIEW_MAX_ATTEMPTS; attempt++) {
    let content: string;
    try {
      content = await openAiChatCompletionJson({
        model: getOpenAiProInsightPreviewModel(),
        system: PREVIEW_OUTLOOK_SYSTEM,
        user: JSON.stringify(
          {
            sheet,
            ...(rejected.length
              ? {
                  previousDraftRejected: `The previous draft was rejected for: ${rejected.join(" | ")} (a number not in the sheet, a claim that a team has no absences, a filler clause saying something is average / has no weakness, or a position defense credited to the wrong team — check teams[].allowedByPosition for whose defense it is). Rewrite without them.`,
                }
              : {}),
          },
          null,
          1
        ),
        temperature: 0.4,
      });
    } catch (e) {
      console.warn("[pro-insight] preview outlook failed", e instanceof Error ? e.message : e);
      return null;
    }
    const { text, heads, bad, filler, wrongPos } = parseOutlook(content, allowed, facts);
    const wrongList = [...(wrongPos.ja ?? []), ...(wrongPos.en ?? [])];
    if (bad.length) console.warn(`[pro-insight] preview outlook dropped: ${bad.join(" ")}`);
    if (filler.length) console.warn(`[pro-insight] preview outlook filler: ${filler.join(" ")}`);
    if (wrongList.length) console.warn(`[pro-insight] preview outlook wrong team defense: ${wrongList.join(" | ")}`);
    rejected = [...bad, ...filler, ...wrongList.map((s) => `wrong team: "${s}"`)];
    if (!text.ja || !text.en) continue;
    const out: UiStrings = { ja: text.ja, en: text.en };
    const outHeads = headsFor(heads);
    if (wrongList.length) {
      // 最後まで直らなければ誤りの文だけ削る。段落が消えたら見出しはずれるので表示側が捨てる
      stripped = {
        preview: {
          ja: stripSentences(text.ja, wrongPos.ja ?? []),
          en: stripSentences(text.en, wrongPos.en ?? []),
        },
        heads: outHeads,
      };
      continue;
    }
    if (filler.some((f) => f.startsWith("ja(") || f.startsWith("en("))) {
      fallback = { preview: out, heads: outHeads };
      continue;
    }
    return { preview: out, heads: outHeads };
  }
  return fallback ?? stripped;
}

/** 本文で色を付ける選手（主力・欠場者）。名前は シートと同じ "N.Jokic" 形式 */
function previewNamesOf(pack: ProInsightFactPack): ProInsightPreviewName[] {
  const idByAbbr = new Map(
    [pack.homeTeamId, pack.awayTeamId].map((id) => [proInsightTeamAbbr(id), id] as const)
  );
  const out: ProInsightPreviewName[] = [];
  const seen = new Set<string>();
  for (const t of pack.preview?.analysis?.teams ?? []) {
    const teamId = idByAbbr.get(t.team);
    if (!teamId) continue;
    const names = [
      ...t.keyPlayers.map((p) => p.name),
      ...t.absences.map((a) => /^([A-Z][^\s,]*\.[^\s,]+)/.exec(a)?.[1] ?? ""),
    ];
    for (const name of names) {
      if (!name || seen.has(name)) continue;
      seen.add(name);
      out.push({ name, teamId });
    }
  }
  return out;
}

/** ピックアップ（pack.preview あり）だけ展望を付ける。それ以外は preview を外す */
export async function withPreviewOutlook(
  brief: ProInsightNarrativeBrief,
  pack: ProInsightFactPack
): Promise<ProInsightNarrativeBrief> {
  const { preview: _old, previewHeads: _oldHeads, previewNames: _oldNames, ...rest } = brief;
  if (!pack.preview) return rest;
  const result = await generatePreviewOutlook(pack);
  if (!result) return rest;
  const names = previewNamesOf(pack);
  return {
    ...rest,
    // CONTEXT の材料は PREVIEW のシートに入っている。別枠で繰り返すと重複・食い違いの元
    sections: rest.sections.filter((s) => s.kind !== "CONTEXT"),
    preview: result.preview,
    ...(result.heads ? { previewHeads: result.heads } : {}),
    ...(names.length ? { previewNames: names } : {}),
  };
}
