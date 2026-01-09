import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/requireUser";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);

        // Params
        const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
        const pageSize = Math.max(1, Math.min(50, parseInt(searchParams.get("pageSize") || "10")));
        const q = searchParams.get("q")?.trim() || "";
        const track = searchParams.get("track") || "All";
        const mode = searchParams.get("mode") || "All";
        const region = searchParams.get("region") || "All";
        const sort = searchParams.get("sort") || "recommended"; // recommended, newest, deadline
        const savedOnly = searchParams.get("savedOnly") === "true";

        const ids = searchParams.get("ids")?.split(",").filter(Boolean);

        // Build Where Clause
        const where: any = { status: "APPROVED" };

        if (ids && ids.length > 0) {
            where.id = { in: ids };
        } else {
            if (track !== "All") where.track = track;
            if (mode !== "All") where.mode = mode;
            if (region !== "All") where.region = region;

            if (savedOnly) {
                const ctx = await requireUser();
                if (ctx.response) return ctx.response; // 401 if not logged in

                const saved = await (prisma as any).savedCompetition.findMany({
                    where: { userId: ctx.user.id },
                    select: { compId: true }
                });
                const savedIds = saved.map((s: any) => s.compId);

                if (savedIds.length === 0) {
                    return NextResponse.json({
                        items: [],
                        featured: [],
                        total: 0,
                        page,
                        pageSize,
                        totalPages: 0
                    });
                }
                where.id = { in: savedIds };
            }

            if (q) {
                where.OR = [
                    { title: { contains: q } },
                    { description: { contains: q } },
                    { tags: { contains: q } }
                ];
            }
        }

        let orderBy: any = { createdAt: "desc" };
        if (sort === "title") orderBy = { title: "asc" };
        else if (sort === "deadline") orderBy = { deadline: "asc" };

        // Fetch Main Items first
        const [total, comps] = await (prisma as any).$transaction([
            (prisma as any).competition.count({ where }),
            (prisma as any).competition.findMany({
                where,
                orderBy,
                skip: (page - 1) * pageSize,
                take: pageSize,
            }),
        ]);

        // Enhanced "Featured" Fetch (outside transaction to allow flexible logic)
        let featuredComps = await (prisma as any).competition.findMany({
            where: { status: "APPROVED", isFeatured: true },
            take: 6,
            orderBy: { createdAt: "desc" }
        });

        // Fallback Recommendation: If no manually featured items, pick top 3 items matching current track or random
        if (featuredComps.length === 0) {
            const fallbackWhere: any = { status: "APPROVED" };
            if (track !== "All") fallbackWhere.track = track; // Recommend based on current filter context (which matches profile usually)

            featuredComps = await (prisma as any).competition.findMany({
                where: fallbackWhere,
                take: 6,
                orderBy: { createdAt: "desc" }
            });
        }

        const items = comps.map((c: any) => ({
            ...c,
            tags: c.tags ? JSON.parse(c.tags) : [],
        }));

        const featured = featuredComps.map((c: any) => ({
            ...c,
            tags: c.tags ? JSON.parse(c.tags) : [],
        }));

        return NextResponse.json({
            items,
            featured, // Use this for "Featured" section
            total,
            page,
            pageSize,
            totalPages: Math.ceil(total / pageSize)
        });
    } catch (error) {
        console.error("GET /api/comps error:", error);
        return NextResponse.json(
            { error: "Failed to fetch competitions" },
            { status: 500 }
        );
    }
}

export async function POST(req: Request) {
    // 1. Check Auth (and log it)
    const ctx = await requireUser();
    if (ctx.response) {
        console.log("[API] POST /api/comps - Unauthorized attempt");
        return ctx.response;
    }
    const { user } = ctx;
    console.log(`[API] POST /api/comps - User: ${user.email} (${user.id})`);

    try {
        // 2. Parse Body (and log it)
        const body = await req.json();
        console.log("[API] Payload:", JSON.stringify(body, null, 2));

        const {
            title,
            track,
            mode,
            region,
            level,
            deadline,
            description,
            format,
            eligibility,
            howToApply,
            tags,
            applyUrl,
            officialUrl,
        } = body;

        // 3. Validation
        if (!title || !track) {
            console.error("[API] Validation failed: Missing title or track");
            return NextResponse.json(
                { error: "Missing required fields (title, track)" },
                { status: 400 }
            );
        }

        // 4. DB Creation
        const comp = await (prisma as any).competition.create({
            data: {
                title,
                track,
                mode: mode || "Online",
                region: region || "International",
                level: level || "All",
                deadline: deadline || "TBA",
                description: description || "",
                format: format || "",
                eligibility: eligibility || "",
                howToApply: howToApply || "",
                tags: JSON.stringify(tags || []),
                applyUrl: applyUrl || "",
                officialUrl: officialUrl || "",
                createdAt: new Date(),
                status: "PENDING",
                submittedByUserId: user.id,
            },
        });

        console.log("[API] Competition created:", comp.id);
        return NextResponse.json(comp);
    } catch (error) {
        console.error("[API] Create comp exception:", error);
        return NextResponse.json(
            {
                error: "Internal Server Error",
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}
