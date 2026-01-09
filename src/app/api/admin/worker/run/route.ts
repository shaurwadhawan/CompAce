import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkAdmin } from "@/lib/checkAdmin";

export const maxDuration = 60; // Allow 60s for serverless function if supported

// Helper: Normalize Title
function normalizeTitle(title: string): string {
    let s = title.toLowerCase();
    // Remove years (e.g., 2024, 2025, 2026)
    s = s.replace(/202[0-9]/g, "");
    // Remove punctuation (keep spaces)
    s = s.replace(/[^\w\s]/g, "");
    // Remove multiple spaces
    s = s.replace(/\s+/g, " ");

    // Remove common words
    const stops = ["competition", "contest", "challenge", "olympiad", "hackathon", "hack", "round", "preliminary", "prelim", "qualifier", "final", "finals", "global", "national", "international", "annual", "regional", "state", "world", "championship", "us", "usa"];

    s = s.split(" ").filter(w => !stops.includes(w)).join(" ");
    return s.trim();
}

// Helper: Get Host
function getHost(url: string | null): string | null {
    if (!url) return null;
    try {
        const u = new URL(url.startsWith("http") ? url : `https://${url}`);
        return u.hostname.replace(/^www\./, "").toLowerCase();
    } catch {
        return null;
    }
}

// Flags helper
function addFlag(current: string | null, flag: string): string {
    const flags = current ? JSON.parse(current) : [];
    if (!flags.includes(flag)) flags.push(flag);
    return JSON.stringify(flags);
}

function removeFlag(current: string | null, flag: string): string {
    if (!current) return "[]";
    let flags = JSON.parse(current);
    flags = flags.filter((f: string) => f !== flag);
    return JSON.stringify(flags);
}

export async function POST(req: Request) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    try {
        // 1. Acquire Lock (Using Raw SQL to bypass potential stale PrismaClient)
        const now = new Date();
        const lockName = "hygiene_worker";
        const nowIso = now.toISOString();
        const lockUntilIso = new Date(now.getTime() + 60000).toISOString();

        // Clean old lock
        try {
            // Try ORM first
            if ((prisma as any).workerLock) {
                await (prisma as any).workerLock.deleteMany({
                    where: { name: lockName, lockedUntil: { lt: now } }
                });
            } else {
                // Fallback to Raw SQL
                await prisma.$executeRawUnsafe(`DELETE FROM "WorkerLock" WHERE name = ? AND lockedUntil < ?`, lockName, nowIso);
            }
        } catch (e) {
            console.warn("Lock cleanup failed (ignoring):", e);
        }

        try {
            if ((prisma as any).workerLock) {
                await (prisma as any).workerLock.create({
                    data: {
                        name: lockName,
                        lockedUntil: new Date(now.getTime() + 60000)
                    }
                });
            } else {
                // Fallback to Raw SQL
                // ID is cuid, but we can generate a random string for now or use uuid if available. 
                // Simple random string is enough for a lock id.
                const id = Math.random().toString(36).substring(7);
                await prisma.$executeRawUnsafe(
                    `INSERT INTO "WorkerLock" (id, name, lockedUntil) VALUES (?, ?, ?)`,
                    id, lockName, lockUntilIso
                );
            }
        } catch (e: any) {
            console.error("Lock Acquire Failed:", e);
            return NextResponse.json({ error: "Worker is busy (locked)" }, { status: 429 });
        }

        try {
            const body = await req.json();
            const task = body.task; // "dedupe" | "urlcheck"
            const limit = body.limit || 25;

            let processed = 0;
            let details = "";

            if (task === "dedupe") {
                // PHASE 1: Normalization (Batched)
                // Find items that need normalization
                const unnormalized = await (prisma as any).competition.findMany({
                    where: { canonicalTitle: null },
                    select: { id: true, title: true, officialUrl: true, applyUrl: true },
                    take: 20 // Process 20 at a time to be safe
                });

                console.log(`[Worker] Found ${unnormalized.length} unnormalized items.`);

                if (unnormalized.length > 0) {
                    let normalizations = 0;
                    for (const c of unnormalized) {
                        const cTitle = normalizeTitle(c.title || "");
                        const cHost = getHost(c.officialUrl) || getHost(c.applyUrl);

                        await (prisma as any).competition.update({
                            where: { id: c.id },
                            data: { canonicalTitle: cTitle, canonicalHost: cHost }
                        });
                        normalizations++;
                    }
                    console.log(`[Worker] Normalized batch of ${normalizations}`);

                    processed = normalizations;
                    details = `Normalized batch of ${normalizations}. Run again to continue/finish.`;

                } else {
                    // PHASE 2: Identify Duplicates (Only when normalization is done)
                    // Fetch fields needed for dedupe - now getting ALL is safe(ish) if just reading
                    const allComps = await (prisma as any).competition.findMany({
                        select: { id: true, title: true, canonicalTitle: true, canonicalHost: true, duplicateOfId: true, qualityFlags: true, enrichmentState: true },
                        where: { duplicateOfId: null }
                    });

                    let dupesFound = 0;
                    // Group by Host + Title
                    const groupBy = new Map<string, typeof allComps>();

                    for (const c of allComps) {
                        if (!c.canonicalTitle || !c.canonicalHost) continue;
                        const key = `${c.canonicalTitle}|${c.canonicalHost}`;
                        if (!groupBy.has(key)) groupBy.set(key, []);
                        groupBy.get(key)!.push(c);
                    }

                    // Process Groups
                    for (const [key, group] of groupBy.entries()) {
                        if (group.length > 1) {
                            // Sort by ID to ensure deterministic master (or use creation date if avl)
                            // Heuristic: Keep first one as master
                            const master = group[0];
                            const others = group.slice(1);

                            for (const other of others) {
                                if (!other.duplicateOfId) {
                                    await (prisma as any).competition.update({
                                        where: { id: other.id },
                                        data: {
                                            duplicateOfId: master.id,
                                            status: "REJECTED",
                                            qualityFlags: JSON.stringify(["DUPLICATE"]),
                                            enrichmentState: "NEEDS_REVIEW",
                                            adminNotes: `Auto-detected duplicate of ${master.title} (${master.id})`
                                        }
                                    });
                                    dupesFound++;
                                }
                            }
                        }
                    }
                    details = `Duplicate analysis complete. Marked ${dupesFound} duplicates.`;
                    processed = dupesFound;
                }

            } else if (task === "urlcheck") {
                // Find candidates: NEW state or URL unchecked
                const candidates = await (prisma as any).competition.findMany({
                    where: {
                        duplicateOfId: null,
                        OR: [
                            { enrichmentState: "NEW" },
                            { urlCheckedAt: null }
                        ]
                    },
                    take: limit
                });

                for (const c of candidates) {
                    const url = c.officialUrl || c.applyUrl;
                    let status = 0;
                    let final = "";
                    let broken = false;

                    if (!url) {
                        broken = true;
                    } else {
                        // Try fetch
                        try {
                            const target = url.startsWith("http") ? url : `https://${url}`;
                            const res = await fetch(target, {
                                method: "GET",
                                headers: {
                                    "User-Agent": "Mozilla/5.0 (compatible; CompAceBot/1.0; +http://compace.com)"
                                },
                                signal: AbortSignal.timeout(10000),
                                redirect: "follow"
                            });
                            status = res.status;
                            final = res.url; // final URL after redirects
                            if (status >= 400) broken = true;
                        } catch (e) {
                            broken = true;
                            // Network error (dns, timeout) -> status 0
                        }
                    }

                    // Build updates
                    const currentFlags = c.qualityFlags || "[]";
                    const newFlags = broken ? addFlag(currentFlags, "BROKEN_URL") : removeFlag(currentFlags, "BROKEN_URL");

                    await (prisma as any).competition.update({
                        where: { id: c.id },
                        data: {
                            urlStatusCode: status,
                            urlFinal: final,
                            urlCheckedAt: new Date(),
                            qualityFlags: newFlags,
                            enrichmentState: broken ? "NEEDS_REVIEW" : "READY_TO_ENRICH"
                        }
                    });
                    processed++;
                }
                details = `Checked ${processed} URLs.`;
            }

            return NextResponse.json({ success: true, processed, details });

        } catch (e: any) {
            console.error("Inner Worker Error:", e);
            return NextResponse.json({ error: `Worker Error: ${e.message}` }, { status: 500 });
        } finally {
            // Release Lock
            try {
                if ((prisma as any).workerLock) {
                    await (prisma as any).workerLock.delete({ where: { name: lockName } });
                } else {
                    await prisma.$executeRawUnsafe(`DELETE FROM "WorkerLock" WHERE name = ?`, lockName);
                }
            } catch (e) { /* ignore */ }
        }
    } catch (outerError: any) {
        console.error("Outer Worker Error:", outerError);
        return NextResponse.json({ error: `Outer Error: ${outerError.message}` }, { status: 500 });
    }
}
