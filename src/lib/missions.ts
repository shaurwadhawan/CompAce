// src/lib/missions.ts
"use client";

export type TrackLower = "coding" | "econ" | "mun" | "olympiad" | "math" | "science";

export type AssignedMission = {
  id: string;        // unique stable id
  text: string;      // what shows in the checklist
  fromCompId?: string;
  createdAt: number; // for sorting
};

function keyFor(track: TrackLower) {
  return `compace:assigned:${track}`;
}

function completionKeyFor(track: TrackLower) {
  return `compace:missions:${track}`;
}

export function getAssignedMissions(track: TrackLower): AssignedMission[] {
  try {
    const raw = localStorage.getItem(keyFor(track));
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((x) => x && typeof x.id === "string" && typeof x.text === "string")
      .map((x) => ({
        id: x.id,
        text: x.text,
        fromCompId: typeof x.fromCompId === "string" ? x.fromCompId : undefined,
        createdAt: typeof x.createdAt === "number" ? x.createdAt : Date.now(),
      }));
  } catch {
    return [];
  }
}

export function addAssignedMissions(
  track: TrackLower,
  missions: Omit<AssignedMission, "createdAt">[]
): AssignedMission[] {
  const current = getAssignedMissions(track);

  const now = Date.now();
  const next = [...current];

  for (const m of missions) {
    const exists = next.some((x) => x.id === m.id);
    if (!exists) {
      next.push({ ...m, createdAt: now });
    }
  }

  try {
    localStorage.setItem(keyFor(track), JSON.stringify(next));
  } catch { }

  try {
    window.dispatchEvent(new Event("compace:update"));
  } catch { }

  return next;
}

export function clearAssignedMissions(track: TrackLower) {
  try {
    localStorage.removeItem(keyFor(track));
  } catch { }

  try {
    window.dispatchEvent(new Event("compace:update"));
  } catch { }
}
// Completion logic (migrated from MissionCard)

export function getCompletedIds(track: TrackLower): string[] {
  try {
    const raw = localStorage.getItem(completionKeyFor(track));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function toggleCompletedId(track: TrackLower, id: string): string[] {
  const current = getCompletedIds(track);
  const exists = current.includes(id);
  const next = exists ? current.filter((x) => x !== id) : [...current, id];

  try {
    localStorage.setItem(completionKeyFor(track), JSON.stringify(next));
  } catch { }

  try {
    window.dispatchEvent(new Event("compace:update"));
  } catch { }

  return next;
}

export function clearCompletedIds(track: TrackLower) {
  try {
    localStorage.removeItem(completionKeyFor(track));
  } catch { }

  try {
    window.dispatchEvent(new Event("compace:update"));
  } catch { }
}
