"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const STORAGE_KEY = "compace:savedComps";

function readSaved(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function SavedCompsMini() {
  const [saved, setSaved] = useState<string[]>([]);

  useEffect(() => {
    const refresh = () => setSaved(readSaved());
    refresh();
    window.addEventListener("focus", refresh);
    return () => window.removeEventListener("focus", refresh);
  }, []);

  if (saved.length === 0) {
    return (
      <div className="mt-4 text-sm text-gray-600">
        No saved competitions yet. Go to{" "}
        <Link href="/competitions" className="font-semibold underline">
          Competitions
        </Link>{" "}
        and hit Save.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="text-sm text-gray-700">
        You have <span className="font-semibold">{saved.length}</span> saved.
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {saved.slice(0, 6).map((id) => (
          <span key={id} className="rounded-full bg-gray-100 px-3 py-1 text-xs">
            {id}
          </span>
        ))}
      </div>

      <div className="mt-4">
        <Link
          href="/saved"
          className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"
        >
          View all saved →
        </Link>
      </div>
    </div>
  );
}
