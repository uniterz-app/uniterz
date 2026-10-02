import {
  collection,
  onSnapshot,
  query,
  where,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";

export type AdminInboxCounts = {
  feature: number;
  inbox: number;
  redemptions: number;
};

export const EMPTY_ADMIN_INBOX: AdminInboxCounts = {
  feature: 0,
  inbox: 0,
  redemptions: 0,
};

export function adminInboxTotal(counts: AdminInboxCounts): number {
  return counts.feature + counts.inbox + counts.redemptions;
}

/** 管理者向け新着（問い合わせ未読 + 交換申請 pending） */
export function subscribeAdminInboxUnread(
  db: Firestore,
  onCounts: (counts: AdminInboxCounts) => void
): Unsubscribe {
  let next: AdminInboxCounts = { ...EMPTY_ADMIN_INBOX };
  const emit = () => onCounts({ ...next });

  const unsubContacts = onSnapshot(
    query(collection(db, "contacts"), where("status", "==", "unread")),
    (snap) => {
      let feature = 0;
      let inbox = 0;
      snap.forEach((docSnap) => {
        if (String(docSnap.data()?.type ?? "") === "feature") feature += 1;
        else inbox += 1;
      });
      next = { ...next, feature, inbox };
      emit();
    },
    () => {
      next = { ...next, feature: 0, inbox: 0 };
      emit();
    }
  );

  const unsubRedemptions = onSnapshot(
    query(
      collection(db, "unit_redemptions"),
      where("status", "==", "pending")
    ),
    (snap) => {
      next = { ...next, redemptions: snap.size };
      emit();
    },
    () => {
      next = { ...next, redemptions: 0 };
      emit();
    }
  );

  return () => {
    unsubContacts();
    unsubRedemptions();
  };
}
