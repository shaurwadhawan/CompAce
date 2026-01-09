import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { NextResponse } from "next/server";
import { User } from "@prisma/client";

export type AuthenticatedContext = {
    user: { id: string; email: string };
    response?: never;
};

export type ErrorContext = {
    user?: never;
    response: NextResponse;
};

export type RequireUserResult = AuthenticatedContext | ErrorContext;

export async function requireUser(): Promise<RequireUserResult> {
    const session = await auth();

    if (!session?.user?.email) {
        return {
            response: new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            }),
        };
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true, email: true },
        });

        if (!user) {
            return {
                response: new NextResponse(JSON.stringify({ error: "User not found" }), {
                    status: 401,
                    headers: { "Content-Type": "application/json" },
                }),
            };
        }

        return { user: { id: user.id, email: user.email! } };
    } catch (error) {
        console.error("Auth helper error:", error);
        return {
            response: new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }),
        };
    }
}
