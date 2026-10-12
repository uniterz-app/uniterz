/**
 * アプリ利用状況のローカルダッシュボード（現在・1 時間前・増減・招待）。
 * 毎時 00 分に Firestore / Auth を読み直し（起動直後の取得から 30 分未満ならその回は飛ばす）、
 * ブラウザは 60 秒ごとに再描画する。
 *
 *   npm run stats:dashboard
 *   → http://localhost:4545
 */
import "./_loadAdminEnv";
import { createServer } from "node:http";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { exec } from "node:child_process";
import { getAuth } from "firebase-admin/auth";
import { Timestamp, type DocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "../lib/firebaseAdmin";
import { CURRENT_NBA_SEASON_KEY } from "../lib/rankings/nbaSeason";
import { referralPreseasonInviteeKey } from "../lib/referral/referralPreseasonBonusServer";

const PORT = Number(process.env.APP_STATS_PORT ?? 4545);
const APP_RELEASE_MS = Date.parse("2026-10-09T00:00:00+09:00");
const HOUR_MS = 3_600_000;
const MIN_GAP_MS = 30 * 60_000;
const DAY_MS = 24 * HOUR_MS;
const HISTORY_DIR = join(homedir(), ".uniterz");
const HISTORY_PATH = join(HISTORY_DIR, "app-stats-history.json");

type Snapshot = {
  at: number;
  active24h: number;
  favorites: number;
  returned?: number;
  returnedActive24h?: number;
  appActive24h?: number;
};

/** 通知を許可した端末（pushTokens）。起動のたびに updatedAt が更新される */
type AppDevice = { first: number; last: number; isNew: boolean };

type Referral = {
  inviteeUid: string;
  invitee: string;
  referrerUid: string;
  referrer: string;
  createdMs: number;
  submitted: boolean;
  granted: boolean;
};

type Raw = {
  fetchedAt: number;
  users: { created: number; last: number }[];
  /** 10/9 より前に登録した Web 時代のユーザーの最終利用時刻 */
  webUserLast: number[];
  standings: number[];
  awards: number[];
  referrals: Referral[];
  favorites: number;
  appDevices: AppDevice[];
  locale: { fresh: LocaleTally; returned: LocaleTally };
};

type LocaleTally = { country: Record<string, number>; language: Record<string, number> };

const LOCALE_FIELDS = ["countryCode", "language", "locale"] as const;

const toMs = (v: unknown): number => {
  const d = (v as { toDate?: () => Date })?.toDate?.();
  return d ? d.getTime() : NaN;
};

const loadHistory = (): Snapshot[] => {
  try {
    return existsSync(HISTORY_PATH) ? JSON.parse(readFileSync(HISTORY_PATH, "utf8")) : [];
  } catch {
    return [];
  }
};

const saveHistory = (rows: Snapshot[]) => {
  mkdirSync(HISTORY_DIR, { recursive: true });
  const cutoff = Date.now() - 3 * DAY_MS;
  writeFileSync(HISTORY_PATH, JSON.stringify(rows.filter((r) => r.at >= cutoff)));
};

/**
 * 毎時の全件読み（予想提出・全ユーザー doc・全端末）を避けるため、前回の結果を手元に持ち、
 * 増えた分だけ読む。削除や後からの変更を拾うため 1 日 1 回は全件読み直す。
 */
const CACHE_PATH = join(HISTORY_DIR, "app-stats-cache.json");
const FULL_REFRESH_MS = DAY_MS;
/** プロフィール（お気に入り・国）はオンボーディング中に入るので、この間は毎回読み直す */
const RECENT_USER_REREAD_MS = 6 * HOUR_MS;

type UserRow = { displayName: string | null; favorite: boolean; country: string; language: string };
type SubmissionRow = { uid: string; ms: number };
type TokenRow = { first: number; updated: number };

type FetchCache = {
  fullAt: number;
  standings: Record<string, SubmissionRow>;
  awards: Record<string, SubmissionRow>;
  /** uid → tokenId → row */
  tokens: Record<string, Record<string, TokenRow>>;
  tokensCheckedAt: number;
  users: Record<string, UserRow>;
};

const loadFetchCache = (): FetchCache | null => {
  try {
    return existsSync(CACHE_PATH) ? (JSON.parse(readFileSync(CACHE_PATH, "utf8")) as FetchCache) : null;
  } catch {
    return null;
  }
};

const saveFetchCache = (cache: FetchCache) => {
  mkdirSync(HISTORY_DIR, { recursive: true });
  writeFileSync(CACHE_PATH, JSON.stringify(cache));
};

const userRowOf = (d: DocumentSnapshot): UserRow => {
  const name = d.get("displayName");
  const team = d.get("favoriteNbaTeamId");
  const players = d.get("favoriteNbaPlayers");
  return {
    displayName: typeof name === "string" && name.trim() ? name.trim() : null,
    favorite:
      (typeof team === "string" && team.length > 0) ||
      (Array.isArray(players) && players.length > 0),
    country: String(d.get("countryCode") ?? "").trim().toUpperCase() || "-",
    language: String(d.get("language") ?? d.get("locale") ?? "").trim() || "-",
  };
};

const maxSubmittedMs = (rows: Record<string, SubmissionRow>) =>
  Object.values(rows).reduce((m, r) => (Number.isFinite(r.ms) && r.ms > m ? r.ms : m), 0);

async function fetchRaw(): Promise<Raw> {
  const db = getAdminDb();
  const auth = getAuth();
  const now = Date.now();
  const prevCache = loadFetchCache();
  const full = !prevCache || now - prevCache.fullAt >= FULL_REFRESH_MS;
  const cache: FetchCache = full
    ? { fullAt: now, standings: {}, awards: {}, tokens: {}, tokensCheckedAt: now, users: {} }
    : prevCache;
  const recentCreatedUids = new Set<string>();

  const users: Raw["users"] = [];
  const webUserLast: number[] = [];
  const cohort = new Set<string>();
  const returnedUids: string[] = [];
  let pageToken: string | undefined;
  do {
    const res = await auth.listUsers(1000, pageToken);
    for (const u of res.users) {
      const created = Date.parse(u.metadata.creationTime || "");
      if (!Number.isFinite(created)) continue;
      const last = Date.parse(u.metadata.lastRefreshTime || u.metadata.lastSignInTime || "");
      if (created < APP_RELEASE_MS) {
        webUserLast.push(last);
        if (Number.isFinite(last) && last >= APP_RELEASE_MS) returnedUids.push(u.uid);
        continue;
      }
      cohort.add(u.uid);
      users.push({ created, last });
      if (now - created <= RECENT_USER_REREAD_MS) recentCreatedUids.add(u.uid);
    }
    pageToken = res.pageToken;
  } while (pageToken);

  /** 提出 doc の submittedAt は初回提出時だけ書かれる → 前回の最大値以降だけ読めば新規提出を拾える */
  const syncSubmissions = async (collection: string, rows: Record<string, SubmissionRow>) => {
    const sinceMs = full ? 0 : maxSubmittedMs(rows);
    const q = sinceMs > 0
      ? db.collection(collection).where("submittedAt", ">=", Timestamp.fromMillis(sinceMs))
      : db.collection(collection).where("isSubmitted", "==", true);
    const snap = await q.select("uid", "submittedAt", "isSubmitted").get();
    for (const d of snap.docs) {
      if (d.get("isSubmitted") !== true || !d.id.startsWith(`${CURRENT_NBA_SEASON_KEY}_`)) continue;
      const ms = toMs(d.get("submittedAt"));
      rows[d.id] = { uid: String(d.get("uid") ?? ""), ms: Number.isFinite(ms) ? ms : APP_RELEASE_MS };
    }
  };

  const submittedByUid = (rows: Record<string, SubmissionRow>) => {
    const byUid = new Map<string, number>();
    for (const r of Object.values(rows)) {
      if (cohort.has(r.uid)) byUid.set(r.uid, r.ms);
    }
    return byUid;
  };

  /** 端末登録のたびに pushTokenOwners.updatedAt も更新される → 変わった人の pushTokens だけ読み直す */
  const syncTokens = async () => {
    const checkedAt = Date.now();
    if (full) {
      const snap = await db.collectionGroup("pushTokens").select("createdAt", "updatedAt").get();
      cache.tokens = {};
      for (const d of snap.docs) {
        const uid = d.ref.parent.parent?.id;
        if (!uid) continue;
        const updated = toMs(d.get("updatedAt"));
        const created = toMs(d.get("createdAt"));
        (cache.tokens[uid] ??= {})[d.id] = {
          first: Number.isFinite(created) ? created : updated,
          updated,
        };
      }
      cache.tokensCheckedAt = checkedAt;
      return;
    }
    const owners = await db
      .collection("pushTokenOwners")
      .where("updatedAt", ">=", Timestamp.fromMillis(cache.tokensCheckedAt - 5 * 60_000))
      .select("uid")
      .get();
    const uids = [...new Set(owners.docs.map((d) => String(d.get("uid") ?? "")).filter(Boolean))];
    await Promise.all(
      uids.map(async (uid) => {
        const snap = await db
          .collection(`users/${uid}/pushTokens`)
          .select("createdAt", "updatedAt")
          .get();
        const rows: Record<string, TokenRow> = {};
        for (const d of snap.docs) {
          const updated = toMs(d.get("updatedAt"));
          const created = toMs(d.get("createdAt"));
          rows[d.id] = { first: Number.isFinite(created) ? created : updated, updated };
        }
        if (snap.empty) delete cache.tokens[uid];
        else cache.tokens[uid] = rows;
      })
    );
    cache.tokensCheckedAt = checkedAt;
  };

  const [, , relSnap] = await Promise.all([
    syncSubmissions("seasonStandingsPredictions", cache.standings),
    syncSubmissions("seasonAwardsPredictions", cache.awards),
    db.collection("referralRelations").get(),
    syncTokens(),
  ]);
  const standingsByUid = submittedByUid(cache.standings);
  const awardsByUid = submittedByUid(cache.awards);

  const deviceByUid = new Map<string, AppDevice>();
  for (const [uid, tokens] of Object.entries(cache.tokens)) {
    for (const t of Object.values(tokens)) {
      const row = deviceByUid.get(uid) ?? { first: Infinity, last: -Infinity, isNew: cohort.has(uid) };
      if (Number.isFinite(t.first)) row.first = Math.min(row.first, t.first);
      if (Number.isFinite(t.updated)) row.last = Math.max(row.last, t.updated);
      deviceByUid.set(uid, row);
    }
  }

  const rels = relSnap.docs.filter((d) => cohort.has(d.id));
  const nameUids = new Set<string>();
  for (const d of rels) {
    nameUids.add(d.id);
    nameUids.add(String(d.get("referrerUid") ?? ""));
  }
  nameUids.delete("");

  /** キャッシュに無い人と登録直後の人だけ users doc を読む（全件は 1 日 1 回） */
  const needUser = (uid: string) => !cache.users[uid] || recentCreatedUids.has(uid);
  const userRefs = [...new Set([...cohort, ...returnedUids, ...nameUids])]
    .filter(needUser)
    .map((uid) => db.collection("users").doc(uid));
  const ledgerRefs = rels.map((d) =>
    db.collection("unit_ledger").doc(referralPreseasonInviteeKey(d.id))
  );

  const [userDocs, ledgerDocs] = await Promise.all([
    userRefs.length
      ? db.getAll(...userRefs, {
          fieldMask: [
            "displayName",
            "favoriteNbaTeamId",
            "favoriteNbaPlayers",
            ...LOCALE_FIELDS,
          ],
        })
      : Promise.resolve([]),
    ledgerRefs.length ? db.getAll(...ledgerRefs) : Promise.resolve([]),
  ]);
  for (const d of userDocs) cache.users[d.id] = userRowOf(d);
  saveFetchCache(cache);

  const userRows = (uids: Iterable<string>): UserRow[] =>
    [...uids].map((uid) => cache.users[uid]).filter((r): r is UserRow => !!r);

  const tallyLocale = (rows: UserRow[]): LocaleTally => {
    const country: Record<string, number> = {};
    const language: Record<string, number> = {};
    for (const r of rows) {
      country[r.country] = (country[r.country] ?? 0) + 1;
      language[r.language] = (language[r.language] ?? 0) + 1;
    }
    return { country, language };
  };
  const cohortRows = userRows(cohort);
  const locale = { fresh: tallyLocale(cohortRows), returned: tallyLocale(userRows(returnedUids)) };

  const names = new Map<string, string>();
  for (const uid of new Set([...cohort, ...nameUids])) {
    const name = cache.users[uid]?.displayName;
    if (name) names.set(uid, name);
  }
  const favorites = cohortRows.filter((r) => r.favorite).length;
  const grantedInvitees = new Set(
    ledgerDocs.filter((d) => d.exists).map((d) => String(d.get("uid") ?? ""))
  );

  const referrals: Referral[] = rels.map((d) => {
    const referrerUid = String(d.get("referrerUid") ?? "");
    return {
      inviteeUid: d.id,
      invitee: names.get(d.id) ?? "(名前未設定)",
      referrerUid,
      referrer: names.get(referrerUid) ?? referrerUid,
      createdMs: toMs(d.get("createdAt")),
      submitted: standingsByUid.has(d.id) || awardsByUid.has(d.id),
      granted: grantedInvitees.has(d.id),
    };
  });
  referrals.sort((a, b) => (b.createdMs || 0) - (a.createdMs || 0));

  return {
    fetchedAt: now,
    users,
    webUserLast,
    standings: [...standingsByUid.values()],
    awards: [...awardsByUid.values()],
    referrals,
    favorites,
    appDevices: [...deviceByUid.values()],
    locale,
  };
}

function metricsAt(raw: Raw, at: number) {
  const atOrBefore = (ms: number) => Number.isFinite(ms) && ms <= at;
  return {
    users: raw.users.filter((u) => u.created <= at).length,
    new24h: raw.users.filter((u) => u.created <= at && u.created > at - DAY_MS).length,
    new1h: raw.users.filter((u) => u.created <= at && u.created > at - HOUR_MS).length,
    standings: raw.standings.filter(atOrBefore).length,
    awards: raw.awards.filter(atOrBefore).length,
    referrals: raw.referrals.filter((r) => atOrBefore(r.createdMs)).length,
    appUsers: raw.appDevices.filter((d) => atOrBefore(d.first)).length,
    appReturned: raw.appDevices.filter((d) => !d.isNew && atOrBefore(d.first)).length,
  };
}

const appActive24h = (raw: Raw) =>
  raw.appDevices.filter((d) => raw.fetchedAt - d.last <= DAY_MS).length;

const activeNow = (raw: Raw) =>
  raw.users.filter((u) => Number.isFinite(u.last) && raw.fetchedAt - u.last <= DAY_MS).length;

const returnedSinceRelease = (raw: Raw) =>
  raw.webUserLast.filter((ms) => Number.isFinite(ms) && ms >= APP_RELEASE_MS).length;

const returnedActive24h = (raw: Raw) =>
  raw.webUserLast.filter((ms) => Number.isFinite(ms) && raw.fetchedAt - ms <= DAY_MS).length;

function nearestSnapshot(history: Snapshot[], target: number): Snapshot | null {
  let best: Snapshot | null = null;
  for (const s of history) {
    if (Math.abs(s.at - target) > 20 * 60_000) continue;
    if (!best || Math.abs(s.at - target) < Math.abs(best.at - target)) best = s;
  }
  return best;
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const jst = (ms: number, withDate = false) =>
  Number.isFinite(ms)
    ? new Date(ms).toLocaleString("ja-JP", {
        timeZone: "Asia/Tokyo",
        ...(withDate ? { month: "numeric", day: "numeric" } : {}),
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const regionNames = new Intl.DisplayNames(["ja"], { type: "region" });
const languageNames = new Intl.DisplayNames(["ja"], { type: "language" });

const regionName = (code: string) => {
  if (code === "-") return "未設定";
  try {
    return regionNames.of(code) ?? code;
  } catch {
    return code;
  }
};

const languageName = (code: string) => {
  if (code === "-") return "未設定";
  try {
    return languageNames.of(code) ?? code;
  } catch {
    return code;
  }
};

function localeTable(
  title: string,
  fresh: Record<string, number>,
  returned: Record<string, number>,
  nameOf: (code: string) => string
): string {
  const keys = [...new Set([...Object.keys(fresh), ...Object.keys(returned)])];
  const total = (k: string) => (fresh[k] ?? 0) + (returned[k] ?? 0);
  keys.sort((a, b) => {
    if (a === "-" || b === "-") return a === "-" ? 1 : -1;
    return total(b) - total(a);
  });
  const rows = keys
    .map(
      (k) => `<tr><td>${esc(nameOf(k))}</td><td class="num">${fresh[k] ?? 0}</td><td class="num">${returned[k] ?? 0}</td><td class="num"><b>${total(k)}</b></td></tr>`
    )
    .join("");
  return `<table><thead><tr><th>${title}</th><th class="num">新規</th><th class="num">帰ってきた</th><th class="num">合計</th></tr></thead><tbody>${rows}</tbody></table>`;
}

function render(raw: Raw | null, history: Snapshot[], error: string | null): string {
  if (!raw) {
    return page(`<p class="muted">${error ? `取得失敗: ${esc(error)}` : "読み込み中…"}</p>`);
  }
  const now = raw.fetchedAt;
  const cur = metricsAt(raw, now);
  const prev = metricsAt(raw, now - HOUR_MS);
  const active = activeNow(raw);
  const prevSnap = nearestSnapshot(history, now - HOUR_MS);
  const total = cur.users;
  const pct = (n: number) => (total ? `${((n / total) * 100).toFixed(1)}%` : "");

  const webTotal = raw.webUserLast.length;
  const returned = returnedSinceRelease(raw);
  const returnedActive = returnedActive24h(raw);
  const ofWeb = (n: number) => (webTotal ? `/ ${webTotal.toLocaleString()}` : "");

  type Card = { label: string; now: number; prev: number | null; sub?: string; foot?: string; big?: boolean };
  const renderCards = (rows: Card[]) =>
    rows
      .map((r) => {
        const diff = r.prev == null ? null : r.now - r.prev;
        const diffHtml =
          diff == null
            ? `<span class="muted">蓄積中</span>`
            : `<span class="${diff > 0 ? "up" : diff < 0 ? "down" : "muted"}">${diff > 0 ? "+" : ""}${diff}</span>`;
        return `<div class="card${r.big ? " big" : ""}">
        <div class="label">${r.label}</div>
        <div class="value">${r.now.toLocaleString()}${r.sub ? `<small>${r.sub}</small>` : ""}</div>
        ${r.foot ? `<div class="foot">${r.foot}</div>` : ""}
        <div class="meta"><span class="muted">1h前 ${r.prev == null ? "-" : r.prev.toLocaleString()}</span>${diffHtml}</div>
      </div>`;
      })
      .join("");

  const appActive = appActive24h(raw);
  const appNew = raw.appDevices.filter((d) => d.isNew).length;
  const prevUsedTotal = prevSnap?.returned == null ? null : prev.users + prevSnap.returned;

  const userCards = renderCards([
    {
      label: "アプリ版になってから使ったユーザー",
      now: cur.users + returned,
      prev: prevUsedTotal,
      foot: `24h 以内に使った人 <b>${(active + returnedActive).toLocaleString()}</b>`,
      big: true,
    },
    {
      label: "新しく登録したユーザー",
      now: cur.users,
      prev: prev.users,
      foot: `24h 以内に使った人 <b>${active.toLocaleString()}</b>`,
      big: true,
    },
    {
      label: "帰ってきたユーザー（Web 時代の登録者）",
      now: returned,
      prev: prevSnap?.returned ?? null,
      sub: ofWeb(returned),
      foot: `24h 以内に使った人 <b>${returnedActive.toLocaleString()}</b>`,
      big: true,
    },
    {
      label: "アプリで確認できた人（通知 ON 端末）",
      now: cur.appUsers,
      prev: prev.appUsers,
      foot: `新規 <b>${appNew}</b> · 帰ってきた <b>${cur.appReturned}</b> · 24h <b>${appActive}</b>`,
      big: true,
    },
  ]);

  const signupCards = renderCards([
    { label: "直近 1 時間の新規登録", now: cur.new1h, prev: prev.new1h },
    { label: "直近 24 時間の新規登録", now: cur.new24h, prev: prev.new24h },
  ]);

  const actionCards = renderCards([
    { label: "順位予想 提出", now: cur.standings, prev: prev.standings, sub: pct(cur.standings) },
    { label: "アワード予想 提出", now: cur.awards, prev: prev.awards, sub: pct(cur.awards) },
    { label: "招待で登録", now: cur.referrals, prev: prev.referrals },
    { label: "お気に入り登録", now: raw.favorites, prev: prevSnap?.favorites ?? null, sub: pct(raw.favorites) },
  ]);

  const cards = `
    <h2 class="sec">ユーザー（10/9 アプリ版リリースから）</h2>
    <div class="cards users">${userCards}</div>
    <div class="row2">
      <div><h2 class="sec">新規登録</h2><div class="cards">${signupCards}</div></div>
      <div><h2 class="sec">行動（新しく登録したユーザーのうち）</h2><div class="cards">${actionCards}</div></div>
    </div>`;

  const hourBuckets: { label: string; n: number }[] = [];
  const thisHour = Math.floor(now / HOUR_MS) * HOUR_MS;
  for (let i = 23; i >= 0; i--) {
    const start = thisHour - i * HOUR_MS;
    hourBuckets.push({
      label: String(new Date(start + 9 * HOUR_MS).getUTCHours()),
      n: raw.users.filter((u) => u.created >= start && u.created < start + HOUR_MS).length,
    });
  }
  const maxN = Math.max(1, ...hourBuckets.map((b) => b.n));
  const bars = hourBuckets
    .map(
      (b) => `<div class="bar"><span class="n">${b.n}</span><div style="height:${(b.n / maxN) * 100}%"></div><span class="h">${b.label}</span></div>`
    )
    .join("");

  const byReferrer = new Map<string, { name: string; total: number; lastHour: number; submitted: number }>();
  for (const r of raw.referrals) {
    const row = byReferrer.get(r.referrerUid) ?? { name: r.referrer, total: 0, lastHour: 0, submitted: 0 };
    row.total++;
    if (r.createdMs > now - HOUR_MS) row.lastHour++;
    if (r.submitted) row.submitted++;
    byReferrer.set(r.referrerUid, row);
  }
  const referrerRows = [...byReferrer.values()]
    .sort((a, b) => b.total - a.total || b.lastHour - a.lastHour)
    .map(
      (r) => `<tr><td>${esc(r.name)}</td><td class="num">${r.total}</td><td class="num">${r.submitted}</td><td class="num ${r.lastHour ? "up" : "muted"}">${r.lastHour ? `+${r.lastHour}` : "-"}</td></tr>`
    )
    .join("");

  const referralRows = raw.referrals
    .map((r) => {
      const fresh = r.createdMs > now - HOUR_MS;
      return `<tr class="${fresh ? "fresh" : ""}">
        <td class="muted">${jst(r.createdMs, true)}</td>
        <td>${esc(r.invitee)}</td>
        <td>${esc(r.referrer)}</td>
        <td>${r.submitted ? `<span class="up">提出</span>` : `<span class="muted">未</span>`}</td>
        <td>${r.granted ? `<span class="up">付与</span>` : `<span class="muted">-</span>`}</td>
      </tr>`;
    })
    .join("");

  const body = `
    <header>
      <h1>UNITERZ アプリユーザー <span class="muted">10/9〜</span></h1>
      <div class="muted">更新 ${jst(now)} · 次 ${jst(nextRefreshAt)}${error ? ` · <span class="down">直近の取得失敗</span>` : ""}</div>
    </header>
    <section>${cards}</section>
    <section class="grid">
      <div class="stack">
        <div class="panel">
          <h2>時間別の新規登録（直近 24 時間 · 計 ${hourBuckets.reduce((s, b) => s + b.n, 0)}）</h2>
          <div class="bars">${bars}</div>
        </div>
        <div class="panel">
          <h2>国・言語 <span class="muted">（国はプロフィールで本人が選んだもの）</span></h2>
          <div class="locale">
            ${localeTable("国", raw.locale.fresh.country, raw.locale.returned.country, regionName)}
            ${localeTable("言語", raw.locale.fresh.language, raw.locale.returned.language, languageName)}
          </div>
        </div>
      </div>
      <div class="panel">
        <h2>招待している人</h2>
        <table><thead><tr><th>招待した人</th><th class="num">人数</th><th class="num">予想提出</th><th class="num">1h</th></tr></thead><tbody>${referrerRows}</tbody></table>
      </div>
    </section>
    <section class="panel">
      <h2>招待の一覧 <span class="muted">（1 時間以内は強調）</span></h2>
      <table><thead><tr><th>登録</th><th>招待された人</th><th>招待した人</th><th>予想</th><th>特典</th></tr></thead><tbody>${referralRows}</tbody></table>
    </section>`;
  return page(body);
}

function page(body: string): string {
  return `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta http-equiv="refresh" content="60">
<title>UNITERZ App Stats</title>
<style>
  :root { color-scheme: dark; }
  body { margin: 0; padding: 24px; background: #050508; color: #e8f6ff; font: 14px/1.4 -apple-system, BlinkMacSystemFont, "Hiragino Sans", sans-serif; }
  header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
  h1 { margin: 0; font-size: 20px; letter-spacing: .04em; }
  h2 { margin: 0 0 10px; font-size: 13px; color: #00F5FF; letter-spacing: .06em; }
  .muted { color: rgba(232,246,255,.45); }
  .up { color: #34F5A1; font-weight: 600; }
  .down { color: #FF5C7A; font-weight: 600; }
  .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin-bottom: 14px; }
  .cards.users { grid-template-columns: repeat(4, 1fr); }
  .card.big .value { font-size: 40px; }
  .card.big:first-child { border-color: rgba(0,245,255,.55); }
  .foot { font-size: 12px; color: rgba(232,246,255,.7); margin-bottom: 6px; }
  .foot b { color: #e8f6ff; font-size: 14px; }
  h2.sec { color: rgba(232,246,255,.55); font-weight: 500; margin: 4px 0 8px; }
  .row2 { display: grid; grid-template-columns: 1fr 2fr; gap: 14px; }
  .card, .panel { background: #0c1018; border: 1px solid rgba(0,245,255,.18); border-radius: 10px; padding: 12px 14px; }
  .label { font-size: 12px; color: rgba(232,246,255,.6); }
  .value { font-size: 30px; font-weight: 700; font-variant-numeric: tabular-nums; margin: 4px 0; }
  .value small { font-size: 12px; font-weight: 500; color: rgba(232,246,255,.5); margin-left: 6px; }
  .meta { display: flex; justify-content: space-between; font-size: 12px; font-variant-numeric: tabular-nums; }
  .grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 14px; margin-bottom: 14px; align-items: start; }
  .stack { display: grid; gap: 14px; }
  .locale { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
  .panel { margin-bottom: 0; }
  section.panel { margin-bottom: 14px; }
  .bars { display: flex; align-items: flex-end; gap: 3px; height: 180px; }
  .bar { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; height: 100%; }
  .bar > div { width: 100%; background: linear-gradient(#00F5FF, rgba(0,245,255,.25)); border-radius: 3px 3px 0 0; min-height: 2px; }
  .bar .n { font-size: 11px; margin-bottom: 3px; font-variant-numeric: tabular-nums; }
  .bar .h { font-size: 10px; color: rgba(232,246,255,.45); margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
  th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,.06); }
  th { font-size: 11px; color: rgba(232,246,255,.5); font-weight: 500; }
  .num { text-align: right; }
  tr.fresh td { background: rgba(0,245,255,.07); }
</style></head><body>${body}</body></html>`;
}

let latest: Raw | null = null;
let lastError: string | null = null;
let history = loadHistory();
let nextRefreshAt = NaN;

async function refresh() {
  try {
    latest = await fetchRaw();
    lastError = null;
    history.push({
      at: latest.fetchedAt,
      active24h: activeNow(latest),
      favorites: latest.favorites,
      returned: returnedSinceRelease(latest),
      returnedActive24h: returnedActive24h(latest),
      appActive24h: appActive24h(latest),
    });
    saveHistory(history);
    history = loadHistory();
    console.log(`[${jst(latest.fetchedAt)}] users=${latest.users.length} referrals=${latest.referrals.length}`);
  } catch (e) {
    lastError = e instanceof Error ? e.message : String(e);
    console.error("refresh failed:", e);
  }
}

createServer((req, res) => {
  if (req.url !== "/" && !req.url?.startsWith("/?")) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  res.end(render(latest, history, lastError));
}).listen(PORT, "127.0.0.1", () => {
  const url = `http://localhost:${PORT}`;
  console.log(`dashboard: ${url}`);
  if (!process.argv.includes("--no-open")) exec(`open ${url}`);
});

function scheduleNextHour() {
  const now = Date.now();
  let next = Math.floor(now / HOUR_MS) * HOUR_MS + HOUR_MS;
  if (latest && next - latest.fetchedAt < MIN_GAP_MS) next += HOUR_MS;
  nextRefreshAt = next;
}

/**
 * 1 時間の setTimeout は Mac のスリープ中に時計が止まり、起きてもその分だけ遅れる。
 * 毎分、壁時計で予定時刻を過ぎたかを見る（スリープ明けはすぐ取り直す）。
 */
let refreshing = false;
setInterval(async () => {
  if (refreshing || !(Date.now() >= nextRefreshAt)) return;
  refreshing = true;
  try {
    if (!latest || Date.now() - latest.fetchedAt >= MIN_GAP_MS) await refresh();
  } finally {
    refreshing = false;
    scheduleNextHour();
  }
}, 60_000);

void refresh().then(scheduleNextHour);
