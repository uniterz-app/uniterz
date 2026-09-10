/**
 * 招待コード bind 失敗時のユーザー向け文言（7言語）。
 * 未知の error は null（サイレント可）。
 */
import { L, type LocalizedLang } from "@/lib/i18n/localize";

export function referralBindUserMessage(
  errorCode: string | null | undefined,
  lang: LocalizedLang
): string | null {
  switch (String(errorCode ?? "").trim()) {
    case "self_invite":
      return L(lang, {
        ja: "自分の招待コードは使えません。",
        en: "You can't use your own invite code.",
        ko: "자신의 초대 코드는 사용할 수 없습니다.",
        zh: "不能使用自己的邀请码。",
        es: "No puedes usar tu propio código de invitación.",
        pt: "Você não pode usar o próprio código de convite.",
        fr: "Vous ne pouvez pas utiliser votre propre code d'invitation.",
      });
    case "already_bound":
      return L(lang, {
        ja: "招待コードはすでに登録済みです（1回のみ）。",
        en: "An invite code is already linked (once per account).",
        ko: "초대 코드는 이미 등록되었습니다(계정당 1회).",
        zh: "邀请码已绑定（每个账号仅一次）。",
        es: "Ya hay un código vinculado (una vez por cuenta).",
        pt: "Já há um código vinculado (uma vez por conta).",
        fr: "Un code est déjà lié (une seule fois par compte).",
      });
    case "invite_code_not_found":
    case "invalid_code":
      return L(lang, {
        ja: "招待コードが見つかりません。入力内容を確認してください。",
        en: "Invite code not found. Please check and try again.",
        ko: "초대 코드를 찾을 수 없습니다. 입력 내용을 확인하세요.",
        zh: "找不到邀请码，请检查后重试。",
        es: "No se encontró el código. Revísalo e inténtalo de nuevo.",
        pt: "Código não encontrado. Verifique e tente de novo.",
        fr: "Code introuvable. Vérifiez et réessayez.",
      });
    case "mutual_invite":
      return L(lang, {
        ja: "相互招待はできません。",
        en: "Mutual invites aren't allowed.",
        ko: "상호 초대는 할 수 없습니다.",
        zh: "不允许互相邀请。",
        es: "No se permiten invitaciones mutuas.",
        pt: "Convites mútuos não são permitidos.",
        fr: "Les invitations mutuelles ne sont pas autorisées.",
      });
    default:
      return null;
  }
}
