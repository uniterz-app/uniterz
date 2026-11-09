/**
 * Pro 導線の計測イベント（Native → `POST /api/me/pro-funnel`）。
 *
 * - `proFunnelUsers/{uid}`: イベントごとの初回・最終・回数（何人に出たか）
 * - `proFunnelDaily/{YYYY-MM-DD JST}`: イベントごとの日次件数（`*_shown` は端末で 1 日 1 回に絞る）
 * - `proInsightOpens/{gameId}`: 試合ごとの INSIGHT を開いた回数・人数（Pro / Free 別）。
 *   人数は `proInsightOpens/{gameId}/users/{uid}` の初回作成で数える
 */

export const PRO_FUNNEL_EVENTS = [
  /** Free に Pro Skin 解放モーダル（Pro で解放）を出した */
  "skin_modal_shown",
  /** 同モーダルの Pro ボタン */
  "skin_modal_tap",
  /** Free に INSIGHT の PREVIEW 第 1 段落を出した */
  "insight_teaser_shown",
  /** 同パネルのトライアルボタン */
  "insight_teaser_tap",
  /** Pro 購入画面を開いた */
  "subscribe_view",
  /** 購入画面で購入 / トライアル開始を押した */
  "purchase_tap",
  /** ストアの購入が完了した */
  "purchase_done",
  /** 予想フォームで INSIGHT タブを開いた（Pro / Free とも。`gameId` 付き） */
  "insight_open",
] as const;

export type ProFunnelEvent = (typeof PRO_FUNNEL_EVENTS)[number];

/** 購入画面をどこから開いたか */
export const PRO_FUNNEL_SOURCES = [
  "skin_modal",
  "insight_teaser",
  "insight",
  "pro_league",
  "ask",
  "favorite",
  "pro_skin",
  "other",
] as const;

export type ProFunnelSource = (typeof PRO_FUNNEL_SOURCES)[number];

export function isProFunnelEvent(v: unknown): v is ProFunnelEvent {
  return typeof v === "string" && (PRO_FUNNEL_EVENTS as readonly string[]).includes(v);
}

export function isProFunnelSource(v: unknown): v is ProFunnelSource {
  return typeof v === "string" && (PRO_FUNNEL_SOURCES as readonly string[]).includes(v);
}

export const PRO_INSIGHT_OPENS_COLLECTION = "proInsightOpens";

export function isProFunnelGameId(v: unknown): v is string {
  return typeof v === "string" && /^[A-Za-z0-9_-]{1,80}$/.test(v);
}

/** 日本時間の日付キー（YYYY-MM-DD） */
export function proFunnelDayKey(ms: number): string {
  return new Date(ms + 9 * 3600_000).toISOString().slice(0, 10);
}
