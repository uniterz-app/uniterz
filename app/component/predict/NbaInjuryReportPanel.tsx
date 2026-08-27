"use client";

import { useRouter } from "next/navigation";
import {
  injuryDetailLabel,
  injuryStatusLabel,
  injuryStatusShortLabel,
  injuryStatusTone,
  playerCardName,
  playerInitials,
  sortInjuryEntries,
  type InjuryStatusTone,
  type NbaInjuryCardRow,
  type NbaInjuryEntry,
  type NbaInjuryReport,
  type NbaInjuryTeamReport,
} from "@/lib/predict/nbaInjuryReport";
import { NBA_TEAM_NAME_BY_ID } from "@/lib/nba-team-names";
import { getMobileTeamName } from "@/lib/team-name-split-mobile";
import { nameBebas, nameOxanium } from "@/lib/fonts";
import { matchCardTeamNameStyle } from "@/lib/games/teamDisplayTypography";
import type { Language } from "@/lib/i18n/language";
import { nbaPlayerDetailPreviewHref } from "@/lib/predict/nbaTeamDetailHref";
import { stashPredictTeamDetailReturn } from "@/lib/predict/predictTeamDetailReturn";

type Props = {
  report: NbaInjuryReport;
  language: Language;
  className?: string;
  fromPredictGameId?: string;
  predictReturnMode?: "overlay" | "route";
};

/** 参考デザイン準拠のステータスカラー */
const TONE: Record<
  InjuryStatusTone,
  { accent: string; border: string; badgeBg: string }
> = {
  out: {
    accent: "#FF2D78",
    border: "rgba(255,45,120,0.85)",
    badgeBg: "#FF2D78",
  },
  doubt: {
    accent: "#FF8A3D",
    border: "rgba(255,138,61,0.85)",
    badgeBg: "#FF8A3D",
  },
  question: {
    accent: "#F5C518",
    border: "rgba(245,197,24,0.9)",
    badgeBg: "#F5C518",
  },
  probable: {
    accent: "#00E5FF",
    border: "rgba(0,229,255,0.85)",
    badgeBg: "#00E5FF",
  },
  available: {
    accent: "#2DFF6E",
    border: "rgba(45,255,110,0.85)",
    badgeBg: "#2DFF6E",
  },
  neutral: {
    accent: "rgba(255,255,255,0.55)",
    border: "rgba(255,255,255,0.22)",
    badgeBg: "rgba(255,255,255,0.35)",
  },
};

function StatusIcon({
  tone,
  color,
  className = "h-[18px] w-[18px]",
}: {
  tone: InjuryStatusTone;
  color: string;
  className?: string;
}) {
  const common = {
    className,
    viewBox: "0 0 28 28",
    fill: "none",
    "aria-hidden": true as const,
  };

  if (tone === "out") {
    return (
      <svg {...common}>
        <path
          d="M7 7L21 21M21 7L7 21"
          stroke={color}
          strokeWidth="3.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (tone === "question" || tone === "doubt") {
    return (
      <svg {...common}>
        <circle cx="14" cy="14" r="11" stroke={color} strokeWidth="2.2" />
        <path
          d="M10.8 10.6c0-1.9 1.5-3.4 3.3-3.4s3.3 1.4 3.3 3.2c0 1.5-.8 2.3-2 3.1-.9.6-1.5 1.2-1.5 2.4"
          stroke={color}
          strokeWidth="2.1"
          strokeLinecap="round"
        />
        <circle cx="14" cy="20.2" r="1.35" fill={color} />
      </svg>
    );
  }
  if (tone === "probable") {
    return (
      <svg {...common}>
        <path
          d="M14 3.5L23 7.2V13c0 5.4-3.7 9.4-9 10.8C8.7 22.4 5 18.4 5 13V7.2L14 3.5Z"
          stroke={color}
          strokeWidth="2.2"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (tone === "available") {
    return (
      <svg {...common}>
        <path
          d="M6.5 14.5L11.5 19.5L21.5 8.5"
          stroke={color}
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="14" cy="14" r="9" stroke={color} strokeWidth="2" />
    </svg>
  );
}

function toCardRows(team: NbaInjuryTeamReport): NbaInjuryCardRow[] {
  return sortInjuryEntries(team.entries).map((e: NbaInjuryEntry) => ({
    ...e,
    teamId: e.teamId ?? team.teamId,
    teamName: e.teamName ?? team.teamName,
    side: team.side,
  }));
}

function InjuryStatusCard({
  row,
  language,
  onPress,
}: {
  row: NbaInjuryCardRow;
  language: Language;
  onPress?: (row: NbaInjuryCardRow) => void;
}) {
  const tone = injuryStatusTone(row.status);
  const colors = TONE[tone];
  const expected = (row.returnDate ?? "—").toUpperCase();
  // 負傷詳細の翻訳辞書は ja のみ。他言語は英語表記にフォールバック
  const detail = injuryDetailLabel(row, language === "ja" ? "ja" : "en");
  const name = playerCardName(row.player);
  const statusShort = injuryStatusShortLabel(row.status);

  const cardClass =
    "relative min-w-0 w-full cursor-pointer select-none overflow-hidden bg-[rgba(8,10,14,0.92)] text-left transition duration-150 ease-out hover:brightness-110 active:scale-[0.98] active:brightness-125 rounded-[2px] p-2.5";
  const cardStyle = {
    border: `1px solid ${colors.border}`,
  } as const;

  const inner = (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-1.5">
        <p
          className={[
            nameOxanium.className,
            "truncate text-[13px] font-bold uppercase tracking-[0.02em] text-white",
          ].join(" ")}
        >
          {name}
        </p>
        <span
          className={[
            nameOxanium.className,
            "shrink-0 rounded-[2px] border px-1.5 py-0.5 text-[9px] font-extrabold uppercase leading-none tracking-[0.04em]",
          ].join(" ")}
          style={{
            borderColor: colors.accent,
            backgroundColor: colors.badgeBg + "33",
            color: colors.accent,
          }}
        >
          {statusShort}
        </span>
      </div>

      {detail ? (
        <p
          className={[
            "truncate leading-tight text-white/65",
            language === "ja"
              ? "text-[11px] font-semibold tracking-[0.01em]"
              : "text-[10px] font-semibold uppercase tracking-[0.03em]",
          ].join(" ")}
        >
          {detail}
        </p>
      ) : null}

      <p
        className={[
          nameOxanium.className,
          "text-[10px] font-bold uppercase tracking-[0.02em]",
        ].join(" ")}
        style={{ color: colors.accent }}
      >
        ↳ {expected}
      </p>
    </div>
  );

  if (onPress) {
    return (
      <button
        type="button"
        onClick={() => onPress(row)}
        className={cardClass}
        style={cardStyle}
      >
        {inner}
      </button>
    );
  }

  return (
    <article className={cardClass} style={cardStyle}>
      {inner}
    </article>
  );
}

function columnTeamLabel(team: NbaInjuryTeamReport): string {
  const full = NBA_TEAM_NAME_BY_ID[team.teamId];
  if (full) return getMobileTeamName("nba", full).toUpperCase();
  return team.teamName.toUpperCase();
}

function TeamInjuryColumn({
  team,
  language,
  onPlayerPress,
}: {
  team: NbaInjuryTeamReport;
  language: Language;
  onPlayerPress?: (row: NbaInjuryCardRow) => void;
}) {
  const rows = toCardRows(team);
  const label = columnTeamLabel(team);

  return (
    <section className="min-w-0">
      <header className="mb-1.5 px-0.5 text-center">
        <p
          className={[
            nameBebas.className,
            "truncate text-[15px] font-bold uppercase leading-tight text-white md:text-[18px]",
          ].join(" ")}
          style={matchCardTeamNameStyle(true)}
        >
          {label}
        </p>
      </header>

      {rows.length === 0 ? (
        <p className="border border-white/10 bg-[rgba(8,10,14,0.92)] px-2 py-3.5 text-center text-[10px] text-white/35 md:px-1.5 md:py-3 md:text-[9px]">
          {language === "ja" ? "怪我人なし" : "No injuries"}
        </p>
      ) : (
        <div className="flex flex-col gap-2 md:gap-1.5">
          {rows.map((row) => (
            <InjuryStatusCard
              key={`${row.side}-${row.player.id}-${row.status}-${row.returnDate ?? ""}`}
              row={row}
              language={language}
              onPress={onPlayerPress}
            />
          ))}
        </div>
      )}
    </section>
  );
}

/** NBA 予想ツール — Injury Report（HOME / AWAY 2 カラム） */
export default function NbaInjuryReportPanel({
  report,
  language,
  className,
  fromPredictGameId,
  predictReturnMode,
}: Props) {
  const router = useRouter();
  const resolvedReturnMode =
    predictReturnMode ?? (fromPredictGameId ? "overlay" : "route");

  const openPlayerDetail = (row: NbaInjuryCardRow) => {
    if (fromPredictGameId) {
      stashPredictTeamDetailReturn({
        gameId: fromPredictGameId,
        predictToolsTab: "injuries",
        returnMode: resolvedReturnMode,
      });
    }
    router.push(
      nbaPlayerDetailPreviewHref(String(row.player.id), {
        fromPredict: fromPredictGameId,
        predictToolsTab: fromPredictGameId ? "injuries" : undefined,
      })
    );
  };

  return (
    <div
      className={["grid grid-cols-2 gap-2", className].filter(Boolean).join(" ")}
    >
      <TeamInjuryColumn
        team={report.home}
        language={language}
        onPlayerPress={openPlayerDetail}
      />
      <TeamInjuryColumn
        team={report.away}
        language={language}
        onPlayerPress={openPlayerDetail}
      />
    </div>
  );
}
