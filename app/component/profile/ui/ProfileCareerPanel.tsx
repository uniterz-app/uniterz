"use client";

import { useMemo, useState } from "react";
import { useReducedMotion } from "framer-motion";
import ProfileEditKinetikGlitchTitle from "@/app/component/profile/edit/ProfileEditKinetikGlitchTitle";
import ProfileKinetikPanelFrame from "@/app/component/profile/ui/ProfileKinetikPanelFrame";
import { jp, nameOxanium, nameRajdhani } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import {
  aggregateCareerAwardsFromBadges,
  type ProfileCareerBadgeLike,
} from "@/lib/profile/profileCareerStats";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import { PROFILE_PLAN_PRO_BG_DEFAULT } from "@/lib/profile/profilePlanProBgVariants";
import {
  buildUserCareerBoardRows,
  buildUserCareerSummaryRows,
  type UserCareerDoc,
} from "@/lib/profile/userCareer";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

type Props = {
  language?: Language;
  layout?: "web" | "mobile";
  /** 正本。あれば通算サマリー + シーズン章を表示 */
  career?: UserCareerDoc | null;
  badges?: readonly ProfileCareerBadgeLike[];
  loading?: boolean;
  /**
   * section: overview 用の独立パネル
   * face: カード裏面用（表と同じ Pro スキン枠）
   */
  variant?: "section" | "face";
  className?: string;
  isPro?: boolean;
  planProBgVariant?: ProfilePlanProBgVariant;
};

type CareerRow = {
  key: string;
  label: string;
  value: string;
};

/** 予想者としての履歴書 — overview 公開ブロック / カード裏面 */
export default function ProfileCareerPanel({
  language = "ja",
  layout = "mobile",
  career = null,
  badges = [],
  loading = false,
  variant = "section",
  className = "",
  isPro = false,
  planProBgVariant = PROFILE_PLAN_PRO_BG_DEFAULT,
}: Props) {
  const msg = t(language);
  const isJa = language === "ja";
  const isMobile = layout === "mobile";
  const isFace = variant === "face";
  const lang: "ja" | "en" = isJa ? "ja" : "en";
  const reduceMotion = useReducedMotion() === true;
  const showProSkin = isPro && isFace;

  const seasonKeys = useMemo(() => {
    const keys = Object.keys(career?.seasons ?? {}).sort();
    if (keys.length === 0) return [CURRENT_NBA_SEASON_KEY];
    return keys;
  }, [career]);

  const [viewMode, setViewMode] = useState<"career" | "season">("career");
  const [seasonKey, setSeasonKey] = useState<string>(
    () => seasonKeys[seasonKeys.length - 1] ?? CURRENT_NBA_SEASON_KEY
  );
  const [board, setBoard] = useState<"regular" | "playoffs">("regular");

  const awards = useMemo(
    () => aggregateCareerAwardsFromBadges(badges, lang),
    [badges, lang]
  );

  const rows: CareerRow[] = useMemo(() => {
    if (!career) return [];
    if (viewMode === "career") {
      return buildUserCareerSummaryRows(career.summary, lang);
    }
    const chapter = career.seasons[seasonKey];
    const boardStats =
      board === "playoffs"
        ? chapter?.playoffs
        : chapter?.regular;
    if (!boardStats) return [];
    return buildUserCareerBoardRows(boardStats, lang);
  }, [career, viewMode, seasonKey, board, lang]);

  const scopeTitle =
    viewMode === "career"
      ? isJa
        ? "CAREER // ALL"
        : "CAREER // ALL"
      : board === "playoffs"
        ? `${seasonKey} PLAYOFFS`
        : `${seasonKey} SEASON`;

  const cycleScope = () => {
    if (viewMode === "career") {
      setViewMode("season");
      setBoard("regular");
      setSeasonKey(seasonKeys[seasonKeys.length - 1] ?? CURRENT_NBA_SEASON_KEY);
      return;
    }
    if (board === "regular") {
      setBoard("playoffs");
      return;
    }
    const idx = seasonKeys.indexOf(seasonKey);
    if (idx >= 0 && idx < seasonKeys.length - 1) {
      setSeasonKey(seasonKeys[idx + 1]!);
      setBoard("regular");
      return;
    }
    setViewMode("career");
  };

  const body = (
    <div className="relative z-[3] flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0 flex-1">
          {isFace ? (
            <div className="flex w-full justify-center py-1">
              <div className="profile-edit-kinetik-metrics-scope-title profile-edit-kinetik-metrics-scope-title--static">
                <ProfileEditKinetikGlitchTitle compact={isMobile}>
                  {msg.profile.careerSheetTitle}
                </ProfileEditKinetikGlitchTitle>
              </div>
            </div>
          ) : (
            <>
              <p
                className={[
                  nameRajdhani.className,
                  "text-[10px] font-semibold uppercase tracking-[0.22em] text-cyan-200/70",
                ].join(" ")}
              >
                PREDICTOR DOSSIER
              </p>
              <h3
                className={[
                  nameRajdhani.className,
                  "mt-1 font-semibold tracking-[0.14em] text-white/95",
                  isMobile ? "text-lg" : "text-xl sm:text-[1.72rem]",
                ].join(" ")}
              >
                {msg.profile.careerTitle}
              </h3>
              <div
                className={[
                  "mt-1.5 h-px w-16",
                  "bg-white/20",
                ].join(" ")}
                aria-hidden
              />
            </>
          )}
          {isFace ? (
            <div
              className={[
                "profile-edit-kinetik-metrics-scope-header",
                "profile-edit-kinetik-metrics-scope-header--picker",
                "profile-edit-kinetik-metrics-scope-header--toggle",
                "mt-3",
                showProSkin
                  ? "profile-edit-kinetik-metrics-scope-header--pro"
                  : "",
              ].join(" ")}
            >
              <button
                type="button"
                className="profile-edit-kinetik-metrics-scope-nav profile-edit-kinetik-metrics-scope-nav--prev"
                onClick={cycleScope}
                aria-label={isJa ? "前の統計ボード" : "Previous stats board"}
              >
                <span
                  className="profile-edit-kinetik-metrics-scope-arrow profile-edit-kinetik-metrics-scope-arrow--left"
                  aria-hidden
                />
              </button>
              <button
                type="button"
                className="profile-edit-kinetik-metrics-scope-title profile-edit-kinetik-metrics-scope-title--breath"
                onClick={cycleScope}
                aria-label={
                  isJa
                    ? "CAREER / SEASON / PLAYOFF を切り替え"
                    : "Switch Career / Season / Playoff"
                }
              >
                <span
                  className={[
                    nameRajdhani.className,
                    "font-semibold tracking-[0.14em] text-white/95",
                    isFace || isMobile ? "text-base" : "text-lg sm:text-xl",
                    showProSkin
                      ? "drop-shadow-[0_0_12px_rgba(34,211,238,0.28)]"
                      : "",
                  ].join(" ")}
                >
                  {scopeTitle}
                </span>
              </button>
              <button
                type="button"
                className="profile-edit-kinetik-metrics-scope-nav profile-edit-kinetik-metrics-scope-nav--next"
                onClick={cycleScope}
                aria-label={isJa ? "次の統計ボード" : "Next stats board"}
              >
                <span
                  className="profile-edit-kinetik-metrics-scope-arrow profile-edit-kinetik-metrics-scope-arrow--right"
                  aria-hidden
                />
              </button>
            </div>
          ) : null}
          {!isFace ? (
            <p
              className={[
                isJa ? jp.className : "",
                "mt-2 max-w-[520px] text-xs leading-relaxed text-slate-300/80 sm:text-[14px]",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {msg.profile.careerDesc}
            </p>
          ) : null}
        </div>
      </div>

      {loading ? (
        <div
          className="mt-4 h-36 skeleton-scan rounded-md border border-white/10 bg-white/6"
          aria-hidden
        />
      ) : (
        <>
          <dl className="mt-5 grid grid-cols-2 gap-x-2 gap-y-2 sm:grid-cols-2">
            {rows.map((row) => (
              <div
                key={row.key}
                className={[
                  "min-w-0 px-2.5 py-2",
                  showProSkin
                    ? "border border-black/35 bg-black/55"
                    : "border border-white/[0.06] bg-white/[0.03]",
                ].join(" ")}
              >
                <dt
                  className={[
                    nameRajdhani.className,
                    showProSkin
                      ? "text-[9px] font-semibold uppercase tracking-[0.18em] text-white/75 [text-shadow:0_1px_3px_rgba(0,0,0,0.85)]"
                      : "text-[9px] font-semibold uppercase tracking-[0.18em] text-white/55",
                  ].join(" ")}
                >
                  {row.label}
                </dt>
                <dd
                  className={[
                    nameOxanium.className,
                    showProSkin
                      ? "mt-1 truncate text-[1.02rem] font-semibold tabular-nums tracking-wide text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.9)]"
                      : "mt-1 truncate text-[1.02rem] font-semibold tabular-nums tracking-wide text-white/90",
                  ].join(" ")}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>

          {viewMode === "career" ? (
          <div className="mt-4">
            <p
              className={[
                nameRajdhani.className,
                "mt-5 text-[9px] font-semibold uppercase tracking-[0.18em] text-white/40",
              ].join(" ")}
            >
              {msg.profile.careerAwards}
            </p>
            {awards.length === 0 ? (
              <p
                className={[
                  isJa ? jp.className : "",
                  "mt-1.5 text-sm text-white/35",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                —
              </p>
            ) : (
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {awards.map((award) => (
                  <li
                    key={award.key}
                    className={[
                      nameRajdhani.className,
                      "border border-white/12 bg-white/[0.04] px-2 py-1 text-[11px] font-semibold tracking-wide text-white/80",
                    ].join(" ")}
                  >
                    {award.label}
                    {award.count > 1 ? ` ×${award.count}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>
          ) : null}

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setViewMode("career")}
              className={[
                nameRajdhani.className,
                "rounded-sm border px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em]",
                viewMode === "career"
                  ? "border-cyan-300/45 bg-cyan-400/15 text-cyan-50"
                  : "border-white/10 bg-white/[0.03] text-white/35",
              ].join(" ")}
            >
              {msg.profile.careerSeasonAllTime}
            </button>
            {seasonKeys.map((opt) => {
              const active = viewMode === "season" && seasonKey === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    setViewMode("season");
                    setSeasonKey(opt);
                    setBoard("regular");
                  }}
                  className={[
                    nameRajdhani.className,
                    "rounded-sm border px-2.5 py-1 text-[11px] font-semibold tracking-[0.12em]",
                    active
                      ? "border-cyan-300/45 bg-cyan-400/15 text-cyan-50"
                      : "border-white/10 bg-white/[0.03] text-white/35",
                  ].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );

  if (isFace) {
    return (
      <ProfileKinetikPanelFrame
        as="div"
        isPlanPro={isPro}
        animatePlanProBg={isPro && !reduceMotion}
        planProBgVariant={planProBgVariant}
        proMobileStage={isPro && isMobile}
        web={layout === "web"}
        planProBgAccentReady
        className={[
          "flex h-full min-h-full w-full min-w-0 flex-col overflow-y-auto p-3",
          isPro
            ? "profile-edit-kinetik-card--pro-mobile"
            : "border border-t-0 border-cyan-300/20 bg-[#061018]/96",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {body}
      </ProfileKinetikPanelFrame>
    );
  }

  return (
    <ProfileKinetikPanelFrame
      as="section"
      className={["block w-full min-w-0 p-3", className]
        .filter(Boolean)
        .join(" ")}
    >
      {body}
    </ProfileKinetikPanelFrame>
  );
}
