/**
 * WELCOME / プロフィールセットアップ画面コピー（7言語）。
 */
import { L, type LocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";
import { resolveAppUiLocalizedLang } from "@/lib/i18n/resolveAppUiLanguage";

export type OnboardingWelcomeCopy = {
  desc: string;
  pickPhoto: string;
  username: string;
  language: string;
  country: string;
  countryNotSet: string;
  countryHint: string;
  countryFlagLater: string;
  invite: string;
  inviteHint: string;
  continue: string;
  saving: string;
  nameTooLong: string;
  invalidTitle: string;
  saveFail: string;
  photoDeniedTitle: string;
  photoDenied: string;
  photoPickerTitle: string;
  photoPickerHint: string;
  photoFail: string;
  backFail: string;
};

const COPY: Record<keyof OnboardingWelcomeCopy, UiStrings> = {
  desc: {
    ja: "ユーザー名と言語を設定してください。画像・国・招待コードは任意です。",
    en: "Set your username and language. Photo, country, and invite code are optional.",
    ko: "사용자 이름과 언어를 설정하세요. 사진·국가·초대 코드는 선택 사항입니다.",
    zh: "请设置用户名和语言。头像、国家和邀请码为可选项。",
    es: "Configura tu nombre de usuario e idioma. Foto, país y código son opcionales.",
    pt: "Defina seu nome de usuário e idioma. Foto, país e código são opcionais.",
    fr: "Définissez votre nom et votre langue. Photo, pays et code sont optionnels.",
  },
  pickPhoto: {
    ja: "プロフィール画像を選ぶ",
    en: "Choose profile photo",
    ko: "프로필 사진 선택",
    zh: "选择头像",
    es: "Elegir foto de perfil",
    pt: "Escolher foto de perfil",
    fr: "Choisir une photo de profil",
  },
  username: {
    ja: "ユーザー名",
    en: "Username",
    ko: "사용자 이름",
    zh: "用户名",
    es: "Nombre de usuario",
    pt: "Nome de usuário",
    fr: "Nom d'utilisateur",
  },
  language: {
    ja: "使用言語",
    en: "App language",
    ko: "앱 언어",
    zh: "应用语言",
    es: "Idioma de la app",
    pt: "Idioma do app",
    fr: "Langue de l'app",
  },
  country: {
    ja: "住んでいる国（任意）",
    en: "Country (optional)",
    ko: "거주 국가 (선택)",
    zh: "所在国家（可选）",
    es: "País (opcional)",
    pt: "País (opcional)",
    fr: "Pays (facultatif)",
  },
  countryNotSet: {
    ja: "未設定",
    en: "Not set",
    ko: "미설정",
    zh: "未设置",
    es: "Sin definir",
    pt: "Não definido",
    fr: "Non défini",
  },
  countryHint: {
    ja: "国はランキング表示時のフラッグに使用されます。",
    en: "Country is used for the flag shown on rankings.",
    ko: "국가는 랭킹에 표시되는 국기에 사용됩니다.",
    zh: "国家用于排行榜上的国旗显示。",
    es: "El país se usa para la bandera en el ranking.",
    pt: "O país é usado na bandeira do ranking.",
    fr: "Le pays sert pour le drapeau affiché au classement.",
  },
  countryFlagLater: {
    ja: "（一部の国は今後フラッグ画像を追加予定）",
    en: "(Some flags may be added later.)",
    ko: "(일부 국기는 추후 추가될 수 있습니다.)",
    zh: "（部分国旗可能稍后补充）",
    es: "(Algunas banderas se añadirán más adelante.)",
    pt: "(Algumas bandeiras podem ser adicionadas depois.)",
    fr: "(Certains drapeaux pourront être ajoutés plus tard.)",
  },
  invite: {
    ja: "招待コード（任意）",
    en: "Invite code (optional)",
    ko: "초대 코드 (선택)",
    zh: "邀请码（可选）",
    es: "Código de invitación (opcional)",
    pt: "Código de convite (opcional)",
    fr: "Code d'invitation (facultatif)",
  },
  inviteHint: {
    ja: "入力すると 30 Unit もらえます（あとから入力はできません）",
    en: "Enter a code to get 30 Units (can't add it later)",
    ko: "입력하면 30 Unit을 받습니다 (나중에 입력할 수 없습니다)",
    zh: "输入后可获得 30 Unit（之后无法再填写）",
    es: "Introdúcelo y recibe 30 Units (no se puede añadir después)",
    pt: "Digite e ganhe 30 Units (não dá para inserir depois)",
    fr: "Saisissez-le pour 30 Units (impossible de l'ajouter plus tard)",
  },
  continue: {
    ja: "CONTINUE",
    en: "CONTINUE",
    ko: "CONTINUE",
    zh: "CONTINUE",
    es: "CONTINUE",
    pt: "CONTINUE",
    fr: "CONTINUE",
  },
  saving: {
    ja: "保存中...",
    en: "Saving...",
    ko: "저장 중...",
    zh: "保存中...",
    es: "Guardando...",
    pt: "Salvando...",
    fr: "Enregistrement...",
  },
  nameTooLong: {
    ja: "ユーザー名は50文字以内にしてください。",
    en: "Username must be 50 characters or fewer.",
    ko: "사용자 이름은 50자 이하여야 합니다.",
    zh: "用户名须在 50 个字符以内。",
    es: "El nombre debe tener 50 caracteres o menos.",
    pt: "O nome deve ter no máximo 50 caracteres.",
    fr: "Le nom doit comporter 50 caractères ou moins.",
  },
  invalidTitle: {
    ja: "入力エラー",
    en: "Invalid input",
    ko: "입력 오류",
    zh: "输入错误",
    es: "Entrada no válida",
    pt: "Entrada inválida",
    fr: "Saisie invalide",
  },
  saveFail: {
    ja: "プロフィールの保存に失敗しました。",
    en: "Could not save your profile.",
    ko: "프로필을 저장하지 못했습니다.",
    zh: "无法保存个人资料。",
    es: "No se pudo guardar el perfil.",
    pt: "Não foi possível salvar o perfil.",
    fr: "Impossible d'enregistrer le profil.",
  },
  photoDeniedTitle: {
    ja: "写真へのアクセス",
    en: "Photo access",
    ko: "사진 접근",
    zh: "照片访问权限",
    es: "Acceso a fotos",
    pt: "Acesso às fotos",
    fr: "Accès aux photos",
  },
  photoDenied: {
    ja: "設定から写真へのアクセスを許可してください。",
    en: "Allow photo access in Settings, then try again.",
    ko: "설정에서 사진 접근을 허용한 뒤 다시 시도하세요.",
    zh: "请在设置中允许访问照片后重试。",
    es: "Permite el acceso a fotos en Ajustes e inténtalo de nuevo.",
    pt: "Permita o acesso às fotos em Ajustes e tente de novo.",
    fr: "Autorisez l'accès aux photos dans Réglages, puis réessayez.",
  },
  photoPickerTitle: {
    ja: "写真を選べません",
    en: "Can't pick a photo",
    ko: "사진을 선택할 수 없습니다",
    zh: "无法选择照片",
    es: "No se puede elegir una foto",
    pt: "Não é possível escolher uma foto",
    fr: "Impossible de choisir une photo",
  },
  photoPickerHint: {
    ja: "このビルドでは画像ライブラリが使えません。開発クライアントを入れ直してください。",
    en: "The image library isn't available in this build. Reinstall the dev client.",
    ko: "이 빌드에서는 이미지 라이브러리를 쓸 수 없습니다. 개발 클라이언트를 다시 설치하세요.",
    zh: "此构建无法使用图库。请重新安装开发客户端。",
    es: "La biblioteca de imágenes no está disponible. Reinstala el cliente de desarrollo.",
    pt: "A biblioteca de imagens não está disponível. Reinstale o cliente de desenvolvimento.",
    fr: "La photothèque n'est pas disponible. Réinstallez le client de développement.",
  },
  photoFail: {
    ja: "画像の読み込みに失敗しました。",
    en: "Could not load the image.",
    ko: "이미지를 불러오지 못했습니다.",
    zh: "无法加载图片。",
    es: "No se pudo cargar la imagen.",
    pt: "Não foi possível carregar a imagem.",
    fr: "Impossible de charger l'image.",
  },
  backFail: {
    ja: "戻るのに失敗しました。",
    en: "Could not go back. Try again.",
    ko: "돌아가기에 실패했습니다. 다시 시도하세요.",
    zh: "无法返回，请重试。",
    es: "No se pudo volver. Inténtalo de nuevo.",
    pt: "Não foi possível voltar. Tente de novo.",
    fr: "Impossible de revenir. Réessayez.",
  },
};

export function onboardingWelcomeCopy(
  lang: LocalizedLang = resolveAppUiLocalizedLang()
): OnboardingWelcomeCopy {
  return {
    desc: L(lang, COPY.desc),
    pickPhoto: L(lang, COPY.pickPhoto),
    username: L(lang, COPY.username),
    language: L(lang, COPY.language),
    country: L(lang, COPY.country),
    countryNotSet: L(lang, COPY.countryNotSet),
    countryHint: L(lang, COPY.countryHint),
    countryFlagLater: L(lang, COPY.countryFlagLater),
    invite: L(lang, COPY.invite),
    inviteHint: L(lang, COPY.inviteHint),
    continue: L(lang, COPY.continue),
    saving: L(lang, COPY.saving),
    nameTooLong: L(lang, COPY.nameTooLong),
    invalidTitle: L(lang, COPY.invalidTitle),
    saveFail: L(lang, COPY.saveFail),
    photoDeniedTitle: L(lang, COPY.photoDeniedTitle),
    photoDenied: L(lang, COPY.photoDenied),
    photoPickerTitle: L(lang, COPY.photoPickerTitle),
    photoPickerHint: L(lang, COPY.photoPickerHint),
    photoFail: L(lang, COPY.photoFail),
    backFail: L(lang, COPY.backFail),
  };
}
