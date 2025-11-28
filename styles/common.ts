// styles/theme.ts
export const theme = {
  page: {
    bg: "#0a3b47",   // ← 背景色
    padding: "18px 12px 40px",
    maxWidth: 960,
  },
  card: {
    bg: "rgba(121, 179, 145, 0.18)", // ← カード色
    radius: 24,
    padding: "18px 16px",
    shadow: "0 6px 18px rgba(0,0,0,0.18)",
    border: "1px solid rgba(255,255,255,0.06)",
  },
  fonts: {
    base: '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif',
    impact: 'Impact, Haettenschweiler, "Arial Black", sans-serif',
  },
  colors: {
    text: "#fff",
    subtext: "rgba(255,255,255,0.75)",
    primary: "#6f8df8",
    success: "#9bbf4a",
  },
} as const;
