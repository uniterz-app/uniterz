"use client";

import Shared, {
  type BadgeDetailModalProps,
} from "@/app/component/badges/BadgeDetailModal";

export type { BadgeDetailModalProps };

/** Mobile badge palette: shine on artwork. */
export default function BadgeDetailModal(props: BadgeDetailModalProps) {
  return <Shared {...props} shine />;
}
