import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const ctx = await requireUser();
    if (ctx.response) return ctx.response;
    const { user } = ctx;

    const saved = await prisma.savedCompetition.findMany({
        where: { userId: user.id }
    });

    return NextResponse.json(saved.map(s => s.compId));
}

export async function POST(req: Request) {
    const ctx = await requireUser();
    if (ctx.response) return ctx.response;
    const { user } = ctx;

    const body = await req.json();
    const { compId, saved } = body;

    if (!compId) return new NextResponse("Missing compId", { status: 400 });

    if (saved) {
        await prisma.savedCompetition.upsert({
            where: {
                userId_compId: {
                    userId: user.id,
                    compId
                }
            },
            create: { userId: user.id, compId },
            update: {}
        });
    } else {
        try {
            await prisma.savedCompetition.delete({
                where: {
                    userId_compId: {
                        userId: user.id,
                        compId
                    }
                }
            });
        } catch {
            // ignore
        }
    }

    return NextResponse.json({ success: true });
}
