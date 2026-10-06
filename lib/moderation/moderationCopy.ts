/** 通報・ブロック UI コピー（Web / Native 共用） */
import { L, type LocalizedLang } from "@/lib/i18n/localize";
import type { ModerationReportReason } from "@/lib/moderation/moderationTypes";

export type ModerationCopy = {
  moreLabel: string;
  report: string;
  block: string;
  unblock: string;
  cancel: string;
  close: string;
  reportGroup: string;
  reasonTitle: string;
  reasons: Record<ModerationReportReason, string>;
  reportDoneTitle: string;
  reportDoneBody: string;
  blockConfirmTitle: string;
  blockConfirmBody: string;
  blockDoneTitle: string;
  blockDoneBody: string;
  unblockDoneTitle: string;
  blockedBadge: string;
  failed: string;
  rateLimited: string;
};

export function moderationCopy(lang: LocalizedLang): ModerationCopy {
  return {
    moreLabel: "MORE",
    report: L(lang, {
      ja: "通報する",
      en: "Report",
      ko: "신고하기",
      zh: "举报",
      es: "Denunciar",
      pt: "Denunciar",
      fr: "Signaler",
      de: "Melden",
      ar: "إبلاغ",
    }),
    block: L(lang, {
      ja: "ブロックする",
      en: "Block",
      ko: "차단하기",
      zh: "屏蔽",
      es: "Bloquear",
      pt: "Bloquear",
      fr: "Bloquer",
      de: "Blockieren",
      ar: "حظر",
    }),
    unblock: L(lang, {
      ja: "ブロックを解除",
      en: "Unblock",
      ko: "차단 해제",
      zh: "取消屏蔽",
      es: "Desbloquear",
      pt: "Desbloquear",
      fr: "Débloquer",
      de: "Blockierung aufheben",
      ar: "إلغاء الحظر",
    }),
    cancel: L(lang, {
      ja: "キャンセル",
      en: "Cancel",
      ko: "취소",
      zh: "取消",
      es: "Cancelar",
      pt: "Cancelar",
      fr: "Annuler",
      de: "Abbrechen",
      ar: "إلغاء",
    }),
    close: L(lang, {
      ja: "閉じる",
      en: "Close",
      ko: "닫기",
      zh: "关闭",
      es: "Cerrar",
      pt: "Fechar",
      fr: "Fermer",
      de: "Schließen",
      ar: "إغلاق",
    }),
    reportGroup: L(lang, {
      ja: "このグループを通報",
      en: "Report this group",
      ko: "이 그룹 신고",
      zh: "举报此群组",
      es: "Denunciar este grupo",
      pt: "Denunciar este grupo",
      fr: "Signaler ce groupe",
      de: "Diese Gruppe melden",
      ar: "الإبلاغ عن هذه المجموعة",
    }),
    reasonTitle: L(lang, {
      ja: "通報の理由を選んでください",
      en: "Why are you reporting this?",
      ko: "신고 사유를 선택하세요",
      zh: "请选择举报原因",
      es: "¿Por qué lo denuncias?",
      pt: "Por que você está denunciando?",
      fr: "Pourquoi signalez-vous ce contenu ?",
      de: "Warum meldest du das?",
      ar: "لماذا تبلغ عن هذا؟",
    }),
    reasons: {
      inappropriate: L(lang, {
        ja: "不適切な名前・画像",
        en: "Inappropriate name or image",
        ko: "부적절한 이름 또는 이미지",
        zh: "不当的名称或图片",
        es: "Nombre o imagen inapropiados",
        pt: "Nome ou imagem inadequados",
        fr: "Nom ou image inapproprié",
        de: "Unangemessener Name oder Bild",
        ar: "اسم أو صورة غير لائقة",
      }),
      spam: L(lang, {
        ja: "スパム・なりすまし",
        en: "Spam or impersonation",
        ko: "스팸 또는 사칭",
        zh: "垃圾信息或冒充他人",
        es: "Spam o suplantación",
        pt: "Spam ou falsificação de identidade",
        fr: "Spam ou usurpation d'identité",
        de: "Spam oder Identitätsbetrug",
        ar: "رسائل مزعجة أو انتحال شخصية",
      }),
      harassment: L(lang, {
        ja: "嫌がらせ・その他",
        en: "Harassment or other",
        ko: "괴롭힘 또는 기타",
        zh: "骚扰或其他",
        es: "Acoso u otro motivo",
        pt: "Assédio ou outro motivo",
        fr: "Harcèlement ou autre",
        de: "Belästigung oder Sonstiges",
        ar: "تحرش أو سبب آخر",
      }),
    },
    reportDoneTitle: L(lang, {
      ja: "通報を受け付けました",
      en: "Report sent",
      ko: "신고가 접수되었습니다",
      zh: "举报已提交",
      es: "Denuncia enviada",
      pt: "Denúncia enviada",
      fr: "Signalement envoyé",
      de: "Meldung gesendet",
      ar: "تم إرسال البلاغ",
    }),
    reportDoneBody: L(lang, {
      ja: "運営が内容を確認し、規約違反があれば 24 時間以内に削除・利用停止などの対応を行います。",
      en: "Our team will review it and remove content or suspend the account within 24 hours if it violates our Terms.",
      ko: "운영팀이 내용을 확인하고, 약관 위반이 있으면 24시간 이내에 삭제 또는 이용 정지 등의 조치를 취합니다.",
      zh: "我们的团队将进行审核，如违反条款，将在 24 小时内删除内容或停用账号。",
      es: "Nuestro equipo lo revisará y, si incumple los Términos, eliminará el contenido o suspenderá la cuenta en un plazo de 24 horas.",
      pt: "Nossa equipe vai analisar e, se houver violação dos Termos, removerá o conteúdo ou suspenderá a conta em até 24 horas.",
      fr: "Notre équipe va l'examiner et, en cas de violation des Conditions, supprimera le contenu ou suspendra le compte sous 24 heures.",
      de: "Unser Team prüft die Meldung und entfernt bei einem Verstoß gegen die Bedingungen innerhalb von 24 Stunden den Inhalt oder sperrt das Konto.",
      ar: "سيراجع فريقنا البلاغ، وفي حال مخالفة الشروط سنحذف المحتوى أو نوقف الحساب خلال 24 ساعة.",
    }),
    blockConfirmTitle: L(lang, {
      ja: "このユーザーをブロックしますか？",
      en: "Block this user?",
      ko: "이 사용자를 차단할까요?",
      zh: "要屏蔽此用户吗？",
      es: "¿Bloquear a este usuario?",
      pt: "Bloquear este usuário?",
      fr: "Bloquer cet utilisateur ?",
      de: "Diesen Nutzer blockieren?",
      ar: "هل تريد حظر هذا المستخدم؟",
    }),
    blockConfirmBody: L(lang, {
      ja: "ブロックすると、この人はランキングやグループの順位表に表示されなくなります。プロフィールからいつでも解除できます。",
      en: "They will no longer appear in rankings or group leaderboards for you. You can unblock them from their profile anytime.",
      ko: "차단하면 이 사용자는 랭킹과 그룹 순위표에 더 이상 표시되지 않습니다. 프로필에서 언제든지 해제할 수 있습니다.",
      zh: "屏蔽后，此用户将不再出现在你的排行榜和群组排名中。你可以随时在其个人资料中取消屏蔽。",
      es: "Dejará de aparecer en tus clasificaciones y en las tablas de grupos. Puedes desbloquearlo desde su perfil cuando quieras.",
      pt: "Ele deixará de aparecer nos seus rankings e nas classificações de grupos. Você pode desbloquear pelo perfil a qualquer momento.",
      fr: "Cette personne n'apparaîtra plus dans vos classements ni dans ceux des groupes. Vous pouvez la débloquer depuis son profil à tout moment.",
      de: "Die Person wird dir in Ranglisten und Gruppentabellen nicht mehr angezeigt. Du kannst die Blockierung jederzeit im Profil aufheben.",
      ar: "لن يظهر هذا المستخدم بعد الآن في تصنيفاتك أو جداول ترتيب المجموعات. يمكنك إلغاء الحظر من ملفه الشخصي في أي وقت.",
    }),
    blockDoneTitle: L(lang, {
      ja: "ブロックしました",
      en: "User blocked",
      ko: "차단했습니다",
      zh: "已屏蔽",
      es: "Usuario bloqueado",
      pt: "Usuário bloqueado",
      fr: "Utilisateur bloqué",
      de: "Nutzer blockiert",
      ar: "تم حظر المستخدم",
    }),
    blockDoneBody: L(lang, {
      ja: "このユーザーはランキングに表示されなくなりました。",
      en: "This user will no longer appear in your rankings.",
      ko: "이 사용자는 더 이상 랭킹에 표시되지 않습니다.",
      zh: "此用户将不再出现在你的排行榜中。",
      es: "Este usuario ya no aparecerá en tus clasificaciones.",
      pt: "Este usuário não aparecerá mais nos seus rankings.",
      fr: "Cet utilisateur n'apparaîtra plus dans vos classements.",
      de: "Dieser Nutzer erscheint nicht mehr in deinen Ranglisten.",
      ar: "لن يظهر هذا المستخدم في تصنيفاتك بعد الآن.",
    }),
    unblockDoneTitle: L(lang, {
      ja: "ブロックを解除しました",
      en: "User unblocked",
      ko: "차단을 해제했습니다",
      zh: "已取消屏蔽",
      es: "Usuario desbloqueado",
      pt: "Usuário desbloqueado",
      fr: "Utilisateur débloqué",
      de: "Blockierung aufgehoben",
      ar: "تم إلغاء حظر المستخدم",
    }),
    blockedBadge: L(lang, {
      ja: "ブロック中",
      en: "Blocked",
      ko: "차단됨",
      zh: "已屏蔽",
      es: "Bloqueado",
      pt: "Bloqueado",
      fr: "Bloqué",
      de: "Blockiert",
      ar: "محظور",
    }),
    failed: L(lang, {
      ja: "送信できませんでした。時間をおいて再度お試しください。",
      en: "Couldn't send. Please try again later.",
      ko: "전송하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      zh: "发送失败，请稍后再试。",
      es: "No se pudo enviar. Inténtalo de nuevo más tarde.",
      pt: "Não foi possível enviar. Tente novamente mais tarde.",
      fr: "Échec de l'envoi. Veuillez réessayer plus tard.",
      de: "Senden fehlgeschlagen. Bitte versuche es später erneut.",
      ar: "تعذّر الإرسال. يرجى المحاولة لاحقًا.",
    }),
    rateLimited: L(lang, {
      ja: "本日の通報の上限に達しました。お問い合わせからご連絡ください。",
      en: "You've reached today's report limit. Please contact us instead.",
      ko: "오늘의 신고 한도에 도달했습니다. 문의하기를 이용해 주세요.",
      zh: "今日举报次数已达上限，请通过联系我们与我们联系。",
      es: "Has alcanzado el límite de denuncias de hoy. Contáctanos en su lugar.",
      pt: "Você atingiu o limite de denúncias de hoje. Entre em contato conosco.",
      fr: "Vous avez atteint la limite de signalements du jour. Contactez-nous plutôt.",
      de: "Du hast das heutige Meldelimit erreicht. Bitte kontaktiere uns stattdessen.",
      ar: "لقد بلغت الحد اليومي للبلاغات. يرجى التواصل معنا بدلاً من ذلك.",
    }),
  };
}
