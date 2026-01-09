// src/lib/storage.ts

const STORAGE_KEY = "compace:savedComps";

// --- Saved comps ---
export function getSavedIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function isSaved(id: string): boolean {
  return getSavedIds().includes(id);
}

export function toggleSaved(id: string): string[] {
  const current = getSavedIds();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }

  broadcastUpdate();
  return next;
}

// --- Streak ---
const STREAK_KEY = "compace:streak";

type StreakData = {
  lastDate: string; // YYYY-MM-DD
  count: number;
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getStreak(): number {
  try {
    const raw = localStorage.getItem(STREAK_KEY);
    if (!raw) return 0;
    const parsed: StreakData = JSON.parse(raw);
    return parsed.count ?? 0;
  } catch {
    return 0;
  }
}

export function recordStreakActivity() {
  try {
    const today = todayKey();
    const raw = localStorage.getItem(STREAK_KEY);

    if (!raw) {
      localStorage.setItem(STREAK_KEY, JSON.stringify({ lastDate: today, count: 1 }));
      broadcastUpdate();
      return;
    }

    const parsed: StreakData = JSON.parse(raw);

    if (parsed.lastDate === today) {
      return; // already counted today
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = yesterday.toISOString().slice(0, 10);

    const nextCount = parsed.lastDate === yesterdayKey ? parsed.count + 1 : 1;

    localStorage.setItem(STREAK_KEY, JSON.stringify({ lastDate: today, count: nextCount }));
    broadcastUpdate();
  } catch {
    // ignore
  }
}

// --- Onboarding flag ---
const ONBOARDED_KEY = "compace:onboarded";

export function isOnboarded(): boolean {
  try {
    return localStorage.getItem(ONBOARDED_KEY) === "1";
  } catch {
    return false;
  }
}

export function setOnboarded(val: boolean) {
  try {
    localStorage.setItem(ONBOARDED_KEY, val ? "1" : "0");
  } catch {
    // ignore
  }
  broadcastUpdate();
}

// --- Saved checklist ---
export type ChecklistItemId = "rules" | "account" | "draft" | "submit";

export const CHECKLIST_ITEMS: { id: ChecklistItemId; label: string }[] = [
  { id: "rules", label: "Read rules" },
  { id: "account", label: "Create account" },
  { id: "draft", label: "Draft submission" },
  { id: "submit", label: "Submit" },
];

function checklistKey(compId: string) {
  return `compace:checklist:${compId}`;
}

export function getChecklist(compId: string): ChecklistItemId[] {
  try {
    const raw = localStorage.getItem(checklistKey(compId));
    const parsed = raw ? JSON.parse(raw) : [];
    const allowed = new Set(CHECKLIST_ITEMS.map((x) => x.id));
    return Array.isArray(parsed)
      ? parsed.filter((x) => typeof x === "string" && allowed.has(x as unknown as ChecklistItemId))
      : [];
  } catch {
    return [];
  }
}

export function setChecklist(compId: string, items: ChecklistItemId[]) {
  try {
    localStorage.setItem(checklistKey(compId), JSON.stringify(items));
  } catch {
    // ignore
  }
  broadcastUpdate();
}

export function toggleChecklistItem(compId: string, item: ChecklistItemId): ChecklistItemId[] {
  const current = getChecklist(compId);
  const next = current.includes(item) ? current.filter((x) => x !== item) : [...current, item];
  setChecklist(compId, next);
  return next;
}

export function resetChecklist(compId: string) {
  try {
    localStorage.removeItem(checklistKey(compId));
  } catch {
    // ignore
  }
  broadcastUpdate();
}

// --- Application Planner (NEW) ---
export type PlannerData = {
  targetDate: string; // YYYY-MM-DD
  notes: string;
};

function plannerKey(compId: string) {
  return `compace:planner:${compId}`;
}

export function getPlanner(compId: string): PlannerData | null {
  try {
    const raw = localStorage.getItem(plannerKey(compId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;

    const targetDate = typeof parsed.targetDate === "string" ? parsed.targetDate : "";
    const notes = typeof parsed.notes === "string" ? parsed.notes : "";

    if (!targetDate) return null;
    return { targetDate, notes };
  } catch {
    return null;
  }
}

export function setPlanner(compId: string, data: PlannerData) {
  try {
    localStorage.setItem(plannerKey(compId), JSON.stringify(data));
  } catch {
    // ignore
  }
  broadcastUpdate();
}

export function resetPlanner(compId: string) {
  try {
    localStorage.removeItem(plannerKey(compId));
  } catch {
    // ignore
  }
  broadcastUpdate();
}
// --- Simple “Prep Plan” generator (rules-based, no AI) ---
export function suggestTargetDate(daysFromToday: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  return d.toISOString().slice(0, 10);
}

export function generatePrepPlan(compId: string) {
  // defaults: 14 days out, with a generic note
  const plan: PlannerData = {
    targetDate: suggestTargetDate(14),
    notes: "Aim to finish draft early, then do one clean final pass before submission.",
  };

  setPlanner(compId, plan);
  return plan;
}

// --- Broadcast ---
export function broadcastUpdate() {
  try {
    window.dispatchEvent(new Event("compace:update"));
  } catch {
    // ignore
  }
}
