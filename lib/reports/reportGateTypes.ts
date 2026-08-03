/** Report タブのゲート／空状態（見た目確認・本番共通） */

export const REPORT_GATE_KINDS = [
  "free",
  "waitingMonday",
  "waitingMonth",
  "insufficientPicks",
  "monthlyLocked",
] as const;

export type ReportGateKind = (typeof REPORT_GATE_KINDS)[number];

/** プレビュー切替用。live = ゲート無し（実データ／通常表示） */
export const REPORT_GATE_PREVIEW_MODES = ["live", ...REPORT_GATE_KINDS] as const;

export type ReportGatePreviewMode = (typeof REPORT_GATE_PREVIEW_MODES)[number];

export function isReportGateKind(v: string): v is ReportGateKind {
  return (REPORT_GATE_KINDS as readonly string[]).includes(v);
}

export function isReportGatePreviewMode(v: string): v is ReportGatePreviewMode {
  return (REPORT_GATE_PREVIEW_MODES as readonly string[]).includes(v);
}
