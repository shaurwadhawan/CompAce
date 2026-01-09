import { prisma } from "@/lib/db";
import { checkAdmin } from "@/lib/checkAdmin";
import { NextResponse } from "next/server";

export async function POST() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        // Fix: existing seed data has random past dates, causing the 24h check to fail.
        // Seed traits:
        // 1. eligibility: "High School Students" (Hardcoded in seed)
        // 2. howToApply: "Apply on website" (Hardcoded in seed)
        // 3. submittedByUserId: null
        // 4. source: "manual" (default for existing) OR "seed" (for new runs)

        const { count } = await (prisma as any).competition.deleteMany({
            where: {
                OR: [
                    { source: "seed" }, // Future proof
                    {
                        // Catch existing seed data
                        status: "APPROVED",
                        submittedByUserId: null,
                        source: "manual", // Default
                        eligibility: "High School Students",
                        howToApply: "Apply on website"
                    }
                ]
            }
        });

        return NextResponse.json({ deletedCount: count });
    } catch (error) {
        console.error("Cleanup error:", error);
        return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }
}
