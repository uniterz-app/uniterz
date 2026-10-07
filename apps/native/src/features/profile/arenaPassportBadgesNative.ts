/** ARENA PASSPORT バッジ（カラー / 灰色）。Metro は静的 require のみ */
import type { ImageSourcePropType } from "react-native";
import type { ArenaPassportId } from "../../../../../lib/profile/arenaPassport";

const COLOR: Record<ArenaPassportId, ImageSourcePropType> = {
  bos: require("../../../assets/arena-passport/bos.png"),
  bkn: require("../../../assets/arena-passport/bkn.png"),
  nyk: require("../../../assets/arena-passport/nyk.png"),
  phi: require("../../../assets/arena-passport/phi.png"),
  tor: require("../../../assets/arena-passport/tor.png"),
  chi: require("../../../assets/arena-passport/chi.png"),
  cle: require("../../../assets/arena-passport/cle.png"),
  det: require("../../../assets/arena-passport/det.png"),
  ind: require("../../../assets/arena-passport/ind.png"),
  mil: require("../../../assets/arena-passport/mil.png"),
  atl: require("../../../assets/arena-passport/atl.png"),
  cha: require("../../../assets/arena-passport/cha.png"),
  mia: require("../../../assets/arena-passport/mia.png"),
  orl: require("../../../assets/arena-passport/orl.png"),
  was: require("../../../assets/arena-passport/was.png"),
  den: require("../../../assets/arena-passport/den.png"),
  min: require("../../../assets/arena-passport/min.png"),
  okc: require("../../../assets/arena-passport/okc.png"),
  por: require("../../../assets/arena-passport/por.png"),
  uta: require("../../../assets/arena-passport/uta.png"),
  gsw: require("../../../assets/arena-passport/gsw.png"),
  lac: require("../../../assets/arena-passport/lac.png"),
  lal: require("../../../assets/arena-passport/lal.png"),
  phx: require("../../../assets/arena-passport/phx.png"),
  sac: require("../../../assets/arena-passport/sac.png"),
  dal: require("../../../assets/arena-passport/dal.png"),
  hou: require("../../../assets/arena-passport/hou.png"),
  mem: require("../../../assets/arena-passport/mem.png"),
  nop: require("../../../assets/arena-passport/nop.png"),
  sas: require("../../../assets/arena-passport/sas.png"),
};

const GRAY: Record<ArenaPassportId, ImageSourcePropType> = {
  bos: require("../../../assets/arena-passport/gray/bos.png"),
  bkn: require("../../../assets/arena-passport/gray/bkn.png"),
  nyk: require("../../../assets/arena-passport/gray/nyk.png"),
  phi: require("../../../assets/arena-passport/gray/phi.png"),
  tor: require("../../../assets/arena-passport/gray/tor.png"),
  chi: require("../../../assets/arena-passport/gray/chi.png"),
  cle: require("../../../assets/arena-passport/gray/cle.png"),
  det: require("../../../assets/arena-passport/gray/det.png"),
  ind: require("../../../assets/arena-passport/gray/ind.png"),
  mil: require("../../../assets/arena-passport/gray/mil.png"),
  atl: require("../../../assets/arena-passport/gray/atl.png"),
  cha: require("../../../assets/arena-passport/gray/cha.png"),
  mia: require("../../../assets/arena-passport/gray/mia.png"),
  orl: require("../../../assets/arena-passport/gray/orl.png"),
  was: require("../../../assets/arena-passport/gray/was.png"),
  den: require("../../../assets/arena-passport/gray/den.png"),
  min: require("../../../assets/arena-passport/gray/min.png"),
  okc: require("../../../assets/arena-passport/gray/okc.png"),
  por: require("../../../assets/arena-passport/gray/por.png"),
  uta: require("../../../assets/arena-passport/gray/uta.png"),
  gsw: require("../../../assets/arena-passport/gray/gsw.png"),
  lac: require("../../../assets/arena-passport/gray/lac.png"),
  lal: require("../../../assets/arena-passport/gray/lal.png"),
  phx: require("../../../assets/arena-passport/gray/phx.png"),
  sac: require("../../../assets/arena-passport/gray/sac.png"),
  dal: require("../../../assets/arena-passport/gray/dal.png"),
  hou: require("../../../assets/arena-passport/gray/hou.png"),
  mem: require("../../../assets/arena-passport/gray/mem.png"),
  nop: require("../../../assets/arena-passport/gray/nop.png"),
  sas: require("../../../assets/arena-passport/gray/sas.png"),
};

export function arenaPassportBadgeNativeSource(
  id: ArenaPassportId,
  visited: boolean
): ImageSourcePropType {
  return visited ? COLOR[id] : GRAY[id];
}
