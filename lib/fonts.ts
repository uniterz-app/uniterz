// app/lib/fonts.ts

import {
  Alfa_Slab_One,
  Noto_Sans_JP,
  Oxanium,
  Rajdhani,
  Space_Grotesk,
  Bebas_Neue,
  Zen_Kaku_Gothic_New,
  M_PLUS_1p,
} from "next/font/google";

/* =========================
   Display / Name Fonts
========================= */

export const nameOxanium = Oxanium({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const nameRajdhani = Rajdhani({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const nameSpace = Space_Grotesk({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const nameBebas = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

/* =========================
   JP / Utility Fonts
========================= */

export const nameZen = Zen_Kaku_Gothic_New({
  subsets: ["latin"],
  weight: ["700", "900"],
  display: "swap",
});

export const nameMplus = M_PLUS_1p({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

/* =========================
   Accent Fonts
========================= */

export const alfa = Alfa_Slab_One({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const jp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["800", "900"],
  display: "swap",
});