import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";
import type { PushNotificationType } from "./pushPayloadTypes";
import {
  formatPushMatchupLabel,
  resolvePushTeamId,
  type PushMatchupInput,
} from "./pushMatchupLabel";

export type PushLanguage = LocalizedLang;

export type GameMatchupCopyInput = Partial<PushMatchupInput> & {
  /** 欠場 detail・Unit detail など（選手名/状態/Unit は英語固定のまま渡す） */
  detail?: string;
  /** 予想締切まとめ — 未予想件数（2以上でまとめ文言） */
  pendingCount?: number;
};

export function buildPushNotificationCopy(
  type: PushNotificationType,
  language: LocalizedLang | string,
  input?: GameMatchupCopyInput
): { title: string; body: string; subtitle?: string } {
  const lang = resolveLocalizedLang(language);
  const hasMatchup =
    typeof input?.homeLabel === "string" && typeof input?.awayLabel === "string";
  const matchup = hasMatchup
    ? formatPushMatchupLabel(
        {
          homeLabel: input.homeLabel!,
          awayLabel: input.awayLabel!,
          homeTeamId: input.homeTeamId,
          awayTeamId: input.awayTeamId,
          homeScore: input.homeScore,
          awayScore: input.awayScore,
        },
        lang
      )
    : "";
  const detail = input?.detail?.trim() || "";
  const pendingCount =
    typeof input?.pendingCount === "number" && input.pendingCount > 0
      ? Math.floor(input.pendingCount)
      : matchup
        ? 1
        : 0;

  switch (type) {
    case "game_final":
      return {
        title: L(lang, {
          ja: "予想した試合の結果が確定しました",
          en: "A match you predicted is final",
          ko: "예측한 경기 결과가 확정되었습니다",
          zh: "你预测的比赛结果已确定",
          es: "Un partido que tipaste ya es final",
          pt: "Uma partida que você palpitou está final",
          fr: "Un match que vous avez tippé est terminé",
        }),
        body:
          matchup ||
          L(lang, {
            ja: "アプリで結果を確認できます",
            en: "Check the result in the app",
            ko: "앱에서 결과를 확인할 수 있습니다",
            zh: "可在应用中查看结果",
            es: "Consulta el resultado en la app",
            pt: "Veja o resultado no app",
            fr: "Consultez le résultat dans l’app",
          }),
      };

    case "injury_status":
      return {
        title: L(lang, {
          ja: "出場ステータスが更新されました",
          en: "Availability updated",
          ko: "출전 상태가 업데이트되었습니다",
          zh: "出场状态已更新",
          es: "Disponibilidad actualizada",
          pt: "Disponibilidade atualizada",
          fr: "Disponibilité mise à jour",
        }),
        body:
          detail ||
          L(lang, {
            ja: "平均出場の多い選手の状態が変わりました",
            en: "A high-minute player's status changed",
            ko: "평균 출전 시간이 많은 선수의 상태가 바뀌었습니다",
            zh: "高出场时间球员的状态已变化",
            es: "Cambió el estado de un jugador de muchos minutos",
            pt: "O status de um jogador de muitos minutos mudou",
            fr: "Le statut d’un joueur à fort temps de jeu a changé",
          }),
      };

    case "prediction_deadline":
      if (pendingCount >= 2) {
        const lead = matchup || "—";
        return {
          title: L(lang, {
            ja: "未予想の試合があります",
            en: "You have unpredicted matches",
            ko: "미예측 경기가 있습니다",
            zh: "还有未预测的比赛",
            es: "Tienes partidos sin tip",
            pt: "Você tem partidas sem tip",
            fr: "Vous avez des matchs non tippés",
          }),
          body: L(lang, {
            ja: `あと ${pendingCount} 試合（${lead} ほか）`,
            en: `${pendingCount} matches left (${lead} + more)`,
            ko: `앞으로 ${pendingCount}경기（${lead} 외）`,
            zh: `还有 ${pendingCount} 场（${lead} 等）`,
            es: `Quedan ${pendingCount} partidos (${lead} y más)`,
            pt: `Faltam ${pendingCount} partidas (${lead} e mais)`,
            fr: `Encore ${pendingCount} matchs (${lead} et plus)`,
          }),
        };
      }
      return {
        title: L(lang, {
          ja: "予想締切が近づいています",
          en: "Prediction deadline soon",
          ko: "예측 마감이 다가옵니다",
          zh: "预测截止临近",
          es: "El plazo de tip se acerca",
          pt: "O prazo do tip está perto",
          fr: "La deadline de tip approche",
        }),
        body:
          matchup ||
          L(lang, {
            ja: "まだ予想していない試合があります",
            en: "You still have an unpredicted match",
            ko: "아직 예측하지 않은 경기가 있습니다",
            zh: "你还有未预测的比赛",
            es: "Aún tienes un partido sin tip",
            pt: "Você ainda tem uma partida sem tip",
            fr: "Il vous reste un match non tippé",
          }),
      };

    case "pro_insight_update":
      return {
        title: L(lang, {
          ja: "PRO INSIGHT が更新されました",
          en: "PRO INSIGHT updated",
          ko: "PRO INSIGHT가 업데이트되었습니다",
          zh: "PRO INSIGHT 已更新",
          es: "PRO INSIGHT actualizado",
          pt: "PRO INSIGHT atualizado",
          fr: "PRO INSIGHT mis à jour",
        }),
        body: matchup
          ? L(lang, {
              ja: `${matchup} — 重要読みが変わりました`,
              en: `${matchup} — key takes changed`,
              ko: `${matchup} — 중요 해석이 바뀌었습니다`,
              zh: `${matchup} — 重要解读已变化`,
              es: `${matchup} — cambiaron las lecturas clave`,
              pt: `${matchup} — leituras-chave mudaram`,
              fr: `${matchup} — lectures clés modifiées`,
            })
          : L(lang, {
              ja: "重要読みが変わりました。試合を開いて確認してください",
              en: "Key Insight takes changed. Open the match",
              ko: "중요 해석이 바뀌었습니다. 경기를 열어 확인하세요",
              zh: "重要解读已变化。请打开比赛查看",
              es: "Cambiaron las lecturas clave. Abre el partido",
              pt: "Leituras-chave mudaram. Abra a partida",
              fr: "Les lectures clés ont changé. Ouvrez le match",
            }),
      };

    case "monthly_report":
      return {
        title: L(lang, {
          ja: "月次レポートが届きました",
          en: "Monthly report is ready",
          ko: "월간 리포트가 도착했습니다",
          zh: "月度报告已送达",
          es: "Tu informe mensual está listo",
          pt: "Seu relatório mensal chegou",
          fr: "Votre rapport mensuel est prêt",
        }),
        body: L(lang, {
          ja: "今月の予想レポートを確認できます",
          en: "Your monthly prediction report is ready",
          ko: "이번 달 예측 리포트를 확인할 수 있습니다",
          zh: "可查看本月预测报告",
          es: "Ya puedes ver tu informe de tips del mes",
          pt: "Você já pode ver o relatório de tips do mês",
          fr: "Votre rapport de tips du mois est disponible",
        }),
      };

    case "weekly_report":
      return {
        title: L(lang, {
          ja: "週次レポートが届きました",
          en: "Weekly report is ready",
          ko: "주간 리포트가 도착했습니다",
          zh: "周报已送达",
          es: "Tu informe semanal está listo",
          pt: "Seu relatório semanal chegou",
          fr: "Votre rapport hebdomadaire est prêt",
        }),
        body: L(lang, {
          ja: "先週の予想レポートを確認できます",
          en: "Your weekly prediction report is ready",
          ko: "지난주 예측 리포트를 확인할 수 있습니다",
          zh: "可查看上周预测报告",
          es: "Ya puedes ver tu informe de tips de la semana",
          pt: "Você já pode ver o relatório de tips da semana",
          fr: "Votre rapport de tips de la semaine est disponible",
        }),
      };

    case "unit_reward":
      return {
        title: L(lang, {
          ja: "Unit を獲得しました",
          en: "You earned Units",
          ko: "Unit를 획득했습니다",
          zh: "已获得 Unit",
          es: "Has ganado Units",
          pt: "Você ganhou Units",
          fr: "Vous avez gagné des Units",
        }),
        body:
          detail ||
          L(lang, {
            ja: "ランキング報酬が付与されました",
            en: "Ranking rewards were added",
            ko: "랭킹 보상이 지급되었습니다",
            zh: "排名奖励已发放",
            es: "Se añadieron recompensas de ranking",
            pt: "Recompensas de ranking foram adicionadas",
            fr: "Des récompenses de classement ont été ajoutées",
          }),
      };

    // --- 外す予定（送信停止まで型互換のため残す） ---
    case "game_start":
      return {
        title: L(lang, {
          ja: "あなたの予想試合がまもなく開始します",
          en: "Your predicted match starts soon",
          ko: "예측한 경기가 곧 시작됩니다",
          zh: "你预测的比赛即将开始",
          es: "Tu partido tipado empieza pronto",
          pt: "Sua partida tipada começa em breve",
          fr: "Votre match tippé commence bientôt",
        }),
        body:
          matchup ||
          L(lang, {
            ja: "アプリで試合を確認してください",
            en: "Check the match in the app",
            ko: "앱에서 경기를 확인하세요",
            zh: "请在应用中查看比赛",
            es: "Consulta el partido en la app",
            pt: "Veja a partida no app",
            fr: "Consultez le match dans l’app",
          }),
      };
    case "ranking_updated":
      return {
        title: L(lang, {
          ja: "ランキング更新",
          en: "Rankings updated",
          ko: "랭킹 업데이트",
          zh: "排名已更新",
          es: "Ranking actualizado",
          pt: "Ranking atualizado",
          fr: "Classement mis à jour",
        }),
        body: L(lang, {
          ja: "本日の累積ランキングが更新されました",
          en: "Today's cumulative rankings have been updated",
          ko: "오늘의 누적 랭킹이 업데이트되었습니다",
          zh: "今日累计排名已更新",
          es: "Se actualizó el ranking acumulado de hoy",
          pt: "O ranking acumulado de hoje foi atualizado",
          fr: "Le classement cumulé du jour a été mis à jour",
        }),
      };
    case "starter_change":
      return {
        title: L(lang, {
          ja: "先発メンバーに変更があります",
          en: "Starting lineup changed",
          ko: "선발 라인업이 변경되었습니다",
          zh: "首发阵容有变更",
          es: "Cambio en la alineación titular",
          pt: "Mudança na escalação titular",
          fr: "Changement dans le cinq de départ",
        }),
        body:
          detail ||
          L(lang, {
            ja: "予想の確認をおすすめします",
            en: "Review your prediction",
            ko: "예측을 다시 확인하는 것을 권장합니다",
            zh: "建议复查你的预测",
            es: "Revisa tu tip",
            pt: "Revise seu tip",
            fr: "Revérifiez votre tip",
          }),
      };
    case "pregame_digest":
      return {
        title: L(lang, {
          ja: "試合前の更新がまとまっています",
          en: "Pregame updates",
          ko: "경기 전 업데이트가 있습니다",
          zh: "赛前更新汇总",
          es: "Actualizaciones prepartido",
          pt: "Atualizações pré-jogo",
          fr: "Mises à jour pré-match",
        }),
        body:
          detail ||
          (matchup
            ? L(lang, {
                ja: `${matchup} — 欠場など複数の変更`,
                en: `${matchup} — several updates`,
                ko: `${matchup} — 여러 변경`,
                zh: `${matchup} — 多项更新`,
                es: `${matchup} — varios cambios`,
                pt: `${matchup} — várias mudanças`,
                fr: `${matchup} — plusieurs changements`,
              })
            : L(lang, {
                ja: "複数の更新があります。予想を再確認してください",
                en: "Several updates. Re-check your prediction",
                ko: "여러 업데이트가 있습니다. 예측을 다시 확인하세요",
                zh: "有多项更新。请复查预测",
                es: "Hay varias actualizaciones. Revisa tu tip",
                pt: "Há várias atualizações. Revise seu tip",
                fr: "Plusieurs mises à jour. Revérifiez votre tip",
              })),
      };
  }
}

export function normalizePushLanguage(raw: unknown): PushLanguage {
  return resolveLocalizedLang(typeof raw === "string" ? raw : undefined);
}

export function resolveTeamLabel(side: unknown): string {
  if (typeof side === "string") return side.trim();
  if (side && typeof side === "object") {
    const name = (side as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return name.trim();
    const teamId = (side as { teamId?: unknown }).teamId;
    if (typeof teamId === "string" && teamId.trim()) return teamId.trim();
  }
  return "?";
}

export function resolveGameMatchupCopy(
  gameData: Record<string, unknown> | undefined,
  scores?: { home: number; away: number }
): GameMatchupCopyInput {
  return {
    homeLabel: resolveTeamLabel(gameData?.home),
    awayLabel: resolveTeamLabel(gameData?.away),
    homeTeamId: resolvePushTeamId(gameData?.home),
    awayTeamId: resolvePushTeamId(gameData?.away),
    homeScore: scores?.home,
    awayScore: scores?.away,
  };
}
