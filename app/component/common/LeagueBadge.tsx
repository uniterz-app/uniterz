// app/component/common/LeagueBadge.tsx
"use client";

type Props = {
  league: "B1" | "J1" | string;
  size?: "xs" | "sm";
  variant?: "pill" | "tag" | "dot";
  className?: string;
  labelOverride?: string;
};

const COLORS = {
  B1: {
    bg: "bg-orange-400/15",
    ring: "ring-orange-300/30",
    text: "text-orange-200",
    dot: "bg-orange-300",
    grad: "from-orange-400/35 to-rose-400/25",
  },
  J1: {
    bg: "bg-emerald-400/15",
    ring: "ring-emerald-300/30",
    text: "text-emerald-200",
    dot: "bg-emerald-300",
    grad: "from-emerald-400/35 to-teal-400/25",
  },
  OTHER: {
    bg: "bg-white/10",
    ring: "ring-white/20",
    text: "text-white/80",
    dot: "bg-white/60",
    grad: "from-white/20 to-white/10",
  },
} as const;

function cn(...args: (string | undefined | null | false)[]) {
  return args.filter(Boolean).join(" ");
}

export default function LeagueBadge({
  league,
  size = "sm",
  variant = "pill",
  className,
  labelOverride,
}: Props) {
  const L = (league === "B1" || league === "J1") ? league : "OTHER";
  const c = COLORS[L];

  if (variant === "dot") {
    return (
      <span className={cn("inline-flex items-center gap-1", className)}>
        <span className={cn("h-2 w-2 rounded-full", c.dot)} />
        <span className={cn(size === "xs" ? "text-[11px]" : "text-xs", c.text)}>
          {labelOverride ?? (L === "OTHER" ? league : `${league} specialist`)}
        </span>
      </span>
    );
  }

  if (variant === "tag") {
    return (
      <span
        className={cn(
          "inline-flex items-center px-2 py-0.5 rounded-md ring-1",
          size === "xs" ? "text-[11px]" : "text-xs",
          c.bg, c.ring, c.text, className
        )}
      >
        {labelOverride ?? (L === "OTHER" ? league : `${league} specialist`)}
      </span>
    );
  }

  // pill (default)
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full ring-1",
        "bg-gradient-to-r", c.grad,
        size === "xs" ? "text-[11px]" : "text-xs",
        c.ring, c.text, className
      )}
    >
      {labelOverride ?? (L === "OTHER" ? league : `${league} specialist`)}
    </span>
  );
}
