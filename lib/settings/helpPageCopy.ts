/**
 * Help 画面 chrome（7言語）。FAQ 本文は `helpFaqsCopy`。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function helpPageCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    guideLabel: "GUIDE",
    topicsLabel: "TOPICS",
    guideIntro: L(lang, {
      ja: "Uniterz の遊び方・採点・ランキングについてまとめています。気になる項目をタップして詳細を確認してください。",
      en: "How to play, scoring, and rankings — tap a section below to read more.",
      ko: "Uniterz 플레이·채점·랭킹을 정리했습니다. 항목을 탭해 자세히 확인하세요.",
      zh: "汇总 Uniterz 玩法、计分与排名。点按条目查看详情。",
      es: "Cómo jugar, puntuación y rankings — toca una sección para leer más.",
      pt: "Como jogar, pontuação e rankings — toque em uma seção para ler mais.",
      fr: "Jouer, scoring et classements — touchez une section pour en savoir plus.",
    }),
    title: L(lang, {
      ja: "ヘルプ・ガイド",
      en: "Help & Guide",
      ko: "도움말·가이드",
      zh: "帮助与指南",
      es: "Ayuda y guía",
      pt: "Ajuda e guia",
      fr: "Aide et guide",
    }),
    description: L(lang, {
      ja: "Uniterz の使い方とスコアリングについて",
      en: "Learn how to use Uniterz and how scoring works.",
      ko: "Uniterz 사용법과 스코어링에 대해",
      zh: "了解 Uniterz 用法与计分方式",
      es: "Cómo usar Uniterz y cómo funciona la puntuación.",
      pt: "Como usar o Uniterz e como funciona a pontuação.",
      fr: "Utilisation d’Uniterz et fonctionnement du scoring.",
    }),
    lastUpdatedLabel: L(lang, {
      ja: "最終更新: ",
      en: "Last updated: ",
      ko: "최종 업데이트: ",
      zh: "最后更新：",
      es: "Última actualización: ",
      pt: "Última atualização: ",
      fr: "Dernière mise à jour : ",
    }),
  };
}
