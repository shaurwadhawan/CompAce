"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSavedComps } from "@/hooks/useSavedComps";
import { allComps, type Comp } from "@/lib/comps";
import {
  CHECKLIST_ITEMS,
  type ChecklistItemId,
  getChecklist,
  toggleChecklistItem,
  resetChecklist,
  getPlanner,
  setPlanner,
  resetPlanner,
  type PlannerData,
  generatePrepPlan,
} from "@/lib/storage";

type SortKey = "deadline" | "track" | "title";
type TrackFilter = "All" | Comp["track"];

function sortByDeadline(a: Comp, b: Comp) {
  const ad = (a.deadlineSort ?? "").trim();
  const bd = (b.deadlineSort ?? "").trim();

  const aHas = ad.length > 0;
  const bHas = bd.length > 0;

  if (aHas && !bHas) return -1;
  if (!aHas && bHas) return 1;
  if (!aHas && !bHas) return a.title.localeCompare(b.title);

  return ad.localeCompare(bd);
}

function formatSavedExport(comps: Comp[]) {
  const lines = comps.map((c, i) => {
    return `${i + 1}. ${c.title} — ${c.track} — ${c.mode} — ${c.region}
   Level: ${c.level} | Deadline: ${c.deadline}
   Details: /competitions/${c.id}
   Apply: ${c.applyUrl}
   Official: ${c.officialUrl}`;
  });

  return `CompAce — Saved Shortlist\n\n${lines.join("\n\n")}\n`;
}

function fmtDateNice(iso: string) {
  try {
    const d = new Date(`${iso}T00:00:00`);
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short" });
  } catch {
    return iso;
  }
}

function addDays(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function buildTimeline(targetDate: string) {
  // 4-step plan relative to target:
  // Rules: -10d, Account: -8d, Draft: -4d, Submit: 0d
  const rules = addDays(targetDate, -10);
  const account = addDays(targetDate, -8);
  const draft = addDays(targetDate, -4);
  const submit = targetDate;

  return [
    { id: "rules", label: "Read rules", date: rules },
    { id: "account", label: "Create account", date: account },
    { id: "draft", label: "Draft submission", date: draft },
    { id: "submit", label: "Submit", date: submit },
  ] as const;
}

export default function SavedPage() {
  const { savedIds, toggle } = useSavedComps();
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("All");
  const [sort, setSort] = useState<SortKey>("deadline");
  const [copied, setCopied] = useState(false);

  // compId -> checklist item ids done
  const [checklists, setChecklists] = useState<Record<string, ChecklistItemId[]>>({});

  // compId -> planner data
  const [planners, setPlanners] = useState<Record<string, PlannerData | null>>({});

  // compId -> form draft
  const [draftPlanner, setDraftPlanner] = useState<
    Record<string, { targetDate: string; notes: string }>
  >({});

  useEffect(() => {
    const refresh = () => {
      // Rebuild dictionary state based on the current savedIds list
      const nextCheck: Record<string, ChecklistItemId[]> = {};
      const nextPlan: Record<string, PlannerData | null> = {};
      const nextDraft: Record<string, { targetDate: string; notes: string }> = {};

      for (const id of savedIds) {
        nextCheck[id] = getChecklist(id);

        const plan = getPlanner(id);
        nextPlan[id] = plan;

        nextDraft[id] = {
          targetDate: plan?.targetDate ?? "",
          notes: plan?.notes ?? "",
        };
      }

      setChecklists(nextCheck);
      setPlanners(nextPlan);
      setDraftPlanner(nextDraft);
    };

    refresh();
    window.addEventListener("compace:update", refresh);
    window.addEventListener("storage", refresh);

    return () => {
      window.removeEventListener("compace:update", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, [savedIds]);

  const [savedDetails, setSavedDetails] = useState<Comp[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (savedIds.length === 0) {
      setSavedDetails([]);
      return;
    }

    setLoading(true);
    // Fetch from API
    fetch(`/api/comps?ids=${savedIds.join(",")}`)
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.items)) {
          setSavedDetails(data.items);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch saved comps", err);
        setLoading(false);
      });
  }, [savedIds]);

  const savedCompsBase = useMemo(() => {
    return savedDetails;
  }, [savedDetails]);

  const hasUnknownDeadlines = useMemo(() => {
    if (savedCompsBase.length === 0) return false;
    return savedCompsBase.some((c) => (c.deadlineSort ?? "").trim().length === 0);
  }, [savedCompsBase]);

  const deadlineLabel = hasUnknownDeadlines ? "Deadline (known first)" : "Deadline";

  const savedComps = useMemo(() => {
    const base =
      trackFilter === "All"
        ? savedCompsBase
        : savedCompsBase.filter((c) => c.track === trackFilter);

    const sorted = [...base].sort((a, b) => {
      if (sort === "deadline") return sortByDeadline(a, b);
      if (sort === "track") {
        const t = a.track.localeCompare(b.track);
        return t !== 0 ? t : a.title.localeCompare(b.title);
      }
      return a.title.localeCompare(b.title);
    });

    return sorted;
  }, [savedCompsBase, trackFilter, sort]);

  const recommendedTop3 = useMemo(() => {
    const notSaved = allComps.filter((c) => !savedIds.includes(c.id));
    return notSaved.slice(0, 3);
  }, [savedIds]);

  const onCopy = async () => {
    try {
      const text = formatSavedExport(savedComps);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignore
    }
  };

  const pillClass = (active: boolean) =>
    active
      ? "rounded-full bg-black px-4 py-2 text-xs font-semibold text-white"
      : "rounded-full border px-4 py-2 text-xs font-semibold hover:bg-black/5";

  const toggleChecklist = (compId: string, item: ChecklistItemId) => {
    setChecklists((prev) => {
      const current = prev[compId] ?? [];
      const next = current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
      return { ...prev, [compId]: next };
    });

    toggleChecklistItem(compId, item);
  };

  const resetOneChecklist = (compId: string) => {
    setChecklists((prev) => ({ ...prev, [compId]: [] }));
    resetChecklist(compId);
  };

  const savePlanner = (compId: string) => {
    const d = draftPlanner[compId];
    if (!d?.targetDate) return;

    const payload: PlannerData = {
      targetDate: d.targetDate,
      notes: d.notes ?? "",
    };

    setPlanners((prev) => ({ ...prev, [compId]: payload }));
    setPlanner(compId, payload);
  };

  const clearPlanner = (compId: string) => {
    setPlanners((prev) => ({ ...prev, [compId]: null }));
    setDraftPlanner((prev) => ({ ...prev, [compId]: { targetDate: "", notes: "" } }));
    resetPlanner(compId);
  };

  // ✅ One-click plan (NEW)
  const autoPlan = (compId: string) => {
    const plan = generatePrepPlan(compId); // also saves to storage.ts
    setPlanners((prev) => ({ ...prev, [compId]: plan }));
    setDraftPlanner((prev) => ({
      ...prev,
      [compId]: { targetDate: plan.targetDate, notes: plan.notes },
    }));
  };

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold">Saved Competitions</h1>
          <p className="mt-2 text-gray-600">
            Your shortlist — keep it tight, then apply strategically.
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm text-gray-600">Saved</div>
          <div className="text-2xl font-bold">{savedIds.length}</div>
        </div>
      </div>

      {/* Action bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onCopy}
            type="button"
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
            disabled={savedComps.length === 0}
          >
            {copied ? "Copied ✅" : "Export shortlist"}
          </button>

          <Link
            href="/competitions"
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"
          >
            Browse competitions
          </Link>

          <Link
            href="/profile"
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"
          >
            Edit profile
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-xl border px-3 py-2 text-sm"
          >
            <option value="deadline">Sort: {deadlineLabel}</option>
            <option value="track">Sort: Track</option>
            <option value="title">Sort: Title A→Z</option>
          </select>
        </div>
      </div>

      {savedIds.length > 0 && sort === "deadline" && hasUnknownDeadlines && (
        <div className="mt-3 text-xs text-gray-600">
          Note: rolling/variable deadlines show after known dates.
        </div>
      )}

      {/* Track filter pills */}
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setTrackFilter("All")}
          className={pillClass(trackFilter === "All")}
        >
          All
        </button>
        {(["Coding", "Econ", "MUN", "Olympiad", "Math", "Science"] as Comp["track"][]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTrackFilter(t)}
            className={pillClass(trackFilter === t)}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {savedIds.length === 0 && (
        <div className="mt-8 grid gap-4">
          <div className="rounded-2xl border bg-white p-6">
            <h2 className="text-xl font-semibold">No saved comps yet</h2>
            <p className="mt-2 text-sm text-gray-600">
              Save 2–5 competitions first. Then this page becomes your shortlist hub
              with apply links + export + checklists + planner.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href="/competitions"
                className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
              >
                Start saving →
              </Link>
              <Link
                href="/dashboard"
                className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"
              >
                View dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-sm text-gray-600">Quick picks</div>
                <div className="text-lg font-semibold">Try these first</div>
              </div>
              <Link href="/competitions" className="text-sm font-semibold underline">
                See all →
              </Link>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {recommendedTop3.map((c) => (
                <div key={c.id} className="rounded-xl border p-4">
                  <h3 className="font-semibold leading-snug">{c.title}</h3>
                  <p className="mt-1 text-xs text-gray-600">
                    {c.track} · {c.mode} · {c.region}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <Link href={`/competitions/${c.id}`} className="text-sm font-semibold underline">
                      Details →
                    </Link>

                    <button
                      onClick={() => toggle(c.id)}
                      className="rounded-lg border px-3 py-2 text-xs font-semibold hover:bg-black/5"
                      type="button"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Saved list */}
      {savedIds.length > 0 && (
        <div className="mt-8 grid gap-4">
          {savedComps.map((c) => {
            const saved = savedIds.includes(c.id);

            const done = checklists[c.id] ?? [];
            const doneCount = done.length;
            const totalCount = CHECKLIST_ITEMS.length;
            const pct = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);

            const planner = planners[c.id];
            const draft = draftPlanner[c.id] ?? { targetDate: "", notes: "" };
            const timeline = planner?.targetDate ? buildTimeline(planner.targetDate) : null;

            return (
              <div key={c.id} className="rounded-2xl border p-5">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold">{c.title}</h2>
                    <p className="mt-1 text-sm text-gray-600">
                      {c.track} · {c.mode} · {c.region}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-700">
                      <span className="rounded-full bg-gray-100 px-3 py-1">Level: {c.level}</span>
                      <span className="rounded-full bg-gray-100 px-3 py-1">
                        Deadline: {c.deadline}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {c.tags.slice(0, 5).map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs text-black/70"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Checklist */}
                    <div className="mt-5 rounded-2xl border border-black/10 bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold">Apply checklist</div>
                          <div className="mt-1 text-xs text-gray-600">
                            {doneCount}/{totalCount} done · {pct}% complete
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => resetOneChecklist(c.id)}
                          className="rounded-lg border border-black/15 px-3 py-1 text-xs font-semibold hover:bg-black/5"
                        >
                          Reset
                        </button>
                      </div>

                      <div className="mt-3 h-2 w-full rounded-full bg-black/10">
                        <div
                          className="h-2 rounded-full bg-black transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="mt-4 grid gap-2 sm:grid-cols-2">
                        {CHECKLIST_ITEMS.map((item) => {
                          const checked = done.includes(item.id);
                          return (
                            <label
                              key={item.id}
                              className="flex items-center gap-3 rounded-xl border border-black/10 px-3 py-2 text-sm hover:bg-black/5"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => toggleChecklist(c.id, item.id)}
                                className="h-4 w-4 accent-black"
                              />
                              <span className={checked ? "line-through opacity-60" : ""}>
                                {item.label}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Planner */}
                    <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-sm font-semibold">Application planner</div>
                          <div className="mt-1 text-xs text-gray-600">
                            Pick a target submit date, or generate one-click.
                          </div>
                        </div>

                        {planner && (
                          <button
                            type="button"
                            onClick={() => clearPlanner(c.id)}
                            className="rounded-lg border border-black/15 px-3 py-1 text-xs font-semibold hover:bg-black/5"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* ✅ 4 columns: date | notes | save | generate */}
                      <div className="mt-4 grid gap-3 sm:grid-cols-[220px_1fr_auto_auto]">
                        <div>
                          <div className="text-xs font-semibold text-gray-700">
                            Target submit date
                          </div>
                          <input
                            type="date"
                            value={draft.targetDate}
                            onChange={(e) =>
                              setDraftPlanner((prev) => ({
                                ...prev,
                                [c.id]: { ...draft, targetDate: e.target.value },
                              }))
                            }
                            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                          />
                        </div>

                        <div>
                          <div className="text-xs font-semibold text-gray-700">Notes</div>
                          <input
                            value={draft.notes}
                            onChange={(e) =>
                              setDraftPlanner((prev) => ({
                                ...prev,
                                [c.id]: { ...draft, notes: e.target.value },
                              }))
                            }
                            placeholder="e.g. need teammate, school approval, etc."
                            className="mt-2 w-full rounded-xl border px-3 py-2 text-sm"
                          />
                        </div>

                        <div className="sm:self-end">
                          <button
                            type="button"
                            onClick={() => savePlanner(c.id)}
                            disabled={!draft.targetDate}
                            className={
                              draft.targetDate
                                ? "w-full rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
                                : "w-full rounded-xl border px-4 py-2 text-sm font-semibold text-black/40"
                            }
                          >
                            Save plan
                          </button>
                        </div>

                        <div className="sm:self-end">
                          <button
                            type="button"
                            onClick={() => autoPlan(c.id)}
                            className="w-full rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"
                          >
                            Generate plan
                          </button>
                        </div>
                      </div>

                      {planner && timeline && (
                        <div className="mt-5">
                          <div className="text-xs font-semibold text-gray-700">
                            Timeline (target: {fmtDateNice(planner.targetDate)})
                          </div>

                          <div className="mt-3 grid gap-2 sm:grid-cols-2">
                            {timeline.map((step) => (
                              <div key={step.id} className="rounded-xl border border-black/10 p-3">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm font-semibold">{step.label}</div>
                                  <div className="text-xs text-gray-600">{fmtDateNice(step.date)}</div>
                                </div>
                                <div className="mt-1 text-xs text-gray-600">
                                  Suggested date: {step.date}
                                </div>
                              </div>
                            ))}
                          </div>

                          {planner.notes && (
                            <div className="mt-3 rounded-xl border border-black/10 bg-white px-3 py-2 text-sm">
                              <span className="font-semibold">Notes:</span> {planner.notes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link
                        href={`/competitions/${c.id}`}
                        className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"
                      >
                        Details
                      </Link>

                      <a
                        href={c.applyUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
                      >
                        Apply →
                      </a>

                      <a
                        href={c.officialUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"
                      >
                        Official site
                      </a>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <button
                      onClick={() => toggle(c.id)}
                      className={
                        saved
                          ? "rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
                          : "rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"
                      }
                      type="button"
                    >
                      {saved ? "Unsave" : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {savedComps.length === 0 && (
            <div className="rounded-2xl border bg-white p-6 text-center">
              <div className="text-lg font-semibold">No matches in this filter</div>
              <p className="mt-2 text-sm text-gray-600">Try switching the track filter to All.</p>
              <button
                type="button"
                onClick={() => setTrackFilter("All")}
                className="mt-4 rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"
              >
                Reset filter
              </button>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
