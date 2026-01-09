import { prisma } from "@/lib/db";
import { checkAdmin } from "@/lib/checkAdmin";
import { NextResponse } from "next/server";

type CompRow = {
    title: string;
    track: string;
    mode: string;
    region: string;
    level: string;
    deadline: string;
    description: string;
    format: string;
    eligibility: string;
    howToApply: string;
    tags: string; // might be "tag1, tag2" or "tag1|tag2"
    applyUrl: string;
    officialUrl: string;
};

export async function POST(req: Request) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        const body = await req.json();
        const rows = body.rows as CompRow[];

        if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json({ error: "No rows provided" }, { status: 400 });
        }

        // 1. Fetch existing signatures for De-duplication
        // We fetch: id, officialUrl, applyUrl, title, track, region
        const existingData = await (prisma as any).competition.findMany({
            select: { id: true, officialUrl: true, applyUrl: true, title: true, track: true, region: true }
        });

        const urlSet = new Set<string>();
        const applyUrlSet = new Set<string>();
        const signatureSet = new Set<string>(); // title|track|region

        existingData.forEach((c: any) => {
            if (c.officialUrl) urlSet.add(c.officialUrl.trim().toLowerCase());
            if (c.applyUrl) applyUrlSet.add(c.applyUrl.trim().toLowerCase());
            const sig = `${c.title.trim().toLowerCase()}|${c.track}|${c.region}`;
            signatureSet.add(sig);
        });

        let inserted = 0;
        let skipped = 0;
        let errors = 0;
        const details: string[] = [];

        // 2. Process rows
        for (const row of rows) {
            try {
                // Determine skip
                const urlKey = row.officialUrl?.trim().toLowerCase();
                const applyKey = row.applyUrl?.trim().toLowerCase();
                const sigKey = `${row.title.trim().toLowerCase()}|${row.track}|${row.region}`;

                // Relaxed Deduplication:
                // We previously skipped if officialUrl or applyUrl existed anywhere in DB.
                // This caused issues for orgs like FBLA which have 50+ comps with same URL.
                // Now we only skip if the specific "Title + Track + Region" combo exists.

                /* 
                if (urlKey && urlSet.has(urlKey)) {
                    skipped++;
                    continue;
                }
                if (applyKey && applyUrlSet.has(applyKey)) {
                    skipped++;
                    continue;
                }
                */
                if (signatureSet.has(sigKey)) {
                    skipped++;
                    // details.push(`Skipped (Signature match): ${row.title}`);
                    continue;
                }

                // Prepare Data
                // Tags: Handle comma or pipe separated
                let tagList: string[] = [];
                if (row.tags) {
                    tagList = row.tags.split(/[|,]/).map(t => t.trim()).filter(Boolean);
                }

                await (prisma as any).competition.create({
                    data: {
                        title: row.title,
                        track: row.track,
                        mode: row.mode || "Online",
                        region: row.region || "International",
                        level: row.level || "All",
                        deadline: row.deadline || "TBA",
                        description: row.description || "",
                        format: row.format || "",
                        eligibility: row.eligibility || "",
                        howToApply: row.howToApply || "",
                        tags: JSON.stringify(tagList),
                        applyUrl: row.applyUrl || "",
                        officialUrl: row.officialUrl || "",
                        status: "PENDING",
                        source: "csv-import",
                        verifiedSource: !!row.officialUrl,
                        createdAt: new Date(),
                    },
                });

                inserted++;
                // Add to Sets to prevent dupe within the same batch
                if (urlKey) urlSet.add(urlKey);
                if (applyKey) applyUrlSet.add(applyKey);
                signatureSet.add(sigKey);

            } catch (err) {
                console.error("Import row error:", err);
                errors++;
                details.push(`Error importing "${row.title}": ${String(err)}`);
            }
        }

        return NextResponse.json({
            total: rows.length,
            inserted,
            skipped,
            errors,
            details
        });

    } catch (error) {
        console.error("Import API fatal error:", error);
        return NextResponse.json({ error: "Import failed" }, { status: 500 });
    }
}
