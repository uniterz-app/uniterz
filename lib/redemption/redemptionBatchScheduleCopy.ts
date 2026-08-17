/**
 * 商品交換の運用スケジュール文言（月末まとめ購入）
 * 4/1 申請 → 同月 25 日前後にまとめて購入、という体験を先に伝える。
 */

export function redemptionBatchScheduleCopy(language: "ja" | "en"): {
  short: string;
  detail: string;
  pendingHint: string;
  approvedHint: string;
} {
  if (language === "ja") {
    return {
      short: "月末まとめ購入（おおよそ25日前後）",
      detail:
        "交換申請はいつでも受け付けます。運営は配送料を抑えるため、その月の申請をまとめて月末（おおよそ25日前後）に購入・発送準備します。例: 4/1 の申請も、実際の購入は 4/25 前後になります。",
      pendingHint: "受付済み。月末のまとめ購入までお待ちください。",
      approvedHint: "購入準備中。月末まとめ購入（おおよそ25日前後）の対象です。",
    };
  }
  return {
    short: "Monthly batch order (~25th)",
    detail:
      "You can apply any day. To keep shipping costs down, we review and purchase that month’s requests together near month-end (around the 25th). Example: an Apr 1 request is typically purchased around Apr 25.",
    pendingHint: "Received. Waiting for the month-end batch purchase.",
    approvedHint: "Queued for the monthly batch purchase (~25th).",
  };
}
