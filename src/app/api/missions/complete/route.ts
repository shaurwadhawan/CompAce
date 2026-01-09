import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const ctx = await requireUser();
    if (ctx.response) return ctx.response;
    const { user } = ctx;

    const { searchParams } = new URL(req.url);
    const track = searchParams.get("track");

    if (!track) return new NextResponse("Missing track", { status: 400 });

    const completed = await prisma.missionCompletion.findMany({
        where: { userId: user.id, track }
    });

    return NextResponse.json(completed.map(c => c.missionId));
}

export async function POST(req: Request) {
    const ctx = await requireUser();
    if (ctx.response) return ctx.response;
    const { user } = ctx;

    const body = await req.json();
    const { track, missionId, done } = body;

    if (!track || !missionId) return new NextResponse("Missing fields", { status: 400 });

    if (done) {
        // Add if not exists
        await prisma.missionCompletion.upsert({
            where: {
                userId_track_missionId: {
                    userId: user.id,
                    track,
                    missionId
                }
            },
            create: {
                userId: user.id,
                track,
                missionId
            },
            update: {}
        });
    } else {
        // Remove
        try {
            await prisma.missionCompletion.delete({
                where: {
                    userId_track_missionId: {
                        userId: user.id,
                        track,
                        missionId
                    }
                }
            });
        } catch {
            // ignore if not found
        }
    }

    return NextResponse.json({ success: true });
}
