"use client";

import { useState, useEffect, useCallback } from "react";
import {
    getAssignedMissions,
    addAssignedMissions,
    getCompletedIds,
    toggleCompletedId as localToggleComplete,
    clearCompletedIds,
    type TrackLower,
    type AssignedMission,
} from "@/lib/missions";

export function useMissions(track: TrackLower) {
    const [assigned, setAssigned] = useState<AssignedMission[]>([]);
    const [completedIds, setCompletedIds] = useState<string[]>([]);
    const [isLocal, setIsLocal] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const today = new Date().toLocaleDateString("en-CA");
            // Fetch assigned missions
            const resAssigned = await fetch(`/api/missions?track=${track}&date=${today}`);

            if (resAssigned.status === 401) {
                setIsLocal(true);
                setAssigned(getAssignedMissions(track));
                setCompletedIds(getCompletedIds(track));
            } else if (resAssigned.ok) {
                setIsLocal(false);
                const data = await resAssigned.json();
                setAssigned(Array.isArray(data) ? data : data.missions || []);

                // Fetch completed missions if signed in
                const resCompleted = await fetch(`/api/missions/complete?track=${track}`);
                if (resCompleted.ok) {
                    const cData = await resCompleted.json();
                    setCompletedIds(Array.isArray(cData) ? cData : cData.completed || []);
                }
            } else {
                setIsLocal(true);
                setAssigned(getAssignedMissions(track));
                setCompletedIds(getCompletedIds(track));
            }
        } catch {
            setIsLocal(true);
            setAssigned(getAssignedMissions(track));
            setCompletedIds(getCompletedIds(track));
        } finally {
            setIsLoaded(true);
        }
    }, [track]);

    useEffect(() => {
        refresh();

        const handleUpdate = () => refresh();
        window.addEventListener("compace:update", handleUpdate);
        window.addEventListener("storage", handleUpdate);

        return () => {
            window.removeEventListener("compace:update", handleUpdate);
            window.removeEventListener("storage", handleUpdate);
        };
    }, [refresh]);

    const assignMissions = async (items: Omit<AssignedMission, "createdAt">[]) => {
        const now = Date.now();
        const optimisticAssigned = [
            ...assigned,
            ...items.map(i => ({ ...i, createdAt: now }))
        ];
        // Optimistic unique check? 
        // We lack the scoped IDs locally until refresh. 
        // This makes optimistic UI tricky if we want to show exact server state.
        // But for UI "it appears", appending is fine. 
        // Refresh will fix IDs.
        setAssigned(optimisticAssigned);

        if (isLocal) {
            addAssignedMissions(track, items);
        } else {
            try {
                const today = new Date().toLocaleDateString("en-CA");
                await fetch("/api/missions", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ track, missions: items, date: today }),
                });
                window.dispatchEvent(new Event("compace:update"));
            } catch {
                refresh();
            }
        }
    };

    const toggleComplete = async (missionId: string) => {
        const isCompleted = completedIds.includes(missionId);
        const nextCompleted = isCompleted
            ? completedIds.filter((id) => id !== missionId)
            : [...completedIds, missionId];

        // Optimistic
        setCompletedIds(nextCompleted);

        if (isLocal) {
            localToggleComplete(track, missionId);
        } else {
            try {
                await fetch("/api/missions/complete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ track, missionId, done: !isCompleted }),
                });
                window.dispatchEvent(new Event("compace:update"));
            } catch {
                refresh();
            }
        }
    };

    const resetProgress = async () => {
        const prevCompleted = [...completedIds];
        setCompletedIds([]);

        if (isLocal) {
            clearCompletedIds(track);
        } else {
            try {
                await fetch("/api/missions/complete/batch", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ track, missionIds: prevCompleted, done: false }),
                });
                window.dispatchEvent(new Event("compace:update"));
            } catch {
                refresh();
            }
        }
    };

    return {
        missions: assigned,
        completedIds,
        assignMissions,
        toggleComplete,
        resetProgress,
        isLoaded,
        isLocal,
    };
}
