import TrackMissionsClient from "./TrackMissionsClient";
import type { TrackLower } from "@/lib/missions";

type Mission = { id: number; text: string };
type TrackData = { title: string; missions: Mission[] };

const missionMap: Record<string, TrackData> = {
  coding: {
    title: "Today’s Coding Missions",
    missions: [
      { id: 1, text: "Solve 2 array/string problems" },
      { id: 2, text: "Review one algorithm pattern" },
      { id: 3, text: "Write solution explanation in words" },
    ],
  },
  econ: {
    title: "Today’s Econ / Case Missions",
    missions: [
      { id: 1, text: "Read one economics article" },
      { id: 2, text: "Outline a case framework" },
      { id: 3, text: "Write a 150-word evaluation" },
    ],
  },
  mun: {
    title: "Today’s MUN Missions",
    missions: [
      { id: 1, text: "Research one country position" },
      { id: 2, text: "Draft a 60-second opening speech" },
      { id: 3, text: "Prepare 2 rebuttals" },
    ],
  },
  olympiad: {
    title: "Today’s Olympiad Missions",
    missions: [
      { id: 1, text: "Solve 3 past-paper problems" },
      { id: 2, text: "Review one core theorem" },
      { id: 3, text: "Write full working for one problem" },
    ],
  },
  math: {
    title: "Today’s Math Missions",
    missions: [
      { id: 1, text: "Solve 3 AMC/AIME problems" },
      { id: 2, text: "Review a proof technique" },
      { id: 3, text: "Memorize 3 formulas" },
    ],
  },
  science: {
    title: "Today’s Science Missions",
    missions: [
      { id: 1, text: "Read a research paper abstract" },
      { id: 2, text: "Review a lab technique" },
      { id: 3, text: "Summarize a scientific concept" },
    ],
  },
};

export default async function TrackPage({
  params,
}: {
  params: Promise<{ track: string }>;
}) {
  const { track } = await params;
  const data = missionMap[track];

  if (!data) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold">Unknown track</h1>
        <p className="mt-2 text-gray-600">Got: {track}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-12">
      <div className="w-full">
        <TrackMissionsClient
          track={track as TrackLower}
          title={data.title}
          baseMissions={data.missions}
        />
      </div>
    </main>
  );
}
