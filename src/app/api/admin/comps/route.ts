import { prisma } from "@/lib/db";
import { checkAdmin } from "@/lib/checkAdmin";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "PENDING";

    // Support "ALL"
    const where = status === "ALL" ? {} : { status };

    try {
        const comps = await (prisma as any).competition.findMany({
            where,
            include: {
                submittedBy: { select: { email: true, name: true } },
                duplicateOf: { select: { id: true, title: true } }
            },
            orderBy: { createdAt: "desc" },
        });

        const jsonComps = comps.map((c: any) => ({
            ...c,
            tags: c.tags ? JSON.parse(c.tags) : [],
        }));

        return NextResponse.json(jsonComps);
    } catch (error) {
        console.error("Admin fetch error:", error);
        return NextResponse.json({ error: "Fetch failed" }, { status: 500 });
    }
}
