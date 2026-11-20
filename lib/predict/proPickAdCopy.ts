/**
 * Free の PRO PICK「この試合だけ解除」の文面（広告 / 初回の無料）。
 * 広告 SDK 導入前はモック。文言は SDK 導入後もそのまま使える。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function proPickAdCopy(language: string | null | undefined): {
  /** 初回の無料解除があるとき */
  firstFreeCta: string;
  /** 広告で解除するとき */
  adCta: string;
  adModalTitle: string;
  adModalBody: string;
  adModalWait: string;
  adModalDone: string;
  adModalCancel: string;
  adUnavailable: string;
  /** 見終わったのに、まだ解除を確認できないとき */
  adPending: string;
} {
  const lang = resolveLocalizedLang(language);
  return {
    firstFreeCta: L(lang, {
      ja: "この試合の PRO PICK を無料で見る",
      en: "See this game's PRO PICK for free",
      zh: "免费查看本场 PRO PICK",
      ko: "이 경기의 PRO PICK 무료로 보기",
      es: "Ver el PRO PICK de este partido gratis",
      de: "PRO PICK dieses Spiels kostenlos ansehen",
      fr: "Voir le PRO PICK de ce match gratuitement",
      ar: "عرض PRO PICK لهذه المباراة مجانًا",
      pt: "Ver o PRO PICK deste jogo grátis",
    }),
    adCta: L(lang, {
      ja: "広告を見てこの試合の PRO PICK を見る",
      en: "Watch an ad to see this game's PRO PICK",
      zh: "观看广告以查看本场 PRO PICK",
      ko: "광고를 보고 이 경기의 PRO PICK 보기",
      es: "Mira un anuncio para ver el PRO PICK de este partido",
      de: "Werbung ansehen, um das PRO PICK dieses Spiels zu sehen",
      fr: "Regarder une pub pour voir le PRO PICK de ce match",
      ar: "شاهد إعلانًا لعرض PRO PICK لهذه المباراة",
      pt: "Assista a um anúncio para ver o PRO PICK deste jogo",
    }),
    adModalTitle: L(lang, {
      ja: "広告",
      en: "Ad",
      zh: "广告",
      ko: "광고",
      es: "Anuncio",
      de: "Werbung",
      fr: "Publicité",
      ar: "إعلان",
      pt: "Anúncio",
    }),
    adModalBody: L(lang, {
      ja: "広告が終わると、この試合の PRO PICK が開きます。",
      en: "This game's PRO PICK opens when the ad finishes.",
      zh: "广告结束后将打开本场 PRO PICK。",
      ko: "광고가 끝나면 이 경기의 PRO PICK이 열립니다.",
      es: "El PRO PICK de este partido se abre cuando termine el anuncio.",
      de: "Das PRO PICK dieses Spiels öffnet sich, wenn die Werbung endet.",
      fr: "Le PRO PICK de ce match s’ouvre à la fin de la publicité.",
      ar: "سيُفتح PRO PICK لهذه المباراة بعد انتهاء الإعلان.",
      pt: "O PRO PICK deste jogo abre quando o anúncio terminar.",
    }),
    adModalWait: L(lang, {
      ja: "しばらくお待ちください",
      en: "Please wait",
      zh: "请稍候",
      ko: "잠시만 기다려 주세요",
      es: "Espera un momento",
      de: "Bitte warten",
      fr: "Patientez",
      ar: "يرجى الانتظار",
      pt: "Aguarde",
    }),
    adModalDone: L(lang, {
      ja: "PRO PICK を開く",
      en: "Open PRO PICK",
      zh: "打开 PRO PICK",
      ko: "PRO PICK 열기",
      es: "Abrir PRO PICK",
      de: "PRO PICK öffnen",
      fr: "Ouvrir PRO PICK",
      ar: "فتح PRO PICK",
      pt: "Abrir PRO PICK",
    }),
    adModalCancel: L(lang, {
      ja: "やめる",
      en: "Cancel",
      zh: "取消",
      ko: "취소",
      es: "Cancelar",
      de: "Abbrechen",
      fr: "Annuler",
      ar: "إلغاء",
      pt: "Cancelar",
    }),
    adPending: L(lang, {
      ja: "広告の確認に少し時間がかかっています。しばらくしてから、もう一度押してください。",
      en: "The ad check is taking a moment. Please try again shortly.",
      zh: "广告确认需要一点时间，请稍后再次点击。",
      ko: "광고 확인에 시간이 조금 걸리고 있습니다. 잠시 후 다시 눌러 주세요.",
      es: "La verificación del anuncio tarda un poco. Inténtalo de nuevo en breve.",
      de: "Die Prüfung der Werbung dauert etwas. Bitte gleich noch einmal tippen.",
      fr: "La vérification de la publicité prend un peu de temps. Réessaie dans un instant.",
      ar: "التحقق من الإعلان يستغرق بعض الوقت. يرجى المحاولة مرة أخرى بعد قليل.",
      pt: "A verificação do anúncio está demorando um pouco. Tente novamente em instantes.",
    }),
    adUnavailable: L(lang, {
      ja: "広告の準備ができていません。しばらくしてからお試しください。",
      en: "Ads aren't ready yet. Please try again later.",
      zh: "广告尚未准备好，请稍后再试。",
      ko: "광고를 아직 준비하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      es: "Los anuncios aún no están disponibles. Inténtalo más tarde.",
      de: "Werbung ist noch nicht verfügbar. Bitte versuche es später erneut.",
      fr: "Les publicités ne sont pas encore disponibles. Réessaie plus tard.",
      ar: "الإعلانات غير جاهزة بعد. يرجى المحاولة لاحقًا.",
      pt: "Os anúncios ainda não estão disponíveis. Tente novamente mais tarde.",
    }),
  };
}
