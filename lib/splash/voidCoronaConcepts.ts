/**
 * Void Corona スプラッシュ案 — Native DEV プレビュー用の確定メタ。
 * 参照画: 黒円＋シアン粒子コロナ。尺は約 2 秒前提。
 */

export type VoidCoronaConceptId =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S"
  | "T"
  | "V"
  | "W";

export type VoidCoronaConcept = {
  id: VoidCoronaConceptId;
  nameJa: string;
  nameEn: string;
  noteJa: string;
  noteEn: string;
  /** 本編尺（ホールド前）。D はパルス区間を含む最低尺 */
  totalMs: number;
};

export const VOID_CORONA_CONCEPTS: readonly VoidCoronaConcept[] = [
  {
    id: "A",
    nameJa: "収束 → 刻印",
    nameEn: "Converge",
    noteJa: "粒子が中心へ吸い寄せられ、黒円の内側に白ロゴが静かに刻まれる。",
    noteEn: "Particles fall inward; the white mark imprints inside the void.",
    totalMs: 2200,
  },
  {
    id: "B",
    nameJa: "粒子が U に",
    nameEn: "U Mark",
    noteJa:
      "コロナが寄り、ヘッダー左の U がシアン輪郭→白でロック（SVG 重ね）。",
    noteEn: "Corona gathers; header U locks cyan outline → white (SVG overlay).",
    totalMs: 2400,
  },
  {
    id: "C",
    nameJa: "ポータル通過",
    nameEn: "Portal",
    noteJa: "ロゴが円内に現れ、黒円が開いて Games 空間へ入る。",
    noteEn: "Mark appears in the void; the circle opens into the app.",
    totalMs: 2400,
  },
  {
    id: "D",
    nameJa: "コロナ心拍",
    nameEn: "Pulse",
    noteJa: "縁が呼吸し、データ待ちのあいだロゴが淡く鼓動。確定してから消える。",
    noteEn: "Corona breathes while waiting; mark settles when ready.",
    totalMs: 2200,
  },
  {
    id: "E",
    nameJa: "通過",
    nameEn: "Pass",
    noteJa: "黒円をトンネル入口に、ロゴが手前からくぐって通過する。",
    noteEn: "Void as tunnel mouth — the mark approaches and passes through.",
    totalMs: 2600,
  },
  {
    id: "F",
    nameJa: "通過（U）",
    nameEn: "Pass U",
    noteJa: "案 E と同じ通過。対象はヘッダー左の直立 U マーク。",
    noteEn: "Same pass as E, but with the header U mark.",
    totalMs: 2600,
  },
  {
    id: "G",
    nameJa: "収縮 → 粒子 U",
    nameEn: "Form U",
    noteJa:
      "粒子が U に集まったら消え、白い U がドクン 1 回してから画面へ。",
    noteEn:
      "Particles form the U then vanish; solid U heartbeats once, then enter.",
    totalMs: 2900,
  },
  {
    id: "H",
    nameJa: "粒子 U のまま",
    nameEn: "U Hold",
    noteJa: "収縮して粒子が U になるが、塗りマークにはせず粒子のまま残る。",
    noteEn: "Same assemble into U, but stays as particle matter — no solid fill.",
    totalMs: 2500,
  },
  {
    id: "I",
    nameJa: "粒子 U → 散開",
    nameEn: "U Scatter",
    noteJa: "いったん粒子が U を作ったあと、外側へ散って消える。",
    noteEn: "Particles form the U, then scatter outward and fade.",
    totalMs: 2700,
  },
  {
    id: "J",
    nameJa: "ダークサイバー",
    nameEn: "Dark Cyber",
    noteJa:
      "スキャン線と HUD。暗い粒子が U に収束し、グリッチ後に赤紫の心拍でロック。",
    noteEn:
      "Scanlines + HUD. Dark particles form the U; glitch then magenta heartbeat lock.",
    totalMs: 3000,
  },
  {
    id: "K",
    nameJa: "デジタルスキャン",
    nameEn: "Digital Scan",
    noteJa:
      "座標と数値が流れ、ノイズを経て U がスキャン復元される。解析／AI 系の空気。",
    noteEn:
      "Coords and digits stream, then noise; the U is scan-reconstructed. Analysis / AI mood.",
    totalMs: 2900,
  },
  {
    id: "L",
    nameJa: "リキッドメタル",
    nameEn: "Liquid Metal",
    noteJa:
      "金属粒子が流れ寄り、表面が張ってクロームの U が完成する。高級感寄り。",
    noteEn:
      "Metal particles flow in, a surface skins over, chrome U locks. Premium mood.",
    totalMs: 3000,
  },
  {
    id: "M",
    nameJa: "ブラックリキッド",
    nameEn: "Black Liquid",
    noteJa: "黒い液体がゆっくり流れ、ロゴを形成する。高級感強め。",
    noteEn: "Black liquid flows slowly and forms the logo. Strong luxury.",
    totalMs: 3200,
  },
  {
    id: "N",
    nameJa: "粒子集合",
    nameEn: "Particle Gather",
    noteJa: "暗闇の微細な粒子が中央に集まり、ロゴになる。",
    noteEn: "Fine particles in the dark gather at the center into the logo.",
    totalMs: 3000,
  },
  {
    id: "O",
    nameJa: "スモーク",
    nameEn: "Smoke",
    noteJa: "黒い煙の中からロゴだけが浮かび上がる。重厚。",
    noteEn: "Only the logo rises out of black smoke. Heavy, weighty.",
    totalMs: 3100,
  },
  {
    id: "P",
    nameJa: "ブラッククローム",
    nameEn: "Black Chrome",
    noteJa: "金属面に一本の光が走り、反射でロゴが見える。",
    noteEn: "A single light streak runs across metal; the logo appears in reflection.",
    totalMs: 2800,
  },
  {
    id: "Q",
    nameJa: "ダークガラス",
    nameEn: "Dark Glass",
    noteJa: "黒いガラスの屈折・歪みの中からロゴが現れる。Apple 系の洗練。",
    noteEn: "Logo emerges through black-glass refraction. Apple-like polish.",
    totalMs: 3000,
  },
  {
    id: "R",
    nameJa: "シャドウリビール",
    nameEn: "Shadow Reveal",
    noteJa: "ほぼ真っ黒 → 輪郭だけ → 徐々にロゴ全体。かなりミニマル。",
    noteEn: "Near-black → outline only → full logo. Very minimal.",
    totalMs: 2800,
  },
  {
    id: "S",
    nameJa: "暗いエネルギー波",
    nameEn: "Dark Wave",
    noteJa: "中央から低輝度の波紋が広がり、その瞬間だけロゴが露出する。",
    noteEn: "Dim ripples expand from center; the logo is exposed only in that beat.",
    totalMs: 2900,
  },
  {
    id: "T",
    nameJa: "深海",
    nameEn: "Deep Sea",
    noteJa: "漆黒にごく弱い光線と浮遊粒子。ロゴが深部から近づいてくる。",
    noteEn: "Jet black, faint rays and drift particles; logo approaches from the deep.",
    totalMs: 3200,
  },
  {
    id: "V",
    nameJa: "ダークサイバー II",
    nameEn: "Dark Cyber II",
    noteJa: "黒背景に極細グリッドと走査線。最後だけロゴに光が走る。",
    noteEn: "Fine grid and scanlines on black; light runs the logo only at the end.",
    totalMs: 3000,
  },
  {
    id: "W",
    nameJa: "空間歪曲",
    nameEn: "Lens Warp",
    noteJa: "ロゴ周辺だけ重力レンズのように歪み、形が出現する。",
    noteEn: "Background warps like a gravity lens around the logo as it appears.",
    totalMs: 3000,
  },
] as const;

export const VOID_CORONA_COLORS = {
  bg: "#000000",
  void: "#000000",
  particle: "#9FE8E6",
  particleHot: "#C8FFFC",
  particleCool: "#5BB8B4",
  coronaGlow: "rgba(120, 220, 215, 0.55)",
  logoWhite: "#FFFFFF",
  logoCyan: "#B8FFFC",
  logoSoft: "rgba(255,255,255,0.72)",
} as const;

export function getVoidCoronaConcept(
  id: VoidCoronaConceptId
): VoidCoronaConcept {
  const hit = VOID_CORONA_CONCEPTS.find((c) => c.id === id);
  return hit ?? VOID_CORONA_CONCEPTS[0];
}
