"use client";

export default function TeamsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* ===== Cyber Background ===== */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* ベースグラデーション */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(1200px 600px at 15% -10%, rgba(0,220,255,0.25), transparent 60%),
              radial-gradient(900px 500px at 85% 20%, rgba(120,80,255,0.22), transparent 55%),
              radial-gradient(700px 400px at 50% 120%, rgba(0,200,180,0.20), transparent 60%),
              linear-gradient(180deg, #020617 0%, #030b10 100%)
            `,
          }}
        />

        {/* サイバーグリッド（常時スクロール） */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "72px 72px",
            animation: "gridScroll 30s linear infinite",
          }}
        />
      </div>

      {/* ===== Content ===== */}
      <div className="relative z-10">{children}</div>

      {/* ===== Animations ===== */}
      <style jsx global>{`
        @keyframes gridScroll {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(72px);
          }
        }
      `}</style>
    </div>
  );
}
