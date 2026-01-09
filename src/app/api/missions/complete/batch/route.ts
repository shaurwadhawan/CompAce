import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const ctx = await requireUser();
    if (ctx.response) return ctx.response;
    const { user } = ctx;

    const body = await req.json();
    const { track, missionIds, done } = body;

    if (!track || !Array.isArray(missionIds)) {
        return new NextResponse("Invalid body", { status: 400 });
    }

    if (missionIds.length === 0) {
        return NextResponse.json({ success: true, count: 0 });
    }

    try {
        if (done) {
            await prisma.$transaction(
                missionIds.map(id =>
                    prisma.missionCompletion.upsert({
                        where: {
                            userId_track_missionId: {
                                userId: user.id,
                                track,
                                missionId: id
                            }
                        },
                        create: {
                            userId: user.id,
                            track,
                            missionId: id
                        },
                        update: {}
                    })
                )
            );
        } else {
            // Delete many is easy
            await prisma.missionCompletion.deleteMany({
                where: {
                    userId: user.id,
                    track,
                    missionId: { in: missionIds }
                }
            });
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Batch completion error", e);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
