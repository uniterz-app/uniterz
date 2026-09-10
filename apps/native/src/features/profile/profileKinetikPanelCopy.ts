/**
 * Native Kinetik パネルのユーザー向け文言（7言語）。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "../../../../../lib/i18n/localize";

export type ProfileKinetikPanelLang = LocalizedLang;
export const resolveProfileKinetikPanelLang = resolveLocalizedLang;

export function profileKinetikPanelCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    viewsTitle: L(lang, {
      ja: "プロフィール閲覧数",
      en: "Profile views",
      ko: "프로필 조회수",
      zh: "资料浏览次数",
      es: "Visitas al perfil",
      pt: "Visualizações do perfil",
      fr: "Vues du profil",
    }),
    viewsBody: L(lang, {
      ja: "ログインした人がこのプロフィールを見た回数です。同じ人が同じ日に何度見ても 1 回です。自分で自分のプロフィールを見た分は入りません。",
      en: "How many logged-in people have opened this profile. Multiple views by the same person on the same day count as one. Viewing your own profile is not counted.",
      ko: "로그인한 사용자가 이 프로필을 본 횟수입니다. 같은 사람이 같은 날 여러 번 봐도 1회로 칩니다. 본인 프로필 조회는 포함되지 않습니다.",
      zh: "已登录用户打开此资料的次数。同一人同一天多次查看计为 1 次。查看自己的资料不计入。",
      es: "Cuántas personas con sesión iniciada abrieron este perfil. Varias visitas de la misma persona el mismo día cuentan como una. Ver tu propio perfil no cuenta.",
      pt: "Quantas pessoas logadas abriram este perfil. Várias visitas da mesma pessoa no mesmo dia contam como uma. Ver o próprio perfil não conta.",
      fr: "Nombre de personnes connectées ayant ouvert ce profil. Plusieurs vues le même jour par la même personne comptent pour une. Voir son propre profil ne compte pas.",
    }),
    viewsHint: L(lang, {
      ja: "閲覧数の説明を表示",
      en: "Show what profile views means",
      ko: "조회수 설명 보기",
      zh: "显示浏览次数说明",
      es: "Mostrar qué significan las visitas",
      pt: "Mostrar o que significam as visualizações",
      fr: "Afficher la signification des vues",
    }),
    viewsAria: (n: number) =>
      L(lang, {
        ja: `プロフィール閲覧数 ${n.toLocaleString("ja-JP")}`,
        en: `${n.toLocaleString("en-US")} profile views`,
        ko: `프로필 조회수 ${n.toLocaleString("en-US")}`,
        zh: `资料浏览 ${n.toLocaleString("en-US")} 次`,
        es: `${n.toLocaleString("en-US")} visitas al perfil`,
        pt: `${n.toLocaleString("en-US")} visualizações do perfil`,
        fr: `${n.toLocaleString("en-US")} vues du profil`,
      }),
    unitsAria: (n: number) =>
      L(lang, {
        ja: `保有 Unit ${n.toLocaleString("ja-JP")}`,
        en: `${n.toLocaleString("en-US")} Units`,
        ko: `보유 Unit ${n.toLocaleString("en-US")}`,
        zh: `持有 Unit ${n.toLocaleString("en-US")}`,
        es: `${n.toLocaleString("en-US")} Units`,
        pt: `${n.toLocaleString("en-US")} Units`,
        fr: `${n.toLocaleString("en-US")} Units`,
      }),
    unitsOpenHistoryAria: (base: string) =>
      L(lang, {
        ja: `${base} · 履歴を開く`,
        en: `${base} · Open history`,
        ko: `${base} · 기록 열기`,
        zh: `${base} · 打开记录`,
        es: `${base} · Abrir historial`,
        pt: `${base} · Abrir histórico`,
        fr: `${base} · Ouvrir l’historique`,
      }),
    shareProfile: L(lang, {
      ja: "プロフィールを共有",
      en: "Share profile",
      ko: "프로필 공유",
      zh: "分享资料",
      es: "Compartir perfil",
      pt: "Compartilhar perfil",
      fr: "Partager le profil",
    }),
    shareCopied: L(lang, {
      ja: "コピー済",
      en: "Copied",
      ko: "복사됨",
      zh: "已复制",
      es: "Copiado",
      pt: "Copiado",
      fr: "Copié",
    }),
    shareText: (title: string) =>
      L(lang, {
        ja: `${title} のプロフィール`,
        en: `${title}'s profile`,
        ko: `${title}의 프로필`,
        zh: `${title} 的资料`,
        es: `Perfil de ${title}`,
        pt: `Perfil de ${title}`,
        fr: `Profil de ${title}`,
      }),
    matchUnit: L(lang, {
      ja: "試合",
      en: "matches",
      ko: "경기",
      zh: "场次",
      es: "partidos",
      pt: "jogos",
      fr: "matchs",
    }),
    winRateLabel: L(lang, {
      ja: "勝率",
      en: "WIN RATE",
      ko: "승률",
      zh: "胜率",
      es: "WIN RATE",
      pt: "WIN RATE",
      fr: "WIN RATE",
    }),
    totalPtsLabel: L(lang, {
      ja: "総合得点",
      en: "TOTAL PTS",
      ko: "총점",
      zh: "总分",
      es: "TOTAL PTS",
      pt: "TOTAL PTS",
      fr: "TOTAL PTS",
    }),
    topScorerLabel: L(lang, {
      ja: "最多得点者",
      en: "TOP SCORER",
      ko: "최다 득점",
      zh: "最佳得分",
      es: "TOP SCORER",
      pt: "TOP SCORER",
      fr: "TOP SCORER",
    }),
    winRateFootnote: (posts: number, hits: number) =>
      L(lang, {
        ja: `投稿 ${posts} · 的中 ${hits}`,
        en: `${hits} hits · ${posts} posts`,
        ko: `적중 ${hits} · 게시 ${posts}`,
        zh: `命中 ${hits} · 帖子 ${posts}`,
        es: `${hits} aciertos · ${posts} posts`,
        pt: `${hits} acertos · ${posts} posts`,
        fr: `${hits} hits · ${posts} posts`,
      }),
    rankLabel: (rank: number) =>
      L(lang, {
        ja: `${rank}位`,
        en: `#${rank}`,
        ko: `${rank}위`,
        zh: `第${rank}名`,
        es: `#${rank}`,
        pt: `#${rank}`,
        fr: `#${rank}`,
      }),
    markList: L(lang, {
      ja: "マークリスト",
      en: "Mark list",
      ko: "마크 목록",
      zh: "标记列表",
      es: "Lista de marcas",
      pt: "Lista de marcas",
      fr: "Liste des marques",
    }),
    marked: L(lang, {
      ja: "マーク済み",
      en: "Marked",
      ko: "마크됨",
      zh: "已标记",
      es: "Marcado",
      pt: "Marcado",
      fr: "Marqué",
    }),
    mark: L(lang, {
      ja: "マークする",
      en: "Mark",
      ko: "마크하기",
      zh: "标记",
      es: "Marcar",
      pt: "Marcar",
      fr: "Marquer",
    }),
    scopeTotalHint: L(lang, {
      ja: "累計",
      en: "TTL",
      ko: "누적",
      zh: "累计",
      es: "TTL",
      pt: "TTL",
      fr: "TTL",
    }),
  };
}
