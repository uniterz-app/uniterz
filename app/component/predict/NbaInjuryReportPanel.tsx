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
  const initials = playerInitials(row.player);
  const statusText = injuryStatusLabel(row.status);
  const statusShort = injuryStatusShortLabel(row.status);

  const cardClass =
    "relative min-w-0 w-full cursor-pointer select-none overflow-hidden bg-[rgba(8,10,14,0.92)] text-left transition duration-150 ease-out hover:brightness-110 active:scale-[0.97] active:brightness-125";
  const cardStyle = {
    border: `1px solid ${colors.border}`,
    clipPath:
      "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)",
  } as const;

  const inner = (
    <>
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0"
        style={{
          width: 8,
          height: 8,
          background: colors.accent,
          clipPath: "polygon(100% 0, 0 100%, 100% 100%)",
        }}
      />

      <div className="flex items-stretch gap-2 px-2.5 py-2.5 pr-1.5 md:gap-1.5 md:px-1.5 md:py-1.5 md:pr-1">
        {/* イニシャル四角はデスクトップのみ（モバイルは名前行に集約） */}
        <div className="hidden h-9 w-9 shrink-0 items-center justify-center border border-white/18 bg-[#14181f] md:flex">
          <span
            className={[
              nameOxanium.className,
              "text-[11px] font-bold leading-none tracking-tight text-white",
            ].join(" ")}
          >
            {initials}
          </span>
        </div>

        <div className="min-w-0 flex-1 self-center">
          <p
            className={[
              nameOxanium.className,
              "text-[13px] font-bold uppercase leading-snug tracking-[0.02em] text-white md:text-[11px]",
            ].join(" ")}
          >
            {name}
          </p>
          {detail ? (
            <p
              className={[
                "mt-1 leading-snug text-white/55",
                language === "ja"
                  ? "text-[11px] font-semibold tracking-[0.01em] md:text-[9px]"
                  : "text-[10px] font-semibold uppercase tracking-[0.04em] md:text-[8px]",
              ].join(" ")}
            >
              {detail}
            </p>
          ) : null}
          <p
            className={[
              nameOxanium.className,
              "mt-1 text-[11px] font-bold uppercase leading-snug tracking-[0.04em] md:text-[9px]",
            ].join(" ")}
            style={{ color: colors.accent }}
          >
            EXP {expected}
          </p>
        </div>

        <div className="flex shrink-0 items-stretch gap-1">
          <span aria-hidden className="my-0.5 w-px shrink-0 self-stretch bg-white/18" />
          <div
            className="flex w-[44px] flex-col items-center justify-center gap-1 pl-0.5 pr-0.5 md:w-[42px]"
            title={statusText}
            aria-label={statusText}
          >
            <StatusIcon
              tone={tone}
              color={colors.accent}
              className="h-5 w-5 md:h-[18px] md:w-[18px]"
            />
            <span
              className={[
                nameOxanium.className,
                "max-w-full text-center text-[9px] font-extrabold uppercase leading-none tracking-[0.06em] md:text-[8px]",
              ].join(" ")}
              style={{ color: colors.accent }}
            >
              {statusShort}
            </span>
          </div>
        </div>
      </div>
    </>
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
