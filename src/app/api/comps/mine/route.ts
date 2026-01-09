import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { NextResponse } from "next/server";

export async function GET() {
    const ctx = await requireUser();
    if (ctx.response) return ctx.response;
    const { user } = ctx;

    try {
        const comps = await (prisma as any).competition.findMany({
            where: { submittedByUserId: user.id },
            orderBy: { createdAt: "desc" },
        });

        const jsonComps = comps.map((c: any) => ({
            ...c,
            tags: c.tags ? JSON.parse(c.tags) : [],
        }));

        return NextResponse.json(jsonComps);
    } catch (error) {
        console.error("GET /api/comps/mine error:", error);
        return NextResponse.json(
            { error: "Failed to fetch submissions" },
            { status: 500 }
        );
    }
}
