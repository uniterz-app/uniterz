"use client";

export default function Header() {
  return (
    <header className="relative overflow-hidden bg-[#101827]/85 px-6 py-2 md:px-10 md:py-4 text-white shadow-[0_10px_30px_rgba(0,0,0,0.55)]">
      
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top,rgba(80,120,255,0.18),transparent_60%)]" />
      </div>

      {/* container */}
      <div className="relative mx-auto flex w-full flex-col items-center gap-0.5 max-w-[520px] md:max-w-[900px] lg:max-w-[1200px]">

        {/* UNITERZ */}
        <div
          className="text-[22px] md:text-[28px] tracking-[0.35em] text-cyan-200/80"
          style={{ fontFamily: "Bebas Neue" }}
        >
          UNITERZ
        </div>

        {/* cyber line */}
        <div className="relative w-full">
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-90" />
          <div className="absolute inset-0 blur-sm bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-60" />
        </div>

      </div>
    </header>
  );
}