"use client";

import { useState, useEffect, useCallback } from "react";
import { getSavedIds, toggleSaved as localToggle, broadcastUpdate } from "@/lib/storage";

export function useSavedComps() {
    const [savedIds, setSavedIds] = useState<string[]>([]);
    const [isLocal, setIsLocal] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch("/api/comps/saved");
            if (res.status === 401) {
                setIsLocal(true);
                setSavedIds(getSavedIds());
            } else if (res.ok) {
                setIsLocal(false);
                const data = await res.json();
                setSavedIds(Array.isArray(data) ? data : []);
            } else {
                // Fallback on error
                setIsLocal(true);
                setSavedIds(getSavedIds());
            }
        } catch {
            setIsLocal(true);
            setSavedIds(getSavedIds());
        } finally {
            setIsLoaded(true);
        }
    }, []);

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

    const toggle = async (id: string) => {
        const isSaved = savedIds.includes(id);
        const nextIds = isSaved ? savedIds.filter((x) => x !== id) : [...savedIds, id];

        // Optimistic update
        setSavedIds(nextIds);

        if (isLocal) {
            localToggle(id);
        } else {
            try {
                await fetch("/api/comps/saved", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ compId: id, saved: !isSaved }),
                });
                broadcastUpdate();
            } catch {
                refresh();
            }
        }
    };

    return { savedIds, toggle, isLoaded };
}
