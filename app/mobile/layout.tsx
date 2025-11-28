// app/mobile/layout.tsx
"use client";

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ★ AuthGate は RootLayout で全体を包んでいるため、
  //   ここでは children をそのまま返すだけでOK
  return <>{children}</>;
}
