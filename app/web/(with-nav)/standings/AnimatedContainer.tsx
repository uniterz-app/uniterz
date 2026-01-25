"use client";

import { useEffect, useState } from "react";

export default function AnimatedContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(false);
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      className={`
        relative
        transition-all duration-500 ease-out
        will-change-[opacity,transform,filter]
        ${
          mounted
            ? "opacity-100 scale-100 translate-y-0 blur-0"
            : "opacity-0 scale-[0.96] translate-y-4 blur-[4px]"
        }
      `}
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 22%, black 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 22%, black 100%)",
      }}
    >
      {children}
    </div>
  );
}
