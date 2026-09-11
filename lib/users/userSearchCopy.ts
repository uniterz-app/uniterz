/**
 * ユーザー検索 UI コピー（7言語）
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function userSearchCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    lang,
    title: L(lang, {
      ja: "ユーザー検索",
      en: "User Search",
      ko: "사용자 검색",
      zh: "搜索用户",
      es: "Buscar usuarios",
      pt: "Buscar usuários",
      fr: "Recherche d'utilisateurs",
    }),
    menuLabel: L(lang, {
      ja: "ユーザー検索",
      en: "User Search",
      ko: "사용자 검색",
      zh: "搜索用户",
      es: "Buscar usuarios",
      pt: "Buscar usuários",
      fr: "Recherche d'utilisateurs",
    }),
    placeholder: L(lang, {
      ja: "ユーザー名で検索",
      en: "Search by username",
      ko: "사용자 이름으로 검색",
      zh: "按用户名搜索",
      es: "Buscar por nombre",
      pt: "Buscar por nome",
      fr: "Rechercher par nom",
    }),
    hint: L(lang, {
      ja: "2文字以上入力してください",
      en: "Enter at least 2 characters",
      ko: "2자 이상 입력하세요",
      zh: "请输入至少 2 个字符",
      es: "Introduce al menos 2 caracteres",
      pt: "Digite pelo menos 2 caracteres",
      fr: "Saisissez au moins 2 caractères",
    }),
    empty: L(lang, {
      ja: "見つかりませんでした",
      en: "No users found",
      ko: "사용자를 찾을 수 없습니다",
      zh: "未找到用户",
      es: "No se encontraron usuarios",
      pt: "Nenhum usuário encontrado",
      fr: "Aucun utilisateur trouvé",
    }),
    mark: L(lang, {
      ja: "MARK",
      en: "MARK",
      ko: "MARK",
      zh: "MARK",
      es: "MARK",
      pt: "MARK",
      fr: "MARK",
    }),
    /** 解除アクション／ボタン表示は言語問わず英語 */
    unmarked: L(lang, {
      ja: "UNMARK",
      en: "UNMARK",
      ko: "UNMARK",
      zh: "UNMARK",
      es: "UNMARK",
      pt: "UNMARK",
      fr: "UNMARK",
    }),
    /** マーク済み表示は言語問わず英語 */
    marked: L(lang, {
      ja: "MARKED",
      en: "MARKED",
      ko: "MARKED",
      zh: "MARKED",
      es: "MARKED",
      pt: "MARKED",
      fr: "MARKED",
    }),
    searching: L(lang, {
      ja: "検索中…",
      en: "Searching…",
      ko: "검색 중…",
      zh: "搜索中…",
      es: "Buscando…",
      pt: "Buscando…",
      fr: "Recherche…",
    }),
    failed: L(lang, {
      ja: "検索に失敗しました",
      en: "Search failed",
      ko: "검색에 실패했습니다",
      zh: "搜索失败",
      es: "Error al buscar",
      pt: "Falha na busca",
      fr: "Échec de la recherche",
    }),
    markFailed: L(lang, {
      ja: "MARK できませんでした",
      en: "Could not MARK",
      ko: "MARK 실패",
      zh: "无法标记",
      es: "No se pudo marcar",
      pt: "Não foi possível marcar",
      fr: "Impossible de marquer",
    }),
    capFree: (n: number) =>
      L(lang, {
        ja: `Free は最大 ${n} 人までです`,
        en: `Free plan max is ${n}`,
        ko: `Free는 최대 ${n}명입니다`,
        zh: `免费版最多 ${n} 人`,
        es: `Free permite hasta ${n}`,
        pt: `Free permite até ${n}`,
        fr: `Free autorise ${n} max`,
      }),
    capPro: (n: number) =>
      L(lang, {
        ja: `PRO は最大 ${n} 人までです`,
        en: `PRO max is ${n}`,
        ko: `PRO는 최대 ${n}명입니다`,
        zh: `PRO 最多 ${n} 人`,
        es: `PRO permite hasta ${n}`,
        pt: `PRO permite até ${n}`,
        fr: `PRO autorise ${n} max`,
      }),
  };
}
