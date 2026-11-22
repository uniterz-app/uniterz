/**
 * かなで書かれた選手名を英字のロスター名と突き合わせる。読み取りの AI は知らない選手
 * （新人・若手）を似た別人に置き換えることがあり（アレックスサー → Alex Caruso）、
 * 書かれた名前もかなのまま返すので、コードで音を比べる。
 * かな → ローマ字にしたうえで、英語名と同じ「子音の並び」（Alex Sarr / アレックスサー → rks）にそろえる。
 */

const DIGRAPHS: Record<string, string> = {
  キャ: "kya", キュ: "kyu", キョ: "kyo", ギャ: "gya", ギュ: "gyu", ギョ: "gyo",
  シャ: "sha", シュ: "shu", ショ: "sho", シェ: "she", ジャ: "ja", ジュ: "ju", ジョ: "jo", ジェ: "je",
  チャ: "cha", チュ: "chu", チョ: "cho", チェ: "che", ニャ: "nya", ニュ: "nyu", ニョ: "nyo",
  ヒャ: "hya", ヒュ: "hyu", ヒョ: "hyo", ビャ: "bya", ビュ: "byu", ビョ: "byo", ピャ: "pya", ピュ: "pyu", ピョ: "pyo",
  ミャ: "mya", ミュ: "myu", ミョ: "myo", リャ: "rya", リュ: "ryu", リョ: "ryo",
  ティ: "ti", ディ: "di", トゥ: "tu", ドゥ: "du", デュ: "dyu", テュ: "tyu",
  ファ: "fa", フィ: "fi", フェ: "fe", フォ: "fo", フュ: "fyu",
  ウィ: "wi", ウェ: "we", ウォ: "wo", ヴァ: "va", ヴィ: "vi", ヴェ: "ve", ヴォ: "vo",
  ツァ: "tsa", ツィ: "tsi", ツェ: "tse", ツォ: "tso", イェ: "ye", クァ: "kwa", グァ: "gwa",
};

const MONO: Record<string, string> = {
  ア: "a", イ: "i", ウ: "u", エ: "e", オ: "o",
  カ: "ka", キ: "ki", ク: "ku", ケ: "ke", コ: "ko", ガ: "ga", ギ: "gi", グ: "gu", ゲ: "ge", ゴ: "go",
  サ: "sa", シ: "shi", ス: "su", セ: "se", ソ: "so", ザ: "za", ジ: "ji", ズ: "zu", ゼ: "ze", ゾ: "zo",
  タ: "ta", チ: "chi", ツ: "tsu", テ: "te", ト: "to", ダ: "da", ヂ: "ji", ヅ: "zu", デ: "de", ド: "do",
  ナ: "na", ニ: "ni", ヌ: "nu", ネ: "ne", ノ: "no",
  ハ: "ha", ヒ: "hi", フ: "fu", ヘ: "he", ホ: "ho", バ: "ba", ビ: "bi", ブ: "bu", ベ: "be", ボ: "bo",
  パ: "pa", ピ: "pi", プ: "pu", ペ: "pe", ポ: "po",
  マ: "ma", ミ: "mi", ム: "mu", メ: "me", モ: "mo", ヤ: "ya", ユ: "yu", ヨ: "yo",
  ラ: "ra", リ: "ri", ル: "ru", レ: "re", ロ: "ro", ワ: "wa", ヲ: "o", ン: "n", ヴ: "vu",
  ァ: "a", ィ: "i", ゥ: "u", ェ: "e", ォ: "o", ャ: "ya", ュ: "yu", ョ: "yo",
};

const KANA_RE = /[ぁ-ゖァ-ヺー]/;

export function hasKana(text: string): boolean {
  return KANA_RE.test(text);
}

export function hiraganaToKatakana(text: string): string {
  return text.replace(/[ぁ-ゖ]/g, (c) => String.fromCharCode(c.charCodeAt(0) + 0x60));
}

/** 長音・促音は落とす（子音の並びで比べるので要らない） */
export function kanaToRomaji(text: string): string {
  const s = hiraganaToKatakana(text);
  let out = "";
  for (let i = 0; i < s.length; i++) {
    const two = s.slice(i, i + 2);
    if (DIGRAPHS[two]) {
      out += DIGRAPHS[two];
      i++;
      continue;
    }
    const c = s[i]!;
    if (MONO[c]) out += MONO[c];
    else if (c === "ッ" || c === "ー") continue;
    else if (/[a-zA-Z]/.test(c)) out += c.toLowerCase();
    else out += " ";
  }
  return out.replace(/\s+/g, " ").trim();
}

function finishKey(s: string): string {
  return s
    .replace(/v/g, "b")
    .replace(/l/g, "r")
    .replace(/z/g, "s")
    .replace(/[hwy]/g, "")
    .replace(/[aeiou]/g, "")
    .replace(/(.)\1+/g, "$1");
}

/** ローマ字（かなから）の子音の並び */
function romajiKey(romaji: string): string {
  return finishKey(
    romaji
      .toLowerCase()
      .replace(/[^a-z]/g, "")
      .replace(/sh/g, "s")
      .replace(/ch/g, "C")
      .replace(/C/g, "c")
  );
}

/** 英語名の子音の並び。日本語の書き方に寄せる（語末・子音前の r は読まない、c は k / s など） */
function englishKey(name: string): string {
  const words = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\b(jr|sr|ii|iii|iv)\b\.?/g, "")
    .replace(/[^a-z ]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
  return finishKey(
    words
      .map((w) =>
        w
          .replace(/^th/, "t")
          .replace(/stle$/, "sle")
          .replace(/th/g, "s")
          .replace(/t?ch/g, "C")
          .replace(/sh/g, "s")
          .replace(/ph/g, "f")
          .replace(/ck/g, "k")
          .replace(/x/g, "ks")
          .replace(/q/g, "k")
          .replace(/c(?=[eiy])/g, "s")
          .replace(/c/g, "k")
          .replace(/C/g, "c")
          .replace(/g(?=e)/g, "j")
          .replace(/m(?=[bp])/g, "n")
          .replace(/r+(?![aeiouy])/g, "")
      )
      .join("")
  );
}

export function kanaNameKey(written: string): string {
  return romajiKey(kanaToRomaji(written));
}

export function englishNameKey(name: string): string {
  return englishKey(name);
}

/**
 * 質問を AI と言葉の判定に渡す前に直す。指標の言葉をひらがなで書いた質問（3pせいこうりつ・りばうんど）は
 * 漢字・カタカナに（助詞などのひらがなはそのまま）。
 */
const HIRAGANA_STAT_WORDS: ReadonlyArray<[RegExp, string]> = [
  [/せいこうりつ/g, "成功率"],
  [/せいこうすう/g, "成功数"],
  [/けっていりつ/g, "決定率"],
  [/しとうすう/g, "試投数"],
  [/しとう/g, "試投"],
  [/とくてん/g, "得点"],
  [/しってん/g, "失点"],
  [/へいきん/g, "平均"],
  [/しゅつじょうじかん/g, "出場時間"],
  [/せいせき/g, "成績"],
  [/じゅんい/g, "順位"],
  [/しょうはい/g, "勝敗"],
  [/れんしょう/g, "連勝"],
  [/れんぱい/g, "連敗"],
  [/こんき/g, "今季"],
  [/こんしーずん/g, "今シーズン"],
  [/きょねん/g, "去年"],
  [/つぎのしあい/g, "次の試合"],
  [/しあい/g, "試合"],
  [/りばうんど/g, "リバウンド"],
  [/あしすと/g, "アシスト"],
  [/すてぃーる/g, "スティール"],
  [/ぶろっく/g, "ブロック"],
  [/たーんおーばー/g, "ターンオーバー"],
  [/どらいぶ/g, "ドライブ"],
  [/ふりーすろー/g, "フリースロー"],
  [/すりーぽいんと/g, "スリーポイント"],
  [/すりー/g, "スリー"],
  [/らんきんぐ/g, "ランキング"],
  [/すたっつ/g, "スタッツ"],
];

export function normalizeNbaAskQuestion(question: string): string {
  let out = question;
  for (const [re, to] of HIRAGANA_STAT_WORDS) out = out.replace(re, to);
  /** 「Drivetop10」は英単語が切れず AI も言葉の判定も読めない → 「Drive top10」 */
  return out.replace(/([a-z])(?=(?:top|best|worst)\s*\d)/gi, "$1 ");
}
