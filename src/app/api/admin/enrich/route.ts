import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
    try {
        const { id, title, apiKey } = await req.json();

        if (!apiKey) {
            return NextResponse.json({ error: "Missing SerpApi Key" }, { status: 400 });
        }

        // 1. Search Query
        // We look for specific terms to avoid generic "list of competitions" sites
        const query = encodeURIComponent(`"${title}" official website 2026 application`);
        const searchUrl = `https://serpapi.com/search.json?q=${query}&engine=google&api_key=${apiKey}&num=3`;

        const res = await fetch(searchUrl);
        if (!res.ok) {
            return NextResponse.json({ error: "SerpApi Request Failed" }, { status: 502 });
        }

        const data = await res.json();

        if (data.error) {
            return NextResponse.json({ error: data.error }, { status: 500 });
        }

        const results = data.organic_results || [];
        if (results.length === 0) {
            return NextResponse.json({ updated: false, reason: "No results found" });
        }

        // 2. Pick the best result
        // Heuristic: Prefer results that contain the title words or "official"
        // Avoid wikipedia, facebook, etc. if possible
        const blacklist = ["wikipedia.org", "facebook.com", "instagram.com", "linkedin.com", "compace", "reddit"];

        let bestUrl = "";

        for (const r of results) {
            const link = r.link as string;
            if (blacklist.some(b => link.includes(b))) continue;
            bestUrl = link;
            break;
        }

        if (!bestUrl) {
            // Fallback to first if all were blacklisted? No, better safe than sorry.
            return NextResponse.json({ updated: false, reason: "No suitable URL found (filtered)" });
        }

        // 3. Update DB
        // We only update if it's different to save DB writes?
        // Actually, just update.
        await prisma.competition.update({
            where: { id },
            data: {
                officialUrl: bestUrl,
                // We purposefully don't overwrite applyUrl unless it was empty
                // But typically for "Enricher", we want to set it if missing.
                // Let's check logic: The UI passes currentUrl.
                // For this simplistic version, let's update both if applyUrl is empty or same as officialUrl
            }
        });

        // We also conditionally update applyUrl if it's currently empty
        const current = await prisma.competition.findUnique({ where: { id }, select: { applyUrl: true } });
        if (!current?.applyUrl || current.applyUrl.length < 5) {
            await prisma.competition.update({
                where: { id },
                data: { applyUrl: bestUrl }
            });
        }

        return NextResponse.json({ updated: true, newUrl: bestUrl });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Unknown error" }, { status: 500 });
    }
}
