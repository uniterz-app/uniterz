/** トレード Buzz を初めて開いたときの説明。 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function tradeBuzzIntroCopy(language: string | null | undefined): {
  eyebrow: string;
  title: string;
  buzzLabel: string;
  buzzBody: string;
  confirmedLabel: string;
  confirmedBody: string;
  filterBody: string;
  adNote: string;
  cta: string;
} {
  const lang = resolveLocalizedLang(language);
  return {
    eyebrow: "BUZZ",
    title: L(lang, {
      ja: "トレードの動きを見る画面",
      en: "Where trades show up",
      zh: "查看交易动态",
      ko: "트레이드 동향을 보는 화면",
      es: "Dónde aparecen los traspasos",
      de: "Hier siehst du Trades",
      fr: "Où voir les transferts",
      ar: "شاشة حركة الصفقات",
      pt: "Onde os trades aparecem",
    }),
    buzzLabel: "Buzz",
    buzzBody: L(lang, {
      ja: "いま出ているトレードの噂。まだ決まっていない話も含む。",
      en: "Trade rumors in play. Not official until they land.",
      zh: "正在流传的交易传闻。尚未敲定。",
      ko: "지금 나오는 트레이드 소문. 확정은 아님.",
      es: "Rumores de traspaso. Aún no son oficiales.",
      de: "Gerüchte. Noch nicht offiziell.",
      fr: "Rumeurs de transfert. Pas encore officiel.",
      ar: "شائعات صفقات. ليست رسمية بعد.",
      pt: "Rumores de trade. Ainda não oficiais.",
    }),
    confirmedLabel: L(lang, {
      ja: "確定",
      en: "Done",
      zh: "已敲定",
      ko: "확정",
      es: "Hecho",
      de: "Fix",
      fr: "Confirmé",
      ar: "مؤكد",
      pt: "Feito",
    }),
    confirmedBody: L(lang, {
      ja: "成立したトレード。噂ではない。",
      en: "Trades that already went through.",
      zh: "已经完成的交易。不是传闻。",
      ko: "성사된 트레이드. 소문이 아님.",
      es: "Traspasos ya cerrados.",
      de: "Bereits abgeschlossene Trades.",
      fr: "Transferts déjà conclus.",
      ar: "صفقات تمت بالفعل.",
      pt: "Trades já fechados.",
    }),
    filterBody: L(lang, {
      ja: "チームで絞れる。右端の黄色い点は、Buzz に更新がある印。",
      en: "Filter by team. The yellow dot on BUZZ means something new.",
      zh: "可按球队筛选。右侧 BUZZ 的黄点表示有更新。",
      ko: "팀으로 고를 수 있음. 오른쪽 BUZZ의 노란 점은 새 소식이 있다는 뜻.",
      es: "Filtra por equipo. El punto amarillo en BUZZ es una novedad.",
      de: "Nach Team filtern. Der gelbe Punkt an BUZZ heißt: neu.",
      fr: "Filtrer par équipe. Le point jaune sur BUZZ signale une MAJ.",
      ar: "صفِّ حسب الفريق. النقطة الصفراء على BUZZ تعني تحديثًا.",
      pt: "Filtre por time. O ponto amarelo no BUZZ é novidade.",
    }),
    adNote: L(lang, {
      ja: "Free は Buzz を見るときだけ短い広告。確定は広告なし。Pro はいつも広告なし。",
      en: "Free: a short ad to open Buzz. Confirmed is always free. Pro skips ads.",
      zh: "免费用户看 Buzz 需看短广告。已敲定无需广告。Pro 全程无广告。",
      ko: "Free는 Buzz를 볼 때만 짧은 광고. 확정은 광고 없음. Pro는 항상 광고 없음.",
      es: "Gratis: un anuncio corto para Buzz. Confirmados, sin anuncio. Pro, sin anuncios.",
      de: "Free: kurze Werbung nur für Buzz. Fix ist werbefrei. Pro immer ohne Werbung.",
      fr: "Gratuit : une pub courte pour Buzz. Confirmé sans pub. Pro sans pub.",
      ar: "المجاني: إعلان قصير لفتح Buzz. المؤكد بلا إعلان. Pro بلا إعلانات.",
      pt: "Free: um anúncio curto para o Buzz. Confirmados sem anúncio. Pro sem anúncios.",
    }),
    cta: L(lang, {
      ja: "見る",
      en: "Got it",
      zh: "开始看",
      ko: "보기",
      es: "Ver",
      de: "Ansehen",
      fr: "Voir",
      ar: "عرض",
      pt: "Ver",
    }),
  };
}
