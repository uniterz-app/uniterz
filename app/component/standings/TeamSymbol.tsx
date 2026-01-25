import { nbaSymbols, TeamSymbolId } from "@/lib/nbaSymbols";

export function TeamSymbol({
  id,
  className = "",
}: {
  id: TeamSymbolId;
  className?: string;
}) {
  return (
    <div
      className={`
        absolute right-4 top-1/2 -translate-y-1/2
        w-24 h-10
        text-white/30
        pointer-events-none
        ${className}
      `}
    >
      <div className="w-full h-full [&>svg]:w-full [&>svg]:h-full">
        {nbaSymbols[id]}
      </div>
    </div>
  );
}
