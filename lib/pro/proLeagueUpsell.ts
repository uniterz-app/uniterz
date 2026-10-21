/**
 * 無料ユーザーがピックアップ以外の試合を予想したときの Pro 案内（Native）。
 * 友達招待モーダル（`dayCompleteInvite`）を見た人だけ。最短 14 日おき・端末ローカルに uid 単位。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export const PRO_LEAGUE_UPSELL_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

export function proLeagueUpsellStorageKey(uid: string): string {
  return `uniterz:proLeagueUpsellLastShownAt:v1:${uid}`;
}

export function isProLeagueUpsellDue(
  lastShownAtMs: number | null,
  nowMs: number = Date.now()
): boolean {
  if (lastShownAtMs == null || !Number.isFinite(lastShownAtMs)) return true;
  return nowMs - lastShownAtMs >= PRO_LEAGUE_UPSELL_COOLDOWN_MS;
}

export function proLeagueUpsellCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    eyebrow: "PRO LEAGUE",
    title: L(lang, {
      ja: "ピックアップ以外の試合でも\n競いませんか？",
      en: "Want to compete on every game?",
      ko: "픽업 외 경기로도\n겨뤄보지 않을래요?",
      zh: "想在精选以外的比赛\n也一较高下吗？",
      es: "¿Quieres competir en todos los partidos?",
      pt: "Quer disputar em todos os jogos?",
      fr: "Envie de rivaliser sur tous les matchs ?",
    }),
    body: L(lang, {
      ja: "ランキングに入るのはピックアップの試合だけです。ピックアップ以外の試合も含めて競いたいなら、全試合が対象の無差別級ランキング「PRO LEAGUE」が解放される Pro へ。",
      en: "Only PICK UP games count toward the rankings. To compete on the other games too, go Pro and unlock PRO LEAGUE, the open ranking that counts every game.",
      ko: "랭킹에 반영되는 것은 픽업 경기뿐입니다. 픽업 외 경기까지 포함해 겨루고 싶다면, 모든 경기가 대상인 무차별급 랭킹 「PRO LEAGUE」가 열리는 Pro로.",
      zh: "只有精选比赛计入排行榜。想把精选以外的比赛也算进来一较高下，就加入 Pro，解锁涵盖全部比赛的无差别级排行榜「PRO LEAGUE」。",
      es: "Solo los partidos destacados cuentan para el ranking. Para competir también en los demás, hazte Pro y desbloquea PRO LEAGUE, el ranking abierto con todos los partidos.",
      pt: "Só os jogos em destaque contam para o ranking. Para disputar também nos outros, vire Pro e desbloqueie a PRO LEAGUE, o ranking aberto com todos os jogos.",
      fr: "Seuls les matchs sélectionnés comptent au classement. Pour rivaliser aussi sur les autres, passez Pro et débloquez PRO LEAGUE, le classement ouvert à tous les matchs.",
    }),
    trial: L(lang, {
      ja: "7日間の無料お試しもあります。",
      en: "There's a 7-day free trial, too.",
      ko: "7일 무료 체험도 있어요.",
      zh: "还有 7 天免费试用。",
      es: "También hay una prueba gratis de 7 días.",
      pt: "Também tem teste grátis de 7 dias.",
      fr: "Il y a aussi un essai gratuit de 7 jours.",
    }),
    cta: L(lang, {
      ja: "Pro を見る",
      en: "See Pro",
      ko: "Pro 보기",
      zh: "查看 Pro",
      es: "Ver Pro",
      pt: "Ver Pro",
      fr: "Voir Pro",
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
  };
}
