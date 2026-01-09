"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSavedIds, getStreak } from "@/lib/storage";

type TrackKey = "coding" | "econ" | "mun" | "olympiad";

const TRACKS: { key: TrackKey; label: string }[] = [
  { key: "coding", label: "Coding" },
  { key: "econ", label: "Economics" },
  { key: "mun", label: "MUN" },
  { key: "olympiad", label: "Olympiad" },
];

function readCompleted(track: TrackKey): number {
  try {
    const raw = localStorage.getItem(`compace:missions:${track}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export default function DashboardPage() {
  const [savedCount, setSavedCount] = useState(0);
  const [streak, setStreak] = useState(0);

  const [completed, setCompleted] = useState<Record<TrackKey, number>>({
    coding: 0,
    econ: 0,
    mun: 0,
    olympiad: 0,
  });

  useEffect(() => {
    const refresh = () => {
      setSavedCount(getSavedIds().length);
      setStreak(getStreak());

      setCompleted({
        coding: readCompleted("coding"),
        econ: readCompleted("econ"),
        mun: readCompleted("mun"),
        olympiad: readCompleted("olympiad"),
      });
    };

    refresh();
    window.addEventListener("compace:update", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("compace:update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const totalCompleted = Object.values(completed).reduce((a, b) => a + b, 0);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p className="mt-2 text-gray-600">
        Your daily progress and saved opportunities.
      </p>

      {/* Top cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-600">Daily streak</div>
          <div className="mt-2 text-3xl font-bold">🔥 {streak}</div>
          <div className="text-sm text-gray-500">days in a row</div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-600">Today’s progress</div>
          <div className="mt-2 text-3xl font-bold">{totalCompleted}</div>
          <div className="text-sm text-gray-500">missions completed</div>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-600">Saved competitions</div>
          <div className="mt-2 text-3xl font-bold">{savedCount}</div>
          <Link
            href="/saved"
            className="mt-3 inline-block text-sm font-semibold underline"
          >
            View saved →
          </Link>
        </div>

        <div className="rounded-2xl border p-5">
          <div className="text-sm text-gray-600">Quick start</div>
          <div className="mt-2 text-lg font-semibold">
            Continue today’s missions
          </div>
          <Link
            href="/tracks"
            className="mt-3 inline-block rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Go to tracks
          </Link>
        </div>
      </div>

      {/* Track breakdown */}
      <div className="mt-10">
        <h2 className="mb-4 text-xl font-semibold">Track breakdown</h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {TRACKS.map((t) => (
            <Link
              key={t.key}
              href={`/tracks/${t.key}`}
              className="rounded-xl border p-4 hover:bg-black/5"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold">{t.label}</span>
                <span className="text-sm text-gray-600">
                  {completed[t.key]} done
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}

