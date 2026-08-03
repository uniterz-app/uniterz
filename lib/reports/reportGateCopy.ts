import type { ReportGateKind } from "@/lib/reports/reportGateTypes";

type Lang = "ja" | "en";

export type ReportGateBulletIcon =
  | "result"
  | "division"
  | "rival"
  | "target"
  | "comment"
  | "radar"
  | "habits"
  | "affinity"
  | "outlook"
  | "units";

export type ReportGateBullet = {
  icon: ReportGateBulletIcon;
  title: string;
  detail: string;
};

export type ReportGateCopy = {
  eyebrow: string;
  title: string;
  body: string;
  /** Free ゲートなど、箇条書きの補足 */
  bullets?: readonly ReportGateBullet[];
  cta: string | null;
};

const JA: Record<ReportGateKind, ReportGateCopy> = {
  free: {
    eyebrow: "PRO REPORT",
    title: "成績の振り返りは Pro から",
    body: "週次の競争レポートと、月次の自己分析が届きます。",
    bullets: [
      {
        icon: "result",
        title: "今週の結果",
        detail: "週間順位・獲得ポイント・勝敗",
      },
      {
        icon: "division",
        title: "部門成績",
        detail: "WIN / SCORER / UPSET の順位",
      },
      {
        icon: "rival",
        title: "ライバル対決",
        detail: "抜いた人・抜かれた人がわかる",
      },
      {
        icon: "target",
        title: "次の一手",
        detail: "次のターゲットと背後の脅威",
      },
      {
        icon: "comment",
        title: "診断コメント",
        detail: "今週の総括と、次週の焦点",
      },
    ],
    cta: "Pro を見る",
  },
  waitingMonday: {
    eyebrow: "WEEKLY",
    title: "次の月曜日に届きます",
    body: "週次レポートは毎週月曜に確定版が配信されます。届くまでしばらくお待ちください。",
    cta: null,
  },
  waitingMonth: {
    eyebrow: "MONTHLY",
    title: "月初に届きます",
    body: "月次レポートは毎月1日に作成されます。最初の1冊が届くまでお待ちください。",
    cta: null,
  },
  insufficientPicks: {
    eyebrow: "WEEKLY",
    title: "予想が足りません",
    body: "この期間に予想がなかったため、レポートを作成できませんでした。試合を予想すると次の配信対象になります。",
    cta: "試合を見る",
  },
  monthlyLocked: {
    eyebrow: "MONTHLY",
    title: "月次レポートは Monthly 以上",
    body: "Weekly では週次のみ。月次の自己分析はプラン変更で開けます。",
    bullets: [
      {
        icon: "result",
        title: "月の成績",
        detail: "順位・Unit・前月比が一目でわかる",
      },
      {
        icon: "radar",
        title: "レーダー分析",
        detail: "5軸で自分の強み・弱みがわかる",
      },
      {
        icon: "habits",
        title: "予想のクセ",
        detail: "ホーム／アウェイや傾向の整理",
      },
      {
        icon: "affinity",
        title: "チーム相性",
        detail: "得意・苦手がわかる",
      },
      {
        icon: "outlook",
        title: "来月の見通し",
        detail: "総括と次の焦点",
      },
    ],
    cta: "プランを変更",
  },
};

const EN: Record<ReportGateKind, ReportGateCopy> = {
  free: {
    eyebrow: "PRO REPORT",
    title: "Reports unlock with Pro",
    body: "Get weekly competition recaps and monthly self-analysis.",
    bullets: [
      {
        icon: "result",
        title: "This week’s result",
        detail: "Rank, points, and W–L at a glance",
      },
      {
        icon: "division",
        title: "Divisions",
        detail: "WIN / SCORER / UPSET standings",
      },
      {
        icon: "rival",
        title: "Rival battles",
        detail: "Who you passed — and who passed you",
      },
      {
        icon: "target",
        title: "Next move",
        detail: "Your next target and the threat behind",
      },
      {
        icon: "comment",
        title: "Coach note",
        detail: "Week summary and next week’s focus",
      },
    ],
    cta: "Explore Pro",
  },
  waitingMonday: {
    eyebrow: "WEEKLY",
    title: "Arrives next Monday",
    body: "Weekly finals ship Monday morning. Hang tight until your first report lands.",
    cta: null,
  },
  waitingMonth: {
    eyebrow: "MONTHLY",
    title: "Arrives on the 1st",
    body: "Monthly reports are built on the 1st of each month. Hang tight for your first one.",
    cta: null,
  },
  insufficientPicks: {
    eyebrow: "WEEKLY",
    title: "Not enough predictions",
    body: "No picks in this period, so we couldn’t build a report. Predict games to qualify for the next drop.",
    cta: "Browse games",
  },
  monthlyLocked: {
    eyebrow: "MONTHLY",
    title: "Monthly needs Monthly+",
    body: "Weekly includes weekly only. Unlock monthly analysis by changing plans.",
    bullets: [
      {
        icon: "result",
        title: "Month scorecard",
        detail: "Rank, Units, and month-over-month",
      },
      {
        icon: "radar",
        title: "Radar",
        detail: "Five axes of strengths and gaps",
      },
      {
        icon: "habits",
        title: "Habits",
        detail: "Home/away patterns and bias",
      },
      {
        icon: "affinity",
        title: "Team affinity",
        detail: "Who you click with — and who you don’t",
      },
      {
        icon: "outlook",
        title: "Next outlook",
        detail: "Summary and focus for next month",
      },
    ],
    cta: "Change plan",
  },
};

export function reportGateCopy(
  kind: ReportGateKind,
  language: Lang
): ReportGateCopy {
  return (language === "ja" ? JA : EN)[kind];
}

export function reportGateCtaHref(kind: ReportGateKind): string | null {
  switch (kind) {
    case "free":
      return "/mobile/pro/subscribe";
    case "monthlyLocked":
      return "/mobile/plan-change";
    case "insufficientPicks":
      return "/mobile/games";
    case "waitingMonday":
    case "waitingMonth":
      return null;
  }
}
