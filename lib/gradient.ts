// 1行目
import { teamColorsB1 } from "./teams-b1";              // ← さっきの辞書を使う
import { deltaE76 } from "./color-distance";            // ← 既に作った距離関数

// 4行目：似ていたら away をセカンダリに切替えるしきい値（大きいほど切替えやすい）
const SIMILARITY_THRESHOLD = 40;

// 7行目：色をちょっと暗くしたり混ぜたりする関数（#RRGGBB を 0〜1 で混合）
const mix = (hex1: string, hex2: string, ratio: number) => {
  const toRgb = (h: string) => {
    const n = h.replace('#', '');
    return [0, 2, 4].map(i => parseInt(n.slice(i, i + 2), 16));
  };
  const [r1, g1, b1] = toRgb(hex1);
  const [r2, g2, b2] = toRgb(hex2);
  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
  return `#${[r, g, b].map(v => v.toString(16).padStart(2, '0')).join('')}`;
};

// 20行目：メインの関数（左＝Away色、右＝Home色）
export const getCardGradient = (awayName: string, homeName: string) => {
  // 22行目：辞書から色を取得（なければグレーでフォールバック）
  const awayColors = teamColorsB1[awayName] ?? { primary: "#CCCCCC", secondary: "#000000" };
  const homeColors = teamColorsB1[homeName] ?? { primary: "#CCCCCC", secondary: "#000000" };

  // 26行目：左右の基本色
  const left = awayColors.primary;   // 左：Away
  let right = homeColors.primary;    // 右：Home

  // 29行目：2色が似ていたら → Home(右) をセカンダリに切り替え
  const dE = deltaE76(left, right);
  if (dE <= SIMILARITY_THRESHOLD) {
    right = homeColors.secondary ?? right;
  }

  // 34行目：右色が #000000 だと真っ黒になりすぎるので、
  //          「Home の primary を 20% 暗くした色」に差し替え（Apple風で見やすく）
  const rightDisplay =
    right?.toLowerCase() === "#000000"
      ? mix(homeColors.primary, "#000000", 0.20)
      : right;

  // 40行目：斜め120度で、中央10〜20%幅だけをなめらかに切り替える
  return `linear-gradient(120deg, ${left} 0%, ${left} 40%, ${rightDisplay} 60%, ${rightDisplay} 100%)`;
};
