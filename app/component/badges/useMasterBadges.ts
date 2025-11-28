"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type MasterBadge = {
  id: string;
  title: string;
  description: string;
  icon?: string;
};

export function useMasterBadges() {
  const [badges, setBadges] = useState<MasterBadge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBadges() {
      try {
        const col = collection(db, "master_badges");
        const snap = await getDocs(col);

        const list: MasterBadge[] = [];
        snap.forEach((d) => {
          const data = d.data() as Omit<MasterBadge, "id">;

          list.push({
            id: d.id, // 🔥 Firestore のドキュメントIDを採用（最重要）
            title: data.title,
            description: data.description,
            icon: data.icon,
          });
        });

        setBadges(list);
      } catch (e) {
        console.error("Failed to load master_badges:", e);
        setBadges([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBadges();
  }, []);

  return { badges, loading };
}
