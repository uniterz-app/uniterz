/**
 * SQUAD BATTLE 画面用の表示コピー・UI ヘルパー。
 * プレビュー／モックでも本番でも同じ文言を使う。
 */

import {
  CURRENT_NBA_SEASON_KEY,
  nbaSeasonShortLabel,
} from "@/lib/rankings/nbaSeason";
import type { Squad } from "@/lib/squads/squadBattleMock";
import { estimatedGroupBattleUnitsPerMember } from "@/lib/groupBattles/unitLedger";
import {
  SQUAD_BATTLE_MAX_MEMBERS,
  SQUAD_BATTLE_MIN_MEMBERS,
  countActiveMembers,
} from "@/lib/squads/squadBattleMock";
import { DATE_LOCALE } from "@/lib/i18n/language";
import {
  L,
  Ls,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";

export type {
  SquadBattleScreenCopy,
} from "@/lib/i18n/copy/squadBattleScreen.copy";
export { squadBattleScreenCopy } from "@/lib/i18n/copy/squadBattleScreen.copy";

/** 開催サイクル上の現在フェーズ（休止含む） */
export type SquadBattleUiPhase = "entry" | "battle" | "reward" | "idle";

/** 表示言語（`users.language` 由来） */
export type SquadBattleUiLang = LocalizedLang;

export const resolveSquadBattleUiLang = resolveLocalizedLang;

/** 大会ドキュメントの phase → JOIN/RANK の UI フェーズ */
export function groupBattlePhaseToUiPhase(
  phase: string | null | undefined
): SquadBattleUiPhase {
  switch (phase) {
    case "announced":
    case "recruiting":
    case "locking":
      return "entry";
    case "battle":
      return "battle";
    case "settling":
    case "final":
      return "reward";
    case "closed":
    default:
      return "idle";
  }
}

/**
 * JOIN の作成・申請・コード参加など mutate 可能か。
 * サーバー `assertRecruitingOrThrow` と揃える（announced / locking は不可）。
 */
export function canMutateSquadBattleJoinUi(
  phase: string | null | undefined
): boolean {
  return phase === "recruiting";
}

/**
 * 週間チップの初期選択。
 * 今日（JST）までに開始した最後の週。未開始なら W1。
 */
export function resolveSquadBattleWeekIndex(args: {
  weeklyLabels: readonly string[];
  nowMs?: number;
}): SquadBattleWeekIndex {
  const labels = args.weeklyLabels.filter(Boolean);
  if (labels.length === 0) return 1;
  const now = args.nowMs ?? Date.now();
  const jst = new Date(now + 9 * 60 * 60 * 1000);
  const today = `${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}-${String(jst.getUTCDate()).padStart(2, "0")}`;
  let idx = 0;
  for (let i = 0; i < labels.length; i += 1) {
    if (labels[i]! <= today) idx = i;
    else break;
  }
  const oneBased = Math.min(4, Math.max(1, idx + 1));
  return oneBased as SquadBattleWeekIndex;
}

/** 週間ランキングの週インデックス（1〜4） */
export type SquadBattleWeekIndex = 1 | 2 | 3 | 4;

function weekPeriodLabel(week: 1 | 2 | 3 | 4) {
  const ranges: Record<1 | 2 | 3 | 4, [number, number]> = {
    1: [1, 7],
    2: [8, 14],
    3: [15, 21],
    4: [22, 28],
  };
  const [start, end] = ranges[week];
  return {
    ja: `第${week}週 · 開催 ${start}〜${end}日`,
    en: `Week ${week} · Days ${start}–${end}`,
    ko: `${week}주차 · ${start}–${end}일`,
    zh: `第${week}周 · 第${start}–${end}天`,
    es: `Semana ${week} · Días ${start}–${end}`,
    pt: `Semana ${week} · Dias ${start}–${end}`,
    fr: `Semaine ${week} · Jours ${start}–${end}`,
  };
}

const WEEK_PERIOD_LABELS = (
  [1, 2, 3, 4] as const satisfies readonly SquadBattleWeekIndex[]
).map((index) => ({
  index,
  label: `W${index}` as const,
  period: weekPeriodLabel(index),
}));

/** 週チップの既定ラベル（大会 weeklyLabels 未取得時） */
export function squadBattleWeekOptions(
  lang: SquadBattleUiLang = "ja"
): ReadonlyArray<{
  index: SquadBattleWeekIndex;
  label: string;
  periodLabel: string;
}> {
  return WEEK_PERIOD_LABELS.map((w) => ({
    index: w.index,
    label: w.label,
    periodLabel: L(lang, w.period),
  }));
}

/** 大会の weeklyLabels 本数に合わせた週チップ（最大4） */
export function squadBattleWeekChipOptions(
  weeklyLabels: readonly string[],
  lang: SquadBattleUiLang = "ja"
): Array<{
  index: SquadBattleWeekIndex;
  label: string;
  periodLabel: string;
}> {
  const count = Math.min(
    4,
    Math.max(1, weeklyLabels.length > 0 ? weeklyLabels.length : 4)
  );
  return squadBattleWeekOptions(lang)
    .slice(0, count)
    .map((w, i) => {
      const monday = weeklyLabels[i];
      return {
        index: w.index,
        label: w.label,
        periodLabel: monday
          ? `${w.label} · ${formatWeekChipRange(monday, lang)}`
          : w.periodLabel,
      };
    });
}

function weekRangeSeparator(lang: SquadBattleUiLang): string {
  return L(lang, {
    ja: "〜",
    en: " – ",
    ko: "–",
    zh: "–",
    es: " – ",
    pt: " – ",
    fr: " – ",
  });
}

function formatWeekChipRange(
  mondayKey: string,
  lang: SquadBattleUiLang = "ja"
): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(mondayKey)) return mondayKey;
  const [y, m, d] = mondayKey.split("-").map(Number);
  const start = new Date(Date.UTC(y!, m! - 1, d!));
  const end = new Date(Date.UTC(y!, m! - 1, d! + 6));
  const fmt = (dt: Date) =>
    `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;
  const sep = weekRangeSeparator(lang);
  return `${fmt(start)}${sep}${fmt(end)}`;
}

/** LIVE / FINAL の短い説明 */
export function squadBattleBoardStatusHint(
  lang: SquadBattleUiLang = "ja"
): { live: string; final: string } {
  return {
    live: L(lang, {
      ja: "暫定順位。原則 16:00 / 23:30 JST 前後に更新。確定後に FINAL へ",
      en: "Provisional. Usually refreshed around 16:00 / 23:30 JST. Turns FINAL once confirmed",
      ko: "임시 순위. 보통 16:00 / 23:30 JST 전후 갱신. 확정 후 FINAL로 전환",
      zh: "暂定排名。通常在 16:00 / 23:30 JST 前后更新，确认后变为 FINAL",
      es: "Provisional. Suele actualizarse cerca de 16:00 / 23:30 JST. Pasa a FINAL al confirmarse",
      pt: "Provisório. Geralmente atualizado por volta de 16:00 / 23:30 JST. Vira FINAL ao confirmar",
      fr: "Provisoire. Mis à jour vers 16:00 / 23:30 JST. Passe en FINAL une fois confirmé",
    }),
    final: L(lang, {
      ja: "最終確定済み。この順位で Unit を配布します",
      en: "Confirmed. Units are paid out on these standings",
      ko: "최종 확정. 이 순위로 Unit이 지급됩니다",
      zh: "已最终确认。将按此排名发放 Unit",
      es: "Confirmado. Los Units se pagan según este ranking",
      pt: "Confirmado. Units pagos conforme este ranking",
      fr: "Confirmé. Les Units sont versés selon ce classement",
    }),
  };
}

/** RANK ボードの最終集計時刻（JST） */
export function formatSquadBattleBoardBuiltAt(
  builtAtMs: number | null | undefined,
  lang: SquadBattleUiLang = "ja"
): string | null {
  const ms = Number(builtAtMs);
  if (!Number.isFinite(ms) || ms <= 0) return null;
  try {
    return new Date(ms).toLocaleString(DATE_LOCALE[lang], {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return null;
  }
}

/** DEV プレビューのフェーズ切替チップ */
export function squadBattleUiPhaseOptions(
  lang: SquadBattleUiLang = "ja"
): ReadonlyArray<{ id: SquadBattleUiPhase; label: string }> {
  return [
    { id: "entry", label: "ENTRY" },
    { id: "battle", label: "BATTLE" },
    { id: "reward", label: "REWARD" },
    {
      id: "idle",
      label: L(lang, {
        ja: "休止",
        en: "OFF",
        ko: "휴식",
        zh: "休止",
        es: "PAUSA",
        pt: "PAUSA",
        fr: "PAUSE",
      }),
    },
  ];
}

/**
 * イントロ下部の補足（フェーズ説明と重複しないこと）。
 * 報酬の同額配布・入れ替え不可は ENTRY / REWARD 側で伝える。
 */
export function squadBattleIntroNotices(
  lang: SquadBattleUiLang = "ja"
): readonly string[] {
  return Ls(lang, [
    {
      ja: "対象は Pick Up 試合のみ。同点は同順位。不正は失格。配布は Free / Pro 共通。",
      en: "Pick Up games only. Ties share the rank. Cheating means disqualification. Payouts are the same for Free and Pro.",
      ko: "Pick Up 경기만 대상. 동점은 동순위. 부정행위는 실격. 지급은 Free / Pro 동일.",
      zh: "仅限 Pick Up 比赛。同分同排名。作弊即取消资格。Free / Pro 奖励相同。",
      es: "Solo partidos Pick Up. Empates comparten puesto. Trampa = descalificación. Pagos iguales Free / Pro.",
      pt: "Apenas jogos Pick Up. Empates dividem posição. Trapaça = desclassificação. Pagamentos iguais Free / Pro.",
      fr: "Matchs Pick Up uniquement. Ex æquo partage le rang. Triche = disqualification. Paiements identiques Free / Pro.",
    },
  ]);
}

/** 休止パネル（JOIN / RANK）— フェーズバナーと二重に出さない。ルールはここに集約 */
export function squadBattleIdlePanel(lang: SquadBattleUiLang = "ja"): {
  kicker: string;
  title: string;
  detail: string;
} {
  return {
    kicker: L(lang, {
      ja: "Off season",
      en: "Off season",
      ko: "Off season",
      zh: "Off season",
      es: "Off season",
      pt: "Off season",
      fr: "Off season",
    }),
    title: L(lang, {
      ja: "NEXT ENTRY SOON",
      en: "NEXT ENTRY SOON",
      ko: "NEXT ENTRY SOON",
      zh: "NEXT ENTRY SOON",
      es: "NEXT ENTRY SOON",
      pt: "NEXT ENTRY SOON",
      fr: "NEXT ENTRY SOON",
    }),
    detail: L(lang, {
      ja: "次回 ENTRY の告知までお待ちください。再招集もそのときから。",
      en: "Hold tight until the next ENTRY is announced. Re-forming opens then too.",
      ko: "다음 ENTRY 공지까지 기다려 주세요. 재모집도 그때 시작됩니다.",
      zh: "请等待下次 ENTRY 公告。原班招募也将同时开放。",
      es: "Espera hasta que se anuncie el próximo ENTRY. Reagrupar también abrirá entonces.",
      pt: "Aguarde o anúncio do próximo ENTRY. Reagrupar também abrirá então.",
      fr: "Patientez jusqu'à l'annonce du prochain ENTRY. Le regroupement ouvrira aussi.",
    }),
  };
}

/** オフシーズン下のルール見出し + 箇条書き（長文ヘルプの要約） */
export function squadBattleRulesSection(lang: SquadBattleUiLang = "ja"): {
  title: string;
  items: readonly string[];
} {
  return {
    title: L(lang, {
      ja: "ルール",
      en: "Rules",
      ko: "규칙",
      zh: "规则",
      es: "Reglas",
      pt: "Regras",
      fr: "Règles",
    }),
    items: Ls(lang, [
      {
        ja: "3〜5人のスクワッドで、Pick Up 試合の平均スコアを競う",
        en: "Squads of 3–5 compete on average score in Pick Up games",
        ko: "3–5명 스쿼드가 Pick Up 경기 평균 점수로 경쟁",
        zh: "3–5 人小队比拼 Pick Up 比赛平均得分",
        es: "Escuadras de 3–5 compiten por puntuación media en Pick Up",
        pt: "Esquadrões de 3–5 competem pela média em Pick Up",
        fr: "Escouades de 3–5 membres sur le score moyen en Pick Up",
      },
      {
        ja: "1大会につき所属できるグループは1つまで",
        en: "One squad per battle",
        ko: "대회당 하나의 스쿼드만 소속 가능",
        zh: "每场比赛只能加入一个小队",
        es: "Una escuadra por batalla",
        pt: "Um esquadrão por batalha",
        fr: "Une escouade par bataille",
      },
      {
        ja: "空き枠への申請・承認、または招待コードで参加",
        en: "Join by applying to an open slot, or with an invite code",
        ko: "빈 자리 신청·승인 또는 초대 코드로 참가",
        zh: "申请空位并获批准，或使用邀请码加入",
        es: "Solicita una plaza libre o únete con un código",
        pt: "Candidate-se a uma vaga ou entre com código",
        fr: "Postulez à une place libre ou rejoignez avec un code",
      },
      {
        ja: "同時申請は最大3件。メンバー確定後は入れ替え不可",
        en: "Up to 3 applications at once. No swaps once members are locked",
        ko: "동시 신청 최대 3건. 멤버 확정 후 교체 불가",
        zh: "最多 3 个并行申请。成员锁定后不可换人",
        es: "Hasta 3 solicitudes a la vez. Sin cambios tras confirmar miembros",
        pt: "Até 3 candidaturas simultâneas. Sem trocas após confirmar membros",
        fr: "Jusqu'à 3 candidatures. Pas d'échanges après confirmation",
      },
      {
        ja: "約2ヶ月に1回。募集1〜2週間 → バトル約1ヶ月",
        en: "Runs roughly every 2 months. 1–2 weeks recruiting → about 1 month of battle",
        ko: "약 2개월마다. 모집 1–2주 → 배틀 약 1개월",
        zh: "约每 2 个月一次。招募 1–2 周 → 比赛约 1 个月",
        es: "Cada ~2 meses. 1–2 semanas de reclutamiento → ~1 mes de batalla",
        pt: "A cada ~2 meses. 1–2 semanas de recrutamento → ~1 mês de batalha",
        fr: "Environ tous les 2 mois. 1–2 semaines de recrutement → ~1 mois de bataille",
      },
      {
        ja: "週間×4 + 月間で順位。同点は同順位・同 Unit",
        en: "4 weekly boards + 1 monthly. Ties share the rank and the Units",
        ko: "주간×4 + 월간 순위. 동점은 동순위·동 Unit",
        zh: "4 个周榜 + 1 个月榜。同分同排名、同 Unit",
        es: "4 tableros semanales + 1 mensual. Empates comparten puesto y Units",
        pt: "4 rankings semanais + 1 mensal. Empates dividem posição e Units",
        fr: "4 classements hebdos + 1 mensuel. Ex æquo partage rang et Units",
      },
      {
        ja: "週間1位は全員30 Unit、月間1位は全員150 Unit（上位20まで）",
        en: "Weekly 1st pays 30 Units each, monthly 1st pays 150 each (top 20 paid)",
        ko: "주간 1위 전원 30 Unit, 월간 1위 전원 150 Unit (상위 20까지)",
        zh: "周冠军每人 30 Unit，月冠军每人 150 Unit（前 20 名）",
        es: "1.º semanal: 30 Units c/u; 1.º mensual: 150 c/u (top 20)",
        pt: "1.º semanal: 30 Units cada; 1.º mensal: 150 cada (top 20)",
        fr: "1er hebdo : 30 Units chacun ; 1er mensuel : 150 chacun (top 20)",
      },
      {
        ja: "過去スクワッドから同じ顔ぶれを再招集できる",
        en: "You can re-form the same lineup from a past squad",
        ko: "지난 스쿼드에서 같은 멤버로 재모집 가능",
        zh: "可从历史小队原班人马重新招募",
        es: "Puedes reagrupar la misma alineación de una escuadra pasada",
        pt: "Você pode reagrupar a mesma formação de um esquadrão anterior",
        fr: "Vous pouvez regrouper la même lineup d'une escouade passée",
      },
    ]),
  };
}

/** RANK · 未所属時のヒント（ピン留めの内部用語は使わない） */
export function squadBattleRankSpectatorHint(
  lang: SquadBattleUiLang = "ja"
): string {
  return L(lang, {
    ja: "自分のスクワッドはありません。順位表は観戦できます。参加は JOIN（ENTRY）から。",
    en: "You're not in a squad yet. You can still watch the board — join from the JOIN (ENTRY) tab.",
    ko: "아직 스쿼드가 없습니다. 순위표는 관전할 수 있습니다. JOIN(ENTRY)에서 참가하세요.",
    zh: "你还没有小队。仍可观看排行榜 — 从 JOIN（ENTRY）加入。",
    es: "Aún no estás en una escuadra. Puedes ver el ranking — únete desde JOIN (ENTRY).",
    pt: "Você ainda não está em um esquadrão. Pode ver o ranking — entre pela aba JOIN (ENTRY).",
    fr: "Vous n'avez pas encore d'escouade. Vous pouvez suivre le classement — rejoignez via JOIN (ENTRY).",
  });
}

export type SquadBattlePhaseBanner = {
  kicker: string;
  title: string;
  detail: string;
  tone: "entry" | "battle" | "reward" | "idle" | "warn";
};

function entryDeadlineTitle(
  lang: SquadBattleUiLang,
  deadline: string | null,
  recruiting: boolean
): string {
  if (deadline) {
    return L(lang, {
      ja: `募集締切 ${deadline}`,
      en: `Entry closes ${deadline}`,
      ko: `모집 마감 ${deadline}`,
      zh: `招募截止 ${deadline}`,
      es: `Cierre de inscripción ${deadline}`,
      pt: `Inscrições até ${deadline}`,
      fr: `Clôture des inscriptions ${deadline}`,
    });
  }
  return L(lang, {
    ja: recruiting ? "スクワッド募集中" : "メンバー募集中",
    en: recruiting ? "Squads recruiting" : "Recruiting members",
    ko: recruiting ? "스쿼드 모집 중" : "멤버 모집 중",
    zh: recruiting ? "小队招募中" : "成员招募中",
    es: recruiting ? "Escuadras reclutando" : "Reclutando miembros",
    pt: recruiting ? "Esquadrões recrutando" : "Recrutando membros",
    fr: recruiting ? "Escouades en recrutement" : "Recrutement de membres",
  });
}

/** フェーズ帯の下に出す状況バナー */
export function squadBattlePhaseBanner(args: {
  phase: SquadBattleUiPhase;
  activeMemberCount: number;
  hasSquad: boolean;
  deadlineLabel?: string | null;
  lang?: SquadBattleUiLang;
}): SquadBattlePhaseBanner {
  const { phase, activeMemberCount, hasSquad, deadlineLabel } = args;
  const lang = args.lang ?? "ja";
  const deadline = deadlineLabel?.trim() || null;

  if (phase === "idle") {
    return {
      kicker: "OFF SEASON",
      title: L(lang, {
        ja: "次回募集待ち",
        en: "Waiting for the next entry",
        ko: "다음 모집 대기",
        zh: "等待下次招募",
        es: "Esperando la próxima inscripción",
        pt: "Aguardando a próxima inscrição",
        fr: "En attente de la prochaine inscription",
      }),
      detail: L(lang, {
        ja: "次回 ENTRY の告知までお待ちください。再招集もそのときから。",
        en: "Hold tight until the next ENTRY is announced. Re-forming opens then too.",
        ko: "다음 ENTRY 공지까지 기다려 주세요. 재모집도 그때 시작됩니다.",
        zh: "请等待下次 ENTRY 公告。原班招募也将同时开放。",
        es: "Espera hasta que se anuncie el próximo ENTRY. Reagrupar también abrirá entonces.",
        pt: "Aguarde o anúncio do próximo ENTRY. Reagrupar também abrirá então.",
        fr: "Patientez jusqu'à l'annonce du prochain ENTRY. Le regroupement ouvrira aussi.",
      }),
      tone: "idle",
    };
  }

  if (phase === "entry") {
    if (!hasSquad) {
      return {
        kicker: "ENTRY",
        title: entryDeadlineTitle(lang, deadline, true),
        detail: L(lang, {
          ja: `${SQUAD_BATTLE_MIN_MEMBERS}〜${SQUAD_BATTLE_MAX_MEMBERS}人で確定。締切時点で${SQUAD_BATTLE_MIN_MEMBERS}人未満は不参加。`,
          en: `Locked at ${SQUAD_BATTLE_MIN_MEMBERS}–${SQUAD_BATTLE_MAX_MEMBERS} members. Squads under ${SQUAD_BATTLE_MIN_MEMBERS} at the deadline don't enter.`,
          ko: `${SQUAD_BATTLE_MIN_MEMBERS}–${SQUAD_BATTLE_MAX_MEMBERS}명으로 확정. 마감 시 ${SQUAD_BATTLE_MIN_MEMBERS}명 미만은 불참.`,
          zh: `${SQUAD_BATTLE_MIN_MEMBERS}–${SQUAD_BATTLE_MAX_MEMBERS} 人锁定。截止时不足 ${SQUAD_BATTLE_MIN_MEMBERS} 人无法参赛。`,
          es: `Se cierra con ${SQUAD_BATTLE_MIN_MEMBERS}–${SQUAD_BATTLE_MAX_MEMBERS} miembros. Menos de ${SQUAD_BATTLE_MIN_MEMBERS} al cierre = no entra.`,
          pt: `Fecha com ${SQUAD_BATTLE_MIN_MEMBERS}–${SQUAD_BATTLE_MAX_MEMBERS} membros. Menos de ${SQUAD_BATTLE_MIN_MEMBERS} no prazo = não entra.`,
          fr: `Figé à ${SQUAD_BATTLE_MIN_MEMBERS}–${SQUAD_BATTLE_MAX_MEMBERS} membres. Moins de ${SQUAD_BATTLE_MIN_MEMBERS} à la clôture = hors course.`,
        }),
        tone: "entry",
      };
    }
    if (activeMemberCount < SQUAD_BATTLE_MIN_MEMBERS) {
      const missing = SQUAD_BATTLE_MIN_MEMBERS - activeMemberCount;
      return {
        kicker: "ENTRY",
        title: L(lang, {
          ja: `あと ${missing} 人必要`,
          en: `${missing} more member${missing === 1 ? "" : "s"} needed`,
          ko: `${missing}명 더 필요`,
          zh: `还需 ${missing} 人`,
          es: `Faltan ${missing} miembro${missing === 1 ? "" : "s"}`,
          pt: `Faltam ${missing} membro${missing === 1 ? "" : "s"}`,
          fr: `Encore ${missing} membre${missing === 1 ? "" : "s"}`,
        }),
        detail: deadline
          ? L(lang, {
              ja: `締切 ${deadline}。${SQUAD_BATTLE_MIN_MEMBERS}人未満だとエントリー失敗になります。`,
              en: `Closes ${deadline}. Under ${SQUAD_BATTLE_MIN_MEMBERS} members and your entry fails.`,
              ko: `마감 ${deadline}. ${SQUAD_BATTLE_MIN_MEMBERS}명 미만이면 참가 실패.`,
              zh: `截止 ${deadline}。不足 ${SQUAD_BATTLE_MIN_MEMBERS} 人则报名失败。`,
              es: `Cierra ${deadline}. Menos de ${SQUAD_BATTLE_MIN_MEMBERS} miembros y la inscripción falla.`,
              pt: `Fecha ${deadline}. Menos de ${SQUAD_BATTLE_MIN_MEMBERS} membros e a inscrição falha.`,
              fr: `Clôture ${deadline}. Moins de ${SQUAD_BATTLE_MIN_MEMBERS} membres = échec d'inscription.`,
            })
          : L(lang, {
              ja: `${SQUAD_BATTLE_MIN_MEMBERS}人未満だとエントリー失敗になります。`,
              en: `Under ${SQUAD_BATTLE_MIN_MEMBERS} members and your entry fails.`,
              ko: `${SQUAD_BATTLE_MIN_MEMBERS}명 미만이면 참가 실패.`,
              zh: `不足 ${SQUAD_BATTLE_MIN_MEMBERS} 人则报名失败。`,
              es: `Menos de ${SQUAD_BATTLE_MIN_MEMBERS} miembros y la inscripción falla.`,
              pt: `Menos de ${SQUAD_BATTLE_MIN_MEMBERS} membros e a inscrição falha.`,
              fr: `Moins de ${SQUAD_BATTLE_MIN_MEMBERS} membres = échec d'inscription.`,
            }),
        tone: "warn",
      };
    }
    if (activeMemberCount < SQUAD_BATTLE_MAX_MEMBERS) {
      return {
        kicker: "ENTRY",
        title: entryDeadlineTitle(lang, deadline, false),
        detail: L(lang, {
          ja: `${activeMemberCount}/${SQUAD_BATTLE_MAX_MEMBERS} · 最低人数は満たしています。満員または締切で確定。`,
          en: `${activeMemberCount}/${SQUAD_BATTLE_MAX_MEMBERS} · Minimum met. Locked when full or at the deadline.`,
          ko: `${activeMemberCount}/${SQUAD_BATTLE_MAX_MEMBERS} · 최소 인원 충족. 만원 또는 마감 시 확정.`,
          zh: `${activeMemberCount}/${SQUAD_BATTLE_MAX_MEMBERS} · 已达最低人数。满员或截止时锁定。`,
          es: `${activeMemberCount}/${SQUAD_BATTLE_MAX_MEMBERS} · Mínimo cumplido. Se cierra al llenarse o al plazo.`,
          pt: `${activeMemberCount}/${SQUAD_BATTLE_MAX_MEMBERS} · Mínimo atingido. Fecha ao encher ou no prazo.`,
          fr: `${activeMemberCount}/${SQUAD_BATTLE_MAX_MEMBERS} · Minimum atteint. Figé à complet ou à la clôture.`,
        }),
        tone: "entry",
      };
    }
    return {
      kicker: "ENTRY",
      title: L(lang, {
        ja: "メンバー確定 · 待機中",
        en: "Members locked · Standing by",
        ko: "멤버 확정 · 대기 중",
        zh: "成员已锁定 · 等待中",
        es: "Miembros confirmados · En espera",
        pt: "Membros confirmados · Aguardando",
        fr: "Membres confirmés · En attente",
      }),
      detail: L(lang, {
        ja: "満員のため入れ替え不可。開催開始までお待ちください。",
        en: "Full, so no swaps. Wait for the battle to start.",
        ko: "만원이라 교체 불가. 배틀 시작까지 기다려 주세요.",
        zh: "已满员，不可换人。请等待比赛开始。",
        es: "Completo, sin cambios. Espera al inicio de la batalla.",
        pt: "Lotado, sem trocas. Aguarde o início da batalha.",
        fr: "Complet, pas d'échanges. Attendez le début de la bataille.",
      }),
      tone: "entry",
    };
  }

  if (phase === "battle") {
    return {
      kicker: "BATTLE",
      title: hasSquad
        ? L(lang, {
            ja: "対戦中 · メンバー LOCKED",
            en: "In battle · Members LOCKED",
            ko: "대전 중 · 멤버 LOCKED",
            zh: "对战中 · 成员 LOCKED",
            es: "En batalla · Miembros LOCKED",
            pt: "Em batalha · Membros LOCKED",
            fr: "En bataille · Membres LOCKED",
          })
        : L(lang, {
            ja: "観戦モード",
            en: "Spectator mode",
            ko: "관전 모드",
            zh: "观战模式",
            es: "Modo espectador",
            pt: "Modo espectador",
            fr: "Mode spectateur",
          }),
      detail: hasSquad
        ? L(lang, {
            ja: "開始後の入れ替えは不可。Pick Up 試合の週間×4 + 月間で平均スコアを競います。",
            en: "No swaps after the start. You compete on average score across 4 weekly boards + the monthly board, Pick Up games only.",
            ko: "시작 후 교체 불가. Pick Up 경기 주간×4 + 월간 평균 점수로 경쟁합니다.",
            zh: "开始后不可换人。在 4 个周榜 + 月榜上比拼 Pick Up 比赛平均得分。",
            es: "Sin cambios tras el inicio. Compites por media en 4 tableros semanales + mensual, solo Pick Up.",
            pt: "Sem trocas após o início. Compete pela média em 4 rankings semanais + mensal, só Pick Up.",
            fr: "Pas d'échanges après le début. Score moyen sur 4 hebdos + mensuel, matchs Pick Up uniquement.",
          })
        : L(lang, {
            ja: "未参加でも順位表は閲覧できます。参加は次回 ENTRY から。",
            en: "You can view the board without entering. Join from the next ENTRY.",
            ko: "미참가여도 순위표를 볼 수 있습니다. 다음 ENTRY에서 참가하세요.",
            zh: "未参赛也可查看排行榜。从下次 ENTRY 加入。",
            es: "Puedes ver el ranking sin participar. Únete en el próximo ENTRY.",
            pt: "Você pode ver o ranking sem entrar. Participe no próximo ENTRY.",
            fr: "Vous pouvez voir le classement sans participer. Rejoignez au prochain ENTRY.",
          }),
      tone: "battle",
    };
  }

  return {
    kicker: "REWARD",
    title: L(lang, {
      ja: "結果確定 · Unit 配布",
      en: "Results final · Units paid",
      ko: "결과 확정 · Unit 지급",
      zh: "结果确定 · Unit 发放",
      es: "Resultados finales · Units pagados",
      pt: "Resultados finais · Units pagos",
      fr: "Résultats finaux · Units versés",
    }),
    detail: L(lang, {
      ja: "週間1位はメンバー全員に 30 Unit、月間1位は 150 Unit。上位20グループまで順位に応じた Unit を確定メンバー全員へ同額付与します。",
      en: "Weekly 1st pays 30 Units to every member, monthly 1st pays 150. The top 20 squads all earn rank-based Units, paid equally to every locked member.",
      ko: "주간 1위는 전원 30 Unit, 월간 1위는 150 Unit. 상위 20 스쿼드까지 순위별 Unit을 확정 멤버 전원에게 동일 지급.",
      zh: "周冠军每人 30 Unit，月冠军 150 Unit。前 20 名小队按排名发放 Unit，锁定成员等额获得。",
      es: "1.º semanal: 30 Units por miembro; 1.º mensual: 150. Top 20 escuadras reciben Units según puesto, repartidos por igual.",
      pt: "1.º semanal: 30 Units por membro; 1.º mensal: 150. Top 20 esquadrões recebem Units por posição, iguais para todos.",
      fr: "1er hebdo : 30 Units par membre ; 1er mensuel : 150. Top 20 escouades reçoivent des Units selon le rang, part égales.",
    }),
    tone: "reward",
  };
}

/** エントリーカード用ステータスチップ */
export function squadBattleEntryStatusChip(args: {
  phase: SquadBattleUiPhase;
  myRank?: number | null;
  deadlineLabel?: string | null;
  lang?: SquadBattleUiLang;
}): { label: string; tone: "entry" | "battle" | "reward" | "idle" } {
  const { phase, myRank, deadlineLabel } = args;
  const lang = args.lang ?? "ja";
  if (phase === "idle") {
    return {
      label: L(lang, {
        ja: "休止",
        en: "OFF SEASON",
        ko: "휴식",
        zh: "休止",
        es: "PAUSA",
        pt: "PAUSA",
        fr: "PAUSE",
      }),
      tone: "idle",
    };
  }
  if (phase === "reward") {
    return {
      label: L(lang, {
        ja: "結果発表",
        en: "RESULTS",
        ko: "결과 발표",
        zh: "结果公布",
        es: "RESULTADOS",
        pt: "RESULTADOS",
        fr: "RÉSULTATS",
      }),
      tone: "reward",
    };
  }
  if (phase === "entry") {
    return {
      label: deadlineLabel
        ? L(lang, {
            ja: `締切 ${deadlineLabel}`,
            en: `BY ${deadlineLabel}`,
            ko: `마감 ${deadlineLabel}`,
            zh: `截止 ${deadlineLabel}`,
            es: `HASTA ${deadlineLabel}`,
            pt: `ATÉ ${deadlineLabel}`,
            fr: `JUSQU'AU ${deadlineLabel}`,
          })
        : L(lang, {
            ja: "募集中",
            en: "RECRUITING",
            ko: "모집 중",
            zh: "招募中",
            es: "RECLUTANDO",
            pt: "RECRUTANDO",
            fr: "RECRUTEMENT",
          }),
      tone: "entry",
    };
  }
  if (myRank != null && myRank > 0) {
    return { label: `#${myRank}`, tone: "battle" };
  }
  return { label: "BATTLE", tone: "battle" };
}

/** 前後グループとのスコア差（自分より上の直後 / 下の直後） */
export function squadScoreGaps(
  squad: Pick<Squad, "id" | "avgPoints" | "rank">,
  board: Array<Pick<Squad, "id" | "avgPoints" | "rank">>
): { gapToAbove: number | null; gapToBelow: number | null } {
  const above = board
    .filter((s) => s.rank === squad.rank - 1)
    .sort((a, b) => b.avgPoints - a.avgPoints)[0];
  const below = board
    .filter((s) => s.rank === squad.rank + 1)
    .sort((a, b) => b.avgPoints - a.avgPoints)[0];
  return {
    gapToAbove:
      above == null
        ? null
        : Math.max(0, Math.round(above.avgPoints - squad.avgPoints)),
    gapToBelow:
      below == null
        ? null
        : Math.max(0, Math.round(squad.avgPoints - below.avgPoints)),
  };
}

export function squadMemberCountLabel(squad: Squad): string {
  return `${countActiveMembers(squad)}/${SQUAD_BATTLE_MAX_MEMBERS}`;
}

/** RANK リストに出す上位組数（ピン留め MY SQUAD は別） */
export const SQUAD_RANKING_LIST_LIMIT = 20;

export function squadRankingList<T>(rows: T[]): T[] {
  return rows.slice(0, SQUAD_RANKING_LIST_LIMIT);
}

/**
 * リストカード右辺 DETAIL タブ（リザルトカードと同型）。
 * スクワッド行はリザルトより低いので top を上げてカードに載せる。
 */
export const SQUAD_RANKING_DETAIL_SPINE = {
  width: 10,
  height: 72,
  top: 10,
} as const;

/** 募集中メンバーの個人順位（バトル未開始のためスコアの代わり） */
export function squadOpenPeriodRankGroupLabel(
  lang: SquadBattleUiLang = "ja"
): string {
  return L(lang, {
    ja: "順位",
    en: "Rank",
    ko: "순위",
    zh: "排名",
    es: "Puesto",
    pt: "Posição",
    fr: "Rang",
  });
}

export type SquadOpenPeriodRankKey =
  | "lastMonthRank"
  | "lastWeekRank"
  | "thisWeekRank";

export function squadOpenPeriodRanks(
  lang: SquadBattleUiLang = "ja"
): ReadonlyArray<{ key: SquadOpenPeriodRankKey; label: string }> {
  return [
    {
      key: "lastMonthRank",
      label: L(lang, {
        ja: "先月",
        en: "Last mo.",
        ko: "지난달",
        zh: "上月",
        es: "Mes ant.",
        pt: "Mês ant.",
        fr: "Mois dern.",
      }),
    },
    {
      key: "lastWeekRank",
      label: L(lang, {
        ja: "先週",
        en: "Last wk.",
        ko: "지난주",
        zh: "上周",
        es: "Sem. ant.",
        pt: "Sem. ant.",
        fr: "Sem. dern.",
      }),
    },
    {
      key: "thisWeekRank",
      label: L(lang, {
        ja: "今週",
        en: "This wk.",
        ko: "이번 주",
        zh: "本周",
        es: "Esta sem.",
        pt: "Esta sem.",
        fr: "Cette sem.",
      }),
    },
  ];
}

export function formatSquadOpenPeriodRank(
  rank: number | null | undefined
): string {
  if (rank == null || rank <= 0) return "—";
  return String(rank);
}

/** 報酬結果（本番台帳 / プレビュー共通） */
export type SquadBattleWeeklyPayoutLine = {
  weekIndex: SquadBattleWeekIndex;
  rank: number | null;
  units: number;
  status?: "paid" | "pending" | "none";
};

export type SquadBattleRewardResult = {
  weekly: readonly SquadBattleWeeklyPayoutLine[];
  monthlyRank: number | null;
  monthlyUnits: number;
  monthlyStatus?: "paid" | "pending" | "none";
  payoutNote: string;
};

/** @deprecated 名前互換 — SquadBattleRewardResult を使う */
export type SquadBattleWeeklyPayoutMock = SquadBattleWeeklyPayoutLine;
export type SquadBattleRewardResultMock = SquadBattleRewardResult;

function mockWeeklyPayout(
  weekIndex: SquadBattleWeekIndex,
  rank: number
): SquadBattleWeeklyPayoutLine {
  return {
    weekIndex,
    rank,
    units: estimatedGroupBattleUnitsPerMember("weekly", rank) ?? 0,
    status: "paid",
  };
}

/** 報酬の共通脚注 */
export function squadBattleRewardPayoutNote(
  lang: SquadBattleUiLang = "ja"
): string {
  return L(lang, {
    ja: "確定メンバー全員へ同額付与 · Pick Up 試合のみ · 反映まで最大24時間",
    en: "Paid equally to every locked member · Pick Up games only · up to 24h to appear",
    ko: "확정 멤버 전원 동일 지급 · Pick Up 경기만 · 반영까지 최대 24시간",
    zh: "锁定成员等额发放 · 仅限 Pick Up 比赛 · 最多 24 小时到账",
    es: "Pagado por igual a cada miembro confirmado · solo Pick Up · hasta 24 h en aparecer",
    pt: "Pago igualmente a cada membro confirmado · só Pick Up · até 24 h para aparecer",
    fr: "Versé à parts égales à chaque membre confirmé · Pick Up uniquement · jusqu'à 24 h",
  });
}

/**
 * サーバー（`loadMyGroupBattlePayout`）が返す payout ノート。
 * API レスポンスに埋めるため、キー → 文言をここに集約する。
 */
export type SquadBattlePayoutNoteKey =
  | "battleNotFound"
  | "notEntered"
  | "rankFinalUnitsPending"
  | "partiallyPaid"
  | "ledgerRecorded"
  | "noFinalResults";

export function squadBattlePayoutNote(
  key: SquadBattlePayoutNoteKey,
  lang: SquadBattleUiLang = "ja"
): string {
  switch (key) {
    case "battleNotFound":
      return L(lang, {
        ja: "大会が見つかりません。",
        en: "Battle not found.",
        ko: "대회를 찾을 수 없습니다.",
        zh: "未找到比赛。",
        es: "Batalla no encontrada.",
        pt: "Batalha não encontrada.",
        fr: "Bataille introuvable.",
      });
    case "notEntered":
      return L(lang, {
        ja: "未参加のため配布対象外です。次回 ENTRY から参加できます。",
        en: "You didn't enter, so there's no payout this time. You can join from the next ENTRY.",
        ko: "미참가로 지급 대상이 아닙니다. 다음 ENTRY부터 참가할 수 있습니다.",
        zh: "未参赛，本次无奖励。可从下次 ENTRY 加入。",
        es: "No participaste, así que no hay pago esta vez. Únete en el próximo ENTRY.",
        pt: "Você não entrou, então não há pagamento desta vez. Participe no próximo ENTRY.",
        fr: "Vous n'avez pas participé, donc pas de paiement cette fois. Rejoignez au prochain ENTRY.",
      });
    case "rankFinalUnitsPending":
      return L(lang, {
        ja: "順位は確定。Unit 反映まで最大24時間かかる場合があります",
        en: "Ranks are final. Units can take up to 24h to appear",
        ko: "순위는 확정. Unit 반영까지 최대 24시간 걸릴 수 있습니다",
        zh: "排名已确定。Unit 最多 24 小时到账",
        es: "Los puestos son finales. Los Units pueden tardar hasta 24 h",
        pt: "Posições finais. Units podem levar até 24 h para aparecer",
        fr: "Classement final. Les Units peuvent prendre jusqu'à 24 h",
      });
    case "partiallyPaid":
      return L(lang, {
        ja: "一部は付与済み。残りは反映まで最大24時間かかる場合があります",
        en: "Partly paid. The rest can take up to 24h to appear",
        ko: "일부는 지급됨. 나머지는 반영까지 최대 24시간 걸릴 수 있습니다",
        zh: "部分已发放。其余最多 24 小时到账",
        es: "Parcialmente pagado. El resto puede tardar hasta 24 h",
        pt: "Parcialmente pago. O restante pode levar até 24 h",
        fr: "Partiellement versé. Le reste peut prendre jusqu'à 24 h",
      });
    case "ledgerRecorded":
      return L(lang, {
        ja: "台帳に記録済み · Pick Up 試合のみ · Free / Pro 共通",
        en: "Recorded in the ledger · Pick Up games only · same for Free / Pro",
        ko: "원장에 기록됨 · Pick Up 경기만 · Free / Pro 동일",
        zh: "已记入台账 · 仅限 Pick Up 比赛 · Free / Pro 相同",
        es: "Registrado en el libro · solo Pick Up · igual Free / Pro",
        pt: "Registrado no livro · só Pick Up · igual Free / Pro",
        fr: "Enregistré au registre · Pick Up uniquement · identique Free / Pro",
      });
    case "noFinalResults":
      return L(lang, {
        ja: "まだ確定結果がありません",
        en: "No final results yet",
        ko: "아직 확정 결과가 없습니다",
        zh: "尚无最终结果",
        es: "Aún no hay resultados finales",
        pt: "Ainda não há resultados finais",
        fr: "Pas encore de résultats finaux",
      });
  }
}

/** 申請カードの相対時刻（API createdAtMs → 表示） */
export function formatSquadRequestRelativeTime(
  createdAtMs: number,
  lang: SquadBattleUiLang = "ja",
  nowMs: number = Date.now()
): string {
  const ms = Number(createdAtMs);
  if (!Number.isFinite(ms) || ms <= 0) {
    return L(lang, {
      ja: "申請中",
      en: "Pending",
      ko: "대기 중",
      zh: "待处理",
      es: "Pendiente",
      pt: "Pendente",
      fr: "En attente",
    });
  }
  const sec = Math.max(0, Math.floor((nowMs - ms) / 1000));
  if (sec < 60) {
    return L(lang, {
      ja: "たった今",
      en: "Just now",
      ko: "방금",
      zh: "刚刚",
      es: "Ahora mismo",
      pt: "Agora mesmo",
      fr: "À l'instant",
    });
  }
  const min = Math.floor(sec / 60);
  if (min < 60) {
    return L(lang, {
      ja: `${min}分前`,
      en: `${min}m ago`,
      ko: `${min}분 전`,
      zh: `${min} 分钟前`,
      es: `Hace ${min} min`,
      pt: `${min} min atrás`,
      fr: `Il y a ${min} min`,
    });
  }
  const hr = Math.floor(min / 60);
  if (hr < 24) {
    return L(lang, {
      ja: `${hr}時間前`,
      en: `${hr}h ago`,
      ko: `${hr}시간 전`,
      zh: `${hr} 小时前`,
      es: `Hace ${hr} h`,
      pt: `${hr} h atrás`,
      fr: `Il y a ${hr} h`,
    });
  }
  const day = Math.floor(hr / 24);
  if (day === 1) {
    return L(lang, {
      ja: "昨日",
      en: "Yesterday",
      ko: "어제",
      zh: "昨天",
      es: "Ayer",
      pt: "Ontem",
      fr: "Hier",
    });
  }
  if (day < 30) {
    return L(lang, {
      ja: `${day}日前`,
      en: `${day}d ago`,
      ko: `${day}일 전`,
      zh: `${day} 天前`,
      es: `Hace ${day} d`,
      pt: `${day} d atrás`,
      fr: `Il y a ${day} j`,
    });
  }
  return L(lang, {
    ja: "以前",
    en: "Earlier",
    ko: "이전",
    zh: "更早",
    es: "Antes",
    pt: "Antes",
    fr: "Plus tôt",
  });
}

const MOCK_RELATIVE_LABEL_MAP: Record<
  string,
  { ja: string; en: string; ko: string; zh: string; es: string; pt: string; fr: string }
> = {
  "12分前": {
    ja: "12分前",
    en: "12m ago",
    ko: "12분 전",
    zh: "12 分钟前",
    es: "Hace 12 min",
    pt: "12 min atrás",
    fr: "Il y a 12 min",
  },
  "1時間前": {
    ja: "1時間前",
    en: "1h ago",
    ko: "1시간 전",
    zh: "1 小时前",
    es: "Hace 1 h",
    pt: "1 h atrás",
    fr: "Il y a 1 h",
  },
  昨日: {
    ja: "昨日",
    en: "Yesterday",
    ko: "어제",
    zh: "昨天",
    es: "Ayer",
    pt: "Ontem",
    fr: "Hier",
  },
  "30分前": {
    ja: "30分前",
    en: "30m ago",
    ko: "30분 전",
    zh: "30 分钟前",
    es: "Hace 30 min",
    pt: "30 min atrás",
    fr: "Il y a 30 min",
  },
  申請中: {
    ja: "申請中",
    en: "Pending",
    ko: "대기 중",
    zh: "待处理",
    es: "Pendiente",
    pt: "Pendente",
    fr: "En attente",
  },
  たった今: {
    ja: "たった今",
    en: "Just now",
    ko: "방금",
    zh: "刚刚",
    es: "Ahora mismo",
    pt: "Agora mesmo",
    fr: "À l'instant",
  },
};

/** プレビューモックの相対ラベルを言語に合わせる */
export function localizeSquadMockRelativeLabel(
  label: string,
  lang: SquadBattleUiLang
): string {
  const row = MOCK_RELATIVE_LABEL_MAP[label];
  if (!row) return label;
  return L(lang, row);
}

export function squadBattleRewardResultMock(
  lang: SquadBattleUiLang = "ja"
): SquadBattleRewardResult {
  return {
    weekly: [
      mockWeeklyPayout(1, 3),
      mockWeeklyPayout(2, 2),
      mockWeeklyPayout(3, 5),
      mockWeeklyPayout(4, 1),
    ],
    monthlyRank: 5,
    monthlyUnits: estimatedGroupBattleUnitsPerMember("monthly", 5) ?? 0,
    monthlyStatus: "paid",
    payoutNote: squadBattleRewardPayoutNote(lang),
  };
}

export function squadBattlePayoutTotalUnits(
  result: SquadBattleRewardResult
): number {
  const weekly = result.weekly.reduce((sum, w) => sum + w.units, 0);
  return weekly + result.monthlyUnits;
}

/** プレビュー既定の締切ラベル */
export const SQUAD_BATTLE_MOCK_DEADLINE_LABEL = "8/10 23:59";

/** 本番招待コード入力のプレースホルダ（実コードっぽい値は出さない） */
export const SQUAD_BATTLE_INVITE_CODE_PLACEHOLDER = "XXXX-XXXX";

export function squadInviteSendPrompt(
  displayName: string,
  squadName: string,
  lang: SquadBattleUiLang = "ja"
): string {
  return L(lang, {
    ja: `${displayName} を ${squadName} に誘いますか？`,
    en: `Invite ${displayName} to ${squadName}?`,
    ko: `${displayName}님을 ${squadName}에 초대할까요?`,
    zh: `邀请 ${displayName} 加入 ${squadName}？`,
    es: `¿Invitar a ${displayName} a ${squadName}?`,
    pt: `Convidar ${displayName} para ${squadName}?`,
    fr: `Inviter ${displayName} dans ${squadName} ?`,
  });
}

export function squadApplicantApprovePrompt(
  displayName: string,
  lang: SquadBattleUiLang = "ja"
): string {
  return L(lang, {
    ja: `${displayName} を承認しますか？`,
    en: `Approve ${displayName}?`,
    ko: `${displayName}님을 승인할까요?`,
    zh: `批准 ${displayName}？`,
    es: `¿Aprobar a ${displayName}?`,
    pt: `Aprovar ${displayName}?`,
    fr: `Approuver ${displayName} ?`,
  });
}

/** GROUP スロット一覧の SQUAD BATTLE エントリー */
export function squadBattleGroupEntryCopy(lang: SquadBattleUiLang = "ja"): {
  sectionLabel: string;
  title: string;
  enter: string;
  accessibilityLabel: string;
} {
  return {
    sectionLabel: L(lang, {
      ja: ">> スクワッドバトル",
      en: ">> SQUAD BATTLE",
      ko: ">> 스쿼드 배틀",
      zh: ">> 小队对战",
      es: ">> SQUAD BATTLE",
      pt: ">> SQUAD BATTLE",
      fr: ">> SQUAD BATTLE",
    }),
    title: L(lang, {
      ja: "Squad Battle",
      en: "Squad Battle",
      ko: "Squad Battle",
      zh: "Squad Battle",
      es: "Squad Battle",
      pt: "Squad Battle",
      fr: "Squad Battle",
    }),
    enter: L(lang, {
      ja: "Enter",
      en: "Enter",
      ko: "입장",
      zh: "进入",
      es: "Entrar",
      pt: "Entrar",
      fr: "Entrer",
    }),
    accessibilityLabel: L(lang, {
      ja: "スクワッドバトル",
      en: "Squad Battle",
      ko: "스쿼드 배틀",
      zh: "小队对战",
      es: "Squad Battle",
      pt: "Squad Battle",
      fr: "Squad Battle",
    }),
  };
}

export function squadInviteIncomingTitle(
  fromName: string,
  lang: SquadBattleUiLang = "ja"
): string {
  return L(lang, {
    ja: `${fromName} からスクワッドバトルの招待が来ています`,
    en: `${fromName} invited you to a Squad Battle squad`,
    ko: `${fromName}님이 스쿼드 배틀 초대를 보냈습니다`,
    zh: `${fromName} 邀请你加入 Squad Battle 小队`,
    es: `${fromName} te invitó a una escuadra de Squad Battle`,
    pt: `${fromName} convidou você para um esquadrão de Squad Battle`,
    fr: `${fromName} vous a invité dans une escouade Squad Battle`,
  });
}

/** 申請者カードの Score / 勝率は現行 NBA シーズン累計（今週ではない） */
export const SQUAD_APPLICANT_SEASON_SHORT = nbaSeasonShortLabel(
  CURRENT_NBA_SEASON_KEY
);

/** 招待・申請者カード周りの文言 */
export function squadBattleInviteCopy(lang: SquadBattleUiLang = "ja"): {
  holdHint: string;
  listTitle: string;
  listHint: string;
  listEmpty: string;
  joinPrompt: string;
  deadlinePrefix: string;
  openProfile: string;
  scoreLabel: string;
  winRateLabel: string;
  wrLabel: string;
} {
  const season = SQUAD_APPLICANT_SEASON_SHORT;
  return {
    holdHint: L(lang, {
      ja: "保留すると、招待されているスクワッドからいつでも参加できます。",
      en: "Hold it and you can join the inviting squad whenever you like.",
      ko: "보류하면 초대된 스쿼드에서 언제든 참가할 수 있습니다.",
      zh: "暂留后可随时从邀请的小队加入。",
      es: "Pospón y podrás unirte a la escuadra que te invitó cuando quieras.",
      pt: "Guarde e você pode entrar no esquadrão que convidou quando quiser.",
      fr: "Mettez de côté et rejoignez l'escouade qui vous a invité quand vous voulez.",
    }),
    listTitle: L(lang, {
      ja: "招待されているスクワッド",
      en: "Squads that invited you",
      ko: "초대받은 스쿼드",
      zh: "收到邀请的小队",
      es: "Escuadras que te invitaron",
      pt: "Esquadrões que convidaram você",
      fr: "Escouades qui vous ont invité",
    }),
    listHint: L(lang, {
      ja: "招待されたスクワッドです。ここから参加できます。",
      en: "Squads that invited you. You can join from here.",
      ko: "초대받은 스쿼드입니다. 여기서 참가할 수 있습니다.",
      zh: "收到邀请的小队。可在此加入。",
      es: "Escuadras que te invitaron. Puedes unirte desde aquí.",
      pt: "Esquadrões que convidaram você. Entre daqui.",
      fr: "Escouades qui vous ont invité. Rejoignez depuis ici.",
    }),
    listEmpty: L(lang, {
      ja: "届いている招待はありません。",
      en: "No invites right now.",
      ko: "받은 초대가 없습니다.",
      zh: "暂无邀请。",
      es: "No hay invitaciones ahora.",
      pt: "Nenhum convite no momento.",
      fr: "Aucune invitation pour l'instant.",
    }),
    joinPrompt: L(lang, {
      ja: "このグループに参加しますか",
      en: "Join this squad?",
      ko: "이 스쿼드에 참가할까요?",
      zh: "加入此小队？",
      es: "¿Unirse a esta escuadra?",
      pt: "Entrar neste esquadrão?",
      fr: "Rejoindre cette escouade ?",
    }),
    deadlinePrefix: L(lang, {
      ja: "エントリー期限",
      en: "Entry deadline",
      ko: "참가 마감",
      zh: "报名截止",
      es: "Cierre de inscripción",
      pt: "Prazo de inscrição",
      fr: "Date limite d'inscription",
    }),
    openProfile: L(lang, {
      ja: "プロフィールを見る",
      en: "View profile",
      ko: "프로필 보기",
      zh: "查看资料",
      es: "Ver perfil",
      pt: "Ver perfil",
      fr: "Voir le profil",
    }),
    scoreLabel: L(lang, {
      ja: `${season} 累積`,
      en: `${season} total`,
      ko: `${season} 누적`,
      zh: `${season} 累计`,
      es: `${season} total`,
      pt: `${season} total`,
      fr: `${season} total`,
    }),
    winRateLabel: L(lang, {
      ja: `${season} 勝率`,
      en: `${season} win %`,
      ko: `${season} 승률`,
      zh: `${season} 胜率`,
      es: `${season} % victorias`,
      pt: `${season} % vitórias`,
      fr: `${season} % victoires`,
    }),
    wrLabel: L(lang, {
      ja: `${season} WR`,
      en: `${season} WR`,
      ko: `${season} WR`,
      zh: `${season} WR`,
      es: `${season} WR`,
      pt: `${season} WR`,
      fr: `${season} WR`,
    }),
  };
}

/** 開催告知モーダル（たたき台） */
export const SQUAD_BATTLE_LAUNCH_STORAGE_KEY =
  "uniterz:squad-battle-launch:v1";

export function squadBattleLaunchCopy(lang: SquadBattleUiLang = "ja"): {
  kicker: string;
  title: string;
  lead: string;
  cta: string;
  later: string;
  deadlinePrefix: string;
  facts: ReadonlyArray<{ kicker: string; value: string }>;
} {
  return {
    kicker: L(lang, {
      ja: "NOW OPEN",
      en: "NOW OPEN",
      ko: "NOW OPEN",
      zh: "NOW OPEN",
      es: "NOW OPEN",
      pt: "NOW OPEN",
      fr: "NOW OPEN",
    }),
    title: L(lang, {
      ja: "SQUAD BATTLE",
      en: "SQUAD BATTLE",
      ko: "SQUAD BATTLE",
      zh: "SQUAD BATTLE",
      es: "SQUAD BATTLE",
      pt: "SQUAD BATTLE",
      fr: "SQUAD BATTLE",
    }),
    lead: L(lang, {
      ja: "募集が始まりました。3〜5人のスクワッドで、Pick Up 試合の平均スコアを競う。",
      en: "Recruiting is open. Build a squad of 3–5 and compete on average score in Pick Up games.",
      ko: "모집이 시작됐습니다. 3–5명 스쿼드로 Pick Up 경기 평균 점수를 겨루세요.",
      zh: "招募已开始。组建 3–5 人小队，比拼 Pick Up 比赛平均得分。",
      es: "El reclutamiento está abierto. Forma una escuadra de 3–5 y compite por media en Pick Up.",
      pt: "Recrutamento aberto. Monte um esquadrão de 3–5 e dispute a média em Pick Up.",
      fr: "Recrutement ouvert. Formez une escouade de 3–5 et rivalisez sur la moyenne en Pick Up.",
    }),
    cta: L(lang, {
      ja: "参加する",
      en: "Join",
      ko: "참가",
      zh: "加入",
      es: "Unirse",
      pt: "Entrar",
      fr: "Rejoindre",
    }),
    later: L(lang, {
      ja: "あとで",
      en: "Later",
      ko: "나중에",
      zh: "稍后",
      es: "Después",
      pt: "Depois",
      fr: "Plus tard",
    }),
    deadlinePrefix: L(lang, {
      ja: "エントリー期限",
      en: "Entry deadline",
      ko: "참가 마감",
      zh: "报名截止",
      es: "Cierre de inscripción",
      pt: "Prazo de inscrição",
      fr: "Date limite d'inscription",
    }),
    facts: [
      {
        kicker: "ENTRY",
        value: L(lang, {
          ja: "約1〜2週間 · メンバー確定後は入れ替え不可",
          en: "1–2 weeks · no swaps once members lock",
          ko: "약 1–2주 · 멤버 확정 후 교체 불가",
          zh: "约 1–2 周 · 成员锁定后不可换人",
          es: "1–2 semanas · sin cambios tras confirmar miembros",
          pt: "1–2 semanas · sem trocas após confirmar membros",
          fr: "1–2 semaines · pas d'échanges après confirmation",
        }),
      },
      {
        kicker: "PICK UP",
        value: L(lang, {
          ja: "対象試合のみ",
          en: "Selected games only",
          ko: "대상 경기만",
          zh: "仅限指定比赛",
          es: "Solo partidos seleccionados",
          pt: "Apenas jogos selecionados",
          fr: "Matchs sélectionnés uniquement",
        }),
      },
      {
        kicker: "SQUAD",
        value: L(lang, {
          ja: "3〜5人",
          en: "3–5 players",
          ko: "3–5명",
          zh: "3–5 人",
          es: "3–5 jugadores",
          pt: "3–5 jogadores",
          fr: "3–5 joueurs",
        }),
      },
      {
        kicker: "REWARD",
        value: L(lang, {
          ja: "週1位 30 · 月1位 150 Unit（全員）",
          en: "Weekly 1st 30 · monthly 1st 150 Units (each)",
          ko: "주간 1위 30 · 월간 1위 150 Unit (전원)",
          zh: "周冠军 30 · 月冠军 150 Unit（每人）",
          es: "1.º semanal 30 · 1.º mensual 150 Units (c/u)",
          pt: "1.º semanal 30 · 1.º mensal 150 Units (cada)",
          fr: "1er hebdo 30 · 1er mensuel 150 Units (chacun)",
        }),
      },
    ],
  };
}

/** Native DEV / プレビューメニュー — 画面ジャンプ */
export type SquadBattlePreviewJumpOverlay =
  | "intro"
  | "launch"
  | "create"
  | "joinCode"
  | "applicant"
  | "detail";

export const SQUAD_BATTLE_PREVIEW_JUMPS: readonly {
  id: string;
  label: string;
  previewState: "none" | "recruiting" | "full";
  phase: SquadBattleUiPhase;
  tab: "join" | "rank";
  boardStatus?: "live" | "final";
  overlay?: SquadBattlePreviewJumpOverlay;
}[] = [
  {
    id: "join-entry-none",
    label: "JOIN · 未参加",
    previewState: "none",
    phase: "entry",
    tab: "join",
  },
  {
    id: "join-entry-recruit",
    label: "JOIN · 募集中",
    previewState: "recruiting",
    phase: "entry",
    tab: "join",
  },
  {
    id: "join-entry-full",
    label: "JOIN · 満員",
    previewState: "full",
    phase: "entry",
    tab: "join",
  },
  {
    id: "join-battle-watch",
    label: "JOIN · 観戦",
    previewState: "none",
    phase: "battle",
    tab: "join",
  },
  {
    id: "join-reward",
    label: "JOIN · REWARD",
    previewState: "full",
    phase: "reward",
    tab: "join",
  },
  {
    id: "join-idle",
    label: "JOIN · 休止",
    previewState: "none",
    phase: "idle",
    tab: "join",
  },
  {
    id: "rank-live",
    label: "RANK · LIVE",
    previewState: "full",
    phase: "battle",
    tab: "rank",
    boardStatus: "live",
  },
  {
    id: "rank-final",
    label: "RANK · FINAL",
    previewState: "full",
    phase: "battle",
    tab: "rank",
    boardStatus: "final",
  },
  { id: "overlay-intro", label: "イントロ", previewState: "full", phase: "battle", tab: "rank", overlay: "intro" },
  { id: "overlay-launch", label: "開催モーダル", previewState: "none", phase: "entry", tab: "join", overlay: "launch" },
  { id: "overlay-create", label: "作成シート", previewState: "none", phase: "entry", tab: "join", overlay: "create" },
  { id: "overlay-code", label: "招待コード", previewState: "none", phase: "entry", tab: "join", overlay: "joinCode" },
  { id: "overlay-applicant", label: "申請プロフィール", previewState: "recruiting", phase: "entry", tab: "join", overlay: "applicant" },
  { id: "overlay-detail", label: "RANK DETAIL", previewState: "full", phase: "battle", tab: "rank", overlay: "detail" },
] as const;

/** 初回イントロ全画面の付随文言（本文はフェーズ / タグライン側） */
export function squadBattleIntroOverlayCopy(lang: SquadBattleUiLang = "ja"): {
  skip: string;
  srSummary: string;
} {
  return {
    skip: L(lang, {
      ja: "スキップ",
      en: "Skip",
      ko: "건너뛰기",
      zh: "跳过",
      es: "Omitir",
      pt: "Pular",
      fr: "Passer",
    }),
    srSummary: L(lang, {
      ja: "スクワッドバトルの説明。3〜5人で平均スコアを競う。募集約1〜2週間、バトル約1ヶ月、結果確定後に上位へ Unit 配布。",
      en: "About Squad Battle. Squads of 3–5 compete on average score. About 1–2 weeks of recruiting, about a month of battle, then Units for the top squads once results are final.",
      ko: "스쿼드 배틀 안내. 3–5명이 평균 점수로 경쟁. 모집 약 1–2주, 배틀 약 1개월, 결과 확정 후 상위에게 Unit 지급.",
      zh: "Squad Battle 说明。3–5 人比拼平均得分。招募约 1–2 周，比赛约 1 个月，结果确定后向排名靠前的小队发放 Unit。",
      es: "Sobre Squad Battle. Escuadras de 3–5 compiten por media. ~1–2 semanas de reclutamiento, ~1 mes de batalla, luego Units para las mejores.",
      pt: "Sobre Squad Battle. Esquadrões de 3–5 competem pela média. ~1–2 semanas de recrutamento, ~1 mês de batalha, depois Units para os melhores.",
      fr: "À propos de Squad Battle. Escouades de 3–5 sur le score moyen. ~1–2 semaines de recrutement, ~1 mois de bataille, puis Units pour les meilleures.",
    }),
  };
}
