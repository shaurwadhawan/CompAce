"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { type TrackLower } from "@/lib/missions";
import { useMissions } from "@/hooks/useMissions";

type PrepItem = {
  id: string;
  text: string;
  fromCompId: string;
};

// local helper (don’t depend on missions.ts exports that may change)
function toTrackLower(track: string): TrackLower {
  const t = (track || "").toLowerCase();
  if (t.includes("coding")) return "coding";
  if (t.includes("econ")) return "econ";
  if (t.includes("mun")) return "mun";
  if (t.includes("math")) return "math";
  if (t.includes("science")) return "science";
  return "olympiad";
}

function buildSuggestedPrep(trackLower: TrackLower, compTitle: string) {
  const title = compTitle?.trim() || "this competition";

  if (trackLower === "coding") {
    return {
      title: `Prep for ${title}`,
      items: [
        { id: "p1", text: "Solve 2 medium problems (arrays/strings)" },
        { id: "p2", text: "Review one algorithm pattern (two pointers / prefix sums)" },
        { id: "p3", text: "Write a short solution explanation for one problem" },
      ],
    };
  }

  if (trackLower === "econ") {
    return {
      title: `Prep for ${title}`,
      items: [
        { id: "p1", text: "Read one related economics article + 5 bullet takeaways" },
        { id: "p2", text: "Outline a case framework (problem → drivers → options → recommendation)" },
        { id: "p3", text: "Write a 150-word evaluation (pros/cons + judgement)" },
      ],
    };
  }

  if (trackLower === "mun") {
    return {
      title: `Prep for ${title}`,
      items: [
        { id: "p1", text: "Research country position + 3 credible sources" },
        { id: "p2", text: "Draft a 60-second opening speech (hook → policy → ask)" },
        { id: "p3", text: "Prepare 2 rebuttals + 2 questions for opponents" },
      ],
    };
  }

  if (trackLower === "math") {
    return {
      title: `Prep for ${title}`,
      items: [
        { id: "p1", text: "Solve 5 practice problems (timed)" },
        { id: "p2", text: "Review a key formula/theorem" },
        { id: "p3", text: "Write a clear proof for one problem" },
      ],
    };
  }

  if (trackLower === "science") {
    return {
      title: `Prep for ${title}`,
      items: [
        { id: "p1", text: "Read a section of a textbook/paper" },
        { id: "p2", text: "Review an experimental method" },
        { id: "p3", text: "Summarize a scientific concept" },
      ],
    };
  }

  // olympiad
  return {
    title: `Prep for ${title}`,
    items: [
      { id: "p1", text: "Solve 3 past-paper problems (timed)" },
      { id: "p2", text: "Review one core theorem + 3 example applications" },
      { id: "p3", text: "Write full working neatly for 1 problem" },
    ],
  };
}

export default function RecommendedPrepClient({
  compId,
  compTitle,
  compTrack,
}: {
  compId: string;
  compTitle: string;
  compTrack: string;
}) {
  const trackLower = useMemo(() => toTrackLower(compTrack), [compTrack]);

  // Initial recommendation is static
  const basicRec = useMemo(() => buildSuggestedPrep(trackLower, compTitle), [trackLower, compTitle]);

  // Custom AI rec state
  const [aiRec, setAiRec] = useState<{ id: string; text: string }[] | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Effective items (either AI or basic)
  const itemsDisplay = aiRec || basicRec.items;

  const [added, setAdded] = useState(false);
  // “done” = completed in that track (based on MissionCard completion store)
  const { missions: assigned, completedIds, assignMissions } = useMissions(trackLower);

  const fetchAiPlan = async () => {
    setLoadingAi(true);
    try {
      const res = await fetch("/api/ai/generate-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compId }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.items) {
          setAiRec(data.items);
        }
      } else {
        alert("Could not generate plan (missing API key?)");
      }
    } catch {
      alert("Error generating plan");
    } finally {
      setLoadingAi(false);
    }
  };

  const onAdd = () => {
    const items: PrepItem[] = itemsDisplay.map((x) => ({
      id: `prep:${compId}:${x.id}`, // e.g. prep:123:p1
      text: x.text,
      fromCompId: compId,
    }));

    assignMissions(items);

    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const isDone = (itemId: string, itemText: string) => {
    const rawId = `prep:${compId}:${itemId}`;

    // Check locally assigned or exact match (for signed out)
    if (completedIds.includes(rawId)) return true;

    // For DB mode, we look for a mission in the 'assigned' list that:
    // 1. Matches this competition (fromCompId)
    // 2. Matches the text of the item
    // If found, we check if THAT mission's ID is in completedIds.
    // This bridges the "raw ID" -> "scoped ID" gap deterministically.
    const assignedMission = assigned.find(m => m.fromCompId === compId && m.text === itemText);
    if (assignedMission) {
      return completedIds.includes(assignedMission.id);
    }
    return false;
  };

  const doneCount = itemsDisplay.filter((x) => isDone(x.id, x.text)).length;

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Recommended missions</span>
            {aiRec && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">✨ AI Generated</span>}
          </div>
          <h2 className="mt-1 text-lg font-semibold">{basicRec.title}</h2>
          <p className="mt-1 text-sm text-gray-600">
            {doneCount}/{itemsDisplay.length} already done in this track today.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {!aiRec && (
            <button
              onClick={fetchAiPlan}
              disabled={loadingAi}
              className="rounded-xl border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-100 disabled:opacity-50"
            >
              {loadingAi ? "Generating..." : "✨ Generate Personal Plan"}
            </button>
          )}

          <button
            type="button"
            onClick={onAdd}
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
          >
            {added ? "Added ✅" : "Add to today"}
          </button>

          <Link
            href={`/tracks/${trackLower}`}
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"
          >
            Open track →
          </Link>
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        {itemsDisplay.map((it) => {
          const done = isDone(it.id, it.text);
          return (
            <div
              key={it.id}
              className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 ${aiRec ? "border-purple-200 bg-purple-50/30" : "border-black/10"}`}
            >
              <div className="text-sm">
                <div className="font-semibold">
                  Mission {it.id.replace("prep:", "").replace("ai-", "").split("-").pop()} {done ? "✅" : ""}
                </div>
                <div className={done ? "mt-1 text-gray-500 line-through" : "mt-1 text-gray-700"}>
                  {it.text}
                </div>
              </div>
              <div className="text-xs text-gray-500">Track: {trackLower}</div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
