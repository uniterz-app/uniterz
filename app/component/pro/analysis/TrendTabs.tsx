"use client";

type Tab = "day" | "month";

type Props = {
  value: Tab;
  onChange: (v: Tab) => void;
};

export default function TrendTabs({ value, onChange }: Props) {
  return (
    <div className="mb-3 flex gap-2">
      <TabButton
        active={value === "day"}
        onClick={() => onChange("day")}
      >
        日別
      </TabButton>
      <TabButton
        active={value === "month"}
        onClick={() => onChange("month")}
      >
        月別
      </TabButton>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-3 py-1 text-xs font-semibold transition
        ${
          active
            ? "bg-white text-black"
            : "border border-white/20 text-white/70 hover:bg-white/10"
        }`}
    >
      {children}
    </button>
  );
}
