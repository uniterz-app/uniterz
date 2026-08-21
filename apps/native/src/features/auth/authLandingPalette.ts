/** 起動 Landing / Auth ロックパレット。シアン系は増やさない。fogPeak は霧のグレー上限。 */
export const AUTH_LANDING = {
  void: "#03060a",
  canvas: "#081116",
  surface: "#0a1218",
  ink: "#E9FDFF",
  muted: "#7FB5C2",
  accent: "#00F5FF",
  onAccent: "#050508",
  accentSoft: "rgba(0, 245, 255, 0.78)",
  accentLine: "rgba(0, 245, 255, 0.35)",
  accentDim: "rgba(0, 245, 255, 0.14)",
  accentFill: "rgba(0, 245, 255, 0.16)",
  grid: "rgba(0, 245, 255, 0.06)",
  /** 粒子帯のコア輝度。参考画像寄り。白飛びはしない。 */
  fogPeak: 0.88,
} as const;
