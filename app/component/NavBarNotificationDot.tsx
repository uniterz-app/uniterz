/** 下部ナビのアイコン右上：未読通知ドット */
export default function NavBarNotificationDot() {
  return (
    <span
      className="pointer-events-none absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.75)] ring-2 ring-[rgba(10,14,24,0.85)]"
      aria-hidden
    />
  );
}
