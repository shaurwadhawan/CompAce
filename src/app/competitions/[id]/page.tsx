import Link from "next/link";
import { notFound } from "next/navigation";
import { allComps, Comp } from "@/lib/comps";
import { prisma } from "@/lib/db";
import CompHubClient from "./CompHubClient";

export default async function CompetitionDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let comp: Comp | undefined | null = allComps.find((c) => c.id === id);

  if (!comp) {
    // Try DB (if static not found)
    // Note: ensure `npx prisma generate` is run if `competition` property is missing
    const dbComp = await prisma.competition.findUnique({
      where: { id },
    });

    if (dbComp) {
      comp = {
        ...dbComp,
        tags: dbComp.tags ? JSON.parse(dbComp.tags) : [],
        deadlineSort: "", // Missing in DB schema
        track: dbComp.track as Comp["track"], // Cast for now
        mode: dbComp.mode as Comp["mode"],
        region: dbComp.region as Comp["region"],
      };
    }
  }

  if (!comp) return notFound();

  return (
    <main>
      <Link
        href="/competitions"
        className="fixed top-6 left-6 z-50 p-2 bg-white/80 backdrop-blur rounded-full border shadow-sm hover:bg-gray-100 transition-all font-mono text-xs"
      >
        ← Back
      </Link>
      <CompHubClient comp={comp} />
    </main>
  );
}
