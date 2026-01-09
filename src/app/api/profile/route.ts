import { requireUser } from "@/lib/requireUser";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const ctx = await requireUser();
    if (ctx.response) return ctx.response;
    const { user } = ctx;

    const profile = await prisma.userProfile.findUnique({
        where: { userId: user.id }
    });

    if (!profile) return NextResponse.json({});

    // Parse JSON fields
    return NextResponse.json({
        ...profile,
        tracks: profile.tracks ? JSON.parse(profile.tracks) : [],
        levelByTrack: profile.levelByTrack ? JSON.parse(profile.levelByTrack) : {},
    });
}

export async function POST(req: Request) {
    const ctx = await requireUser();
    if (ctx.response) return ctx.response;
    const { user } = ctx;

    const body = await req.json();
    const { tracks, preferredMode, preferredRegion, levelByTrack, locationText } = body;

    const profile = await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
            tracks: JSON.stringify(tracks || []),
            preferredMode: preferredMode || "Any",
            preferredRegion: preferredRegion || "Any",
            levelByTrack: JSON.stringify(levelByTrack || {}),
            locationText: locationText || "",
        },
        create: {
            userId: user.id,
            tracks: JSON.stringify(tracks || []),
            preferredMode: preferredMode || "Any",
            preferredRegion: preferredRegion || "Any",
            levelByTrack: JSON.stringify(levelByTrack || {}),
            locationText: locationText || "",
        }
    });

    return NextResponse.json(profile);
}
