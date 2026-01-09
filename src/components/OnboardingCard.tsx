"use client";

import Link from "next/link";

export default function OnboardingCard({
  onSkip,
}: {
  onSkip: () => void;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm text-gray-600">Welcome to CompAce 👋</div>
          <h2 className="mt-1 text-lg font-semibold">
            Set up your profile for better recommendations
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Pick your tracks, level, and preferences — then CompAce prioritizes the right competitions for you.
          </p>

          <ul className="mt-3 list-disc pl-5 text-sm text-gray-700">
            <li>Choose the tracks you care about</li>
            <li>Set your level by track</li>
            <li>Select online vs in-person + region</li>
          </ul>
        </div>

        <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col sm:items-end">
          <Link
            href="/profile"
            className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
          >
            Set up profile →
          </Link>

          <button
            onClick={onSkip}
            className="rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-black/5"
            type="button"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
