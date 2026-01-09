import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    try {
        const email = "test@example.com";
        const user = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                name: "Test User",
                email,
                image: "https://example.com/avatar.jpg"
            }
        });
        return NextResponse.json({ success: true, user });
    } catch (e) {
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
