import type { ReportGateKind } from "@/lib/reports/reportGateTypes";
import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";

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

function freeBullets(lang: LocalizedLang): readonly ReportGateBullet[] {
  return [
    {
      icon: "result",
      title: L(lang, {
        ja: "今週の結果",
        en: "This week’s result",
        ko: "이번 주 결과",
        zh: "本周结果",
        es: "Resultado de la semana",
        pt: "Resultado da semana",
        fr: "Résultat de la semaine",
      }),
      detail: L(lang, {
        ja: "週間順位・獲得ポイント・勝敗",
        en: "Rank, points, and W–L at a glance",
        ko: "주간 순위·포인트·승패",
        zh: "周排名、积分与胜负",
        es: "Ranking, puntos y W–L",
        pt: "Ranking, pontos e W–L",
        fr: "Rang, points et V–D",
      }),
    },
    {
      icon: "division",
      title: L(lang, {
        ja: "部門成績",
        en: "Divisions",
        ko: "부문 성적",
        zh: "分项成绩",
        es: "Divisiones",
        pt: "Divisões",
        fr: "Divisions",
      }),
      detail: L(lang, {
        ja: "WIN / SCORER / UPSET の順位",
        en: "WIN / SCORER / UPSET standings",
        ko: "WIN / SCORER / UPSET 순위",
        zh: "WIN / SCORER / UPSET 排名",
        es: "Clasificación WIN / SCORER / UPSET",
        pt: "Classificação WIN / SCORER / UPSET",
        fr: "Classement WIN / SCORER / UPSET",
      }),
    },
    {
      icon: "rival",
      title: L(lang, {
        ja: "ライバル対決",
        en: "Rival battles",
        ko: "라이벌 대결",
        zh: "对手对决",
        es: "Batallas rivales",
        pt: "Batalhas rivais",
        fr: "Duels rivaux",
      }),
      detail: L(lang, {
        ja: "抜いた人・抜かれた人がわかる",
        en: "Who you passed — and who passed you",
        ko: "앞지른·앞지른 당한 사람",
        zh: "看清你超越与被超越的人",
        es: "A quién pasaste y quién te pasó",
        pt: "Quem você passou e quem te passou",
        fr: "Qui vous avez dépassé — et qui vous a dépassé",
      }),
    },
    {
      icon: "target",
      title: L(lang, {
        ja: "次の一手",
        en: "Next move",
        ko: "다음 수",
        zh: "下一步",
        es: "Siguiente paso",
        pt: "Próximo passo",
        fr: "Prochain coup",
      }),
      detail: L(lang, {
        ja: "次のターゲットと背後の脅威",
        en: "Your next target and the threat behind",
        ko: "다음 타깃과 뒤의 위협",
        zh: "下一个目标与身后威胁",
        es: "Tu próximo objetivo y la amenaza detrás",
        pt: "Seu próximo alvo e a ameaça atrás",
        fr: "Votre prochaine cible et la menace derrière",
      }),
    },
    {
      icon: "comment",
      title: L(lang, {
        ja: "診断コメント",
        en: "Coach note",
        ko: "진단 코멘트",
        zh: "诊断点评",
        es: "Nota del coach",
        pt: "Nota do coach",
        fr: "Note du coach",
      }),
      detail: L(lang, {
        ja: "今週の総括と、次週の焦点",
        en: "Week summary and next week’s focus",
        ko: "이번 주 총평과 다음 주 초점",
        zh: "本周总结与下周重点",
        es: "Resumen de la semana y foco de la próxima",
        pt: "Resumo da semana e foco da próxima",
        fr: "Bilan de la semaine et focus de la suivante",
      }),
    },
  ];
}

function monthlyBullets(lang: LocalizedLang): readonly ReportGateBullet[] {
  return [
    {
      icon: "result",
      title: L(lang, {
        ja: "月の成績",
        en: "Month scorecard",
        ko: "월간 성적",
        zh: "月度成绩",
        es: "Resultados del mes",
        pt: "Resultados do mês",
        fr: "Bilan du mois",
      }),
      detail: L(lang, {
        ja: "順位・Unit・前月比が一目でわかる",
        en: "Rank, Units, and month-over-month",
        ko: "순위·Unit·전월 비 한눈에",
        zh: "排名、Unit、环比一目了然",
        es: "Ranking, Units y mes a mes",
        pt: "Ranking, Units e mês a mês",
        fr: "Rang, Units et mois sur mois",
      }),
    },
    {
      icon: "radar",
      title: L(lang, {
        ja: "レーダー分析",
        en: "Radar",
        ko: "레이더 분석",
        zh: "雷达分析",
        es: "Radar",
        pt: "Radar",
        fr: "Radar",
      }),
      detail: L(lang, {
        ja: "5軸で自分の強み・弱みがわかる",
        en: "Five axes of strengths and gaps",
        ko: "5축으로 강점·약점",
        zh: "五轴看清强弱",
        es: "Cinco ejes de fortalezas y huecos",
        pt: "Cinco eixos de forças e lacunas",
        fr: "Cinq axes de forces et lacunes",
      }),
    },
    {
      icon: "habits",
      title: L(lang, {
        ja: "予想のクセ",
        en: "Habits",
        ko: "예상 습관",
        zh: "预测习惯",
        es: "Hábitos",
        pt: "Hábitos",
        fr: "Habitudes",
      }),
      detail: L(lang, {
        ja: "ホーム／アウェイや傾向の整理",
        en: "Home/away patterns and bias",
        ko: "홈/어웨이·경향 정리",
        zh: "主客场与偏向整理",
        es: "Patrones home/away y sesgos",
        pt: "Padrões home/away e viés",
        fr: "Schémas domicile/extérieur et biais",
      }),
    },
    {
      icon: "affinity",
      title: L(lang, {
        ja: "チーム相性",
        en: "Team affinity",
        ko: "팀 궁합",
        zh: "球队契合",
        es: "Afinidad de equipo",
        pt: "Afinidade de time",
        fr: "Affinité d’équipe",
      }),
      detail: L(lang, {
        ja: "得意・苦手がわかる",
        en: "Who you click with — and who you don’t",
        ko: "잘하는·못하는 팀",
        zh: "看清擅长与苦手",
        es: "Con quién encajas — y con quién no",
        pt: "Com quem você combina — e com quem não",
        fr: "Avec qui ça marche — et avec qui non",
      }),
    },
    {
      icon: "outlook",
      title: L(lang, {
        ja: "来月の見通し",
        en: "Next outlook",
        ko: "다음 달 전망",
        zh: "下月展望",
        es: "Perspectiva",
        pt: "Perspectiva",
        fr: "Perspectives",
      }),
      detail: L(lang, {
        ja: "総括と次の焦点",
        en: "Summary and focus for next month",
        ko: "총평과 다음 초점",
        zh: "总结与下月重点",
        es: "Resumen y foco del próximo mes",
        pt: "Resumo e foco do próximo mês",
        fr: "Bilan et focus du mois prochain",
      }),
    },
  ];
}

export function reportGateCopy(
  kind: ReportGateKind,
  language: string | null | undefined
): ReportGateCopy {
  const lang = resolveLocalizedLang(language);
  switch (kind) {
    case "free":
      return {
        eyebrow: "PRO REPORT",
        title: L(lang, {
          ja: "成績の振り返りは Pro から",
          en: "Reports unlock with Pro",
          ko: "성적 리뷰는 Pro부터",
          zh: "成绩回顾从 Pro 开始",
          es: "Los reportes se abren con Pro",
          pt: "Relatórios liberam com Pro",
          fr: "Les rapports s’ouvrent avec Pro",
        }),
        body: L(lang, {
          ja: "週次の競争レポートと、月次の自己分析が届きます。",
          en: "Get weekly competition recaps and monthly self-analysis.",
          ko: "주간 경쟁 리포트와 월간 자기 분석이 도착합니다.",
          zh: "送达周竞争报告与月自我分析。",
          es: "Recaps semanales y autoanálisis mensual.",
          pt: "Recaps semanais e autoanálise mensal.",
          fr: "Récaps hebdo et auto-analyse mensuelle.",
        }),
        bullets: freeBullets(lang),
        cta: "Explore Pro",
      };
    case "waitingMonday":
      return {
        eyebrow: "WEEKLY",
        title: L(lang, {
          ja: "次の月曜日に届きます",
          en: "Arrives next Monday",
          ko: "다음 월요일에 도착",
          zh: "下周一送达",
          es: "Llega el próximo lunes",
          pt: "Chega na próxima segunda",
          fr: "Arrive lundi prochain",
        }),
        body: L(lang, {
          ja: "週次レポートは毎週月曜に確定版が配信されます。届くまでしばらくお待ちください。",
          en: "Weekly finals ship Monday morning. Hang tight until your first report lands.",
          ko: "주간 리포트는 매주 월요일 확정본이 배포됩니다. 잠시만 기다려 주세요.",
          zh: "周报每周一发布确定版。请稍候。",
          es: "Los finales semanales salen el lunes. Espera tu primer reporte.",
          pt: "Finais semanais saem na segunda. Aguarde o primeiro relatório.",
          fr: "Les bilans hebdo partent lundi. Patience jusqu’au premier.",
        }),
        cta: null,
      };
    case "waitingMonth":
      return {
        eyebrow: "MONTHLY",
        title: L(lang, {
          ja: "月初に届きます",
          en: "Arrives on the 1st",
          ko: "월초에 도착",
          zh: "月初送达",
          es: "Llega el día 1",
          pt: "Chega no dia 1",
          fr: "Arrive le 1er",
        }),
        body: L(lang, {
          ja: "月次レポートは毎月1日に作成されます。最初の1冊が届くまでお待ちください。",
          en: "Monthly reports are built on the 1st of each month. Hang tight for your first one.",
          ko: "월간 리포트는 매월 1일에 생성됩니다. 첫 권이 올 때까지 기다려 주세요.",
          zh: "月报每月 1 日生成。请等待第一份。",
          es: "Los mensuales se crean el día 1. Espera el primero.",
          pt: "Os mensais saem no dia 1. Aguarde o primeiro.",
          fr: "Les mensuels sont créés le 1er. Patience pour le premier.",
        }),
        cta: null,
      };
    case "insufficientPicks":
      return {
        eyebrow: "WEEKLY",
        title: L(lang, {
          ja: "予想が足りません",
          en: "Not enough predictions",
          ko: "예상이 부족합니다",
          zh: "预测不足",
          es: "Faltan predicciones",
          pt: "Previsões insuficientes",
          fr: "Pas assez de prédictions",
        }),
        body: L(lang, {
          ja: "この期間に予想がなかったため、レポートを作成できませんでした。試合を予想すると次の配信対象になります。",
          en: "No picks in this period, so we couldn’t build a report. Predict games to qualify for the next drop.",
          ko: "이 기간에 예상이 없어 리포트를 만들 수 없었습니다. 경기를 예상하면 다음 배포 대상이 됩니다.",
          zh: "本期间无预测，无法生成报告。预测比赛即可进入下次发放。",
          es: "Sin picks en el período; no hay reporte. Predice partidos para el próximo.",
          pt: "Sem picks no período; sem relatório. Preveja jogos para o próximo.",
          fr: "Aucun pick sur la période ; pas de rapport. Prédisez pour le prochain.",
        }),
        cta: L(lang, {
          ja: "試合を見る",
          en: "Browse games",
          ko: "경기 보기",
          zh: "查看比赛",
          es: "Ver partidos",
          pt: "Ver jogos",
          fr: "Voir les matchs",
        }),
      };
    case "monthlyLocked":
      return {
        eyebrow: "MONTHLY",
        title: L(lang, {
          ja: "月次レポートは Monthly 以上",
          en: "Monthly needs Monthly+",
          ko: "월간 리포트는 Monthly 이상",
          zh: "月报需 Monthly 及以上",
          es: "Mensual requiere Monthly+",
          pt: "Mensal precisa de Monthly+",
          fr: "Mensuel nécessite Monthly+",
        }),
        body: L(lang, {
          ja: "Weekly では週次のみ。月次の自己分析はプラン変更で開けます。",
          en: "Weekly includes weekly only. Unlock monthly analysis by changing plans.",
          ko: "Weekly는 주간만. 월간 자기 분석은 플랜 변경으로 열립니다.",
          zh: "Weekly 仅含周报。改方案可解锁月度分析。",
          es: "Weekly solo trae semanal. Cambia de plan para el mensual.",
          pt: "Weekly só inclui semanal. Mude o plano para o mensal.",
          fr: "Weekly n’inclut que l’hebdo. Changez de plan pour le mensuel.",
        }),
        bullets: monthlyBullets(lang),
        cta: L(lang, {
          ja: "プランを変更",
          en: "Change plan",
          ko: "플랜 변경",
          zh: "更改方案",
          es: "Cambiar plan",
          pt: "Mudar plano",
          fr: "Changer de plan",
        }),
      };
  }
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
