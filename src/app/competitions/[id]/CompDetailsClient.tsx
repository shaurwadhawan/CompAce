// src/app/competitions/[id]/CompDetailsClient.tsx
"use client";

import { useSavedComps } from "@/hooks/useSavedComps";

export default function CompDetailsClient({ compId }: { compId: string }) {
  const { savedIds, toggle } = useSavedComps();
  const saved = savedIds.includes(compId);

  return (
    <button
      onClick={() => toggle(compId)}
      className={
        saved
          ? "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
          : "rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"
      }
      type="button"
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
