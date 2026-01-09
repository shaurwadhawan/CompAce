"use client";

import { useSavedComps } from "@/hooks/useSavedComps";

export default function SaveCompButton({ id }: { id: string }) {
  const { savedIds, toggle } = useSavedComps();
  const saved = savedIds.includes(id);

  return (
    <button
      type="button"
      onClick={() => toggle(id)}
      className={
        saved
          ? "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
          : "rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"
      }
    >
      {saved ? "Saved" : "Save"}
    </button>
  );
}
