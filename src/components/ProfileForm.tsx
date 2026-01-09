"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    readProfile,
    saveProfile,
    defaultProfile,
    type TrackLower,
    type UserProfile,
} from "@/lib/profile";
import { setOnboarded } from "@/lib/storage";

// Define the shape of data returned by /api/profile to match UserProfile
// The API returns the same structure, so we can cast it.

const TRACKS: { key: TrackLower; label: string }[] = [
    { key: "coding", label: "Competitive Coding" },
    { key: "econ", label: "Econ / Essay / Case" },
    { key: "mun", label: "MUN / Debate" },
    { key: "olympiad", label: "Olympiad (General)" },
    { key: "math", label: "Math" },
    { key: "science", label: "Science" },
];

const LEVELS = ["Beginner", "Intermediate", "Advanced"] as const;

interface ProfileFormProps {
    mode: "setup" | "edit";
}

export default function ProfileForm({ mode }: ProfileFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<UserProfile>(defaultProfile());
    const [savedToast, setSavedToast] = useState(false);
    const [isDbUser, setIsDbUser] = useState(false);

    useEffect(() => {
        let mounted = true;
        async function init() {
            // 1. Try fetching from DB (for logged in users)
            try {
                const res = await fetch("/api/profile");
                if (res.ok) {
                    // 200 OK means signed in
                    setIsDbUser(true);

                    const data = await res.json();
                    // Check if it's a valid profile response (contains expected fields)
                    if (data && Array.isArray(data.tracks)) {
                        if (mounted) {
                            setProfile(data as UserProfile);
                        }
                        // If in setup mode and already has profile, redirect?
                        // User requested: "Make sure /profile/setup still auto-redirects to /profile if profile already exists."
                        if (mode === "setup" && data.tracks.length > 0) {
                            router.replace("/profile");
                        }
                        return;
                    }
                }
            } catch (e) {
                // ignore
            }

            // 2. Fallback to LocalStorage (for signed out or new DB users with no data)
            const local = readProfile();
            if (mounted) {
                setProfile(local);
                // If we are DB user but have no data (404/empty), we start with default or local?
                // Usually local data shouldn't leak into DB account automatically unless migrated.
                // But for "edit", default is fine.
            }

            if (mounted) setLoading(false);
        }

        init();
        return () => { mounted = false; };
    }, [mode, router]);

    const toggleTrack = (t: TrackLower) => {
        const exists = profile.tracks.includes(t);
        const nextTracks = exists
            ? profile.tracks.filter((x) => x !== t)
            : [...profile.tracks, t];
        // Enforce at least one track? User requirement "Pick at least one" was in setup.
        // Let's allow empty momentarily but validate on save? 
        // Or just keep the logic from previous file: `nextTracks.length ? nextTracks : prev`
        setProfile({ ...profile, tracks: nextTracks });
    };

    const handleSave = async () => {
        if (profile.tracks.length === 0) {
            alert("Please select at least one track.");
            return;
        }

        setSaving(true);
        try {
            if (isDbUser) {
                // Save to DB
                const res = await fetch("/api/profile", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(profile),
                });
                if (!res.ok) throw new Error("Failed to save");
            } else {
                // Save to LocalStorage
                saveProfile(profile);
            }

            // Common success actions
            setOnboarded(true);

            if (mode === "setup") {
                // Redirect to profile page (as requested: "After successful setup, redirect to /profile")
                router.push("/profile");
            } else {
                // Edit mode: show toast
                setSavedToast(true);
                setTimeout(() => setSavedToast(false), 2000);
            }
        } catch (e) {
            alert("Error saving profile");
        } finally {
            setSaving(false);
        }
    };

    // If loading and setup, maybe show spinner? 
    // But purely client-side rendering might flash. 
    // We'll just render content.

    const title = mode === "setup" ? "Welcome to CompAce" : "Your Profile";
    const subtitle = mode === "setup"
        ? "Let's set up your preferences to personalize your experience."
        : "Set preferences so CompAce recommends the right competitions.";
    const btnLabel = saving ? "Saving..." : (mode === "setup" ? "Start Exploring →" : "Save");

    return (
        <div className="mx-auto max-w-3xl px-6 py-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{title}</h1>
                    <p className="mt-2 text-gray-600">{subtitle}</p>
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="rounded-xl bg-black px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    type="button"
                >
                    {btnLabel}
                </button>
            </div>

            {savedToast && (
                <div className="mt-4 rounded-xl border bg-green-50 px-4 py-3 text-sm font-semibold text-green-800">
                    ✅ Saved successfully!
                </div>
            )}

            {/* Track Interests */}
            <section className="mt-8 rounded-2xl border p-6">
                <h2 className="text-lg font-semibold">Tracks you care about</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Choose at least one.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {TRACKS.map((t) => {
                        const active = profile.tracks.includes(t.key);
                        return (
                            <button
                                key={t.key}
                                type="button"
                                onClick={() => toggleTrack(t.key)}
                                className={`rounded-xl border px-4 py-3 text-left text-sm font-semibold transition-all ${active
                                    ? "bg-black text-white border-black"
                                    : "bg-white text-gray-900 border-gray-200 hover:border-black/30"
                                    }`}
                            >
                                {t.label}
                            </button>
                        );
                    })}
                </div>
            </section>

            {/* Preferences */}
            <section className="mt-6 rounded-2xl border p-6">
                <h2 className="text-lg font-semibold">Preferences</h2>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div>
                        <div className="text-sm font-semibold">Preferred mode</div>
                        <select
                            value={profile.preferredMode}
                            onChange={(e) =>
                                setProfile({ ...profile, preferredMode: e.target.value as any })
                            }
                            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                        >
                            <option value="Any">Any</option>
                            <option value="Online">Online</option>
                            <option value="In-person">In-person</option>
                        </select>
                    </div>

                    <div>
                        <div className="text-sm font-semibold">Preferred region</div>
                        <select
                            value={profile.preferredRegion}
                            onChange={(e) =>
                                setProfile({ ...profile, preferredRegion: e.target.value as any })
                            }
                            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                        >
                            <option value="Any">Any</option>
                            <option value="Local">Local</option>
                            <option value="International">International</option>
                        </select>
                    </div>
                </div>

                <div className="mt-5">
                    <div className="text-sm font-semibold">
                        Your location (Optional)
                    </div>
                    <input
                        value={profile.locationText || ""}
                        onChange={(e) => setProfile({ ...profile, locationText: e.target.value })}
                        placeholder='e.g. "Singapore" or "London"'
                        className="mt-2 w-full rounded-xl border px-4 py-2 text-sm outline-none focus:border-black"
                    />
                </div>
            </section>

            {/* Self-rated level */}
            <section className="mt-6 rounded-2xl border p-6">
                <h2 className="text-lg font-semibold">Your level by track</h2>
                <p className="mt-1 text-sm text-gray-600">
                    Helps us recommend the right difficulty.
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    {(Object.keys(profile.levelByTrack) as TrackLower[]).map((k) => (
                        // Only show levels for selected tracks? Or all?
                        // Existing profile page showed all. Let's stick to user selected tracks for cleaner UI usually, 
                        // but the original code showed all. Let's show all but maybe highlight active?
                        // "Ideally make /profile/setup a thin wrapper... reuse same... styling"
                        // Let's just show all to be safe and consistent with previous code.
                        <div key={k} className={`rounded-xl border p-4 ${profile.tracks.includes(k) ? 'bg-white' : 'bg-gray-50 opacity-60'}`}>
                            <div className="text-sm font-semibold">
                                {TRACKS.find((t) => t.key === k)?.label ?? k}
                                {!profile.tracks.includes(k) && <span className="ml-2 text-[10px] font-normal text-gray-500">(Not selected)</span>}
                            </div>
                            <select
                                value={profile.levelByTrack[k]}
                                onChange={(e) =>
                                    setProfile({
                                        ...profile,
                                        levelByTrack: { ...profile.levelByTrack, [k]: e.target.value as any },
                                    })
                                }
                                disabled={!profile.tracks.includes(k)}
                                className="mt-2 w-full rounded-xl border px-3 py-2 text-sm disabled:cursor-not-allowed"
                            >
                                {LEVELS.map((lvl) => (
                                    <option key={lvl} value={lvl}>
                                        {lvl}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                </div>
            </section>

            {mode === "setup" && (
                <div className="mt-8">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full rounded-xl bg-black py-4 text-base font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                        type="button"
                    >
                        {btnLabel}
                    </button>
                </div>
            )}
        </div>
    );
}
