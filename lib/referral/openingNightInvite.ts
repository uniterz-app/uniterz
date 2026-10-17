/**
 * 開幕戦を予想した直後に 1 回だけ出す「友達を招待」モーダル。Web / Native 共有。
 * 既読は端末ローカルに uid × シーズン単位。
 * 共有先はアプリのダウンロード URL（`/get`）。招待コードはアプリの登録画面で手入力してもらう。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { NBA_OPENING_NIGHT_DATE_KEY } from "@/lib/games/nbaOpeningNightPreviewGames";
import { toDateKeyInTimeZone } from "@/lib/time/zonedTime";
import {
  REFERRAL_INVITEE_UNITS,
  REFERRAL_REFERRER_UNITS_PER_COMPLETED,
} from "@/lib/referral/referralRewards";
import {
  REFERRAL_PRESEASON_REFERRER_UNITS,
  isReferralPreseasonOpen,
} from "@/lib/referral/referralPreseasonBonus";

export function openingNightInviteStorageKey(uid: string): string {
  return `uniterz:openingNightInviteSeen:v1:${CURRENT_NBA_SEASON_KEY}:${uid}`;
}

/** NBA レギュラー開幕夜（JST 暦日）の試合か */
export function isNbaOpeningNightGame(game: {
  league?: unknown;
  seasonPhase?: unknown;
  startAtMs: number | null;
}): boolean {
  if (String(game.league ?? "").toLowerCase() !== "nba") return false;
  if (String(game.seasonPhase ?? "") === "preseason") return false;
  if (game.startAtMs == null || !Number.isFinite(game.startAtMs)) return false;
  return (
    toDateKeyInTimeZone(new Date(game.startAtMs), "Asia/Tokyo") ===
    NBA_OPENING_NIGHT_DATE_KEY
  );
}

export function openingNightInviteCopy(
  language: string | null | undefined,
  nowMs: number = Date.now()
) {
  const lang = resolveLocalizedLang(language);
  const invitee = REFERRAL_INVITEE_UNITS;
  const referrer = REFERRAL_REFERRER_UNITS_PER_COMPLETED;
  const pre = REFERRAL_PRESEASON_REFERRER_UNITS;
  const preseasonOpen = isReferralPreseasonOpen(nowMs);
  return {
    eyebrow: "OPENING NIGHT",
    title: L(lang, {
      ja: "友達を招待して、\n今季の NBA をもっと楽しもう",
      en: "Invite friends and make this NBA season more fun",
      ko: "친구를 초대해 이번 NBA 시즌을 더 즐기세요",
      zh: "邀请朋友，\n让本赛季 NBA 更好玩",
      es: "Invita a tus amigos y disfruta más esta temporada NBA",
      pt: "Convide amigos e curta mais esta temporada da NBA",
      fr: "Invitez vos amis pour profiter encore plus de cette saison NBA",
    }),
    body: L(lang, {
      ja: `予想を見比べたり、ランキングで競い合ったり。招待した友達が 7 日分予想すると、友達に ${invitee} Unit、あなたに ${referrer} Unit。`,
      en: `Compare picks and battle on the rankings. When a friend you invite predicts on 7 days, they get ${invitee} Units and you get ${referrer}.`,
      ko: `예측을 비교하고 랭킹에서 겨뤄보세요. 초대한 친구가 7일간 예측하면 친구에게 ${invitee} Unit, 나에게 ${referrer} Unit.`,
      zh: `一起对比预测、在排行榜上较量。被邀请的朋友预测满 7 天后，朋友得 ${invitee} Unit，你得 ${referrer} Unit。`,
      es: `Comparen picks y compitan en el ranking. Cuando un amigo invitado predice 7 días, él gana ${invitee} Units y tú ${referrer}.`,
      pt: `Comparem palpites e disputem o ranking. Quando um amigo convidado palpitar em 7 dias, ele ganha ${invitee} Units e você ${referrer}.`,
      fr: `Comparez vos pronostics et affrontez-vous au classement. Quand un ami invité pronostique 7 jours, il gagne ${invitee} Units et vous ${referrer}.`,
    }),
    preseasonExtra: preseasonOpen
      ? L(lang, {
          ja: `さらに開幕戦のティップオフまでに友達がシーズン予想を出すと、2 人に +${pre} Unit ずつ。`,
          en: `Plus, if they submit season picks before opening tip-off, you both get +${pre} Units.`,
          ko: `또한 개막전 팁오프 전까지 친구가 시즌 예측을 내면 두 사람 모두 +${pre} Unit.`,
          zh: `另外，朋友在开幕战跳球前提交赛季预测，你们各得 +${pre} Unit。`,
          es: `Además, si envía sus picks de temporada antes del salto inicial, ambos ganan +${pre} Units.`,
          pt: `E se ele enviar os palpites da temporada antes do tip-off, vocês dois ganham +${pre} Units.`,
          fr: `Et s’il envoie ses pronostics de saison avant le tip-off, vous gagnez chacun +${pre} Units.`,
        })
      : null,
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
        ja: `今季の NBA、Uniterz で一緒に予想しよう！アプリの登録時に招待コード「${code}」を入力してね。\n${url}`,
        en: `Let's predict this NBA season together on Uniterz! Enter my invite code "${code}" when you sign up in the app.\n${url}`,
        ko: `이번 NBA 시즌, Uniterz에서 같이 예측하자! 앱 가입할 때 초대 코드 "${code}"를 입력해 줘.\n${url}`,
        zh: `本赛季 NBA，一起在 Uniterz 预测吧！在 App 注册时输入邀请码「${code}」。\n${url}`,
        es: `¡Predigamos juntos esta temporada NBA en Uniterz! Ingresa mi código "${code}" al registrarte en la app.\n${url}`,
        pt: `Vamos palpitar juntos nesta temporada da NBA no Uniterz! Use meu código "${code}" ao se cadastrar no app.\n${url}`,
        fr: `Pronostiquons ensemble cette saison NBA sur Uniterz ! Entre mon code "${code}" à l’inscription dans l’app.\n${url}`,
      }),
  };
}
