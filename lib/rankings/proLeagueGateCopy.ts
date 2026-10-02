/**
 * Free が PRO LEAGUE を開いたときのゲート文言（Report ゲートと同型）
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export type ProLeagueGateBullet = {
  icon: "swords" | "trophy" | "grid" | "users" | "sparkles" | "badge";
  title: string;
  detail: string;
};

export type ProLeagueGateCopy = {
  eyebrow: string;
  title: string;
  body: string;
  bullets: readonly ProLeagueGateBullet[];
  cta: string;
  dismiss: string;
  backToPickUp: string;
  proMemberAria: string;
};

export function proLeagueGateCopy(
  language: string | null | undefined
): ProLeagueGateCopy {
  const lang = resolveLocalizedLang(language);
  return {
    eyebrow: "PRO LEAGUE",
    title: L(lang, {
      ja: "PRO LEAGUE は Pro 限定です",
      en: "PRO LEAGUE is Pro-only",
      ko: "PRO LEAGUE는 Pro 전용입니다",
      zh: "PRO LEAGUE 仅限 Pro",
      es: "PRO LEAGUE es solo Pro",
      pt: "PRO LEAGUE é só Pro",
      fr: "PRO LEAGUE est réservé aux Pro",
    }),
    body: L(lang, {
      ja: "全試合の成績で競うリーグです。閲覧・参加には Pro プランが必要です。",
      en: "Compete across every game. View and join require a Pro plan.",
      ko: "모든 경기 성적으로 겨룹니다. 열람·참가에는 Pro 플랜이 필요합니다.",
      zh: "以全部比赛成绩竞争。查看与加入需要 Pro 方案。",
      es: "Compite en todos los partidos. Ver y unirte requiere plan Pro.",
      pt: "Dispute em todos os jogos. Ver e entrar exige plano Pro.",
      fr: "Affrontez-vous sur tous les matchs. Voir et rejoindre requiert Pro.",
    }),
    bullets: [
      {
        icon: "swords",
        title: L(lang, {
          ja: "全試合対象",
          en: "All games",
          ko: "모든 경기 대상",
          zh: "覆盖全部比赛",
          es: "Todos los partidos",
          pt: "Todos os jogos",
          fr: "Tous les matchs",
        }),
        detail: L(lang, {
          ja: "Pick Up だけでなく、ランキング対象の試合すべてが順位に入ります",
          en: "Not just Pick Up — every ranking-eligible game counts toward the board",
          ko: "Pick Up뿐 아니라 랭킹 대상 경기가 모두 순위에 반영됩니다",
          zh: "不仅是 Pick Up——所有计入排名的比赛都会上榜",
          es: "No solo Pick Up: cada partido elegible suma al tablero",
          pt: "Não só Pick Up — todo jogo elegível conta no ranking",
          fr: "Pas seulement Pick Up — chaque match éligible compte",
        }),
      },
      {
        icon: "trophy",
        title: L(lang, {
          ja: "週間 / 月間 / シーズン",
          en: "Weekly / Monthly / Season",
          ko: "주간 / 월간 / 시즌",
          zh: "周 / 月 / 赛季",
          es: "Semanal / Mensual / Temporada",
          pt: "Semanal / Mensal / Temporada",
          fr: "Hebdo / Mensuel / Saison",
        }),
        detail: L(lang, {
          ja: "Pick Up と同じ期間構成。対戦相手は Pro のみ",
          en: "Same periods as Pick Up, Pro competitors only",
          ko: "Pick Up과 같은 기간. 상대는 Pro만",
          zh: "周期与 Pick Up 相同，仅 Pro 对手",
          es: "Mismos periodos que Pick Up; solo rivales Pro",
          pt: "Mesmos períodos do Pick Up; só rivais Pro",
          fr: "Mêmes périodes que Pick Up ; adversaires Pro uniquement",
        }),
      },
      {
        icon: "badge",
        title: L(lang, {
          ja: "報酬 · バッジ",
          en: "Monthly awards · Badge",
          ko: "보상 · 배지",
          zh: "奖励 · 徽章",
          es: "Premios mensuales · Insignia",
          pt: "Prêmios mensais · Distintivo",
          fr: "Récompenses mensuelles · Badge",
        }),
        detail: L(lang, {
          ja: "月間優秀者に専用バッジを付与します",
          en: "Top monthly finishers earn an exclusive badge",
          ko: "월간 우수자에게 전용 배지를 줍니다",
          zh: "月度优秀者可获专属徽章",
          es: "Los mejores del mes ganan una insignia exclusiva",
          pt: "Os melhores do mês ganham um distintivo exclusivo",
          fr: "Les meilleurs du mois gagnent un badge exclusif",
        }),
      },
      {
        icon: "grid",
        title: L(lang, {
          ja: "スコア / 勝率 / SCORER / UPSET",
          en: "Score / Win% / Scorer / Upset",
          ko: "점수 / 승률 / SCORER / UPSET",
          zh: "得分 / 胜率 / SCORER / UPSET",
          es: "Puntos / %Victoria / Scorer / Upset",
          pt: "Pontos / %Vitória / Scorer / Upset",
          fr: "Score / %Victoire / Scorer / Upset",
        }),
        detail: L(lang, {
          ja: "指標タブ一式。PRO LEAGUE 専用の雰囲気",
          en: "Full metric tabs, Pro board atmosphere",
          ko: "지표 탭 전부. PRO LEAGUE 전용 분위기",
          zh: "完整指标页签，PRO LEAGUE 专属氛围",
          es: "Pestañas de métricas completas, atmósfera Pro",
          pt: "Abas de métricas completas, atmosfera Pro",
          fr: "Onglets de métriques complets, ambiance Pro",
        }),
      },
      {
        icon: "users",
        title: L(lang, {
          ja: "掲載・閲覧は Pro のみ",
          en: "Pro-only standings",
          ko: "게시·열람은 Pro만",
          zh: "仅 Pro 可见上榜",
          es: "Clasificación solo Pro",
          pt: "Classificação só Pro",
          fr: "Classement réservé aux Pro",
        }),
        detail: L(lang, {
          ja: "Free ユーザーは実ランキングを見られません",
          en: "Free users are not listed or shown the real board",
          ko: "Free 사용자는 실제 랭킹을 볼 수 없습니다",
          zh: "Free 用户无法看到真实榜单",
          es: "Los usuarios Free no ven el tablero real",
          pt: "Usuários Free não veem o ranking real",
          fr: "Les utilisateurs Free ne voient pas le vrai classement",
        }),
      },
      {
        icon: "sparkles",
        title: L(lang, {
          ja: "Free 中の成績も残る",
          en: "Your history still counts",
          ko: "Free 중 성적도 남습니다",
          zh: "Free 期间成绩仍保留",
          es: "Tu historial sigue contando",
          pt: "Seu histórico continua valendo",
          fr: "Votre historique compte toujours",
        }),
        detail: L(lang, {
          ja: "Pro 加入後は、それまでの集計を引き継いで参加できます",
          en: "Stats accrue while Free; after Pro you join with that history",
          ko: "Pro 가입 후 기존 집계를 이어 참가합니다",
          zh: "开通 Pro 后可带着既有统计加入",
          es: "Las stats acumulan en Free; con Pro entras con ese historial",
          pt: "As stats acumulam no Free; no Pro você entra com esse histórico",
          fr: "Les stats s’accumulent en Free ; en Pro vous gardez l’historique",
        }),
      },
    ],
    cta: L(lang, {
      ja: "Explore Pro",
      en: "Explore Pro",
      ko: "Explore Pro",
      zh: "Explore Pro",
      es: "Explore Pro",
      pt: "Explore Pro",
      fr: "Explore Pro",
    }),
    dismiss: L(lang, {
      ja: "とじる",
      en: "Close",
      ko: "닫기",
      zh: "关闭",
      es: "Cerrar",
      pt: "Fechar",
      fr: "Fermer",
    }),
    backToPickUp: L(lang, {
      ja: "Pick Up に戻る",
      en: "Back to Pick Up",
      ko: "Pick Up으로 돌아가기",
      zh: "返回 Pick Up",
      es: "Volver a Pick Up",
      pt: "Voltar ao Pick Up",
      fr: "Retour à Pick Up",
    }),
    proMemberAria: L(lang, {
      ja: "Pro会員",
      en: "Pro member",
      ko: "Pro 회원",
      zh: "Pro 会员",
      es: "Miembro Pro",
      pt: "Membro Pro",
      fr: "Membre Pro",
    }),
  };
}

export const PRO_LEAGUE_GATE_CTA_HREF = "/mobile/pro/subscribe";
