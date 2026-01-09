"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSavedIds } from "@/lib/storage";
import { getAssignedMissions, getCompletedIds, TrackLower } from "@/lib/missions";

const TRACKS: TrackLower[] = ["coding", "econ", "mun", "olympiad"];

export default function DataMigration({ user }: { user: { id?: string | null } }) {
    const ranRef = useRef(false);
    const router = useRouter();

    useEffect(() => {
        if (!user?.id || ranRef.current) return;

        const migrateAndRedirect = async () => {
            ranRef.current = true;
            let hasUpdates = false;

            // 1. Check Profile Status (Only if we haven't checked before)
            try {
                const profileRes = await fetch("/api/profile");
                // If 200 but empty body or specific "not onboarded" flag?
                // Our /api/profile returns {} if no profile.
                // Let's check if "tracks" exists.
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    if (!data.tracks || data.tracks.length === 0) {
                        // No profile -> Redirect to setup
                        // But wait, ensure we finish migration first? 
                        // Or migration can happen in background?
                        // Safer to migrate first.
                        router.replace("/profile/setup");
                        return; // Don't block migration, but we are redirecting...
                        // Actually, if we redirect, the migration might abort if the component unmounts.
                        // We should probably redirect AFTER migration.
                    }
                }
            } catch (e) {
                // ignore 
            }

            // ... (Migration logic)
            // 1. Migrate Saved Comps
            const savedIds = getSavedIds();
            if (savedIds.length > 0) {
                await Promise.all(
                    savedIds.map((id) =>
                        fetch("/api/comps/saved", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ compId: id, saved: true }),
                        })
                    )
                );
                localStorage.removeItem("compace:savedComps");
                hasUpdates = true;
            }

            // 2. Migrate Missions (Assigned & Completed)
            for (const track of TRACKS) {
                // A. Assigned
                const assigned = getAssignedMissions(track);
                if (assigned.length > 0) {
                    await fetch("/api/missions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            track,
                            missions: assigned.map((m) => ({
                                id: m.id,
                                text: m.text,
                                fromCompId: m.fromCompId,
                            })),
                        }),
                    });
                    localStorage.removeItem(`compace:assigned:${track}`);
                    hasUpdates = true;
                }

                // B. Completed
                const completedIds = getCompletedIds(track);
                if (completedIds.length > 0) {
                    // Refetch ID mapping strategy as discussed
                    if (assigned.length > 0) {
                        const res = await fetch(`/api/missions?track=${track}`);
                        if (res.ok) {
                            const dbMissions = await res.json();
                            const idsToMark = [];
                            for (const localId of completedIds) {
                                // Robust matching: exact or suffix
                                const match = dbMissions.find((dbm: any) => dbm.id.endsWith(":" + localId) || dbm.id === localId);
                                if (match) {
                                    idsToMark.push(match.id);
                                }
                            }

                            if (idsToMark.length > 0) {
                                await fetch("/api/missions/complete/batch", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ track, missionIds: idsToMark, done: true }),
                                });
                            }
                        }
                    }
                    localStorage.removeItem(`compace:missions:${track}`);
                    hasUpdates = true;
                }
            }

            if (hasUpdates) {
                window.dispatchEvent(new Event("compace:update"));
            }

            // Check profile again and redirect if needed?
            try {
                const profileRes = await fetch("/api/profile");
                if (profileRes.ok) {
                    const data = await profileRes.json();
                    // If empty object or no tracks -> SETUP
                    if (!data || Object.keys(data).length === 0 || !data.tracks) {
                        router.replace("/profile/setup");
                    }
                }
            } catch (e) { }
        };

        migrateAndRedirect();
    }, [user, router]);

    return null;
}
