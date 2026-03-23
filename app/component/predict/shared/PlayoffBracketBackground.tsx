"use client";

export default function PlayoffBracketBackground() {
  const radius = 28;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{
        borderRadius: radius,
      }}
    >
      {/* base color */}
      <div
        className="absolute inset-0"
        style={{
          background: "#020611",
          borderRadius: radius,
        }}
      />

      {/* soft center glow */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          background:
            "radial-gradient(circle at 50% 40%, rgba(80,120,255,0.12), transparent 65%)",
        }}
      />

      {/* edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          background:
            "radial-gradient(circle at center, transparent 55%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* subtle top light */}
      <div
        className="absolute inset-0"
        style={{
          borderRadius: radius,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.03), transparent 30%)",
        }}
      />
    </div>
  );
}