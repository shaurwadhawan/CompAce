import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const ctx = await requireUser();
    if (ctx.response) return ctx.response;
    const { user } = ctx;

    const { searchParams } = new URL(req.url);
    const track = searchParams.get("track");

    // Server-side scoping for robustness, ignores client date.
    // YYYY-MM-DD
    const todayKey = new Date().toISOString().split("T")[0];

    if (!track) return new NextResponse("Missing track", { status: 400 });

    // Filter by ID prefix for today's assignments
    const missions = await prisma.mission.findMany({
        where: {
            userId: user.id,
            track,
            // ID pattern: userId:YYYY-MM-DD:rawId
            // Check startsWith
            id: { startsWith: `${user.id}:${todayKey}` }
        },
        orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(missions);
}

export async function POST(req: Request) {
    const ctx = await requireUser();
    if (ctx.response) return ctx.response;
    const { user } = ctx;

    const body = await req.json();
    const { track, missions } = body;
    // missions: { id, text, fromCompId }[]

    if (!track || !Array.isArray(missions)) {
        return new NextResponse("Invalid body", { status: 400 });
    }

    // Force server-side date
    const todayStr = new Date().toISOString().split("T")[0];

    const result = [];
    for (const m of missions) {
        // Construct deterministic ID: userId:YYYY-MM-DD:rawId
        const scopedId = `${user.id}:${todayStr}:${m.id}`;

        try {
            const exists = await prisma.mission.findUnique({
                where: { id: scopedId }
            });

            if (!exists) {
                const created = await prisma.mission.create({
                    data: {
                        id: scopedId,
                        userId: user.id,
                        track,
                        text: m.text,
                        fromCompId: m.fromCompId,
                        createdAt: new Date()
                    }
                });
                result.push(created);
            }
        } catch {
            // Ignore race condition dupes
        }
    }

    return NextResponse.json({ processed: result.length });
}
