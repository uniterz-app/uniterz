"use client";

export default function Header() {
  return (
    <header className="relative z-10 overflow-hidden bg-app px-6 py-2 md:px-10 md:py-4 text-white shadow-[0_10px_30px_rgba(0,0,0,0.62)]">
      {/* background glow */}
      <div className="pointer-events-none absolute inset-0 opacity-40">
        <div className="absolute left-0 top-0 h-full w-full bg-[radial-gradient(circle_at_top,rgba(255,140,60,0.16),transparent_58%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,120,40,0.06),transparent_45%)]" />
      </div>

      {/* container */}
      <div className="relative mx-auto flex w-full max-w-[520px] flex-col items-center gap-0.5 md:max-w-[900px] lg:max-w-[1200px]">
        {/* UNITERZ */}
        <div
          className="text-[22px] tracking-[0.35em] text-orange-100/85 md:text-[28px]"
          style={{ fontFamily: "Bebas Neue" }}
        >
          UNITERZ
        </div>

        {/* cyber line + light sweep */}
        <div className="relative w-full">
          <div className="relative z-1 h-[2px] w-full overflow-hidden rounded-full">
            <div className="absolute inset-0 bg-linear-to-r from-transparent via-cyan-300 to-transparent opacity-95" />
            <div
              className="animate-header-cyber-sweep pointer-events-none absolute inset-y-0 left-0 w-[42%] max-w-[220px] opacity-90 will-change-transform"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 35%, rgba(224,255,255,0.95) 50%, rgba(255,255,255,0.35) 65%, transparent 100%)",
              }}
              aria-hidden
            />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 top-0 z-0 h-[2px] bg-linear-to-r from-transparent via-cyan-300 to-transparent opacity-70 blur-sm"
            aria-hidden
          />
        </div>
      </div>
    </header>
  );
}
