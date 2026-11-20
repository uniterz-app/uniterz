/**
 * Free の PRO PICK「この試合だけ解除」の文面（広告 / 初回の無料）。
 * 広告 SDK 導入前はモック。文言は SDK 導入後もそのまま使える。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function proPickAdCopy(language: string | null | undefined): {
  /** 初回の無料解除があるとき */
  firstFreeCta: string;
  /** 予想フォーム上の短い知らせ */
  firstFreeNoticeTitle: string;
  firstFreeNoticeBody: string;
  firstFreeNoticeCta: string;
  firstFreeModalTitle: string;
  firstFreeModalBody: string;
  firstFreeModalSee: string;
  firstFreeModalLater: string;
  /** PRO PICK タブ上の短い印 */
  firstFreeTabMark: string;
  /** ゲート CTA の上の一行 */
  firstFreeHint: string;
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
    firstFreeNoticeTitle: L(lang, {
      ja: "初回の PRO PICK は無料",
      en: "Your first PRO PICK is free",
      zh: "首次 PRO PICK 免费",
      ko: "첫 PRO PICK은 무료",
      es: "Tu primer PRO PICK es gratis",
      de: "Dein erstes PRO PICK ist kostenlos",
      fr: "Ton premier PRO PICK est gratuit",
      ar: "أول PRO PICK مجاني",
      pt: "Seu primeiro PRO PICK é grátis",
    }),
    firstFreeNoticeBody: L(lang, {
      ja: "最初の1試合は広告なしで、勝つ確率・予想スコア・得点王の候補を見られます。",
      en: "The first game is ad-free: win probability, projected score, and top-scorer candidates.",
      zh: "第一场无需广告，可查看胜率、预计比分和得分王候选。",
      ko: "첫 경기는 광고 없이 승리 확률·예상 점수·득점왕 후보를 볼 수 있습니다.",
      es: "El primer partido es sin anuncio: probabilidad, marcador proyectado y máximos anotadores.",
      de: "Das erste Spiel ist werbefrei: Siegchance, Score-Tipp und Top-Scorer.",
      fr: "Le premier match est sans pub : proba, score projeté et meilleurs marqueurs.",
      ar: "المباراة الأولى بلا إعلان: احتمال الفوز والنتيجة المتوقعة ومرشحو التهديف.",
      pt: "O primeiro jogo é sem anúncio: probabilidade, placar projetado e cestinha.",
    }),
    firstFreeNoticeCta: L(lang, {
      ja: "無料で見る",
      en: "See it free",
      zh: "免费查看",
      ko: "무료로 보기",
      es: "Ver gratis",
      de: "Kostenlos ansehen",
      fr: "Voir gratuitement",
      ar: "عرض مجانًا",
      pt: "Ver grátis",
    }),
    firstFreeModalTitle: L(lang, {
      ja: "初回の PRO PICK は無料です",
      en: "Your first PRO PICK is free",
      zh: "首次 PRO PICK 免费",
      ko: "첫 PRO PICK은 무료입니다",
      es: "Tu primer PRO PICK es gratis",
      de: "Dein erstes PRO PICK ist kostenlos",
      fr: "Ton premier PRO PICK est gratuit",
      ar: "أول PRO PICK مجاني",
      pt: "Seu primeiro PRO PICK é grátis",
    }),
    firstFreeModalBody: L(lang, {
      ja: "最初の1試合は広告なしで開けます。2試合目からは短い広告のあとです。PRO PICK タブから見られます。",
      en: "The first game opens with no ad. From the second game, a short ad is required. Open it from the PRO PICK tab.",
      zh: "第一场无需广告。从第二场起需观看短广告。可在 PRO PICK 标签打开。",
      ko: "첫 경기는 광고 없이 열립니다. 두 번째부터는 짧은 광고 후입니다. PRO PICK 탭에서 볼 수 있습니다.",
      es: "El primer partido se abre sin anuncio. Desde el segundo, un anuncio corto. Ábrelo en la pestaña PRO PICK.",
      de: "Das erste Spiel öffnet ohne Werbung. Ab dem zweiten Spiel kommt ein kurzer Spot. Öffne es im Tab PRO PICK.",
      fr: "Le premier match s’ouvre sans pub. À partir du 2e, une pub courte. Ouvre-le dans l’onglet PRO PICK.",
      ar: "المباراة الأولى تُفتح بلا إعلان. من الثانية يلزم إعلان قصير. افتحه من تبويب PRO PICK.",
      pt: "O primeiro jogo abre sem anúncio. Do segundo em diante, um anúncio curto. Abra na aba PRO PICK.",
    }),
    firstFreeModalSee: L(lang, {
      ja: "この試合を見る",
      en: "See this game",
      zh: "查看本场",
      ko: "이 경기 보기",
      es: "Ver este partido",
      de: "Dieses Spiel ansehen",
      fr: "Voir ce match",
      ar: "عرض هذه المباراة",
      pt: "Ver este jogo",
    }),
    firstFreeModalLater: L(lang, {
      ja: "あとで",
      en: "Later",
      zh: "稍后再说",
      ko: "나중에",
      es: "Más tarde",
      de: "Später",
      fr: "Plus tard",
      ar: "لاحقًا",
      pt: "Depois",
    }),
    firstFreeTabMark: L(lang, {
      ja: "無料",
      en: "FREE",
      zh: "免费",
      ko: "무료",
      es: "GRATIS",
      de: "FREE",
      fr: "GRATUIT",
      ar: "مجاني",
      pt: "GRÁTIS",
    }),
    firstFreeHint: L(lang, {
      ja: "今だけ 1 試合無料",
      en: "One game free — this time only",
      zh: "限时一场免费",
      ko: "지금만 1경기 무료",
      es: "Un partido gratis, solo ahora",
      de: "Nur jetzt: ein Spiel kostenlos",
      fr: "Un match gratuit, cette fois seulement",
      ar: "مباراة واحدة مجانًا هذه المرة",
      pt: "Um jogo grátis, só agora",
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
