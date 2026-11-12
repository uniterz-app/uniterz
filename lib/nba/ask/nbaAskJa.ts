/**
 * 日本語の答え用の言い換え（ケガの部位・ポジション・国）。辞書に無い語が残るときは英語のまま返す（半端な訳を出さない）。
 */

const INJURY_TERMS: ReadonlyArray<[string, string]> = [
  ["Return to Competition Reconditioning", "復帰に向けた調整"],
  ["Health and Safety Protocols", "健康安全プロトコル"],
  ["Plantar Fasciitis", "足底筋膜炎"],
  ["Personal Reasons", "個人的な理由"],
  ["Not With Team", "チーム不在"],
  ["Stress Reaction", "疲労性の損傷"],
  ["Bone Bruise", "骨挫傷"],
  ["Lower Leg", "すね"],
  ["Low Back", "腰"],
  ["Lower Back", "腰"],
  ["Upper Body", "上半身"],
  ["Lower Body", "下半身"],
  ["G League", "Gリーグ"],
  ["Two-Way", "ツーウェイ"],
  ["Arthroscopy", "関節鏡手術"],
  ["Quadriceps", "大腿四頭筋"],
  ["Hamstring", "ハムストリング"],
  ["Concussion", "脳震盪"],
  ["Tendinopathy", "腱障害"],
  ["Tendinitis", "腱炎"],
  ["Tendonitis", "腱炎"],
  ["Inflammation", "炎症"],
  ["Dislocation", "脱臼"],
  ["Laceration", "裂傷"],
  ["Contusion", "打撲"],
  ["Management", "ケア"],
  ["Suspension", "出場停止"],
  ["Conditioning", "コンディション調整"],
  ["Reconditioning", "再調整"],
  ["Impingement", "インピンジメント"],
  ["Tightness", "張り"],
  ["Soreness", "痛み"],
  ["Achilles", "アキレス腱"],
  ["Abdominal", "腹部"],
  ["Shoulder", "肩"],
  ["Meniscus", "半月板"],
  ["Ligament", "靭帯"],
  ["Fracture", "骨折"],
  ["Sciatica", "坐骨神経痛"],
  ["Recovery", "回復"],
  ["Illness", "体調不良"],
  ["Injury", "負傷"],
  ["Surgery", "手術"],
  ["Sprain", "捻挫"],
  ["Strain", "肉離れ"],
  ["Spasms", "けいれん"],
  ["Bruise", "打撲"],
  ["Oblique", "脇腹"],
  ["Pelvis", "骨盤"],
  ["Tendon", "腱"],
  ["Muscle", "筋肉"],
  ["Finger", "指"],
  ["Thumb", "親指"],
  ["Elbow", "肘"],
  ["Wrist", "手首"],
  ["Ankle", "足首"],
  ["Thigh", "太もも"],
  ["Groin", "鼠径部"],
  ["Spine", "脊椎"],
  ["Torn", "断裂"],
  ["Tear", "断裂"],
  ["Knee", "膝"],
  ["Back", "背中"],
  ["Calf", "ふくらはぎ"],
  ["Foot", "足"],
  ["Heel", "かかと"],
  ["Toe", "つま先"],
  ["Hand", "手"],
  ["Neck", "首"],
  ["Head", "頭"],
  ["Nose", "鼻"],
  ["Face", "顔"],
  ["Hip", "股関節"],
  ["Rib", "肋骨"],
  ["Eye", "目"],
  ["Shin", "すね"],
  ["Rest", "休養"],
  ["Left", "左"],
  ["Right", "右"],
  ["ACL", "前十字靭帯"],
  ["MCL", "内側側副靭帯"],
];

const escape = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const INJURY_RE = new RegExp(`\\b(?:${INJURY_TERMS.map(([en]) => escape(en)).join("|")})\\b`, "gi");
const INJURY_MAP = new Map(INJURY_TERMS.map(([en, ja]) => [en.toLowerCase(), ja]));

/** "Right Knee Arthroscopy" → "右膝 関節鏡手術"。知らない語があれば英語のまま */
export function injuryReasonJa(en: string): string {
  const src = en.trim();
  if (!src) return "";
  let out = src.replace(INJURY_RE, (m) => INJURY_MAP.get(m.toLowerCase()) ?? m);
  if (/[A-Za-z]{2,}/.test(out)) return src;
  out = out
    .replace(/\s*\/\s*/g, "・")
    .replace(/(左|右)\s+/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/([\u3040-\u30ff\u4e00-\u9fff])\s+(?=(?:痛み|張り|捻挫|肉離れ|骨折|手術|関節鏡手術|打撲|炎症|ケア|断裂|負傷|けいれん|腱炎|脱臼))/g, "$1の");
  return out.trim();
}

const POSITION: Record<string, string> = { G: "ガード", F: "フォワード", C: "センター" };

/** "F-C" → "フォワード / センター" */
export function positionJa(pos: string): string {
  const parts = pos.split("-").map((p) => POSITION[p.trim().toUpperCase()]);
  return parts.every(Boolean) ? parts.join(" / ") : pos;
}

const COUNTRY: Record<string, string> = {
  USA: "アメリカ",
  "United States": "アメリカ",
  Canada: "カナダ",
  France: "フランス",
  Serbia: "セルビア",
  Slovenia: "スロベニア",
  Greece: "ギリシャ",
  Cameroon: "カメルーン",
  Australia: "オーストラリア",
  Germany: "ドイツ",
  Japan: "日本",
  Spain: "スペイン",
  Lithuania: "リトアニア",
  Latvia: "ラトビア",
  Croatia: "クロアチア",
  Turkey: "トルコ",
  Türkiye: "トルコ",
  Italy: "イタリア",
  Nigeria: "ナイジェリア",
  Senegal: "セネガル",
  "South Sudan": "南スーダン",
  Sudan: "スーダン",
  "DR Congo": "コンゴ民主共和国",
  Congo: "コンゴ",
  Bahamas: "バハマ",
  "Dominican Republic": "ドミニカ共和国",
  "Puerto Rico": "プエルトリコ",
  Brazil: "ブラジル",
  Argentina: "アルゼンチン",
  "New Zealand": "ニュージーランド",
  "United Kingdom": "イギリス",
  England: "イングランド",
  Israel: "イスラエル",
  Georgia: "ジョージア",
  Finland: "フィンランド",
  Sweden: "スウェーデン",
  Switzerland: "スイス",
  Austria: "オーストリア",
  "Czech Republic": "チェコ",
  Montenegro: "モンテネグロ",
  "Bosnia and Herzegovina": "ボスニア・ヘルツェゴビナ",
  Ukraine: "ウクライナ",
  Russia: "ロシア",
  Mali: "マリ",
  Angola: "アンゴラ",
  "South Korea": "韓国",
  China: "中国",
  Philippines: "フィリピン",
  Jamaica: "ジャマイカ",
  Haiti: "ハイチ",
  Netherlands: "オランダ",
  Belgium: "ベルギー",
  Poland: "ポーランド",
  Denmark: "デンマーク",
};

export function countryJa(country: string): string {
  return COUNTRY[country.trim()] ?? country;
}
