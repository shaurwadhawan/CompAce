"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { allComps, type Comp } from "@/lib/comps";
import { isOnboarded, setOnboarded } from "@/lib/storage";
import { useSavedComps } from "@/hooks/useSavedComps";
import { useProfile } from "@/hooks/useProfile";
import OnboardingCard from "@/components/OnboardingCard";

type SortKey = "recommended" | "saved" | "title" | "deadline" | "newest";
type TrackLower = "coding" | "econ" | "mun" | "olympiad" | "math" | "science";

const trackToLower: Record<Comp["track"], TrackLower> = {
  Coding: "coding",
  Econ: "econ",
  MUN: "mun",
  Olympiad: "olympiad",
  Math: "math",
  Science: "science",
};

interface PaginatedResponse {
  items: Comp[];
  featured?: Comp[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

function readCompletedCount(track: TrackLower): number {
  try {
    const raw = localStorage.getItem(`compace:missions:${track}`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

// ...

export default function CompetitionsPage() {
  const [track, setTrack] = useState<"All" | Comp["track"]>("All");
  const [mode, setMode] = useState<"All" | Comp["mode"]>("All");
  const [region, setRegion] = useState<"All" | Comp["region"]>("All");

  const [query, setQuery] = useState("");
  const [savedOnly, setSavedOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("recommended");
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 12;

  const { savedIds, toggle } = useSavedComps();
  const { profile } = useProfile();
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Data State
  const [apiData, setApiData] = useState<PaginatedResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // Persistence Logic
  const STORAGE_KEY = "compace:filters-v1";
  const [isRestored, setIsRestored] = useState(false); // Validates if we have finished restoring to avoid overwriting with defaults

  // 1. Load from Storage on Mount
  useEffect(() => {
    try {
      const start = localStorage.getItem(STORAGE_KEY);
      if (start) {
        const parsed = JSON.parse(start);
        if (parsed.track) setTrack(parsed.track);
        if (parsed.mode) setMode(parsed.mode);
        if (parsed.region) setRegion(parsed.region);
        if (parsed.sort) setSort(parsed.sort);
        if (typeof parsed.savedOnly === "boolean") setSavedOnly(parsed.savedOnly);
      }
    } catch (e) {
      console.error("Failed to load filters", e);
    } finally {
      setIsRestored(true);
    }
  }, []);

  // 2. Save to Storage on Change (only after restored)
  useEffect(() => {
    if (!isRestored) return;
    const state = { track, mode, region, sort, savedOnly };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [track, mode, region, sort, savedOnly, isRestored]);

  const [completedByTrack, setCompletedByTrack] = useState<
    Record<TrackLower, number>
  >({
    coding: 0,
    econ: 0,
    mun: 0,
    olympiad: 0,
    math: 0,
    science: 0,
  });

  useEffect(() => {
    const refresh = () => {
      setCompletedByTrack({
        coding: readCompletedCount("coding"),
        econ: readCompletedCount("econ"),
        mun: readCompletedCount("mun"),
        olympiad: readCompletedCount("olympiad"),
        math: readCompletedCount("math"),
        science: readCompletedCount("science"),
      });

      setShowOnboarding(!isOnboarded());
    };

    refresh();
    window.addEventListener("compace:update", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("compace:update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  // Fetch from API if logged in
  useEffect(() => {
    if (profile) {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        pageSize: PAGE_SIZE.toString(),
        q: query,
        track: track,
        mode: mode,
        region: region,
        sort: sort,
        savedOnly: savedOnly.toString(),
      });

      fetch(`/api/comps?${params.toString()}`)
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Failed");
        })
        .then((data: PaginatedResponse) => {
          setApiData(data);
          setLoading(false);
        })
        .catch(() => {
          setApiData(null);
          setLoading(false);
        });
    }
  }, [profile, page, query, track, mode, region, sort]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [query, track, mode, region, sort, savedOnly]);


  // Static Logic (Signed Out)
  const normalizedQuery = query.trim().toLowerCase();

  const topTrack = useMemo(() => {
    const entries = Object.entries(completedByTrack) as [TrackLower, number][];
    entries.sort((a, b) => b[1] - a[1]);
    return entries[0]?.[0] ?? "coding";
  }, [completedByTrack]);

  const scoreComp = (c: Comp) => {
    let score = 0;
    if (savedIds.includes(c.id)) score += 40;

    if (profile) {
      // Logic used mainly for 'recommended' top 3, or if sorting by recommended on client
      // But now we server sort.
      // However, Recommended Top 3 still needs this.
      const cTrackLower = trackToLower[c.track] || "coding";
      if (profile.tracks.includes(cTrackLower)) score += 50;
      if (profile.preferredMode === "Any" || profile.preferredMode === c.mode) score += 20;
      if (profile.preferredRegion === "Any" || profile.preferredRegion === c.region) score += 20;
      const userLevel = profile.levelByTrack?.[cTrackLower];
      if (userLevel && c.level.toLowerCase().includes(userLevel.toLowerCase())) {
        score += 15;
      }
    } else {
      const cTrackLower = trackToLower[c.track] || "coding";
      if (cTrackLower === topTrack) score += 35;
      score += Math.min(25, (completedByTrack[cTrackLower] || 0) * 5);
    }
    return score;
  };

  // Determine Source List for display
  const displayList = useMemo(() => {
    if (profile && apiData) {
      return apiData.items;
    }

    // Static Filtering (Signed Out)
    const base = allComps.filter((c) => {
      const matchesFilters =
        (track === "All" || c.track === track) &&
        (mode === "All" || c.mode === mode) &&
        (region === "All" || c.region === region);

      if (!matchesFilters) return false;
      if (savedOnly && !savedIds.includes(c.id)) return false;

      if (!normalizedQuery) return true;

      const haystack = [
        c.title,
        c.track,
        c.mode,
        c.region,
        c.level,
        c.deadline,
        ...(c.tags ?? []),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    return [...base].sort((a, b) => {
      if (sort === "recommended") return scoreComp(b) - scoreComp(a);
      if (sort === "saved") {
        const as = savedIds.includes(a.id) ? 1 : 0;
        const bs = savedIds.includes(b.id) ? 1 : 0;
        if (bs !== as) return bs - as;
      }
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "deadline") return a.deadline.localeCompare(b.deadline);
      return 0; // newest not supported in static
    });
  }, [profile, apiData, track, mode, region, savedOnly, normalizedQuery, sort, savedIds, completedByTrack]); // Simplified deps

  // Recommended Top 3 logic
  const recHeader = profile
    ? `Based on your profile: ${profile.tracks.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(", ")}`
    : `Based on your activity (most active: ${topTrack.toUpperCase()})`;

  const totalResults = profile && apiData ? apiData.total : displayList.length;
  const resultsLabel = `${totalResults} result${totalResults === 1 ? "" : "s"}`;

  // Determine Featured List
  const featuredList = useMemo(() => {
    if (profile && apiData?.featured) {
      return apiData.featured;
    }
    // Fallback or static logic for signed out:
    // Signed out users won't get "featured" from API unless we enable public API.
    // For now, keep generic recommendations if signed out.
    if (!profile) return displayList.slice(0, 3);
    return [];
  }, [profile, apiData, displayList]);

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      {/* ... header ... */}

      {/* ... onboarding ... */}

      {/* Featured / Recommended Section */}
      <div className="mt-7 rounded-2xl border bg-white p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-gray-600">
              {profile && apiData?.featured?.length ? "Featured Competitions" : "Recommended for you"}
            </div>
            <div className="text-base font-semibold">
              {profile && apiData?.featured?.length
                ? "Curated top picks"
                : recHeader}
            </div>
          </div>
          <Link href={profile ? "/profile" : "/dashboard"} className="text-sm font-semibold underline">
            {profile ? "Edit profile →" : "View activity →"}
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {featuredList.map((c) => {
            const saved = savedIds.includes(c.id);
            return (
              <div key={c.id} className="rounded-xl border p-4 flex flex-col justify-between h-full bg-white relative overflow-hidden">
                {/* Visual flare for featured */}
                {profile && apiData?.featured?.length && (
                  <div className="absolute top-0 right-0 p-1.5">
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-full">★ Featured</span>
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    {(!profile || !apiData?.featured) && "Top Pick"}
                    {c.verifiedSource && <span className="text-blue-600 text-[10px] bg-blue-50 border border-blue-100 px-1.5 rounded">Verified</span>}
                  </div>
                  <h3 className="font-semibold leading-snug line-clamp-2" title={c.title}>
                    {c.title}
                  </h3>
                  <p className="mt-1 text-xs text-gray-600">
                    {c.track} · {c.mode} · {c.region}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <Link href={`/competitions/${c.id}`} className="text-sm font-semibold underline">View →</Link>
                  <button
                    onClick={() => toggle(c.id)}
                    className={
                      saved
                        ? "rounded-lg bg-black px-3 py-1.5 text-xs font-semibold text-white"
                        : "rounded-lg border px-3 py-1.5 text-xs font-semibold hover:bg-black/5"
                    }
                  >
                    {saved ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            );
          })}
          {featuredList.length === 0 && (
            <div className="col-span-3 text-center text-sm text-gray-400 py-4">No recommendations yet.</div>
          )}
        </div>
      </div>

      {/* ... filters ... */}

      {/* Filters */}
      <div className="mt-6 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search competitions..."
            className="w-full rounded-xl border px-4 py-2 text-sm outline-none focus:border-black"
          />
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={savedOnly}
              onChange={(e) => setSavedOnly(e.target.checked)}
              className="h-4 w-4 accent-black"
            />
            Saved only
          </label>
        </div>

        <div className="flex flex-wrap gap-3 md:justify-end">
          <select value={track} onChange={(e) => setTrack(e.target.value as any)} className="rounded-xl border px-3 py-2 text-sm">
            <option value="All">All tracks</option>
            <option value="Coding">Coding</option>
            <option value="Econ">Econ</option>
            <option value="MUN">MUN</option>
            <option value="Olympiad">Olympiad</option>
            <option value="Math">Math</option>
            <option value="Science">Science</option>
          </select>

          <select value={mode} onChange={(e) => setMode(e.target.value as any)} className="rounded-xl border px-3 py-2 text-sm">
            <option value="All">All modes</option>
            <option value="Online">Online</option>
            <option value="In-person">In-person</option>
          </select>

          <select value={region} onChange={(e) => setRegion(e.target.value as any)} className="rounded-xl border px-3 py-2 text-sm">
            <option value="All">All regions</option>
            <option value="Global">Global</option>
            <option value="USA">USA</option>
            <option value="UK">UK</option>
            <option value="Canada">Canada</option>
            <option value="India">India</option>
            <option value="Australia">Australia</option>
            <option value="Singapore">Singapore</option>
            <option value="International">International</option>
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-xl border px-3 py-2 text-sm">
            <option value="recommended">Recommended</option>
            <option value="newest">Newest</option>
            <option value="deadline">Deadline</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>
      </div>

      {/* List */}
      <div className="mt-8 grid gap-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500">Loading competitions...</div>
        ) : (
          <>
            {displayList.map((c) => {
              const saved = savedIds.includes(c.id);
              return (
                <div key={c.id} className="rounded-2xl border p-5">
                  <div className="flex items-start justify-between gap-6">
                    <div className="min-w-0">
                      <h2 className="text-xl font-semibold">{c.title}</h2>
                      <div className="mt-1 text-sm text-gray-600">
                        {c.track} · {c.mode} · {c.region}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
                        <span className="rounded-full bg-gray-100 px-3 py-1">Level: {c.level}</span>
                        <span className="rounded-full bg-gray-100 px-3 py-1">Due: {c.deadline}</span>
                      </div>
                      <Link href={`/competitions/${c.id}`} className="mt-4 inline-block text-sm font-semibold underline">
                        View details →
                      </Link>
                    </div>
                    <div className="shrink-0">
                      <button
                        onClick={() => toggle(c.id)}
                        className={saved ? "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white" : "rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"}
                      >
                        {saved ? "Saved" : "Save"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {displayList.length === 0 && (
              <div className="text-center py-10 text-gray-500">No competitions found fitting your criteria.</div>
            )}
          </>
        )}
      </div>

      {/* Pagination Controls (Only for Signed In / API data) */}
      {profile && apiData && apiData.totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm font-medium">Page {page} of {apiData.totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(apiData.totalPages, p + 1))}
            disabled={page === apiData.totalPages}
            className="px-4 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </main>
  );
}
