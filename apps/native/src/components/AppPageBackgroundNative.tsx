import GamesPageBackgroundNative from "../features/background/GamesPageBackgroundNative";

/**
 * Web `AppPageBackground` 相当。
 * ルートに1つだけ置き、タブ遷移でアンマウントされない（オーロラ位相も継続）。
 */
export default function AppPageBackgroundNative() {
  return <GamesPageBackgroundNative lite={false} />;
}
