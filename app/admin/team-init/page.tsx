"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { TEAM_IDS } from "@/lib/team-ids";

export default function TeamInitPage() {
  const [msg, setMsg] = useState("");

  const createTeams = async () => {
    setMsg("作成中…");

    try {
      const entries = Object.entries(TEAM_IDS);

      for (const [name, teamId] of entries) {
        const league = teamId.startsWith("j1-") ? "j" : "bj";

        await setDoc(
          doc(db, "teams", teamId),
          {
            name,
            league,
            record: { w: 0, d: 0, l: 0 },
          },
          { merge: true }
        );
      }

      setMsg(`完了: ${Object.keys(TEAM_IDS).length} チーム作成`);
    } catch (e: any) {
      setMsg("エラー: " + e.message);
    }
  };

  return (
    <main className="p-6 text-white">
      <h1 className="text-xl font-bold mb-4">Team Init</h1>
      <button
        onClick={createTeams}
        className="px-4 py-2 bg-lime-400 text-black rounded-lg font-bold"
      >
        全チームを Firestore に作成
      </button>
      {msg && <p className="mt-4">{msg}</p>}
    </main>
  );
}
