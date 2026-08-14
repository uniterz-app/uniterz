import {
  TOKUSHOHO_HEADING,
  TOKUSHOHO_LEAD,
  TOKUSHOHO_ROWS,
  TOKUSHOHO_UPDATED_AT,
} from "@/lib/legal/tokushohoCopy";
import LegalScrollScreenNative from "./LegalScrollScreenNative";

export default function CommercialLawScreenNative() {
  return (
    <LegalScrollScreenNative
      title={TOKUSHOHO_HEADING}
      description={TOKUSHOHO_LEAD}
      updatedAt={TOKUSHOHO_UPDATED_AT}
      sections={TOKUSHOHO_ROWS.map((row) => ({
        title: row.label,
        body: row.value,
      }))}
    />
  );
}
