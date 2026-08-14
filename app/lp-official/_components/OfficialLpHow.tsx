import { CalendarDays, Pencil, Shirt, Trophy, type LucideIcon } from "lucide-react";
import { officialHow } from "@/lib/lp/officialSiteContent";
import OfficialLpShot from "./OfficialLpShot";

const STEP_ICONS: Record<(typeof officialHow.steps)[number]["icon"], LucideIcon> = {
  match: CalendarDays,
  predict: Pencil,
  rank: Trophy,
  exchange: Shirt,
};

export default function OfficialLpHow() {
  return (
    <section id="how" className="olp-section">
      <div className="olp-wrap">
        <p className="olp-h2-en olp-metric">{officialHow.heading}</p>
        <h2 className="olp-h2">{officialHow.headingJa}</h2>
        <p className="olp-lead">{officialHow.lead}</p>
        <ol className="olp-steps">
          {officialHow.steps.map((step) => {
            const Icon = STEP_ICONS[step.icon];
            return (
              <li key={step.no}>
                <div className="olp-step-head">
                  <span className="olp-step-icon" aria-hidden>
                    <Icon strokeWidth={1.75} />
                  </span>
                  <p className="no olp-metric">{step.no}</p>
                </div>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <OfficialLpShot
                  src={step.shot.src}
                  alt={step.shot.alt}
                  className="olp-step-phone"
                  sizes="(max-width: 719px) 54vw, (max-width: 1023px) 176px, 188px"
                />
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
