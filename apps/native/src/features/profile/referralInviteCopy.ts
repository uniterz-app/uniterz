/**
 * ReferralInviteScreen 本文・ステータス（7言語）。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "../../../../../lib/i18n/localize";
import type {
  ReferralInviteProgressRow,
  ReferralInviteStatus,
} from "../../../../../lib/referral/referralRewards";

export function referralInviteScreenCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    description: L(lang, {
      ja: "友達を招待して Unit を獲得。相手が7日分の予想を出すと双方に付与されます。",
      en: "Invite friends for Units. Both earn when they predict on 7 different days.",
      ko: "친구를 초대해 Unit을 획득. 상대가 7일 예상하면 양쪽에 지급됩니다.",
      zh: "邀请好友赚 Unit。对方在 7 个不同日期预测后双方获得。",
      es: "Invita amigos por Units. Ambos ganan si predicen 7 días distintos.",
      pt: "Convide amigos por Units. Ambos ganham ao prever em 7 dias.",
      fr: "Invitez des amis pour des Units. Les deux gagnent après 7 jours de picks.",
    }),
    copyFailed: L(lang, {
      ja: "コピーに失敗しました",
      en: "Copy failed",
      ko: "복사에 실패했습니다",
      zh: "复制失败",
      es: "Error al copiar",
      pt: "Falha ao copiar",
      fr: "Échec de la copie",
    }),
    codeCopied: L(lang, {
      ja: "コードをコピーしました",
      en: "Code copied",
      ko: "코드를 복사했습니다",
      zh: "已复制代码",
      es: "Código copiado",
      pt: "Código copiado",
      fr: "Code copié",
    }),
    linkCopied: L(lang, {
      ja: "リンクをコピーしました",
      en: "Link copied",
      ko: "링크를 복사했습니다",
      zh: "已复制链接",
      es: "Enlace copiado",
      pt: "Link copiado",
      fr: "Lien copié",
    }),
    shareMessage: (code: string, url: string) =>
      L(lang, {
        ja: `Uniterz でスポーツ予想しよう。招待コード: ${code}\n${url}`,
        en: `Join me on Uniterz. Invite code: ${code}\n${url}`,
        ko: `Uniterz에서 스포츠 예상을 해요. 초대 코드: ${code}\n${url}`,
        zh: `来 Uniterz 一起预测。邀请码：${code}\n${url}`,
        es: `Únete a Uniterz. Código: ${code}\n${url}`,
        pt: `Entre no Uniterz. Código: ${code}\n${url}`,
        fr: `Rejoins-moi sur Uniterz. Code : ${code}\n${url}`,
      }),
    you: L(lang, {
      ja: "あなた",
      en: "You",
      ko: "나",
      zh: "你",
      es: "Tú",
      pt: "Você",
      fr: "Vous",
    }),
    perClear: L(lang, {
      ja: "1人達成ごと",
      en: "per clear",
      ko: "1명 달성마다",
      zh: "每达成一人",
      es: "por logro",
      pt: "por conclusão",
      fr: "par validation",
    }),
    friend: L(lang, {
      ja: "友達",
      en: "Friend",
      ko: "친구",
      zh: "好友",
      es: "Amigo",
      pt: "Amigo",
      fr: "Ami",
    }),
    once: L(lang, {
      ja: "1回のみ",
      en: "once",
      ko: "1회만",
      zh: "仅一次",
      es: "una vez",
      pt: "uma vez",
      fr: "une fois",
    }),
    bonus: L(lang, {
      ja: "区切り",
      en: "Bonus",
      ko: "보너스",
      zh: "里程碑",
      es: "Bonus",
      pt: "Bônus",
      fr: "Bonus",
    }),
    cap: L(lang, {
      ja: "上限",
      en: "Cap",
      ko: "상한",
      zh: "上限",
      es: "Tope",
      pt: "Teto",
      fr: "Plafond",
    }),
    grantNote: L(lang, {
      ja: "付与は、友達が異なる7日に有効予想を投稿したあと。登録だけでは付きません。",
      en: "Granted after the invitee posts on 7 different days. Signup alone does not count.",
      ko: "친구가 서로 다른 7일에 유효 예상을 올린 뒤 지급. 가입만으로는 안 됩니다.",
      zh: "好友在 7 个不同日期发布有效预测后发放。仅注册不算。",
      es: "Se otorga tras 7 días distintos de picks. Solo registrarse no cuenta.",
      pt: "Concedido após 7 dias distintos de picks. Só cadastro não conta.",
      fr: "Attribué après 7 jours distincts de picks. L’inscription seule ne compte pas.",
    }),
    active: L(lang, {
      ja: "進行中",
      en: "Active",
      ko: "진행 중",
      zh: "进行中",
      es: "Activo",
      pt: "Ativo",
      fr: "En cours",
    }),
    review: L(lang, {
      ja: "確認中",
      en: "Review",
      ko: "확인 중",
      zh: "审核中",
      es: "Revisión",
      pt: "Revisão",
      fr: "Revue",
    }),
    completedDone: L(lang, {
      ja: "条件達成・付与済",
      en: "Completed",
      ko: "조건 달성·지급 완료",
      zh: "条件达成·已发放",
      es: "Completado",
      pt: "Concluído",
      fr: "Terminé",
    }),
    progressDays: (days: number, left: number) =>
      L(lang, {
        ja: `予想投稿日数：${days}／7日 / あと${left}日間の予想投稿で条件達成`,
        en: `Predict days: ${days}/7 · ${left} more day(s) to qualify`,
        ko: `예상 투고 일수: ${days}/7 · ${left}일 더 하면 조건 달성`,
        zh: `预测天数：${days}/7 · 再 ${left} 天即可达标`,
        es: `Días de pick: ${days}/7 · faltan ${left} día(s)`,
        pt: `Dias de pick: ${days}/7 · faltam ${left} dia(s)`,
        fr: `Jours de pick : ${days}/7 · encore ${left} jour(s)`,
      }),
  };
}

export function referralInviteStatusLabel(
  status: ReferralInviteStatus,
  lang: LocalizedLang
): string {
  switch (status) {
    case "completed":
      return L(lang, {
        ja: "達成",
        en: "Done",
        ko: "달성",
        zh: "达成",
        es: "Hecho",
        pt: "Feito",
        fr: "Fait",
      });
    case "in_progress":
      return L(lang, {
        ja: "進行中",
        en: "In progress",
        ko: "진행 중",
        zh: "进行中",
        es: "En curso",
        pt: "Em andamento",
        fr: "En cours",
      });
    case "under_review":
      return L(lang, {
        ja: "確認中",
        en: "Review",
        ko: "확인 중",
        zh: "审核中",
        es: "Revisión",
        pt: "Revisão",
        fr: "Revue",
      });
    case "registered":
      return L(lang, {
        ja: "登録済",
        en: "Registered",
        ko: "등록됨",
        zh: "已注册",
        es: "Registrado",
        pt: "Registrado",
        fr: "Inscrit",
      });
    case "invalid":
      return L(lang, {
        ja: "無効",
        en: "Invalid",
        ko: "무효",
        zh: "无效",
        es: "Inválido",
        pt: "Inválido",
        fr: "Invalide",
      });
    case "fraud_rejected":
      return L(lang, {
        ja: "対象外",
        en: "Rejected",
        ko: "대상 외",
        zh: "不符合",
        es: "Rechazado",
        pt: "Rejeitado",
        fr: "Rejeté",
      });
    case "withdrawn":
      return L(lang, {
        ja: "退会",
        en: "Left",
        ko: "탈퇴",
        zh: "已退出",
        es: "Salido",
        pt: "Saiu",
        fr: "Parti",
      });
    default:
      return status;
  }
}

export function referralInviteProgressHint(
  row: ReferralInviteProgressRow,
  language: string | null | undefined
): string {
  const copy = referralInviteScreenCopy(language);
  if (row.status === "completed") return copy.completedDone;
  if (row.status === "in_progress" || row.status === "registered") {
    const left = Math.max(0, 7 - row.activePredictDays);
    return copy.progressDays(row.activePredictDays, left);
  }
  return referralInviteStatusLabel(row.status, copy.lang);
}

export function profileMarkToastCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    waitLoad: L(lang, {
      ja: "プロフィールの読み込みを待ってから、もう一度押してください",
      en: "Wait for the profile to load, then try again",
      ko: "프로필 로딩 후 다시 눌러 주세요",
      zh: "请等待资料加载后再试",
      es: "Espera a que cargue el perfil e inténtalo de nuevo",
      pt: "Aguarde o perfil carregar e tente de novo",
      fr: "Attendez le chargement du profil, puis réessayez",
    }),
    unmarkFailed: L(lang, {
      ja: "マークを外せませんでした",
      en: "Could not unmark",
      ko: "마크를 해제하지 못했습니다",
      zh: "无法取消标记",
      es: "No se pudo quitar la marca",
      pt: "Não foi possível desmarcar",
      fr: "Impossible de retirer la marque",
    }),
    capPro: (max: number) =>
      L(lang, {
        ja: `マークは ${max} 人までです`,
        en: `You can MARK up to ${max} predictors`,
        ko: `마크는 ${max}명까지입니다`,
        zh: `最多可标记 ${max} 人`,
        es: `Puedes MARCAR hasta ${max} predictores`,
        pt: `Você pode MARCAR até ${max} previsores`,
        fr: `Vous pouvez MARQUER jusqu’à ${max} prédicteurs`,
      }),
    capFree: (max: number) =>
      L(lang, {
        ja: `マークは ${max} 人までです（Pro は 50 人）`,
        en: `You can MARK up to ${max} predictors (Pro: 50)`,
        ko: `마크는 ${max}명까지입니다（Pro는 50명）`,
        zh: `最多可标记 ${max} 人（Pro：50）`,
        es: `Puedes MARCAR hasta ${max} (Pro: 50)`,
        pt: `Você pode MARCAR até ${max} (Pro: 50)`,
        fr: `Vous pouvez MARQUER jusqu’à ${max} (Pro : 50)`,
      }),
    markFailed: L(lang, {
      ja: "マークできませんでした",
      en: "Could not MARK this predictor",
      ko: "마크하지 못했습니다",
      zh: "无法标记该预测者",
      es: "No se pudo MARCAR a este predictor",
      pt: "Não foi possível MARCAR este previsor",
      fr: "Impossible de MARQUER ce prédicteur",
    }),
    markedTitle: L(lang, {
      ja: "マークしました",
      en: "MARKED",
      ko: "마크했습니다",
      zh: "已标记",
      es: "MARCADO",
      pt: "MARCADO",
      fr: "MARQUÉ",
    }),
    markedBody: (name: string) =>
      L(lang, {
        ja: `${name} をマークリストに追加しました`,
        en: `${name} was added to your MARK list`,
        ko: `${name}을(를) 마크 목록에 추가했습니다`,
        zh: `已将 ${name} 加入标记列表`,
        es: `${name} se añadió a tu lista MARK`,
        pt: `${name} foi adicionado à sua lista MARK`,
        fr: `${name} a été ajouté à votre liste MARK`,
      }),
    viewList: L(lang, {
      ja: "リストを見る",
      en: "View list",
      ko: "목록 보기",
      zh: "查看列表",
      es: "Ver lista",
      pt: "Ver lista",
      fr: "Voir la liste",
    }),
  };
}
