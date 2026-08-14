import {
  BarChart3,
  Bell,
  Crosshair,
  FileChartColumn,
  HeartPulse,
  Pencil,
  Shirt,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { officialFeatures } from "@/lib/lp/officialSiteContent";

const FEATURE_ICONS: Record<string, LucideIcon> = {
  prediction: Pencil,
  rankings: Trophy,
  units: Shirt,
  data: BarChart3,
  injury: HeartPulse,
  insight: Crosshair,
  report: FileChartColumn,
  notify: Bell,
};

export default function OfficialLpFeatures() {
  return (
    <section id="features" className="olp-section">
      <div className="olp-wrap">
        <p className="olp-h2-en olp-metric">{officialFeatures.heading}</p>
        <h2 className="olp-h2">{officialFeatures.headingJa}</h2>
        <p className="olp-lead">{officialFeatures.lead}</p>

        <div className="olp-feat-primary">
          {officialFeatures.primary.map((item) => {
            const Icon = FEATURE_ICONS[item.id];
            return (
              <article key={item.id} className="olp-frame">
                <div className="olp-feat-head">
                  {Icon ? (
                    <span className="olp-step-icon" aria-hidden>
                      <Icon strokeWidth={1.75} />
                    </span>
                  ) : null}
                  <h3>{item.name}</h3>
                </div>
                <p>{item.text}</p>
              </article>
            );
          })}
        </div>

        <div className="olp-spec">
          {officialFeatures.items.map((item) => {
            const Icon = FEATURE_ICONS[item.id];
            return (
              <div key={item.id}>
                <div className="olp-spec-label">
                  {Icon ? (
                    <span className="olp-step-icon" aria-hidden>
                      <Icon strokeWidth={1.75} />
                    </span>
                  ) : null}
                  <h3 className="olp-metric">{item.name}</h3>
                </div>
                <p>{item.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
