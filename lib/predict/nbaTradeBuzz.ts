/**
 * トレード Buzz — 手で集めた噂・報道のメモ（確定トレードは別）。
 * 参考情報。外れもある前提で、断定しない文面にする。
 *
 * 時刻はすべて日本時間（JST）。`day` は必ず入り、`time` は分かるときだけ入る。
 */
export type NbaTradeBuzzConfidence =
  /** 本人または球団が公式に認めている */
  | "official"
  /** 複数の記者・報道が同じ方向で伝えている */
  | "multi"
  /** 単発の報道・関係者情報 */
  | "single"
  /** 記者や本人による見立て・予想（交渉の報道ではない） */
  | "opinion";

export type NbaTradeBuzzEventKind =
  | "report"
  | "statement"
  | "interest"
  | "market"
  | "opinion";

export type NbaTradeBuzzEvent = {
  /** 日付 `YYYY-MM-DD`（JST） */
  day: string;
  /** 時刻 `HH:mm`（JST）。不明なら null */
  time: string | null;
  kind: NbaTradeBuzzEventKind;
  textJa: string;
  sourceLabel: string;
  sourceUrl?: string | null;
};

export type NbaTradeBuzzItem = {
  id: string;
  /** 確度順の番号（1 が最も確度が高い） */
  rank: number;
  playerId: string | null;
  playerName: string;
  /** 現所属（無ければ null） */
  fromTeamAbbr: string | null;
  confidence: NbaTradeBuzzConfidence;
  /** 一行の要約（断定しない） */
  headlineJa: string;
  /** 古い順ではなく新しい順。`events[0]` が最新 */
  events: NbaTradeBuzzEvent[];
};

export const NBA_TRADE_BUZZ_CONFIDENCE_LABEL: Record<
  NbaTradeBuzzConfidence,
  { ja: string; en: string }
> = {
  official: { ja: "公式に認めた", en: "Confirmed by team" },
  multi: { ja: "複数報道", en: "Multiple reports" },
  single: { ja: "単発の報道", en: "Single report" },
  opinion: { ja: "見立て", en: "Opinion" },
};

export const NBA_TRADE_BUZZ_KIND_LABEL: Record<
  NbaTradeBuzzEventKind,
  string
> = {
  report: "報道",
  statement: "発言",
  interest: "関心",
  market: "市場",
  opinion: "見立て",
};

/** 古い Buzz を薄くする閾値（72h）。最新の出来事からの経過で判定 */
export const NBA_TRADE_BUZZ_STALE_AFTER_MS = 72 * 60 * 60 * 1000;

/** JST の `day` + `time` を ms にする（time 不明は 00:00 JST） */
export function nbaTradeBuzzEventMs(
  event: Pick<NbaTradeBuzzEvent, "day" | "time">
): number {
  const hhmm = event.time ?? "00:00";
  return Date.parse(`${event.day}T${hhmm}:00+09:00`);
}

/** 最新の出来事の時刻（ms）。出来事が無いときは 0 */
export function nbaTradeBuzzLatestMs(item: NbaTradeBuzzItem): number {
  let latest = 0;
  for (const e of item.events) {
    const ms = nbaTradeBuzzEventMs(e);
    if (Number.isFinite(ms) && ms > latest) latest = ms;
  }
  return latest;
}

export function isNbaTradeBuzzStale(
  item: NbaTradeBuzzItem,
  nowMs: number = Date.now()
): boolean {
  const latest = nbaTradeBuzzLatestMs(item);
  if (latest <= 0) return true;
  return nowMs - latest >= NBA_TRADE_BUZZ_STALE_AFTER_MS;
}

/** `11/14 04:50` / `11/13` の表示（JST） */
export function formatNbaTradeBuzzEventWhen(
  event: Pick<NbaTradeBuzzEvent, "day" | "time">
): string {
  const [, m, d] = event.day.split("-");
  const md = `${Number(m)}/${Number(d)}`;
  return event.time ? `${md} ${event.time}` : md;
}
