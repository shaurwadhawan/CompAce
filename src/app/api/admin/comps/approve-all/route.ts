import { prisma } from "@/lib/db";
import { checkAdmin } from "@/lib/checkAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const result = await (prisma as any).competition.updateMany({
            where: {
                status: "PENDING",
            },
            data: {
                status: "APPROVED",
            },
        });

        return NextResponse.json({ count: result.count });
    } catch (error) {
        console.error("Bulk approve error:", error);
        return NextResponse.json({ error: "Failed to bulk approve" }, { status: 500 });
    }
}
