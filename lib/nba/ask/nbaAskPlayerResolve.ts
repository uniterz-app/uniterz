/**
 * 読み取りの AI が返した英語名 → ロスターの選手。綴りの揺れ（Doncic / Dončić、Gilgeous Alexander）と
 * 名字だけを吸収する。同じ名字が複数いるときは決めずに候補を返す。
 */
import type { NbaTeamRosterDocTeam } from "@/lib/nba/teamRosters/teamRosterTypes";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import { englishNameKey, hasKana, kanaNameKey, kanaToRomaji } from "./nbaAskKana";

export type NbaAskPlayerHit = {
  playerId: string;
  name: string;
  teamId: string;
  player: NbaRosterPlayer;
};

export type NbaAskPlayerResolution =
  | { kind: "one"; hit: NbaAskPlayerHit }
  | { kind: "many"; hits: NbaAskPlayerHit[] }
  | { kind: "none" };

function norm(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function distance(a: string, b: string): number {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]!;
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const up = prev[j]!;
      prev[j] = Math.min(prev[j]! + 1, prev[j - 1]! + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = up;
    }
  }
  return prev[b.length]!;
}

function allPlayers(rosters: Record<string, NbaTeamRosterDocTeam>): NbaAskPlayerHit[] {
  const out: NbaAskPlayerHit[] = [];
  const seen = new Set<string>();
  for (const team of Object.values(rosters)) {
    for (const p of team.players) {
      const id = String(p.id ?? "").trim();
      const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
      if (!id || !name || seen.has(id)) continue;
      seen.add(id);
      out.push({ playerId: id, name, teamId: team.teamId, player: p });
    }
  }
  return out;
}

/** 出場の多い順（同じ名字なら主力を先に出す） */
function byRole(a: NbaAskPlayerHit, b: NbaAskPlayerHit): number {
  return (b.player.gp ?? 0) * (b.player.mpg ?? 0) - (a.player.gp ?? 0) * (a.player.mpg ?? 0);
}

function decide(hits: NbaAskPlayerHit[]): NbaAskPlayerResolution | null {
  if (hits.length === 0) return null;
  if (hits.length === 1) return { kind: "one", hit: hits[0]! };
  const sorted = [...hits].sort(byRole);
  // 主力と控えの同姓（例: 片方が出場ほぼ無し）は主力に決める
  const top = sorted[0]!;
  const second = sorted[1]!;
  const load = (h: NbaAskPlayerHit) => (h.player.gp ?? 0) * (h.player.mpg ?? 0);
  if (load(top) >= 200 && load(second) * 8 <= load(top)) return { kind: "one", hit: top };
  return { kind: "many", hits: sorted.slice(0, 5) };
}

export function resolveNbaAskPlayer(
  rosters: Record<string, NbaTeamRosterDocTeam>,
  query: string,
  teamId?: string | null,
  opts: { fuzzy?: boolean } = {}
): NbaAskPlayerResolution {
  const q = norm(query);
  if (q.length < 2) return { kind: "none" };
  const players = allPlayers(rosters).filter((p) => !teamId || p.teamId === teamId);
  const pool = players.length > 0 ? players : allPlayers(rosters);
  const full = (h: NbaAskPlayerHit) => norm(h.name);
  const last = (h: NbaAskPlayerHit) => norm(h.player.lastName ?? "");
  const compact = (s: string) => s.replace(/ /g, "");

  const exact = pool.filter((h) => full(h) === q || compact(full(h)) === compact(q));
  const exactHit = decide(exact);
  if (exactHit) return exactHit;

  const qTokens = q.split(" ");
  const qLast = qTokens[qTokens.length - 1]!;
  if (qTokens.length === 1) {
    const byLast = pool.filter((h) => last(h) === q || compact(last(h)) === compact(q));
    const lastHit = decide(byLast);
    if (lastHit) return lastHit;
    const byFirst = pool.filter((h) => norm(h.player.firstName ?? "") === q);
    const firstHit = decide(byFirst);
    if (firstHit) return firstHit;
  } else {
    const byLast = pool.filter(
      (h) =>
        compact(last(h)) === compact(q) ||
        (last(h) === qLast && norm(h.player.firstName ?? "").startsWith(qTokens[0]!.slice(0, 1)))
    );
    const lastHit = decide(byLast);
    if (lastHit) return lastHit;
  }

  if (opts.fuzzy === false) return { kind: "none" };
  const fuzzy = pool
    .map((h) => {
      const d = qTokens.length === 1 ? distance(last(h), q) : distance(compact(full(h)), compact(q));
      return { h, d };
    })
    .filter(({ d }) => d <= (q.length >= 8 ? 2 : 1))
    .sort((a, b) => a.d - b.d);
  if (fuzzy.length > 0) {
    const best = fuzzy.filter((f) => f.d === fuzzy[0]!.d).map((f) => f.h);
    const fuzzyHit = decide(best);
    if (fuzzyHit) return fuzzyHit;
  }
  /** 名前を AI が作った（Jalen Edgecomb → VJ Edgecombe）ときは名字だけで寄せる */
  if (qTokens.length > 1 && qLast.length >= 5) {
    const byLastFuzzy = pool
      .map((h) => ({ h, d: distance(last(h), qLast) }))
      .filter(({ d }) => d <= (qLast.length >= 8 ? 2 : 1))
      .sort((a, b) => a.d - b.d);
    if (byLastFuzzy.length > 0) {
      const lastFuzzyHit = decide(byLastFuzzy.filter((f) => f.d === byLastFuzzy[0]!.d).map((f) => f.h));
      if (lastFuzzyHit) return lastFuzzyHit;
    }
  }
  return { kind: "none" };
}

function resolveAnyTeam(
  rosters: Record<string, NbaTeamRosterDocTeam>,
  query: string,
  teamId: string | null,
  opts: { fuzzy?: boolean } = {}
): NbaAskPlayerResolution {
  /** AI のチームは移籍前のことがある（LeBron James + LAL → 同じチームの Bronny James に寄る）。フルネームが当たる選手を先に取る */
  if (teamId) {
    const q = norm(query).replace(/ /g, "");
    const exact = allPlayers(rosters).filter((h) => norm(h.name).replace(/ /g, "") === q);
    if (exact.length === 1) return { kind: "one", hit: exact[0]! };
  }
  const found = resolveNbaAskPlayer(rosters, query, teamId, opts);
  return found.kind === "none" && teamId ? resolveNbaAskPlayer(rosters, query, null, opts) : found;
}

/**
 * AI の英語名と、質問に書かれた名前をそのまま綴った名前（フラッグ → Flagg）の両方で引く。
 * AI は知らない選手（新人など）を似た別人に置き換えることがあるので、書かれた名前が
 * ロスターでそのまま当たるならそちらを信じる（綴り違いの吸収はしない）。
 */
/**
 * かなの名前と選手の音の近さ。`s` はフルネーム・縮めた名前 + 名字・名字・名前の順に信じる並べ替え用
 * （「アレックスサー」は Alex Caruso の名前とも一致するが、Alexandre Sarr を取る）。
 * `d` は名前だけの一致を除いた子音の差。
 */
function kanaScore(key: string, h: NbaAskPlayerHit): { s: number; d: number } {
  const d = (en: string) => distance(key, englishNameKey(en));
  const firstKey = englishNameKey(h.player.firstName ?? "");
  const lastKey = englishNameKey(h.player.lastName ?? "");
  /** 名前を縮めた呼び方（Alexandre Sarr → アレックスサー） */
  const rest = lastKey && key.endsWith(lastKey) ? key.slice(0, -lastKey.length) : "";
  const shortFirst = rest.length >= 2 && firstKey.startsWith(rest);
  const full = d(h.name);
  const last = d(h.player.lastName ?? "");
  return {
    s: Math.min(full, shortFirst ? 0.25 : Infinity, last + 0.5, d(h.player.firstName ?? "") + 1),
    d: Math.min(full, shortFirst ? 0 : Infinity, last),
  };
}

/** 子音の並びが同じ選手どうし（マッケイン → McCain / Markkanen）は母音も入れて比べる */
function breakKanaTie(romaji: string, hits: NbaAskPlayerHit[]): NbaAskPlayerHit[] {
  const loose = (h: NbaAskPlayerHit) =>
    Math.min(
      distance(romaji, norm(h.name).replace(/\s+/g, "")),
      distance(romaji, norm(h.player.lastName ?? "").replace(/\s+/g, ""))
    );
  const ranked = hits.map((h) => ({ h, d: loose(h) })).sort((a, b) => a.d - b.d);
  return ranked.length > 1 && ranked[0]!.d + 2 <= ranked[1]!.d ? [ranked[0]!.h] : hits;
}

function bestByKana(key: string, romaji: string, hits: NbaAskPlayerHit[]): NbaAskPlayerHit[] {
  const scored = hits.map((h) => ({ h, s: kanaScore(key, h).s }));
  const best = Math.min(...scored.map((x) => x.s));
  return breakKanaTie(
    romaji,
    scored.filter((x) => x.s === best).map((x) => x.h)
  );
}

/**
 * AI の選んだ選手が書かれたかなの名前と合わないときだけ、音がぴったり合う選手に差し替える。
 * 子音の並びは偶然の一致が多い（スミス ≒ Sam Hauser）ので、AI の答えが名字かフルネームでほぼ合えばそのまま。
 */
function pickByKana(
  rosters: Record<string, NbaTeamRosterDocTeam>,
  byAi: NbaAskPlayerResolution,
  written: string,
  teamId: string | null
): NbaAskPlayerResolution {
  const key = kanaNameKey(written);
  /** 1 文字（あ → ）は当てにならない */
  if (key.length < 2) return byAi;
  const romaji = kanaToRomaji(written).replace(/\s+/g, "");
  if (byAi.kind === "one" && kanaScore(key, byAi.hit).d <= 1) return byAi;
  if (byAi.kind === "many") return decide(bestByKana(key, romaji, byAi.hits)) ?? byAi;
  const pool = allPlayers(rosters).filter((p) => !teamId || p.teamId === teamId);
  const players = pool.length > 0 ? pool : allPlayers(rosters);
  /**
   * テイタム → tm のように子音が短いときも、名字の子音が一致する選手から選ぶ
   * （Timme / Tatum は出場の多いほう・母音の近さで絞る）。
   */
  const exact =
    key.length < 3
      ? players.filter((h) => englishNameKey(h.player.lastName ?? "") === key)
      : players.filter((h) => kanaScore(key, h).s < 1);
  if (exact.length > 0) {
    const picked = bestByKana(key, romaji, exact);
    const decided = decide(picked.length > 0 ? picked : exact);
    if (decided?.kind === "one") return decided;
    if (byAi.kind === "one") return byAi;
    return decided ?? byAi;
  }
  /** AI が誰も当てられなかったときだけ、1 音違い（ホームグレン → Holmgren）を母音まで比べて 1 人に絞れたら答える */
  if (byAi.kind !== "none" || key.length < 4) return byAi;
  const near = players.filter((h) => kanaScore(key, h).d <= 1);
  const picked = breakKanaTie(romaji, near);
  return picked.length === 1 ? { kind: "one", hit: picked[0]! } : byAi;
}

export function pickNbaAskPlayer(
  rosters: Record<string, NbaTeamRosterDocTeam>,
  player: string,
  written: string | null,
  teamId: string | null
): NbaAskPlayerResolution {
  const byAi = resolveAnyTeam(rosters, player, teamId);
  if (!written) return byAi;
  if (hasKana(written)) return pickByKana(rosters, byAi, written, teamId);
  const byWritten = resolveAnyTeam(rosters, written, teamId, { fuzzy: false });
  if (byWritten.kind === "one") return byWritten;
  if (byWritten.kind === "many") {
    const aiId = byAi.kind === "one" ? byAi.hit.playerId : null;
    return aiId && byWritten.hits.some((h) => h.playerId === aiId) ? byAi : byWritten;
  }
  return byAi;
}

/** 日本でよく使う呼び名。読み取りの AI が落とすことがあるので、質問の文から直接拾う */
const NICKNAMES: ReadonlyArray<[RegExp, string]> = [
  [/アントマン|(?<![ァ-ヶー])アント(?![ァ-ヶー])/, "Anthony Edwards"],
  [/ギリシャの怪人|グリークフリーク|(?<![ァ-ヶー])ヤニス(?![ァ-ヶー])/, "Giannis Antetokounmpo"],
  [/(?<![ァ-ヶー])キング(?![ァ-ヶー])/, "LeBron James"],
  [/ジョーカー/, "Nikola Jokic"],
  [/ウェンビー|ウェンバン(?!ヤマ)/, "Victor Wembanyama"],
  [/(?<![ァ-ヶー])シャイ(?![ァ-ヶー])|\bSGA\b/, "Shai Gilgeous-Alexander"],
  [/(?<![ァ-ヶー])ステフ(?![ァ-ヶー])/, "Stephen Curry"],
  [/(?<![ァ-ヶー])ルカ(?![ァ-ヶー])/, "Luka Doncic"],
  [/(?<![ァ-ヶー])カワイ(?![ァ-ヶー])/, "Kawhi Leonard"],
  [/(?<![ァ-ヶー])ザイオン(?![ァ-ヶー])/, "Zion Williamson"],
  [/(?<![ァ-ヶー])カイリー(?![ァ-ヶー])/, "Kyrie Irving"],
  [/(?<![ァ-ヶー])ラメロ(?![ァ-ヶー])/, "LaMelo Ball"],
  [/(?<![ァ-ヶー])エンビード(?![ァ-ヶー])/, "Joel Embiid"],
  [/(?<![ァ-ヶー])テイタム(?![ァ-ヶー])/, "Jayson Tatum"],
  [/(?<![ァ-ヶー])デュラント(?![ァ-ヶー])/, "Kevin Durant"],
  [/\bKD\b/, "Kevin Durant"],
  [/\bAD\b/, "Anthony Davis"],
  [/\bCP3\b/, "Chris Paul"],
];

export function nbaAskNicknamePlayer(text: string): string | null {
  for (const [re, name] of NICKNAMES) if (re.test(text)) return name;
  return null;
}
