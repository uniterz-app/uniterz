/**
 * 選手名のカタカナ辞書（ASK の選手の取り違え防止）。
 * Firestore `nbaPlayerKanaNames/all` の `players.{playerId}` = { name: ロスターの英語名, kana: 日本語の書き方 }。
 * 新しくロスターに入った選手だけ AI に書かせて足す（日次のロスター更新のあと・質問のたびには呼ばない）。
 * 質問の文を辞書で読み、出てきた選手を AI の読み取りより優先する。
 */
import type { Firestore } from "firebase-admin/firestore";
import { requireOpenAiApiKey } from "@/lib/openai/openaiEnv";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { loadTeamRostersSnapshot } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import { hiraganaToKatakana } from "./nbaAskKana";
import { nbaAskTeamJaWords } from "./nbaAskTeamNames";

export const NBA_PLAYER_KANA_NAMES_COLLECTION = "nbaPlayerKanaNames";
const DOC_ID = "all";

export type NbaPlayerKanaEntry = { name: string; kana: string[] };
export type NbaPlayerKanaNames = Record<string, NbaPlayerKanaEntry>;

/**
 * AI の書き方に足す・日本でよく使う呼び方（英語のフルネーム → カタカナ）。
 * Firestore の辞書にその選手がいなくても index に載せる（初歩的な取り違え防止）。
 * 3 文字未満は文中検索では拾わない（`findNbaKanaPlayersInText`）。lookup（player_written）では使える。
 */
const EXTRA_KANA: Record<string, readonly string[]> = {
  "Nikola Jokic": ["ヨキッチ", "ジョキッチ", "ニコラヨキッチ", "ジョーカー"],
  "Alexandre Sarr": ["アレックスサー", "サー", "アレクサンドルサー"],
  "Shai Gilgeous-Alexander": ["シャイ", "シェイ", "ギルジャスアレクサンダー", "シェイギルジャスアレクサンダー"],
  "Rui Hachimura": ["八村", "八村塁", "ハチムラ", "ルイ", "ルイハチムラ"],
  "Yuki Kawamura": ["河村", "河村勇輝", "カワムラ", "ユウキカワムラ", "カワムラユウキ"],
  "LeBron James": ["レブロン", "レブロンジェームズ"],
  "Stephen Curry": ["ステフ", "ステフカリー", "ステフィンカリー", "ステフェンカリー"],
  "Jared McCain": ["マッケイン"],
  "Chet Holmgren": ["ホームグレン", "チェットホームグレン"],
  "Luka Doncic": ["ルカ", "ドンチッチ", "ルカドンチッチ"],
  "Joel Embiid": ["エンビード", "ジョエルエンビード"],
  "Jayson Tatum": ["テイタム", "ジェイソンテイタム"],
  "Devin Booker": ["ブッカー", "デビンブッカー"],
  "Kevin Durant": ["デュラント", "ケビンデュラント"],
  "Anthony Edwards": ["アント", "アントマン", "アンソニーエドワーズ"],
  "Giannis Antetokounmpo": ["ヤニス", "ヤニスアデトクンボ", "ギリシャの怪人"],
  "Victor Wembanyama": ["ウェンビー", "ウェンバンヤマ", "ビクターウェンバンヤマ"],
  "Kawhi Leonard": ["カワイ", "カワイレナード"],
  "Anthony Davis": ["アンソニーデイビス"],
  "Chris Paul": ["クリスポール", "シーピースリー"],
  "Zion Williamson": ["ザイオン", "ザイオンウィリアムソン"],
  "Ja Morant": ["ジャモラント", "モラント"],
  "Kyrie Irving": ["カイリー", "カイリーアービング"],
  "LaMelo Ball": ["ラメロ", "ラメロボール"],
  "Cade Cunningham": ["ケイディ", "ケイド", "ケイドカニングハム", "ケイディカニングハム"],
  "Jalen Brunson": ["ブランソン", "ジェイレンブランソン"],
  "Tyrese Haliburton": ["ハリバートン", "タイリースハリバートン"],
  "Paolo Banchero": ["バンケロ", "パオロバンケロ"],
  "Alperen Sengun": ["シェングン", "アルペレンシェングン"],
  "Donovan Mitchell": ["ドノバンミッチェル"],
  "Trae Young": ["トレイヤング"],
  "Jimmy Butler": ["ジミーバトラー"],
  "De'Aaron Fox": ["ディアーロンフォックス"],
  "Jaylen Brown": ["ジェイレンブラウン"],
  "Jalen Green": ["ジェイレングリーン"],
  "Cooper Flagg": ["フラッグ", "クーパーフラッグ"],
};

/** 選手名と同じ形になりがちな言葉（ルーズボール・ボール保持・チーム名）は辞書で拾わない */
const NOT_NAMES = new Set(
  [
    "ボール",
    "パス",
    "ブロック",
    "ドライブ",
    "ホーム",
    "ゲーム",
    "チーム",
    "ベスト",
    "トップ",
    "キング",
    "ネット",
    "ペース",
    "ミドル",
    "ポイント",
    "ガード",
    "センター",
    "ベンチ",
    "ショット",
    "ダンク",
    "タッチ",
    "スピード",
    "ハッスル",
    "クラッチ",
    "ルーキー",
    "リード",
    "スマート",
    "ハート",
    "ホリデー",
    "ヤング",
    ...nbaAskTeamJaWords(),
  ].map((w) => normalizeKanaName(w))
);

/** 1 文字ずつでも同じ結果になる直し方だけ（質問の文は 1 文字ずつ直して元の位置を覚える） */
export function normalizeKanaName(raw: string): string {
  return hiraganaToKatakana(raw.normalize("NFKC"))
    .replace(/[・･\s=＝.]/g, "")
    .replace(/ヴ/g, "ブ");
}

let cache: { at: number; players: NbaPlayerKanaNames } | null = null;
const CACHE_MS = 10 * 60 * 1000;

export async function loadNbaPlayerKanaNames(db: Firestore): Promise<NbaPlayerKanaNames> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.players;
  const snap = await db.collection(NBA_PLAYER_KANA_NAMES_COLLECTION).doc(DOC_ID).get();
  const raw = (snap.exists ? snap.data()?.players : null) as Record<string, unknown> | null;
  const players: NbaPlayerKanaNames = {};
  for (const [id, v] of Object.entries(raw ?? {})) {
    const e = v as { name?: unknown; kana?: unknown };
    if (typeof e?.name !== "string" || !Array.isArray(e.kana)) continue;
    players[id] = { name: e.name, kana: e.kana.filter((k): k is string => typeof k === "string") };
  }
  cache = { at: Date.now(), players };
  return players;
}

type KanaIndex = { byKana: Map<string, string[]>; names: Map<string, string> };

let indexCache: { src: NbaPlayerKanaNames; index: KanaIndex } | null = null;

function addKana(byKana: Map<string, string[]>, id: string, kana: string) {
  if (kana.length < 2 || NOT_NAMES.has(kana)) return;
  const list = byKana.get(kana) ?? [];
  if (!list.includes(id)) list.push(id);
  byKana.set(kana, list);
}

function buildIndex(players: NbaPlayerKanaNames): KanaIndex {
  if (indexCache?.src === players) return indexCache.index;
  const byKana = new Map<string, string[]>();
  const names = new Map<string, string>();
  for (const [id, e] of Object.entries(players)) {
    names.set(id, e.name);
    for (const k of new Set([...e.kana, ...(EXTRA_KANA[e.name] ?? [])].map(normalizeKanaName))) {
      addKana(byKana, id, k);
    }
  }
  /** Firestore に居ない選手の EXTRA も載せる（河村・よく使う短縮形など） */
  const nameToId = new Map([...names.entries()].map(([id, name]) => [name, id]));
  for (const [name, kanas] of Object.entries(EXTRA_KANA)) {
    const id = nameToId.get(name) ?? `extra:${name}`;
    if (!names.has(id)) names.set(id, name);
    for (const k of kanas.map(normalizeKanaName)) addKana(byKana, id, k);
  }
  const index = { byKana, names };
  indexCache = { src: players, index };
  return index;
}

const KATAKANA = /[ァ-ヺー]/;
const KANJI = /[\u4e00-\u9fff]/;

/** 名前の前後がカタカナ（ルーズボールのボール）や漢字の続き（八村塁の八村）なら名前の一部ではない */
function isBoundary(ch: string | undefined, kanjiName: boolean): boolean {
  if (!ch) return true;
  if (KATAKANA.test(ch)) return false;
  return !(kanjiName && KANJI.test(ch));
}

export type NbaKanaMention = { at: number; text: string; names: string[] };

/**
 * 質問の文に出てくる選手（出た順・同じ選手は 1 回）。1 つの書き方が複数の選手に当たる（グリーン）ときは候補を全部返す。
 * 3 文字未満の書き方（サー）は文の中からは拾わない（偶然の一致が多い）。
 */
export function findNbaKanaPlayersInText(players: NbaPlayerKanaNames, text: string): NbaKanaMention[] {
  const index = buildIndex(players);
  const chars: string[] = [];
  const orig: number[] = [];
  const src = text.normalize("NFKC");
  for (let i = 0; i < src.length; i++) {
    const n = normalizeKanaName(src[i]!);
    for (const c of n) {
      chars.push(c);
      orig.push(i);
    }
  }
  const flat = chars.join("");
  const found: { start: number; end: number; ids: string[] }[] = [];
  for (const [k, ids] of index.byKana) {
    if (k.length < 3) continue;
    const kanjiName = KANJI.test(k);
    let from = 0;
    for (;;) {
      const at = flat.indexOf(k, from);
      if (at < 0) break;
      from = at + 1;
      const end = at + k.length;
      if (!isBoundary(src[orig[at]! - 1], kanjiName) || !isBoundary(src[orig[end - 1]! + 1], kanjiName)) continue;
      found.push({ start: at, end, ids });
    }
  }
  /** 長い書き方を先に取る（ポールジョージ > ポール） */
  found.sort((a, b) => b.end - b.start - (a.end - a.start) || a.start - b.start);
  const taken: typeof found = [];
  for (const f of found) {
    if (taken.some((t) => f.start < t.end && t.start < f.end)) continue;
    taken.push(f);
  }
  taken.sort((a, b) => a.start - b.start);
  const out: NbaKanaMention[] = [];
  for (const t of taken) {
    const names = t.ids.map((id) => index.names.get(id)!).filter(Boolean);
    if (out.some((o) => o.names.length === 1 && names.length === 1 && o.names[0] === names[0])) continue;
    out.push({ at: t.start, text: flat.slice(t.start, t.end), names });
  }
  return out;
}

/** 書かれた名前（AI の player_written）がそのまま辞書にあれば、その選手の英語名 */
export function lookupNbaKanaPlayer(players: NbaPlayerKanaNames, written: string): string[] {
  const index = buildIndex(players);
  const ids = index.byKana.get(normalizeKanaName(written)) ?? [];
  return ids.map((id) => index.names.get(id)!).filter(Boolean);
}

// ---------------------------------------------------------------------------
// 辞書を作る（ingest・スクリプトだけ）
// ---------------------------------------------------------------------------

const GENERATE_MODEL = () => process.env.OPENAI_NBA_KANA_MODEL?.trim() || "gpt-4.1";
const BATCH = 40;

type ChatResponse = {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
};

const KANA_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["players"],
  properties: {
    players: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["id", "kana"],
        properties: { id: { type: "string" }, kana: { type: "array", items: { type: "string" } } },
      },
    },
  },
} as const;

const SYSTEM = [
  "You write NBA player names in Japanese katakana the way Japanese NBA media and fans write them (NBA Rakuten, Number, SNS).",
  "For each player return 2-6 spellings: the full name without a middle dot, the surname alone, and any common alternative spellings or short names Japanese fans use (Nikola Jokic → ニコラヨキッチ, ヨキッチ, ジョキッチ; Alexandre Sarr → アレクサンドルサー, アレックスサー, サー; Shai Gilgeous-Alexander → シェイギルジャスアレクサンダー, ギルジャスアレクサンダー, シャイ).",
  "Katakana only (kanji only for Japanese players). No English, no hiragana, no middle dots, no spaces. Do not invent nicknames.",
].join("\n");

async function generateBatch(players: { id: string; name: string }[]): Promise<{ map: Record<string, string[]>; tokensIn: number; tokensOut: number }> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${requireOpenAiApiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GENERATE_MODEL(),
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: players.map((p) => `${p.id}\t${p.name}`).join("\n") },
      ],
      response_format: { type: "json_schema", json_schema: { name: "kana_names", strict: true, schema: KANA_SCHEMA } },
    }),
  });
  const json = (await res.json().catch(() => ({}))) as ChatResponse;
  if (!res.ok) throw new Error(`openai ${res.status}: ${json.error?.message ?? ""}`);
  const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}") as { players?: { id: string; kana: string[] }[] };
  const map: Record<string, string[]> = {};
  for (const p of parsed.players ?? []) {
    const kana = [...new Set(p.kana.map((k) => k.replace(/[・･\s]/g, "").trim()).filter((k) => /^[ァ-ヺー\u4e00-\u9fff]{2,}$/.test(k)))];
    if (kana.length > 0) map[p.id] = kana.slice(0, 6);
  }
  return { map, tokensIn: json.usage?.prompt_tokens ?? 0, tokensOut: json.usage?.completion_tokens ?? 0 };
}

export type EnsureNbaPlayerKanaNamesResult = {
  ok: true;
  rosterPlayers: number;
  missing: number;
  added: number;
  tokensIn: number;
  tokensOut: number;
  sample: Array<{ name: string; kana: string[] }>;
};

/** 今季ロスターで辞書に無い選手だけ AI に書かせて足す。`write: false` は書かずに結果だけ返す */
export async function ensureNbaPlayerKanaNames(
  db: Firestore,
  opts: { write?: boolean; limit?: number } = {}
): Promise<EnsureNbaPlayerKanaNamesResult> {
  const roster = await loadTeamRostersSnapshot(db, CURRENT_NBA_SEASON_KEY);
  const ref = db.collection(NBA_PLAYER_KANA_NAMES_COLLECTION).doc(DOC_ID);
  const snap = await ref.get();
  const have = (snap.exists ? (snap.data()?.players as Record<string, unknown> | undefined) : undefined) ?? {};
  const seen = new Set<string>();
  const missing: { id: string; name: string }[] = [];
  for (const team of Object.values(roster.bundle.teams ?? {})) {
    for (const p of team.players) {
      const id = String(p.id ?? "").trim();
      const name = `${p.firstName ?? ""} ${p.lastName ?? ""}`.trim();
      if (!id || !name || seen.has(id)) continue;
      seen.add(id);
      if (!have[id]) missing.push({ id, name });
    }
  }
  const todo = typeof opts.limit === "number" ? missing.slice(0, opts.limit) : missing;
  const added: NbaPlayerKanaNames = {};
  let tokensIn = 0;
  let tokensOut = 0;
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    const r = await generateBatch(batch);
    tokensIn += r.tokensIn;
    tokensOut += r.tokensOut;
    for (const p of batch) if (r.map[p.id]) added[p.id] = { name: p.name, kana: r.map[p.id]! };
  }
  if (opts.write !== false && Object.keys(added).length > 0) {
    await ref.set({ players: added, updatedAtMs: Date.now() }, { merge: true });
    cache = null;
  }
  return {
    ok: true,
    rosterPlayers: seen.size,
    missing: missing.length,
    added: Object.keys(added).length,
    tokensIn,
    tokensOut,
    sample: Object.values(added).slice(0, 8),
  };
}
