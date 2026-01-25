"use client";

export default function TeamGradientBg({
  primary,
  secondary,
}: {
  primary: string;
  secondary: string;
}) {
  return (
    <div
      className="fixed inset-0 -z-20 pointer-events-none"
      style={{
        background: `
          radial-gradient(1200px 600px at 20% -10%, ${primary}33, transparent 60%),
          radial-gradient(900px 500px at 90% 20%, ${secondary}26, transparent 55%),
          linear-gradient(180deg, #05070c 0%, #03050a 100%)
        `,
      }}
    />
  );
}
