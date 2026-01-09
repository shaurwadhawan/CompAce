// src/lib/profile.ts

export type TrackLower = "coding" | "econ" | "mun" | "olympiad" | "math" | "science";

export type UserProfile = {
  tracks: TrackLower[]; // interests
  preferredMode: "Any" | "Online" | "In-person";
  preferredRegion: "Any" | "Local" | "International";
  levelByTrack: Record<TrackLower, "Beginner" | "Intermediate" | "Advanced">;

  // for “nearest comps later”
  locationText: string; // e.g. "Singapore" or "London"
};

const PROFILE_KEY = "compace:profile";

export function defaultProfile(): UserProfile {
  return {
    tracks: ["coding"], // default
    preferredMode: "Any",
    preferredRegion: "Any",
    levelByTrack: {
      coding: "Beginner",
      econ: "Beginner",
      mun: "Beginner",
      olympiad: "Beginner",
      math: "Beginner",
      science: "Beginner",
    },
    locationText: "",
  };
}

export function readProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return defaultProfile();

    const parsed = JSON.parse(raw);

    const base = defaultProfile();

    const tracks = Array.isArray(parsed?.tracks)
      ? parsed.tracks.filter(
        (t: unknown) => t === "coding" || t === "econ" || t === "mun" || t === "olympiad" || t === "math" || t === "science"
      )
      : base.tracks;

    const preferredMode =
      parsed?.preferredMode === "Online" || parsed?.preferredMode === "In-person"
        ? parsed.preferredMode
        : "Any";

    const preferredRegion =
      parsed?.preferredRegion === "Local" || parsed?.preferredRegion === "International"
        ? parsed.preferredRegion
        : "Any";

    const levelByTrack = { ...base.levelByTrack };
    if (parsed?.levelByTrack && typeof parsed.levelByTrack === "object") {
      (Object.keys(levelByTrack) as TrackLower[]).forEach((k) => {
        const v = parsed.levelByTrack[k];
        if (v === "Beginner" || v === "Intermediate" || v === "Advanced") {
          levelByTrack[k] = v;
        }
      });
    }

    const locationText = typeof parsed?.locationText === "string" ? parsed.locationText : "";

    return { tracks: tracks.length ? tracks : base.tracks, preferredMode, preferredRegion, levelByTrack, locationText };
  } catch {
    return defaultProfile();
  }
}

export function saveProfile(profile: UserProfile) {
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }

  // tell the app to refresh recommendations
  try {
    window.dispatchEvent(new Event("compace:update"));
  } catch {
    // ignore
  }
}
export function hasProfile(): boolean {
  try {
    return !!localStorage.getItem("compace:profile");
  } catch {
    return false;
  }
}

