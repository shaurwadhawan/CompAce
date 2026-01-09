"use client";

import { useMemo } from "react";
import MissionCard from "@/components/MissionCard";
import { type TrackLower } from "@/lib/missions";
import { useMissions } from "@/hooks/useMissions";

type BaseMission = { id: number; text: string };

export default function TrackMissionsClient({
  track,
  title,
  baseMissions,
}: {
  track: TrackLower;
  title: string;
  baseMissions: BaseMission[];
}) {
  const { missions: assigned, completedIds, toggleComplete, resetProgress } = useMissions(track);

  const merged = useMemo(() => {
    return [
      ...baseMissions.map((m) => ({ id: m.id, text: m.text })),
      ...assigned.map((m) => ({
        id: m.id,
        text: `Prep: ${m.text}`,
      })),
    ];
  }, [baseMissions, assigned]);

  return (
    <>
      <MissionCard
        title={title}
        missions={merged}
        completedIds={completedIds}
        onToggle={(id) => toggleComplete(String(id))}
        onReset={resetProgress}
      />
      {process.env.NODE_ENV !== "production" && (
        <div className="fixed bottom-2 left-2 z-50 rounded bg-black/80 px-2 py-1 text-[10px] font-mono text-white opacity-50 hover:opacity-100">
          MODE: {completedIds.some((i) => i.includes(":")) ? "DB" : "LOCAL"}
        </div>
      )}
    </>
  );
}
