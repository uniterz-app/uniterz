/**
 * NBA ランキング行のひとこと（users.rankingComment）。
 * 設定・表示は Pro のみ。PICK UP / PRO LEAGUE 両方の TODAY とシーズン／期間ランキングで、誰でも見られる。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { findExternalContactViolation } from "@/lib/profile/externalContactTerms";
import { findProfileGamblingTermViolation } from "@/lib/profile/profileGamblingTerms";

export const RANKING_COMMENT_FIELD = "rankingComment";
export const RANKING_COMMENT_MAX_CHARS = 30;

export type RankingCommentError = "too_long" | "forbidden_terms";

/** 改行・連続空白を 1 つにまとめる。空なら "" */
export function normalizeRankingComment(raw: unknown): string {
  if (typeof raw !== "string") return "";
  return raw.normalize("NFC").replace(/\s+/g, " ").trim();
}

export function rankingCommentLength(text: string): number {
  return Array.from(text).length;
}

export function validateRankingComment(
  text: string
): RankingCommentError | null {
  if (rankingCommentLength(text) > RANKING_COMMENT_MAX_CHARS) return "too_long";
  if (
    text &&
    (findProfileGamblingTermViolation(text) != null ||
      findExternalContactViolation(text) != null)
  ) {
    return "forbidden_terms";
  }
  return null;
}

/** users ドキュメントから表示用ひとこと（不正値は undefined） */
export function rankingCommentFromUserDoc(
  data: Record<string, unknown> | undefined
): string | undefined {
  const text = normalizeRankingComment(data?.[RANKING_COMMENT_FIELD]);
  if (!text || validateRankingComment(text) != null) return undefined;
  return text;
}

export function rankingCommentCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    label: L(lang, {
      ja: "ひとこと",
      en: "Comment",
      ko: "한마디",
      zh: "一句话",
      es: "Comentario",
      pt: "Recado",
      fr: "Message",
    }),
    emptyPrompt: L(lang, {
      ja: "ランキングに表示するひとことを設定",
      en: "Add a comment to show on the rankings",
      ko: "랭킹에 표시할 한마디를 설정",
      zh: "设置在排名中显示的一句话",
      es: "Añade un comentario para el ranking",
      pt: "Adicione um recado para o ranking",
      fr: "Ajoutez un message pour le classement",
    }),
    placeholder: L(lang, {
      ja: "例: 今夜はレイカーズ全張り",
      en: "e.g. All in on the Lakers tonight",
      ko: "예: 오늘 밤은 레이커스 올인",
      zh: "例：今晚全押湖人",
      es: "Ej.: Todo a los Lakers esta noche",
      pt: "Ex.: Tudo nos Lakers hoje",
      fr: "Ex. : Tout sur les Lakers ce soir",
    }),
    edit: L(lang, {
      ja: "編集",
      en: "Edit",
      ko: "편집",
      zh: "编辑",
      es: "Editar",
      pt: "Editar",
      fr: "Modifier",
    }),
    save: L(lang, {
      ja: "保存",
      en: "Save",
      ko: "저장",
      zh: "保存",
      es: "Guardar",
      pt: "Salvar",
      fr: "Enregistrer",
    }),
    cancel: L(lang, {
      ja: "キャンセル",
      en: "Cancel",
      ko: "취소",
      zh: "取消",
      es: "Cancelar",
      pt: "Cancelar",
      fr: "Annuler",
    }),
    note: L(lang, {
      ja: "ランキングと TODAY の自分の行の下に、全員に表示されます。空にすると消えます。",
      en: "Shown to everyone under your row in rankings and TODAY. Leave empty to remove.",
      ko: "랭킹과 TODAY의 내 행 아래에 모두에게 표시됩니다. 비우면 삭제됩니다.",
      zh: "会在排名与 TODAY 中你那一行的下方向所有人显示。清空即删除。",
      es: "Visible para todos bajo tu fila en el ranking y TODAY. Déjalo vacío para quitarlo.",
      pt: "Visível para todos abaixo da sua linha no ranking e no TODAY. Deixe vazio para remover.",
      fr: "Visible par tous sous votre ligne du classement et de TODAY. Laissez vide pour supprimer.",
    }),
    error: (code: string | null | undefined) => {
      if (code === "too_long") {
        return L(lang, {
          ja: `${RANKING_COMMENT_MAX_CHARS} 文字以内で入力してください。`,
          en: `Use ${RANKING_COMMENT_MAX_CHARS} characters or fewer.`,
          ko: `${RANKING_COMMENT_MAX_CHARS}자 이내로 입력해 주세요.`,
          zh: `请输入 ${RANKING_COMMENT_MAX_CHARS} 个字符以内。`,
          es: `Máximo ${RANKING_COMMENT_MAX_CHARS} caracteres.`,
          pt: `Máximo de ${RANKING_COMMENT_MAX_CHARS} caracteres.`,
          fr: `${RANKING_COMMENT_MAX_CHARS} caractères maximum.`,
        });
      }
      if (code === "forbidden_terms") {
        return L(lang, {
          ja: "使用できない言葉が含まれています。",
          en: "Your comment contains words that cannot be used.",
          ko: "사용할 수 없는 단어가 포함되어 있습니다.",
          zh: "包含不可使用的词语。",
          es: "Contiene palabras no permitidas.",
          pt: "Contém palavras não permitidas.",
          fr: "Contient des mots non autorisés.",
        });
      }
      if (code === "pro_required") {
        return L(lang, {
          ja: "ひとことは Pro メンバーのみ設定できます。",
          en: "Comments are available to Pro members only.",
          ko: "한마디는 Pro 멤버만 설정할 수 있습니다.",
          zh: "仅 Pro 会员可设置。",
          es: "Solo para miembros Pro.",
          pt: "Disponível apenas para membros Pro.",
          fr: "Réservé aux membres Pro.",
        });
      }
      return L(lang, {
        ja: "保存に失敗しました。",
        en: "Could not save.",
        ko: "저장에 실패했습니다.",
        zh: "保存失败。",
        es: "No se pudo guardar.",
        pt: "Não foi possível salvar.",
        fr: "Échec de l’enregistrement.",
      });
    },
  };
}
