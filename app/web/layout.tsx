// app/web/layout.tsx
"use client";

export default function WebLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // RootLayout の AuthGate / SplashWrapper を再発火させない
  return <>{children}</>;
}
