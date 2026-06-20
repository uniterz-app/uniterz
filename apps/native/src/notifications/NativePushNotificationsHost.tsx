import { useNativePushNotifications } from "../notifications/useNativePushNotifications";

/** メインタブ内でプッシュ通知を登録・タップ遷移を処理 */
export default function NativePushNotificationsHost() {
  useNativePushNotifications(true);
  return null;
}
