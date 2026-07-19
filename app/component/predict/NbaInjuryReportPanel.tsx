"use client";

import {
  injuryDetailLabel,
  injuryStatusLabel,
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
import { nameOxanium } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";

type Props = {
  report: NbaInjuryReport;
  language: Language;
  className?: string;
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
}: {
  row: NbaInjuryCardRow;
  language: Language;
}) {
  const tone = injuryStatusTone(row.status);
  const colors = TONE[tone];
  const expected = (row.returnDate ?? "—").toUpperCase();
  // 負傷詳細の翻訳辞書は ja のみ。他言語は英語表記にフォールバック
  const detail = injuryDetailLabel(row, language === "ja" ? "ja" : "en");
  const name = playerCardName(row.player);
  const initials = playerInitials(row.player);
  const statusText = injuryStatusLabel(row.status);
  /** 列でチームが分かるので、角バッジはポジション（無ければ —） */
  const cornerTag = row.player.position?.trim() || "—";

  return (
    <article
      className="relative min-w-0 overflow-hidden bg-[rgba(8,10,14,0.92)]"
      style={{
        border: `1px solid ${colors.border}`,
        clipPath:
          "polygon(0 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%)",
      }}
    >
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

      <div className="flex items-stretch gap-2 px-2 py-2 pr-1.5 md:gap-1.5 md:px-1.5 md:py-1.5 md:pr-1">
        {/* イニシャル四角はデスクトップのみ（モバイルは名前行に集約） */}
        <div className="relative hidden h-9 w-9 shrink-0 border border-white/18 bg-[#14181f] md:block">
          <span
            className={[
              nameOxanium.className,
              "grid h-full w-full place-items-center text-[11px] font-bold leading-none tracking-tight text-white",
            ].join(" ")}
          >
            {initials}
          </span>
          <span
            className={[
              nameOxanium.className,
              "absolute bottom-0 right-0 grid min-w-[16px] place-items-center px-[2px] py-px text-[6px] font-extrabold leading-none tracking-wide text-[#050508]",
            ].join(" ")}
            style={{
              background: colors.badgeBg,
              border: `1px solid ${colors.accent}`,
            }}
          >
            {cornerTag}
          </span>
        </div>

        <div className="min-w-0 flex-1 self-center">
          <p
            className={[
              nameOxanium.className,
              "truncate text-[12px] font-bold uppercase leading-none tracking-[0.03em] text-white md:text-[11px]",
            ].join(" ")}
          >
            {name}
            {row.player.position?.trim() ? (
              <span className="ml-1 text-[11px] font-semibold text-white/35 md:text-[10px] md:hidden">
                · {row.player.position.trim()}
              </span>
            ) : null}
          </p>
          <p
            className={[
              "mt-0.5 truncate leading-tight text-white/45",
              language === "ja"
                ? "text-[9px] font-semibold tracking-[0.02em] md:text-[8px]"
                : "text-[8px] font-semibold uppercase tracking-[0.06em] md:text-[7px]",
            ].join(" ")}
          >
            {detail}
          </p>
          <p
            className={[
              nameOxanium.className,
              "mt-0.5 truncate text-[9px] font-bold uppercase leading-tight tracking-[0.05em] md:text-[8px]",
            ].join(" ")}
            style={{ color: colors.accent }}
          >
            EXP: {expected}
          </p>
        </div>

        <div className="flex shrink-0 items-stretch gap-1">
          <span aria-hidden className="my-0.5 w-px shrink-0 self-stretch bg-white/18" />
          <div className="flex w-[52px] flex-col items-center justify-center gap-0.5 pl-0.5 pr-0.5 md:w-[46px]">
            <StatusIcon
              tone={tone}
              color={colors.accent}
              className="h-5 w-5 md:h-[18px] md:w-[18px]"
            />
            <span
              className={[
                nameOxanium.className,
                "max-w-full text-center text-[7px] font-extrabold uppercase leading-[1.05] tracking-[0.01em] md:text-[6px]",
              ].join(" ")}
              style={{ color: colors.accent }}
            >
              {statusText}
            </span>
          </div>
        </div>
      </div>
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
}: {
  team: NbaInjuryTeamReport;
  language: Language;
}) {
  const rows = toCardRows(team);
  const label = columnTeamLabel(team);

  return (
    <section className="min-w-0">
      <header className="mb-1.5 px-0.5 text-center">
        <p
          className={[
            nameOxanium.className,
            "truncate text-[12px] font-extrabold uppercase tracking-[0.12em] text-white md:text-[11px]",
          ].join(" ")}
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
}: Props) {
  return (
    <div
      className={["grid grid-cols-2 gap-2", className].filter(Boolean).join(" ")}
    >
      <TeamInjuryColumn team={report.home} language={language} />
      <TeamInjuryColumn team={report.away} language={language} />
    </div>
  );
}
