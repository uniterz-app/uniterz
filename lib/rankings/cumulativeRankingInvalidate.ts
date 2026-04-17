/** プロフィール保存後など、累積ランキングの再取得を促す（useCumulativeRankingsBulk が購読） */
export const CUMULATIVE_RANKING_INVALIDATE_EVENT = "cumulative-ranking:invalidate";

/** 保存した国を API 待ちせず一覧に反映（useCumulativeRankingsBulk が購読） */
export const CUMULATIVE_RANKING_PATCH_MY_COUNTRY_EVENT =
  "cumulative-ranking:patch-my-country";

export type CumulativeRankingPatchMyCountryDetail = {
  uid: string;
  countryCode: string | null;
};

function rankCountrySessionKey(uid: string): string {
  return `uniterz_rank_country_${uid}`;
}

type RankCountrySessionPayload = { c: string | null; t: number };

/**
 * プロフィール保存直後に呼ぶ。ランキング画面が閉じていても、次に開いたとき API 結果へ上書きマージできる。
 * `c: null` は「未設定で保存」を表す（キーは残す）。
 */
export function persistRankCountrySessionOverride(
  uid: string,
  countryCode: string | null
): void {
  if (typeof window === "undefined") return;
  try {
    const payload: RankCountrySessionPayload = {
      c: countryCode && countryCode.trim() !== "" ? countryCode.trim() : null,
      t: Date.now(),
    };
    window.sessionStorage.setItem(
      rankCountrySessionKey(uid),
      JSON.stringify(payload)
    );
  } catch {
    /* プライベートモード等 */
  }
}

/** 未設定: セッション上書きを消す */
export function clearRankCountrySessionOverride(uid: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(rankCountrySessionKey(uid));
  } catch {
    /* ignore */
  }
}

/**
 * `undefined` = セッションに未保存（マージ不要）
 * `null` = ユーザーが国を未設定にした（countryCode を null で上書き）
 * `string` = その国コードで上書き
 */
export function readRankCountrySessionOverride(
  uid: string
): string | null | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const raw = window.sessionStorage.getItem(rankCountrySessionKey(uid));
    if (raw === null) return undefined;
    const o = JSON.parse(raw) as { c?: unknown };
    if (!o || typeof o !== "object") return undefined;
    if (o.c === null) return null;
    if (typeof o.c === "string") return o.c;
    return undefined;
  } catch {
    return undefined;
  }
}

export function dispatchCumulativeRankingInvalidate(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CUMULATIVE_RANKING_INVALIDATE_EVENT));
}

export function dispatchCumulativeRankingPatchMyCountry(
  uid: string,
  countryCode: string | null
): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<CumulativeRankingPatchMyCountryDetail>(
      CUMULATIVE_RANKING_PATCH_MY_COUNTRY_EVENT,
      { detail: { uid, countryCode } }
    )
  );
}
