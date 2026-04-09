"use client";

type SplashLoadingIndicatorProps = {
  className?: string;
};

export default function SplashLoadingIndicator({
  className = "",
}: SplashLoadingIndicatorProps) {
  return (
    <div
      className={`relative inline-block h-[16px] w-[12px] ${className}`}
      role="status"
      aria-label="Loading"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <span
          key={i}
          className="absolute h-[3px] w-[3px] rounded-full bg-white/75"
          style={{
            animation: "splash-dot-orbit 1s steps(6, end) infinite",
            animationDelay: `${i * -0.25}s`,
          }}
        />
      ))}
      <style jsx>{`
        span {
          left: 0;
          top: 0;
        }
        @keyframes splash-dot-orbit {
          0% {
            transform: translate(0px, 0px);
          }
          16.66% {
            transform: translate(9px, 0px);
          }
          33.33% {
            transform: translate(9px, 6px);
          }
          50% {
            transform: translate(9px, 12px);
          }
          66.66% {
            transform: translate(0px, 12px);
          }
          83.33% {
            transform: translate(0px, 6px);
          }
          100% {
            transform: translate(0px, 0px);
          }
        }
      `}</style>
    </div>
  );
}

