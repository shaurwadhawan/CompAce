import { prisma } from "@/lib/db";
import { checkAdmin } from "@/lib/checkAdmin";
import { NextResponse } from "next/server";

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status, rejectionReason, isFeatured, adminNotes, enrichmentState, qualityFlags, duplicateOfId } = body;

    try {
        const data: any = {};
        if (status !== undefined) {
            data.status = status;
            data.rejectionReason = rejectionReason || null;
        }
        if (isFeatured !== undefined) data.isFeatured = isFeatured;
        if (adminNotes !== undefined) data.adminNotes = adminNotes;
        if (enrichmentState !== undefined) data.enrichmentState = enrichmentState;
        if (qualityFlags !== undefined) data.qualityFlags = qualityFlags;
        if (duplicateOfId !== undefined) data.duplicateOfId = duplicateOfId;
        if (body.officialUrl !== undefined) data.officialUrl = body.officialUrl;
        if (body.applyUrl !== undefined) data.applyUrl = body.applyUrl;

        const updated = await (prisma as any).competition.update({
            where: { id },
            data,
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Admin update error:", error);
        return NextResponse.json({ error: "Update failed" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    try {
        await (prisma as any).competition.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Admin delete error:", error);
        return NextResponse.json({ error: "Delete failed" }, { status: 500 });
    }
}
