import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    if (!id) return new NextResponse("Missing ID", { status: 400 });

    const comp = await prisma.competition.findUnique({
        where: { id },
    });

    if (!comp) return new NextResponse("Not Found", { status: 404 });

    return NextResponse.json({
        ...comp,
        tags: comp.tags ? JSON.parse(comp.tags) : [],
    });
}
