"use client";

export default function MaintenanceOverlay() {
  return (
    <div className="
      fixed inset-0 z-[9999]
      bg-black/70 backdrop-blur-sm
      flex items-center justify-center
      text-center text-white
      p-8
    ">
      <div className="bg-white/10 border border-white/20 rounded-2xl p-8 max-w-sm">
        <h1 className="text-xl font-bold mb-3">メンテナンス中</h1>
        <p className="text-sm opacity-80">
          現在システムメンテナンスを行っています。<br />
        </p>
      </div>
    </div>
  );
}
