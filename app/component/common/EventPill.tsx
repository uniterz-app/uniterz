// app/component/event/EventPill.tsx
"use client";

export default function EventPill({
  label,
  color,
}: {
  label: string;
  color: "yellow" | "blue";
}) {
  const styles =
    color === "yellow"
      ? {
          background: "linear-gradient(90deg,#FACC15,#FDE047)",
          color: "#000",
        }
      : {
          background: "linear-gradient(90deg,#60A5FA,#38BDF8)",
          color: "#000",
        };

  return (
    <span
      className="px-2 py-[2px] text-[10px] rounded-full font-bold tracking-widest"
      style={styles}
    >
      {label}
    </span>
  );
}
