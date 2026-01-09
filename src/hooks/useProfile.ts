"use client";

import { useEffect, useState } from "react";
import { UserProfile } from "@/lib/profile";

export function useProfile() {
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;
        async function fetchProfile() {
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    const data = await res.json();
                    // Minimal validation
                    if (data && Array.isArray(data.tracks)) {
                        if (mounted) setProfile(data as UserProfile);
                    }
                }
            } catch (e) {
                // ignore errors (unauthorized etc)
            } finally {
                if (mounted) setLoading(false);
            }
        }
        fetchProfile();
        return () => {
            mounted = false;
        };
    }, []);

    return { profile, loading };
}
