"use client";

import { StandingTeam } from "./useStandings";

type Props = {
  east: StandingTeam[];
  west: StandingTeam[];
  variant: "mobile" | "web";
};

export function Standings({ east, west, variant }: Props) {
  return (
    <div className={variant === "web" ? "grid grid-cols-2 gap-8" : "space-y-6"}>
      <Conference title="Eastern Conference" teams={east} variant={variant} />
      <Conference title="Western Conference" teams={west} variant={variant} />
    </div>
  );
}

function Conference({
  title,
  teams,
  variant,
}: {
  title: string;
  teams: StandingTeam[];
  variant: "mobile" | "web";
}) {
  return (
    <section>
      <h2 className="font-bold mb-2">{title}</h2>

      {variant === "mobile" ? (
        <div className="space-y-1">
          {teams.map((t, i) => (
            <div key={t.id} className="flex justify-between text-sm py-1">
              <span>{i + 1}. {t.name}</span>
              <span>{t.wins}-{t.losses}</span>
            </div>
          ))}
        </div>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {teams.map((t, i) => (
              <tr key={t.id} className="border-t border-white/10">
                <td className="py-1 w-8">{i + 1}</td>
                <td>{t.name}</td>
                <td className="text-right">{t.wins}-{t.losses}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
