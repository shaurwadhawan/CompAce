"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type TrackKey = "coding" | "econ" | "mun" | "olympiad" | "math" | "science";

const tracks: { key: TrackKey; title: string; desc: string; total: number }[] = [
  { key: "coding", title: "Coding", desc: "Arrays, patterns, explanations", total: 3 },
  { key: "econ", title: "Economics", desc: "Articles, frameworks, evaluations", total: 3 },
  { key: "mun", title: "MUN", desc: "Positions, speeches, rebuttals", total: 3 },
  { key: "olympiad", title: "Olympiad", desc: "Past-paper, theorems, full working", total: 3 },
  { key: "math", title: "Math", desc: "Proofs, logic, theorems", total: 3 },
  { key: "science", title: "Science", desc: "Research, labs, theory", total: 3 },
];

function safeReadCompleted(key: TrackKey): number {
  try {
    const raw = localStorage.getItem(`compace:missions:${key}`);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return 0;
    return parsed.filter((x) => typeof x === "number").length;
  } catch {
    return 0;
  }
}

export default function TracksPage() {
  const [doneMap, setDoneMap] = useState<Record<TrackKey, number>>({
    coding: 0,
    econ: 0,
    mun: 0,
    olympiad: 0,
    math: 0,
    science: 0,
  });

  // Load progress on mount
  useEffect(() => {
    setDoneMap({
      coding: safeReadCompleted("coding"),
      econ: safeReadCompleted("econ"),
      mun: safeReadCompleted("mun"),
      olympiad: safeReadCompleted("olympiad"),
      math: safeReadCompleted("math"),
      science: safeReadCompleted("science"),
    });
  }, []);

  // Optional: refresh progress whenever you come back to this tab
  useEffect(() => {
    const onFocus = () => {
      setDoneMap({
        coding: safeReadCompleted("coding"),
        econ: safeReadCompleted("econ"),
        mun: safeReadCompleted("mun"),
        olympiad: safeReadCompleted("olympiad"),
        math: safeReadCompleted("math"),
        science: safeReadCompleted("science"),
      });
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-3xl font-bold">Tracks</h1>
      <p className="mt-2 text-gray-600">Pick a track to start today’s missions.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {tracks.map((t) => {
          const done = doneMap[t.key] ?? 0;
          const pct = t.total === 0 ? 0 : Math.round((done / t.total) * 100);

          return (
            <Link
              key={t.key}
              href={`/tracks/${t.key}`}
              className="rounded-2xl border p-5 transition hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold">{t.title}</div>
                  <div className="mt-1 text-sm text-gray-600">{t.desc}</div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-semibold">{done}/{t.total}</div>
                  <div className="text-xs text-gray-500">{pct}%</div>
                </div>
              </div>

              <div className="mt-4 h-2 w-full rounded-full bg-black/10">
                <div
                  className="h-2 rounded-full bg-black transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="mt-4 text-sm font-medium">Open →</div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
