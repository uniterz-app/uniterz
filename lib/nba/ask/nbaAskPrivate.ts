/**
 * 見せていない情報は、モデルに渡す前に止める。
 * 画面に出ている使い方・PRO 料金・採点のヘルプ・公開順位・NBA スタッツは対象外。
 * 秘密の実データは道具に載せていない。ここは「それらしい文を作らせない」入口。
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import { nbaAskSubject } from "./nbaAskSubject";
import type { NbaAskTurn } from "./runNbaAsk";

/** 権限・管理者・アクセス権 */
const PERMISSION =
  /権限|パーミッション|\bpermissions?\b|管理者|アクセス権|admin\s*(?:role|access|permission)|who\s+(?:has|can)\s+access/i;

/**
 * PRO / 会員 / ユーザーの人数。規模（DAU・継続率）も含む。
 * 「何人」だけ（先発は何人、など）は試合の話なので含めない。
 */
const HEADCOUNT =
  /(?:プロ|pro|有料|会員|加入者|登録者|ユーザー).{0,24}(?:人数|何人|会員数|ユーザー数|加入者数|登録者数)|(?:人数|何人|会員数|加入者数|ユーザー数|登録者数).{0,24}(?:プロ|pro|有料|会員)|会員数|ユーザー数|加入者数|登録者数|利用者|ダウンロード数|インストール数|どれくらいの人|何人くらい|登録してる人|使ってる人数|\bDAU\b|継続率|コンバージョン|retention|daily active|how many\s+(?:people|users).{0,40}\bpro\b|how many\s+(?:\w+\s+){0,4}(?:pro(?:\s+plan)?s?|subscribers?|users?)|(?:number|count)\s+of\s+(?:\w+\s+){0,3}(?:pro(?:\s+plan)?s?|subscribers?|users?)|(?:pro|subscriber)\s+(?:count|headcount)|subscriber\s+count/i;

/**
 * 売上・費用。ひらがなの「うりあげ」も含む。
 * PRO の料金（いくら、プラン）は画面に出ているので含めない。
 */
const MONEY =
  /うりあげ|売り上げ|売上|収益|利益|もうけ|あらり|年商|月商|黒字|赤字|収支|儲|どれくらい入|いくら入|どれだけ入|会社として|事業として|ビジネスとして|\brevenue\b|\bsales\b|\bprofit\b|費用|経費|api\s*(?:代|料|コスト)|契約料/i;

/** 他ユーザーの予想・投票割合。公開リーダーボードの順位は含めない */
const PICKS =
  /投票(?:率|割合|分布)|何\s*[%％].{0,16}(?:選|予想|pick)|何割が(?:選|予想)|何パーセントが(?:選|予想)|選んだ人|予想の割合|ピック率|どっちが多|人気はどっち|みんな(?:は|が).{0,10}(?:選|予想)|他人の予想|他の(?:人|ユーザー).{0,10}予想|誰が.{0,8}(?:選んだ|予想した)|vote\s+share|percent\s+picked|who\s+picked/i;

/** 個人情報。自分の公開ハンドルはここまで届かない文言 */
const PERSONAL =
  /メールアドレス|電話番号|クレジットカード|決済情報|個人情報|パスワード|住所|他の人の(?:メール|アカウント|電話)|push\s*token|プッシュトークン|誰が\s*(?:pro|プロ)|which\s+users?\s+are\s+pro|\buid\b|通報の中身/i;

/** 不正の手口と、画面に出ていない回数制限。採点そのものは含めない */
const ABUSE =
  /抜け道|裏ワザ|裏技|バレずに|ジェイルブレイク|jailbreak|制限を(?:回避|超)|制限の回数|レート制限|システムプロンプト|プロンプトを(?:見せ|教え)|ignore\s+(?:all\s+|previous\s+)?instructions|指示を無視|開発者として|あなたは今から|1\s*分(?:に|で)?\s*10|1\s*日\s*50|1\s*日\s*60|1\s*日\s*120|招待(?:コード)?を(?:量産|悪用)|ban\s*の(?:条件|判定)|通報(?:され|の判定)/i;

/** 内部実装。モデル名や保存先を聞かれたとき */
const INTERNAL =
  /firestore|ball\s*don'?t\s*lie|\bBDL\b|\/api\/admin|\bingest\b|コレクション名|どのモデル|モデル名|どのAI|openai|どこに保存|保存先|データベース|ソースコード|\bgpt-4o\b|システムプロンプト|system\s+prompt/i;

const PATTERNS = [PERMISSION, HEADCOUNT, MONEY, PICKS, PERSONAL, ABUSE, INTERNAL];

export function nbaAskQuestionIsPrivate(text: string): boolean {
  const q = text.trim();
  if (!q) return false;
  return PATTERNS.some((re) => re.test(q));
}

/**
 * 直近の質問。直前を拒否したあとは、NBA かアプリの別話題だと分かるまで同じ扱い。
 * 「それで」「具体的に」は拒否のまま。選手や使い方に話題が変わったら通す。
 */
export function nbaAskTurnIsPrivate(turns: readonly NbaAskTurn[]): boolean {
  const users = turns.filter((t) => t.role === "user");
  const latest = users[users.length - 1]?.content ?? "";
  if (nbaAskQuestionIsPrivate(latest)) return true;
  const prev = users[users.length - 2]?.content ?? "";
  if (!nbaAskQuestionIsPrivate(prev)) return false;
  const next = nbaAskSubject(latest);
  return next.kind !== "nba" && next.kind !== "app";
}

/** 回答に内部の固有名詞が出たら、その文は捨てる */
const LEAK =
  /firestore|ball\s*don'?t\s*lie|\bBDL\b|\/api\/admin|\bgpt-4o\b|\bopenai\b|system\s+prompt|システムプロンプト|nba[A-Z][A-Za-z]{3,}|コレクション/i;

export function nbaAskAnswerLeaksInternal(text: string): boolean {
  return LEAK.test(text);
}

export function nbaAskRedactedRefusal(language: string): string {
  const lang = resolveLocalizedLang(language);
  return L(lang, {
    ja: "それには答えられません。",
    en: "I can't answer that.",
    ko: "그것에는 답할 수 없습니다.",
    zh: "无法回答。",
    es: "No puedo responder a eso.",
    de: "Dazu kann ich nichts sagen.",
    fr: "Je ne peux pas répondre à ça.",
    ar: "لا أستطيع الإجابة عن ذلك.",
    pt: "Não posso responder a isso.",
  });
}

export function nbaAskPrivateRefusal(
  language: string,
  turns?: readonly NbaAskTurn[]
): string {
  const lang = resolveLocalizedLang(language);
  const latest = [...(turns ?? [])].reverse().find((t) => t.role === "user")?.content ?? "";
  if (MONEY.test(latest)) {
    return L(lang, {
      ja: "売上や費用には答えられません。",
      en: "I can't answer about revenue or costs.",
      ko: "매출이나 비용에는 답할 수 없습니다.",
      zh: "无法回答营收或费用。",
      es: "No puedo responder sobre ingresos ni costes.",
      de: "Zu Umsatz oder Kosten kann ich nichts sagen.",
      fr: "Je ne peux pas répondre sur le chiffre d'affaires ni sur les coûts.",
      ar: "لا أستطيع الإجابة عن الإيرادات أو التكاليف.",
      pt: "Não posso responder sobre receita nem custos.",
    });
  }
  if (PICKS.test(latest)) {
    return L(lang, {
      ja: "他の人の予想や、投票の割合には答えられません。",
      en: "I can't answer about other people's picks or vote shares.",
      ko: "다른 사람의 예상이나 투표 비율에는 답할 수 없습니다.",
      zh: "无法回答别人的预测或投票比例。",
      es: "No puedo responder sobre las predicciones de otros ni los porcentajes.",
      de: "Zu den Tipps anderer oder Stimmanteilen kann ich nichts sagen.",
      fr: "Je ne peux pas répondre sur les pronostics des autres ni sur les parts de vote.",
      ar: "لا أستطيع الإجابة عن توقعات الآخرين أو نسب التصويت.",
      pt: "Não posso responder sobre os palpites dos outros nem sobre as porcentagens.",
    });
  }
  if (HEADCOUNT.test(latest) || PERMISSION.test(latest)) {
    return L(lang, {
      ja: "権限や、PRO の加入人数には答えられません。",
      en: "I can't answer about permissions or how many people are on PRO.",
      ko: "권한이나 PRO 가입자 수에는 답할 수 없습니다.",
      zh: "无法回答权限或 PRO 的加入人数。",
      es: "No puedo responder sobre permisos ni cuántas personas tienen PRO.",
      de: "Zu Rechten oder der Anzahl der PRO-Nutzer kann ich nichts sagen.",
      fr: "Je ne peux pas répondre sur les droits ni sur le nombre d'abonnés PRO.",
      ar: "لا أستطيع الإجابة عن الصلاحيات أو عدد مشتركي PRO.",
      pt: "Não posso responder sobre permissões nem quantas pessoas têm PRO.",
    });
  }
  return nbaAskRedactedRefusal(language);
}
