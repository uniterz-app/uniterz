/**
 * 開幕前の紹介特典 — 定数と文言（Web / Native / サーバー共通）。
 * 付与は `referralPreseasonBonusServer.ts`。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS } from "@/lib/predict/seasonPredictDeadline";

export const REFERRAL_PRESEASON_REFERRER_UNITS = 20;
export const REFERRAL_PRESEASON_INVITEE_UNITS = 20;
/** 紹介者 1 人あたり特典が出る招待人数の上限 */
export const REFERRAL_PRESEASON_MAX_PER_REFERRER = 5;
export const REFERRAL_PRESEASON_DEADLINE_MS = SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS;

export function isReferralPreseasonOpen(nowMs = Date.now()): boolean {
  return nowMs < REFERRAL_PRESEASON_DEADLINE_MS;
}

/** シーズン予想を両方提出した直後の招待カード */
export function referralPreseasonInviteCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  const u = REFERRAL_PRESEASON_REFERRER_UNITS;
  const max = REFERRAL_PRESEASON_MAX_PER_REFERRER;
  return {
    eyebrow: L(lang, {
      ja: "開幕前限定",
      en: "Preseason only",
      ko: "개막 전 한정",
      zh: "开幕前限定",
      es: "Solo pretemporada",
      de: "Nur vor Saisonstart",
      fr: "Avant la saison seulement",
      ar: "قبل انطلاق الموسم فقط",
      pt: "Só na pré-temporada",
    }),
    title: L(lang, {
      ja: "友達を誘おう",
      en: "Invite your friends",
      ko: "친구를 초대하세요",
      zh: "邀请朋友吧",
      es: "Invita a tus amigos",
      de: "Lade deine Freunde ein",
      fr: "Invite tes amis",
      ar: "ادعُ أصدقاءك",
      pt: "Convide seus amigos",
    }),
    body: L(lang, {
      ja: `開幕戦までに招待した友達がシーズン予想を出したら、あなたと友達に +${u} Unit ずつ（最大 ${max} 人まで）。`,
      en: `If a friend you invite submits season picks before opening night, you both get +${u} Units (up to ${max} friends).`,
      ko: `개막전 전에 초대한 친구가 시즌 예측을 제출하면 나와 친구 모두 +${u} Unit (최대 ${max}명).`,
      zh: `开幕战前你邀请的朋友提交赛季预测后，你和朋友各得 +${u} Unit（最多 ${max} 人）。`,
      es: `Si un amigo invitado envía sus picks de temporada antes del debut, ambos ganan +${u} Units (hasta ${max} amigos).`,
      de: `Reicht ein eingeladener Freund vor Saisonstart seine Saisontipps ein, bekommt ihr beide +${u} Units (bis zu ${max} Freunde).`,
      fr: `Si un ami invité envoie ses pronostics avant l’ouverture, vous gagnez chacun +${u} Units (jusqu’à ${max} amis).`,
      ar: `إذا قدّم صديق دعوته توقعات الموسم قبل الافتتاح، يحصل كل منكما على +${u} Units (حتى ${max} أصدقاء).`,
      pt: `Se um amigo convidado enviar os palpites da temporada antes da estreia, vocês dois ganham +${u} Units (até ${max} amigos).`,
    }),
    invite: L(lang, {
      ja: "招待リンクを送る",
      en: "Send invite link",
      ko: "초대 링크 보내기",
      zh: "发送邀请链接",
      es: "Enviar invitación",
      de: "Einladung senden",
      fr: "Envoyer l’invitation",
      ar: "إرسال رابط الدعوة",
      pt: "Enviar convite",
    }),
    later: L(lang, {
      ja: "あとで",
      en: "Later",
      ko: "나중에",
      zh: "稍后",
      es: "Más tarde",
      de: "Später",
      fr: "Plus tard",
      ar: "لاحقًا",
      pt: "Depois",
    }),
    shareMessage: (code: string, url: string) =>
      L(lang, {
        ja: `Uniterz で NBA の順位とアワードを予想したよ。開幕前に招待コードで登録して予想を出すと +${u} Unit！ 招待コード: ${code}\n${url}`,
        en: `I made my NBA standings & awards picks on Uniterz. Join with my code and submit yours before opening night for +${u} Units! Code: ${code}\n${url}`,
        ko: `Uniterz에서 NBA 순위와 어워드를 예측했어. 개막 전에 초대 코드로 가입하고 예측하면 +${u} Unit! 초대 코드: ${code}\n${url}`,
        zh: `我在 Uniterz 预测了 NBA 排名和奖项。开幕前用邀请码注册并提交预测可得 +${u} Unit！邀请码：${code}\n${url}`,
        es: `Hice mis picks de clasificación y premios NBA en Uniterz. Únete con mi código y envía los tuyos antes del debut: +${u} Units. Código: ${code}\n${url}`,
        de: `Ich habe meine NBA-Tabellen- und Award-Tipps bei Uniterz abgegeben. Mit meinem Code anmelden und vor Saisonstart tippen: +${u} Units! Code: ${code}\n${url}`,
        fr: `J’ai fait mes pronostics NBA (classement et trophées) sur Uniterz. Inscris-toi avec mon code et envoie les tiens avant l’ouverture : +${u} Units ! Code : ${code}\n${url}`,
        ar: `قدّمت توقعاتي لترتيب وجوائز NBA على Uniterz. سجّل برمزي وقدّم توقعاتك قبل الافتتاح لتحصل على +${u} Units! الرمز: ${code}\n${url}`,
        pt: `Fiz meus palpites de classificação e prêmios da NBA no Uniterz. Entre com meu código e envie os seus antes da estreia: +${u} Units! Código: ${code}\n${url}`,
      }),
  };
}
