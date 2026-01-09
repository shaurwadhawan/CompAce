"use client";

import { useMemo } from "react";


type Mission = {
  id: string | number;
  text: string;
};

export default function MissionCard({
  title,
  missions,
  completedIds,
  onToggle,
  onReset,
}: {
  title: string;
  missions: Mission[];
  completedIds: string[];
  onToggle: (id: string) => void;
  onReset?: () => void;
}) {
  // Clean completedIds to only those present in missions (optional, but good for UI consistency)
  // Actually, standard behavior is usually just check if id is in completedIds.

  const doneCount = missions.filter(m => completedIds.includes(String(m.id))).length;
  const totalCount = missions.length;
  const allDone = totalCount > 0 && doneCount === totalCount;

  return (
    <div className="rounded-2xl border border-black/15 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-black/60">
            {doneCount} / {totalCount} completed {allDone ? "✅" : ""}
          </p>
        </div>

        {onReset && (
          <button
            onClick={onReset}
            className="rounded-lg border border-black/15 px-3 py-1 text-sm hover:bg-black/5"
            type="button"
          >
            Reset
          </button>
        )}
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-black/10">
        <div
          className="h-2 rounded-full bg-black transition-all"
          style={{
            width:
              totalCount === 0
                ? "0%"
                : `${Math.round((doneCount / totalCount) * 100)}%`,
          }}
        />
      </div>

      <ul className="mt-5 space-y-3">
        {missions.map((m) => {
          const mId = String(m.id);
          const isDone = completedIds.includes(mId);
          return (
            <li key={mId} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={isDone}
                onChange={() => onToggle(mId)}
                className="h-4 w-4 accent-black"
              />
              <span className={isDone ? "line-through opacity-60" : ""}>
                {m.text}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

