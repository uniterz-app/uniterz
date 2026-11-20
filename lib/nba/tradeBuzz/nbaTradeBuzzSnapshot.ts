/**
 * トレード Buzz / 確定トレードの Firestore スナップショット。
 * 手入力（管理画面）→ `nbaTradeBuzz/{season}` → 公開 GET はここだけ読む。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import type {
  NbaTradeBuzzConfidence,
  NbaTradeBuzzEvent,
  NbaTradeBuzzEventKind,
  NbaTradeBuzzItem,
} from "@/lib/predict/nbaTradeBuzz";
import type { NbaConfirmedTrade } from "@/lib/predict/nbaTradeConfirmed";
import {
  NBA_TRADE_BUZZ_AS_OF_JST,
  NBA_TRADE_BUZZ_CURATED,
} from "@/lib/predict/nbaTradeBuzzCurated";
import { NBA_CONFIRMED_TRADES_2026_27 } from "@/lib/predict/nbaTradeConfirmed";

export const NBA_TRADE_BUZZ_COLLECTION = "nbaTradeBuzz";

/** 管理画面の巨大 JSON で doc を膨らませない */
const MAX_BUZZ_ITEMS = 40;
const MAX_EVENTS_PER_ITEM = 24;
const MAX_CONFIRMED = 40;

export type NbaTradeBuzzSnapshot = {
  seasonKey: string;
  asOfJst: string;
  updatedAtMs: number;
  items: NbaTradeBuzzItem[];
  confirmed: NbaConfirmedTrade[];
};

const CONFIDENCE = new Set<NbaTradeBuzzConfidence>([
  "official",
  "multi",
  "single",
  "opinion",
]);
const EVENT_KIND = new Set<NbaTradeBuzzEventKind>([
  "report",
  "statement",
  "interest",
  "market",
  "opinion",
]);
const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function str(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : "";
}

function parseEvent(raw: unknown): NbaTradeBuzzEvent | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const day = str(o.day);
  const kind = str(o.kind) as NbaTradeBuzzEventKind;
  const textJa = str(o.textJa);
  const sourceLabel = str(o.sourceLabel);
  if (!DAY_RE.test(day) || !EVENT_KIND.has(kind) || !textJa || !sourceLabel) {
    return null;
  }
  const timeRaw = o.time == null ? null : str(o.time);
  const time = timeRaw && TIME_RE.test(timeRaw) ? timeRaw : null;
  const sourceUrl = str(o.sourceUrl) || null;
  return { day, time, kind, textJa, sourceLabel, sourceUrl };
}

export function parseNbaTradeBuzzItem(raw: unknown): NbaTradeBuzzItem | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = str(o.id);
  const playerName = str(o.playerName);
  const confidence = str(o.confidence) as NbaTradeBuzzConfidence;
  const headlineJa = str(o.headlineJa);
  const rank = Number(o.rank);
  if (!id || !playerName || !CONFIDENCE.has(confidence) || !headlineJa) {
    return null;
  }
  if (!Number.isInteger(rank) || rank < 1) return null;
  const eventsRaw = Array.isArray(o.events) ? o.events : [];
  const events: NbaTradeBuzzEvent[] = [];
  for (const row of eventsRaw) {
    if (events.length >= MAX_EVENTS_PER_ITEM) break;
    const event = parseEvent(row);
    if (event) events.push(event);
  }
  const fromTeamAbbr = str(o.fromTeamAbbr) || null;
  const playerId = str(o.playerId) || null;
  return { id, rank, playerId, playerName, fromTeamAbbr, confidence, headlineJa, events };
}

export function parseNbaConfirmedTrade(raw: unknown): NbaConfirmedTrade | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const id = str(o.id);
  const day = str(o.day);
  const playerName = str(o.playerName);
  const fromTeamAbbr = str(o.fromTeamAbbr);
  const toTeamAbbr = str(o.toTeamAbbr);
  const summaryJa = str(o.summaryJa);
  const sourceLabel = str(o.sourceLabel);
  const sourceUrl = str(o.sourceUrl);
  if (
    !id ||
    !DAY_RE.test(day) ||
    !playerName ||
    !fromTeamAbbr ||
    !toTeamAbbr ||
    !summaryJa ||
    !sourceLabel ||
    !sourceUrl
  ) {
    return null;
  }
  const timeRaw = o.time == null ? null : str(o.time);
  const time = timeRaw && TIME_RE.test(timeRaw) ? timeRaw : null;
  const playerId = str(o.playerId) || null;
  return {
    id,
    day,
    time,
    playerId,
    playerName,
    fromTeamAbbr,
    toTeamAbbr,
    summaryJa,
    sourceLabel,
    sourceUrl,
  };
}

export function nowAsOfJst(atMs: number = Date.now()): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(atMs));
  const pick = (t: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === t)?.value ?? "";
  return `${pick("year")}-${pick("month")}-${pick("day")} ${pick("hour")}:${pick("minute")}`;
}

function snapshotFromDoc(
  seasonKey: string,
  data: Record<string, unknown> | undefined
): NbaTradeBuzzSnapshot | null {
  if (!data) return null;
  const items: NbaTradeBuzzItem[] = [];
  if (Array.isArray(data.items)) {
    for (const row of data.items) {
      const item = parseNbaTradeBuzzItem(row);
      if (item) items.push(item);
    }
  }
  const confirmed: NbaConfirmedTrade[] = [];
  if (Array.isArray(data.confirmed)) {
    for (const row of data.confirmed) {
      const trade = parseNbaConfirmedTrade(row);
      if (trade) confirmed.push(trade);
    }
  }
  const updatedAtMs = Number(data.updatedAtMs);
  const asOfJst = str(data.asOfJst) || nowAsOfJst();
  return {
    seasonKey,
    asOfJst,
    updatedAtMs: Number.isFinite(updatedAtMs) && updatedAtMs > 0 ? updatedAtMs : 0,
    items,
    confirmed,
  };
}

export async function loadNbaTradeBuzzSnapshot(
  db: Firestore,
  seasonKey: string
): Promise<NbaTradeBuzzSnapshot | null> {
  const snap = await db.collection(NBA_TRADE_BUZZ_COLLECTION).doc(seasonKey).get();
  if (!snap.exists) return null;
  return snapshotFromDoc(seasonKey, snap.data() as Record<string, unknown>);
}

export type WriteNbaTradeBuzzInput = {
  seasonKey: string;
  asOfJst?: string;
  items?: unknown;
  confirmed?: unknown;
  /** true: コードの初期データを入れる（既存を上書き） */
  seed?: boolean;
};

export async function writeNbaTradeBuzzSnapshot(
  db: Firestore,
  input: WriteNbaTradeBuzzInput
): Promise<NbaTradeBuzzSnapshot> {
  const ref = db.collection(NBA_TRADE_BUZZ_COLLECTION).doc(input.seasonKey);
  const seeded: NbaTradeBuzzSnapshot = {
    seasonKey: input.seasonKey,
    asOfJst: NBA_TRADE_BUZZ_AS_OF_JST,
    updatedAtMs: 0,
    items: [...NBA_TRADE_BUZZ_CURATED],
    confirmed: [...NBA_CONFIRMED_TRADES_2026_27],
  };
  const needExisting =
    !input.seed && (input.items === undefined || input.confirmed === undefined);
  const existing = needExisting
    ? await loadNbaTradeBuzzSnapshot(db, input.seasonKey)
    : null;
  const base = input.seed ? seeded : existing ?? seeded;

  let items = base.items;
  if (!input.seed && input.items !== undefined) {
    if (!Array.isArray(input.items)) {
      throw Object.assign(new Error("items must be an array"), { status: 400 });
    }
    if (input.items.length > MAX_BUZZ_ITEMS) {
      throw Object.assign(new Error(`items max ${MAX_BUZZ_ITEMS}`), { status: 400 });
    }
    items = [];
    for (const row of input.items) {
      const item = parseNbaTradeBuzzItem(row);
      if (!item) {
        throw Object.assign(new Error("invalid buzz item"), { status: 400 });
      }
      items.push(item);
    }
  }

  let confirmed = base.confirmed;
  if (!input.seed && input.confirmed !== undefined) {
    if (!Array.isArray(input.confirmed)) {
      throw Object.assign(new Error("confirmed must be an array"), { status: 400 });
    }
    if (input.confirmed.length > MAX_CONFIRMED) {
      throw Object.assign(new Error(`confirmed max ${MAX_CONFIRMED}`), {
        status: 400,
      });
    }
    confirmed = [];
    for (const row of input.confirmed) {
      const trade = parseNbaConfirmedTrade(row);
      if (!trade) {
        throw Object.assign(new Error("invalid confirmed trade"), { status: 400 });
      }
      confirmed.push(trade);
    }
  }

  const asOfJst =
    str(input.asOfJst) || (input.seed ? NBA_TRADE_BUZZ_AS_OF_JST : nowAsOfJst());
  const updatedAtMs = Date.now();
  const doc: NbaTradeBuzzSnapshot = {
    seasonKey: input.seasonKey,
    asOfJst,
    updatedAtMs,
    items,
    confirmed,
  };
  await ref.set({
    ...doc,
    updatedAt: FieldValue.serverTimestamp(),
  });
  return doc;
}

export type NbaTradeBuzzPublicMeta = {
  ok: true;
  season: string | null;
  asOfJst: string | null;
  updatedAtMs: number | null;
};

export function publicNbaTradeBuzzMeta(
  doc: NbaTradeBuzzSnapshot | null
): NbaTradeBuzzPublicMeta {
  if (!doc) {
    return { ok: true, season: null, asOfJst: null, updatedAtMs: null };
  }
  return {
    ok: true,
    season: doc.seasonKey,
    asOfJst: doc.asOfJst,
    updatedAtMs: doc.updatedAtMs,
  };
}

export function publicNbaTradeBuzzPayload(doc: NbaTradeBuzzSnapshot | null): {
  ok: true;
  season: string | null;
  asOfJst: string | null;
  updatedAtMs: number | null;
  items: NbaTradeBuzzItem[];
  confirmed: NbaConfirmedTrade[];
} {
  const meta = publicNbaTradeBuzzMeta(doc);
  if (!doc) {
    return { ...meta, items: [], confirmed: [] };
  }
  return {
    ...meta,
    items: doc.items,
    confirmed: doc.confirmed,
  };
}
