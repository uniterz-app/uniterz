/** lib の型 import 経由で Web コンポーネントが型チェックに入るため（Native のバンドルには入らない） */
declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}
