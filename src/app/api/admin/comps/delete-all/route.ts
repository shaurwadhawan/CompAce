import { prisma } from "@/lib/db";
import { checkAdmin } from "@/lib/checkAdmin";
import { NextResponse } from "next/server";

export async function DELETE(req: Request) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Delete ALL competitions
        const result = await (prisma as any).competition.deleteMany({});
        return NextResponse.json({ count: result.count });
    } catch (error) {
        console.error("Delete all error:", error);
        return NextResponse.json({ error: "Failed to delete all" }, { status: 500 });
    }
}
