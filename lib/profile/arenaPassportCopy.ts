import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function arenaPassportCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    title: "ARENA PASSPORT",
    tabCareer: "CAREER",
    tabPassport: "PASSPORT",
    switchAria: L(lang, {
      ja: "CAREER / PASSPORT を切り替え",
      en: "Switch Career / Passport",
      ko: "CAREER / PASSPORT 전환",
      zh: "切换 CAREER / PASSPORT",
    }),
    editHint: L(lang, {
      ja: "行ったアリーナをタップしてカラーに",
      en: "Tap the arenas you've visited",
      ko: "방문한 아레나를 탭하세요",
      zh: "点按你去过的球馆",
      es: "Toca los estadios que visitaste",
      pt: "Toque nas arenas que você visitou",
      fr: "Touchez les salles visitées",
      de: "Tippe auf besuchte Arenen",
    }),
    saveError: L(lang, {
      ja: "保存できませんでした",
      en: "Couldn't save",
      ko: "저장하지 못했습니다",
      zh: "保存失败",
    }),
    disclaimer: L(lang, {
      ja: "UNITERZ は NBA、各 NBA チームおよび各アリーナの所有者・運営者とは提携・公認関係にありません。バッジは各地域をイメージしたオリジナルのイラストです。",
      en: "UNITERZ is not affiliated with or endorsed by the NBA, its teams, or arena owners and operators. Badges are original illustrations inspired by each region.",
      ko: "UNITERZ는 NBA, 각 NBA 팀 및 아레나 소유자·운영자와 제휴·공인 관계가 없습니다. 배지는 각 지역을 모티브로 한 오리지널 일러스트입니다.",
      zh: "UNITERZ 与 NBA、各 NBA 球队及球馆所有者和运营方无任何合作或授权关系。徽章为以各地区为灵感的原创插画。",
    }),
    badgeAria: (city: string, visited: boolean) =>
      L(lang, {
        ja: `${city}（${visited ? "訪問済み" : "未訪問"}）`,
        en: `${city} (${visited ? "visited" : "not visited"})`,
        ko: `${city} (${visited ? "방문함" : "미방문"})`,
        zh: `${city}（${visited ? "已到访" : "未到访"}）`,
      }),
  };
}
