// app/admin/games-import/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { TEAM_IDS } from "@/lib/team-ids";
import { League, normalizeLeague } from "@/lib/leagues";
import {
  Timestamp,
  doc,
  writeBatch,
} from "firebase/firestore";

/** 管理者 UID（.env になければデフォルトを使用） */
const ADMIN_UID =
  process.env.NEXT_PUBLIC_ADMIN_UID || "S6r5KyS9XcXds3Pm7koLzzELrvs2";

/* =========================
   Types
========================= */

type RawSide =
  | string
  | {
      name: string;
      record?: any;
      number?: number;
      colorHex?: string;
      teamId?: string;
    };

type RawGame = {
  id: string;
  league: League;
  /** どれか一つがあればOK */
  startAt?: string | number | Date; // ISO / ms / Date
  startAtJstIso?: string; // "2025-11-06T18:05:00+09:00"
  startAtJst?: number | string | Date; // ms でも ISO でもOKに寄せる
  season?: string;
  venue?: string;
  roundLabel?: string;
  status?: "scheduled" | "live" | "final";
  home: RawSide;
  away: RawSide;
  score?: any;
  liveMeta?: any;
  finalMeta?: any;
};

type Preview =
  | { ok: false; reason: string }
  | {
      ok: true;
      normalized: {
        id: string;
        league: League;
        startAt: Timestamp; // Firestore Timestamp
        startAtJst: Timestamp; // Firestore Timestamp（JSTも統一）
        season: string;
        venue?: string;
        roundLabel?: string;
        status: "scheduled" | "live" | "final";
        home: any;
        away: any;
        score?: any;
        liveMeta?: any;
        finalMeta?: any;
      };
    };

/* =========================
   Helpers
========================= */

/** 文字列/数値/Date → Firestore Timestamp に変換 */
function toTimestamp(v: any): Timestamp | null {
  if (v instanceof Timestamp) return v;
  if (v instanceof Date) return Timestamp.fromDate(v);
  if (typeof v === "number" && Number.isFinite(v)) return Timestamp.fromMillis(v);
  if (typeof v === "string") {
    // ISO or "YYYY-MM-DDTHH:mm:ss+09:00" などを許容
    const d = new Date(v);
    if (!isNaN(+d)) return Timestamp.fromDate(d);
  }
  return null;
}

/** 8月〜翌年7月を1シーズン → 2025年11月なら "2025-26" */
function seasonFromDate(d: Date): string {
  const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
  return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
}
function seasonFromDateByLeague(league: League, d: Date): string {
  // B.LEAGUE（8月〜翌7月）
  if (league === "bj") {
    const y = d.getMonth() >= 7 ? d.getFullYear() : d.getFullYear() - 1;
    return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
  }

  // J1（シーズンは西暦固定）
  if (league === "j1") {
    return String(d.getFullYear());
  }

  // NBA（10月〜翌6月）
  if (league === "nba") {
    const y = d.getMonth() >= 9 ? d.getFullYear() : d.getFullYear() - 1;
    return `${y}-${String((y + 1) % 100).padStart(2, "0")}`;
  }

  return String(d.getFullYear());
}


/**
 * undefined を除去（ネスト対応）。
 * 🔴 重要：Timestamp は分解せず “そのまま” 返す
 * → これが今回の核心修正ポイント
 */
function omitUndefined<T>(v: T): T {
  if (v instanceof Timestamp) return v as any;
  if (v instanceof Date) return v as any;

  if (Array.isArray(v)) {
    return v.map((x) => omitUndefined(x)) as any;
  }

  if (v && typeof v === "object") {
    const out: any = {};
    for (const [k, val] of Object.entries(v as any)) {
      if (val === undefined) continue;
      out[k] = omitUndefined(val as any);
    }
    return out;
  }

  return v;
}

/** 1件を正規化してプレビュー用に返す（startAt / startAtJst を両方 Timestamp で統一） */
function normalizeRow(r: RawGame): Preview {
  try {
    const id = String(r?.id ?? "").trim();
    if (!id) return { ok: false, reason: "id が空です" };

    const league = normalizeLeague(r?.league);

    // --- 時刻ソース（優先順位: startAt → startAtJstIso → startAtJst）---
    const sourceTime = (() => {
      if (r?.startAt != null) return r.startAt;
      if (r?.startAtJstIso != null) return r.startAtJstIso;
      if (r?.startAtJst != null) return r.startAtJst;
      return null;
    })();

    const ts = toTimestamp(sourceTime);
    if (!ts) {
      return {
        ok: false,
        reason: `startAt / startAtJstIso / startAtJst が不正: ${String(sourceTime)}`,
      };
    }

    // startAtJst は入力があればそれを優先して Timestamp 化、なければ ts を使う
    const tsJst =
      toTimestamp(r?.startAtJst) ??
      toTimestamp(r?.startAtJstIso) ??
      ts;

    const jsDate = new Date(ts.toMillis());

    const season =
  typeof r.season === "string" && r.season.trim()
    ? r.season.trim()
    : seasonFromDateByLeague(league, jsDate);

    const status = ((): "scheduled" | "live" | "final" => {
      const s = String(r?.status ?? "scheduled").toLowerCase();
      if (s === "live" || s === "inprogress") return "live";
      if (s === "final" || s === "ended") return "final";
      return "scheduled";
    })();

    // colorHex / teamId は存在するときのみキーを持たせる
const toSide = (x: RawSide) => {
  // 文字列だけ渡された場合（例: "浦和レッズ"）
  if (typeof x === "string") {
    const mappedId = TEAM_IDS[x];
    if (!mappedId) {
      console.warn(`⚠ TEAM_IDS に存在しないチーム名: ${x}`);
    }
    return {
      name: x,
      teamId: mappedId,
    };
  }

  // オブジェクトとして渡された場合
  const name = x?.name ?? "";
  const mappedId = x?.teamId ?? TEAM_IDS[name];

  if (!mappedId) {
    console.warn(`⚠ TEAM_IDS に存在しないチーム名: ${name}`);
  }

  return omitUndefined({
    name,
    teamId: mappedId,
    ...(x?.colorHex ? { colorHex: x.colorHex } : {}),
  });
};


    return {
      ok: true,
      normalized: {
        id,
        league,
        startAt: ts,
        startAtJst: tsJst!, // ここも Timestamp
        season,
        venue: r?.venue || "",
        roundLabel: r?.roundLabel || "",
        status,
        home: toSide(r?.home),
        away: toSide(r?.away),
        score: r?.score ?? null,
        liveMeta: r?.liveMeta ?? null,
        finalMeta: r?.finalMeta ?? null,
      },
    };
  } catch (e: any) {
    return { ok: false, reason: e?.message ?? "unknown" };
  }
}

function chunk<T>(arr: T[], size: number) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/* =========================
   Page Component
========================= */
export default function GamesImportPage() {
  const [uid, setUid] = useState<string | null>(null);
  const [input, setInput] = useState<string>("");
  const [rows, setRows] = useState<Preview[] | null>(null);
  const [writing, setWriting] = useState(false);
  const [resultMsg, setResultMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => setUid(u?.uid ?? null));
    return () => unsub();
  }, []);

  const authorized = uid === ADMIN_UID;

  const parse = () => {
    try {
      let items: RawGame[] = [];
      const text = input.trim();
      if (!text) {
        setRows([]);
        return;
      }
      if (text.startsWith("[")) {
        items = JSON.parse(text); // JSON 配列
      } else {
        // 1行1JSON 形式
        items = text
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) => JSON.parse(l));
      }
      const previews = items.map(normalizeRow);
      setRows(previews);
      setResultMsg(null);
    } catch (e: any) {
      setRows([{ ok: false, reason: `JSON のパースに失敗: ${e?.message}` }]);
      setResultMsg(null);
    }
  };

  const stats = useMemo(() => {
    const all = rows ?? [];
    const ok = all.filter((r) => r.ok).length;
    const ng = all.length - ok;
    return { total: all.length, ok, ng };
  }, [rows]);

  const canWrite = authorized && stats.ok > 0;

  const writeAll = async () => {
    if (!canWrite || !rows) return;

    setWriting(true);
    setResultMsg(null);
    try {
      const okRows = rows.filter(
        (r): r is Extract<Preview, { ok: true }> => r.ok
      );

      let succeed = 0;
      // Firestore: 1 バッチ最大 500 件 → 余裕を見て 450 件ずつ
      for (const group of chunk(okRows, 450)) {
        const batch = writeBatch(db);
        for (const r of group) {
          const g = r.normalized;
          const ref = doc(db, "games", g.id);

          // 🔴 Timestamp を壊さない omitUndefined を通す
          const payload = omitUndefined({
            league: g.league,
            season: g.season,
            startAt: g.startAt, // Timestamp
            startAtJst: g.startAtJst, // Timestamp
            venue: g.venue ?? "",
            roundLabel: g.roundLabel ?? "",
            status: g.status,
            home: g.home,
            away: g.away,
            score: g.score ?? null,
            liveMeta: g.liveMeta ?? null,
            finalMeta: g.finalMeta ?? null,
            // 初期状態（確定前）
            final: false,
            homeScore: null,
            awayScore: null,
            resultComputedAt: null,
          });

          batch.set(ref, payload, { merge: true });
        }
        await batch.commit();
        succeed += group.length;
      }

      setResultMsg(`✅ 書き込み完了: ${succeed} 件`);
    } catch (e: any) {
      setResultMsg(`⛔ 書き込み失敗: ${e?.message ?? e}`);
    } finally {
      setWriting(false);
    }
  };

  return (
    <main className="min-h-[100svh] bg-[#0b2126] text-white p-4 md:p-8">
      <h1 className="text-2xl font-extrabold mb-2">Games Import</h1>
      <p className="text-white/70 mb-4">
        JSON を貼り付けてプレビュー → 問題なければ Firestore に一括書き込みします。
      </p>

      {/* 認可表示 */}
      <div className="mb-4 rounded-lg border border-white/10 p-3">
        <div>
          現在のUID: <code className="text-lime-300">{uid ?? "(未ログイン)"}</code>
        </div>
        <div>
          許可UID: <code className="text-lime-300">{ADMIN_UID}</code>
        </div>
        {authorized ? (
          <div className="text-lime-400 font-bold mt-1">✅ 管理者として書き込み可能</div>
        ) : (
          <div className="text-red-400 font-bold mt-1">
            ⛔ 管理者ではありません（閲覧／プレビューのみ）
          </div>
        )}
      </div>

      {/* 入力 */}
      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        className="w-full min-h-[240px] rounded-xl p-3 bg-white/10 border border-white/15 outline-none"
        placeholder={`例（配列）:
[
  {
    "id": "bj-20251108-001",
    "league": "bj",
    "season": "2025-26",
    "startAtJstIso": "2025-11-08T18:05:00+09:00",
    "venue": "代々木第二体育館",
    "roundLabel": "第5節",
    "home": { "name": "アルバルク東京" },
    "away": { "name": "川崎ブレイブサンダース" },
    "status": "scheduled"
  }
]

（1行1JSON でもOK）
{"id":"bj-20251108-002","league":"bj","startAtJstIso":"2025-11-08T19:05:00+09:00","home":"琉球ゴールデンキングス","away":"名古屋ダイヤモンドドルフィンズ","season":"2025-26"}
{"id":"j-20251110-001","league":"j","startAtJstIso":"2025-11-10T15:00:00+09:00","home":"浦和レッズ","away":"鹿島アントラーズ","season":"2025-26"}
`}
      />

      <div className="mt-3 flex gap-2">
        <button
          onClick={parse}
          className="px-4 h-10 rounded-lg bg-white text-black font-bold"
        >
          プレビュー
        </button>

        <button
          onClick={writeAll}
          disabled={!canWrite || writing}
          className={[
            "px-4 h-10 rounded-lg font-bold",
            canWrite && !writing
              ? "bg-lime-400 text-black hover:bg-lime-300"
              : "bg-white/20 text-white/60 cursor-not-allowed",
          ].join(" ")}
        >
          {writing ? "書き込み中…" : "Firestoreに書き込む"}
        </button>
      </div>

      {/* 結果/統計 */}
      {rows && (
        <div className="mt-4 rounded-xl border border-white/10">
          <div className="p-3 border-b border-white/10 text-sm text-white/80">
            合計 {stats.total} 件 / OK {stats.ok} 件 / NG{" "}
            {stats.total - stats.ok} 件
          </div>
          <div className="max-h-[60vh] overflow-auto divide-y divide-white/10">
            {rows.map((r, i) => (
              <div key={i} className="p-3 text-sm">
                {r.ok ? (
                  <div className="text-lime-300">
                    ✅ {r.normalized.id} / {r.normalized.league} /{" "}
                    {new Date(r.normalized.startAt.toMillis()).toLocaleString(
                      "ja-JP"
                    )}{" "}
                    / season: {r.normalized.season}
                  </div>
                ) : (
                  <div className="text-red-300">⛔ {r.reason}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {resultMsg && (
        <div className="mt-4 p-3 rounded-lg border border-white/10 text-sm">
          {resultMsg}
        </div>
      )}
    </main>
  );
}
