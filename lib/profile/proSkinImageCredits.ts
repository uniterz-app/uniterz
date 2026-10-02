/**
 * 写真素材マップ系 Pro Skin の出典表記（Web / Native 共通）
 * 一覧・根拠: docs/pro-skin-image-credits.md
 *
 * CC BY は表記が利用条件。PD / CC0 も機関の慣行としてクレジットを併記する。
 * Hubble / Webb で ESA が共同クレジットの画像は、ESA 版が CC BY 4.0 のため安全側で CC BY 表記にする。
 * Dust / Ash は手続き生成（元画像なし）のため対象外。
 */

import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export type ProSkinImageLicense = "CC BY 4.0" | "Public domain" | "CC0";

export type ProSkinImageCredit = {
  credit: string;
  license: ProSkinImageLicense;
  sourceUrl: string;
};

const CC_BY_4_URL = "https://creativecommons.org/licenses/by/4.0/";

const CREDITS: Record<string, ProSkinImageCredit> = {
  "beast-startrail": {
    credit: "ESO/B. Tafreshi (twanight.org)",
    license: "CC BY 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Whirling_Southern_Star_Trails_over_ALMA.jpg",
  },
  "beast-nova": {
    credit: "NASA, ESA, CSA, STScI",
    license: "CC BY 4.0",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:HD_92145.jpg",
  },
  "beast-lavaflow": {
    credit: "NPS / Gwen Gerber",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Lava_in_Hawai%27i_Volcanoes_National_Park._NPS-Gwen_Gerber_(18496158498).jpg",
  },
  "beast-marscrust": {
    credit: "NASA/JPL/University of Arizona",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:The_Slow_Charm_of_Brain_Terrain_(47290496341).jpg",
  },
  "beast-lunar": {
    credit: "NASA/GSFC/Arizona State University",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Copernicus_(LRO).png",
  },
  "beast-nebula": {
    credit: "NASA, H. Ford (JHU), the ACS Science Team and ESA",
    license: "CC BY 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Hubble%27s_newest_camera_images_ghostly_star-forming_pillar_of_gas_and_dust_(heic0206c).jpg",
  },
  "beast-galaxy": {
    credit: "ESA/Webb, NASA & CSA",
    license: "CC BY 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Webb-_Dwarf_stars_in_a_glittering_sky_(54993343816).jpg",
  },
  "beast-solar": {
    credit: "NSO/NSF/AURA",
    license: "CC BY 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:NSF%E2%80%99s_Inouye_Solar_Telescope_First_Light_(cropped)_(NSO-DKIST-firstlight-crop).jpg",
  },
  "beast-jovian": {
    credit: "NASA/JPL",
    license: "Public domain",
    sourceUrl: "https://photojournal.jpl.nasa.gov/catalog/PIA00022",
  },
  "beast-rings": {
    credit: "NASA/JPL-Caltech/Space Science Institute",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:PIA21433_-_Cassini_Targets_a_Propeller_in_Saturn's_A_Ring.jpg",
  },
  "beast-europa": {
    credit: "NASA/JPL-Caltech/SETI Institute",
    license: "Public domain",
    sourceUrl: "https://photojournal.jpl.nasa.gov/catalog/PIA19048",
  },
  "beast-dunes": {
    credit: "NASA/JPL-Caltech/University of Arizona (HiRISE)",
    license: "CC0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Southerly_Dunes_in_North_Polar_Erg_-_Flickr_-_UAHiRISE_(NASA).jpg",
  },
  "beast-aurora": {
    credit: "NASA (ISS Expedition 23 crew)",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Aurora_Australis_From_ISS.JPG",
  },
  "beast-flame": {
    credit: "NASA/JPL-Caltech (WISE)",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Flame_nebula_WISE.jpg",
  },
  "beast-pluto": {
    credit: "NASA/APL/SwRI",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:NH-Pluto-bw-NewHorizons-20150713a.jpg",
  },
  "beast-saturn": {
    credit: "NASA/JPL/Space Science Institute",
    license: "Public domain",
    sourceUrl: "https://commons.wikimedia.org/wiki/File:Saturn_closeup.jpg",
  },
  "beast-nightearth": {
    credit: "NASA Goddard Space Flight Center",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Black_Marble_-_Asia_and_Australia_(8246893143).jpg",
  },
  "beast-corona": {
    credit: "NASA/SDO (NASA's Scientific Visualization Studio)",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Continued_Strong_Solar_Flare_Activity-_May_10-14,_2024_(SVS14589_-_SDO_171_5-14-2024_0211).png",
  },
  "beast-crab": {
    credit: "NASA, ESA, J. Hester and A. Loll (Arizona State University)",
    license: "CC BY 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Crab_Nebula.jpg",
  },
  "beast-helix": {
    credit: "NASA, ESA, C.R. O'Dell (Vanderbilt University), M. Meixner and P. McCullough (STScI)",
    license: "CC BY 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:A_new_view_of_the_Helix_Nebula_(opo0432d).jpg",
  },
  "beast-pillars": {
    credit: "NASA, ESA, CSA, STScI",
    license: "CC BY 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Pillars_of_Creation_(NIRCam_Image).jpg",
  },
  "beast-neptune": {
    credit: "NASA/JPL",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Neptune_Full_(original).jpg",
  },
  "beast-io": {
    credit: "NASA/JPL (Galileo)",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Image-Io_highest_resolution_true_color.jpg",
  },
  "beast-lena": {
    credit: "NASA/USGS Landsat",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Lena_River_Delta_-_Landsat_2000.jpg",
  },
  "beast-hurricane": {
    credit: "NASA (ISS)",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Hurricane_Florence_Viewed_from_the_Space_Station.jpg",
  },
  "beast-andromeda": {
    credit: "NASA/JPL-Caltech (GALEX)",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Andromeda_galaxy_-_GALEX_(rotated).jpg",
  },
  "beast-southernring": {
    credit: "NASA, ESA, CSA, STScI",
    license: "CC BY 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:JWST_SouthernRingNebula.png",
  },
  "beast-deepfield": {
    credit: "NASA",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Hubble-ultra-deep-field-20091208-WFC3-IR-full.jpg",
  },
  "beast-milkyway": {
    credit: "NASA/JPL-Caltech/ESA/CXC/STScI",
    license: "CC BY 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Center_of_the_Milky_Way_Galaxy_IV_%E2%80%93_Composite.jpg",
  },
  "beast-shoals": {
    credit: "NASA Earth Observatory / USGS Landsat",
    license: "Public domain",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Great_Bahama_Bank_2020.jpeg",
  },
  "beast-uranus": {
    credit: "NASA, ESA, CSA, STScI",
    license: "CC BY 4.0",
    sourceUrl:
      "https://commons.wikimedia.org/wiki/File:Uranus_Wide_(NIRCam_Image)_(2023-150).png",
  },
};

export function proSkinImageCredit(id: string): ProSkinImageCredit | null {
  return CREDITS[id] ?? null;
}

export function proSkinImageLicenseUrl(
  credit: ProSkinImageCredit
): string | null {
  return credit.license === "CC BY 4.0" ? CC_BY_4_URL : null;
}

/** 例: "Image: ESO/B. Tafreshi · CC BY 4.0 · 加工あり" */
export function formatProSkinImageCreditLine(
  credit: ProSkinImageCredit,
  language: string
): string {
  const lang = resolveLocalizedLang(language);
  const modified = L(lang, {
    ja: "加工あり",
    en: "modified",
    ko: "가공됨",
    zh: "已加工",
    es: "modificada",
    pt: "modificada",
    fr: "modifiée",
  });
  const image = L(lang, {
    ja: "画像",
    en: "Image",
    ko: "이미지",
    zh: "图片",
    es: "Imagen",
    pt: "Imagem",
    fr: "Image",
  });
  return `${image}: ${credit.credit} · ${credit.license} · ${modified}`;
}
