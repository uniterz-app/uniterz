import GamesPageBackgroundNative from "../features/background/GamesPageBackgroundNative";

/**
 * Web `AppPageBackground` 相当。
 * ルートに1つだけ置き、タブ遷移でアンマウントされない。
 * 常時アニメ／多 Canvas は捨てた軽量背景のみ。
 */
export default function AppPageBackgroundNative() {
  return <GamesPageBackgroundNative lite />;
}
