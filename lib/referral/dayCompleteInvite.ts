/**
 * その日の予想を初めて全部終えたときに 1 回だけ出す「友達を招待」モーダル（Native）。
 * 既読は端末ローカルに uid 単位。
 * 共有先はアプリのダウンロード URL（`/get`）。招待コードはアプリの登録画面で手入力してもらう。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import {
  REFERRAL_INVITEE_UNITS,
  REFERRAL_REFERRER_UNITS_PER_COMPLETED,
} from "@/lib/referral/referralRewards";

export function dayCompleteInviteStorageKey(uid: string): string {
  return `uniterz:dayCompleteInviteSeen:v1:${uid}`;
}

export function dayCompleteInviteCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  const invitee = REFERRAL_INVITEE_UNITS;
  const referrer = REFERRAL_REFERRER_UNITS_PER_COMPLETED;
  return {
    eyebrow: "ALL PICKS IN",
    title: L(lang, {
      ja: "友達を誘って、\n予想で競おう",
      en: "Invite friends and compete on your picks",
      ko: "친구를 초대해\n예측으로 겨뤄보세요",
      zh: "邀请朋友，\n一起比拼预测",
      es: "Invita a tus amigos y compitan con sus picks",
      pt: "Convide amigos e disputem nos palpites",
      fr: "Invitez vos amis et affrontez-vous sur vos pronostics",
    }),
    body: L(lang, {
      ja: `今日の予想はすべて完了。予想を見比べたり、ランキングで競い合ったり。招待した友達が 7 日分予想すると、友達に ${invitee} Unit、あなたに ${referrer} Unit。`,
      en: `All of today's picks are in. Compare picks and battle on the rankings. When a friend you invite predicts on 7 days, they get ${invitee} Units and you get ${referrer}.`,
      ko: `오늘의 예측을 모두 마쳤어요. 예측을 비교하고 랭킹에서 겨뤄보세요. 초대한 친구가 7일간 예측하면 친구에게 ${invitee} Unit, 나에게 ${referrer} Unit.`,
      zh: `今天的预测已全部完成。一起对比预测、在排行榜上较量。被邀请的朋友预测满 7 天后，朋友得 ${invitee} Unit，你得 ${referrer} Unit。`,
      es: `Ya tienes todos los picks de hoy. Comparen picks y compitan en el ranking. Cuando un amigo invitado predice 7 días, él gana ${invitee} Units y tú ${referrer}.`,
      pt: `Todos os palpites de hoje estão feitos. Comparem palpites e disputem o ranking. Quando um amigo convidado palpitar em 7 dias, ele ganha ${invitee} Units e você ${referrer}.`,
      fr: `Tous vos pronostics du jour sont faits. Comparez-les et affrontez-vous au classement. Quand un ami invité pronostique 7 jours, il gagne ${invitee} Units et vous ${referrer}.`,
    }),
    invite: L(lang, {
      ja: "招待を送る",
      en: "Send invite",
      ko: "초대 보내기",
      zh: "发送邀请",
      es: "Enviar invitación",
      pt: "Enviar convite",
      fr: "Envoyer l’invitation",
    }),
    later: L(lang, {
      ja: "あとで",
      en: "Later",
      ko: "나중에",
      zh: "稍后",
      es: "Más tarde",
      pt: "Depois",
      fr: "Plus tard",
    }),
    shareMessage: (code: string, url: string) =>
      L(lang, {
        ja: `Uniterz で一緒に NBA を予想して競おう！アプリの登録時に招待コード「${code}」を入力してね。\n${url}`,
        en: `Let's predict the NBA and compete on Uniterz! Enter my invite code "${code}" when you sign up in the app.\n${url}`,
        ko: `Uniterz에서 같이 NBA를 예측하고 겨뤄보자! 앱 가입할 때 초대 코드 "${code}"를 입력해 줘.\n${url}`,
        zh: `一起在 Uniterz 预测 NBA、比拼一下吧！在 App 注册时输入邀请码「${code}」。\n${url}`,
        es: `¡Predigamos la NBA y compitamos en Uniterz! Ingresa mi código "${code}" al registrarte en la app.\n${url}`,
        pt: `Vamos palpitar a NBA e disputar no Uniterz! Use meu código "${code}" ao se cadastrar no app.\n${url}`,
        fr: `Pronostiquons la NBA et affrontons-nous sur Uniterz ! Entre mon code "${code}" à l’inscription dans l’app.\n${url}`,
      }),
  };
}
