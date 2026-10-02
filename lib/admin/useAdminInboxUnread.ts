"use client";

import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import {
  EMPTY_ADMIN_INBOX,
  adminInboxTotal,
  subscribeAdminInboxUnread,
  type AdminInboxCounts,
} from "@/lib/admin/subscribeAdminInboxUnread";

export function useAdminInboxUnread(enabled: boolean): AdminInboxCounts & {
  total: number;
} {
  const [counts, setCounts] = useState<AdminInboxCounts>(EMPTY_ADMIN_INBOX);

  useEffect(() => {
    if (!enabled) {
      setCounts(EMPTY_ADMIN_INBOX);
      return;
    }
    return subscribeAdminInboxUnread(db, setCounts);
  }, [enabled]);

  const total = useMemo(() => adminInboxTotal(counts), [counts]);
  return { ...counts, total };
}
