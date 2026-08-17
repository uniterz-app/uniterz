import type { OfficialAssetBrief } from "@/lib/lp/officialSiteContent";

export default function OfficialLpAssetSlot({
  brief,
}: {
  brief: OfficialAssetBrief;
}) {
  return (
    <p className="olp-asset olp-metric">
      <strong>Asset</strong>
      <span>{brief.placement}</span>
      <span>{brief.asset}</span>
      <span>{brief.subject}</span>
      <span>{brief.spec}</span>
      <span>{brief.notes}</span>
    </p>
  );
}
