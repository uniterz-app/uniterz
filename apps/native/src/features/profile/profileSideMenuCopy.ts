/**
 * Native サイドメニュー行ラベル（7言語）
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";

export type ProfileSideMenuLabels = {
  main: string;
  subscription: string;
  support: string;
  admin: string;
  profile: string;
  userSearch: string;
  badges: string;
  invite: string;
  unitHistory: string;
  unitRedeem: string;
  announcements: string;
  plan: string;
  proSkin: string;
  help: string;
  guidelines: string;
  terms: string;
  contact: string;
  privacy: string;
  commercialLaw: string;
  password: string;
  notifications: string;
  featureRequest: string;
  electronicNotice: string;
  deleteAccount: string;
  logout: string;
  adminFeatureRequests: string;
  adminContacts: string;
  adminRedemptions: string;
  adminGroupBattles: string;
  userFallback: string;
  logoutFailed: string;
  tutorial: string;
};

export function profileSideMenuLabels(
  language: string | null | undefined
): ProfileSideMenuLabels {
  const lang = resolveLocalizedLang(language);
  return {
    main: L(lang, {
      ja: "メイン",
      en: "MAIN",
      ko: "메인",
      zh: "主要",
      es: "PRINCIPAL",
      pt: "PRINCIPAL",
      fr: "PRINCIPAL",
    }),
    subscription: L(lang, {
      ja: "サブスクリプション",
      en: "SUBSCRIPTION",
      ko: "구독",
      zh: "订阅",
      es: "SUSCRIPCIÓN",
      pt: "ASSINATURA",
      fr: "ABONNEMENT",
    }),
    support: L(lang, {
      ja: "サポート",
      en: "SUPPORT",
      ko: "지원",
      zh: "支持",
      es: "SOPORTE",
      pt: "SUPORTE",
      fr: "ASSISTANCE",
    }),
    admin: L(lang, {
      ja: "管理",
      en: "ADMIN",
      ko: "관리",
      zh: "管理",
      es: "ADMIN",
      pt: "ADMIN",
      fr: "ADMIN",
    }),
    profile: L(lang, {
      ja: "プロフィール編集",
      en: "Edit Profile",
      ko: "프로필 편집",
      zh: "编辑资料",
      es: "Editar perfil",
      pt: "Editar perfil",
      fr: "Modifier le profil",
    }),
    userSearch: L(lang, {
      ja: "ユーザー検索",
      en: "User Search",
      ko: "사용자 검색",
      zh: "搜索用户",
      es: "Buscar usuarios",
      pt: "Buscar usuários",
      fr: "Recherche d'utilisateurs",
    }),
    badges: L(lang, {
      ja: "バッジパレット",
      en: "Badge Palette",
      ko: "배지 팔레트",
      zh: "徽章面板",
      es: "Paleta de insignias",
      pt: "Paleta de medalhas",
      fr: "Palette de badges",
    }),
    invite: L(lang, {
      ja: "招待",
      en: "Invite",
      ko: "초대",
      zh: "邀请",
      es: "Invitar",
      pt: "Convidar",
      fr: "Inviter",
    }),
    unitHistory: L(lang, {
      ja: "Unit 履歴",
      en: "Unit History",
      ko: "Unit 기록",
      zh: "Unit 记录",
      es: "Historial de Units",
      pt: "Histórico de Units",
      fr: "Historique Units",
    }),
    unitRedeem: L(lang, {
      ja: "商品交換",
      en: "Redeem Units",
      ko: "상품 교환",
      zh: "兑换商品",
      es: "Canjear Units",
      pt: "Resgatar Units",
      fr: "Échanger Units",
    }),
    announcements: L(lang, {
      ja: "お知らせ",
      en: "Announcements",
      ko: "공지",
      zh: "公告",
      es: "Anuncios",
      pt: "Avisos",
      fr: "Annonces",
    }),
    plan: L(lang, {
      ja: "プランの確認",
      en: "Plan Status",
      ko: "플랜 확인",
      zh: "查看方案",
      es: "Estado del plan",
      pt: "Status do plano",
      fr: "État du plan",
    }),
    proSkin: "Pro Skin",
    help: L(lang, {
      ja: "ヘルプ",
      en: "Help",
      ko: "도움말",
      zh: "帮助",
      es: "Ayuda",
      pt: "Ajuda",
      fr: "Aide",
    }),
    guidelines: L(lang, {
      ja: "ガイドライン",
      en: "Community Guidelines",
      ko: "가이드라인",
      zh: "社区准则",
      es: "Normas de la comunidad",
      pt: "Diretrizes da comunidade",
      fr: "Règles de la communauté",
    }),
    terms: L(lang, {
      ja: "利用規約",
      en: "Terms of Service",
      ko: "이용약관",
      zh: "使用条款",
      es: "Términos del servicio",
      pt: "Termos de serviço",
      fr: "Conditions d’utilisation",
    }),
    contact: L(lang, {
      ja: "お問い合わせ",
      en: "Contact",
      ko: "문의",
      zh: "联系我们",
      es: "Contacto",
      pt: "Contato",
      fr: "Contact",
    }),
    privacy: L(lang, {
      ja: "プライバシーポリシー",
      en: "Privacy Policy",
      ko: "개인정보 처리방침",
      zh: "隐私政策",
      es: "Política de privacidad",
      pt: "Política de privacidade",
      fr: "Politique de confidentialité",
    }),
    commercialLaw: L(lang, {
      ja: "特定商取引法に基づく表記",
      en: "Commercial Transactions Notice",
      ko: "특정상거래법 고지",
      zh: "特定商业交易法告知",
      es: "Aviso de transacciones comerciales",
      pt: "Aviso de transações comerciais",
      fr: "Mentions transactions commerciales",
    }),
    password: L(lang, {
      ja: "パスワード変更",
      en: "Change Password",
      ko: "비밀번호 변경",
      zh: "更改密码",
      es: "Cambiar contraseña",
      pt: "Alterar senha",
      fr: "Changer le mot de passe",
    }),
    notifications: L(lang, {
      ja: "通知設定",
      en: "Notifications",
      ko: "알림 설정",
      zh: "通知设置",
      es: "Notificaciones",
      pt: "Notificações",
      fr: "Notifications",
    }),
    featureRequest: L(lang, {
      ja: "機能リクエスト",
      en: "Feature Request",
      ko: "기능 요청",
      zh: "功能请求",
      es: "Solicitud de función",
      pt: "Pedido de recurso",
      fr: "Demande de fonctionnalité",
    }),
    electronicNotice: L(lang, {
      ja: "電子公告",
      en: "Electronic Notice",
      ko: "전자공고",
      zh: "电子公告",
      es: "Aviso electrónico",
      pt: "Aviso eletrônico",
      fr: "Avis électronique",
    }),
    deleteAccount: L(lang, {
      ja: "アカウント削除",
      en: "Delete Account",
      ko: "계정 삭제",
      zh: "删除账户",
      es: "Eliminar cuenta",
      pt: "Excluir conta",
      fr: "Supprimer le compte",
    }),
    logout: L(lang, {
      ja: "ログアウト",
      en: "Log out",
      ko: "로그아웃",
      zh: "退出登录",
      es: "Cerrar sesión",
      pt: "Sair",
      fr: "Se déconnecter",
    }),
    adminFeatureRequests: L(lang, {
      ja: "機能リクエスト",
      en: "Feature Requests",
      ko: "기능 요청",
      zh: "功能请求",
      es: "Solicitudes de función",
      pt: "Pedidos de recurso",
      fr: "Demandes de fonctionnalité",
    }),
    adminContacts: L(lang, {
      ja: "問い合わせ",
      en: "Inquiries",
      ko: "문의",
      zh: "咨询",
      es: "Consultas",
      pt: "Consultas",
      fr: "Demandes",
    }),
    adminRedemptions: L(lang, {
      ja: "商品交換申請",
      en: "Redemption Requests",
      ko: "상품 교환 신청",
      zh: "兑换申请",
      es: "Solicitudes de canje",
      pt: "Pedidos de resgate",
      fr: "Demandes d’échange",
    }),
    adminGroupBattles: L(lang, {
      ja: "スクワッドバトル開催",
      en: "Squad Battle Ops",
      ko: "스쿼드 배틀 운영",
      zh: "小队对战运营",
      es: "Ops Squad Battle",
      pt: "Ops Squad Battle",
      fr: "Ops Squad Battle",
    }),
    userFallback: L(lang, {
      ja: "ユーザー",
      en: "User",
      ko: "사용자",
      zh: "用户",
      es: "Usuario",
      pt: "Usuário",
      fr: "Utilisateur",
    }),
    logoutFailed: L(lang, {
      ja: "ログアウトに失敗しました。",
      en: "Failed to log out.",
      ko: "로그아웃에 실패했습니다.",
      zh: "退出登录失败。",
      es: "No se pudo cerrar sesión.",
      pt: "Falha ao sair.",
      fr: "Échec de la déconnexion.",
    }),
    tutorial: L(lang, {
      ja: "チュートリアル",
      en: "Tutorial",
      ko: "튜토리얼",
      zh: "教程",
      es: "Tutorial",
      pt: "Tutorial",
      fr: "Tutoriel",
    }),
  };
}

export type { LocalizedLang };
