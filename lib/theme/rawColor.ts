/**
 * テーマで写さない色。Native の Babel（apps/native/babel/themeColorLiteralsPlugin.js）は
 * `rawColor("...")` の引数リテラルを書き換えない。Web では素通しの恒等関数。
 */
export function rawColor<T extends string>(color: T): T {
  return color;
}
