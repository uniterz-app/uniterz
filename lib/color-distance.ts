// 1行目から全部はる（コピーしてOK）
const hexToRgb = (hex: string) => {
  const m = hex.replace("#", "");
  const bigint = parseInt(m, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
};

const rgbToXyz = ({ r, g, b }: { r: number; g: number; b: number }) => {
  const srgb = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  const [R, G, B] = srgb;
  const X = R * 0.4124 + G * 0.3576 + B * 0.1805;
  const Y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  const Z = R * 0.0193 + G * 0.1192 + B * 0.9505;
  return { X, Y, Z };
};

const xyzToLab = ({ X, Y, Z }: { X: number; Y: number; Z: number }) => {
  const refX = 0.95047, refY = 1.0, refZ = 1.08883;
  const fx = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const x = fx(X / refX), y = fx(Y / refY), z = fx(Z / refZ);
  const L = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);
  return { L, a, b };
};

export const deltaE76 = (h1: string, h2: string) => {
  const toLab = (hex: string) => xyzToLab(rgbToXyz(hexToRgb(hex)));
  const l1 = toLab(h1), l2 = toLab(h2);
  const dl = l1.L - l2.L, da = l1.a - l2.a, db = l1.b - l2.b;
  return Math.sqrt(dl * dl + da * da + db * db);
};
