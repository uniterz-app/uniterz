/** TODAY（今日のスタッツリーダー）画面コピー — Web / Native 共用 */
import { L, type LocalizedLang } from "@/lib/i18n/localize";

export function dailyLeadersCopy(lang: LocalizedLang) {
  return {
    title: "TODAY'S LEADERS",
    noGames: L(lang, {
      ja: "今日の試合はありません",
      en: "No games today",
      ko: "오늘은 경기가 없습니다",
      zh: "今天没有比赛",
      es: "Hoy no hay partidos",
      pt: "Não há jogos hoje",
      fr: "Aucun match aujourd'hui",
      de: "Heute keine Spiele",
      ar: "لا توجد مباريات اليوم",
    }),
    notStarted: L(lang, {
      ja: "試合が始まると、ここにスタッツリーダーが表示されます",
      en: "Leaders will appear here once games tip off",
      ko: "경기가 시작되면 여기에 스탯 리더가 표시됩니다",
      zh: "比赛开始后，这里会显示数据领先者",
      es: "Los líderes aparecerán aquí cuando empiecen los partidos",
      pt: "Os líderes aparecerão aqui quando os jogos começarem",
      fr: "Les leaders s'afficheront ici dès le début des matchs",
      de: "Die Leader erscheinen hier, sobald die Spiele beginnen",
      ar: "سيظهر المتصدرون هنا عند بدء المباريات",
    }),
    loadFailed: L(lang, {
      ja: "読み込めませんでした",
      en: "Couldn't load",
      ko: "불러오지 못했습니다",
      zh: "加载失败",
      es: "No se pudo cargar",
      pt: "Não foi possível carregar",
      fr: "Chargement impossible",
      de: "Laden fehlgeschlagen",
      ar: "تعذّر التحميل",
    }),
    liveNote: L(lang, {
      ja: "試合中は1分ごとに更新されます",
      en: "Updates every minute during games",
      ko: "경기 중에는 1분마다 업데이트됩니다",
      zh: "比赛进行中每分钟更新",
      es: "Se actualiza cada minuto durante los partidos",
      pt: "Atualiza a cada minuto durante os jogos",
      fr: "Mise à jour chaque minute pendant les matchs",
      de: "Während der Spiele minütlich aktualisiert",
      ar: "يتم التحديث كل دقيقة أثناء المباريات",
    }),
    gamesLabel: (n: number) =>
      L(lang, {
        ja: `${n} 試合`,
        en: `${n} ${n === 1 ? "game" : "games"}`,
        ko: `${n}경기`,
        zh: `${n} 场比赛`,
        es: `${n} ${n === 1 ? "partido" : "partidos"}`,
        pt: `${n} ${n === 1 ? "jogo" : "jogos"}`,
        fr: `${n} ${n === 1 ? "match" : "matchs"}`,
        de: `${n} ${n === 1 ? "Spiel" : "Spiele"}`,
        ar: `${n} مباريات`,
      }),
    live: "LIVE",
    preseason: "PRESEASON",
  };
}
