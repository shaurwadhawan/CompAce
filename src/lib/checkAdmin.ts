import { auth } from "@/auth";

export async function checkAdmin() {
    const session = await auth();
    const userEmail = session?.user?.email;

    if (!userEmail) return false;

    const admins = (process.env.ADMIN_EMAILS || "")
        .split(",")
        .map((e) => e.trim())
        .filter((e) => e);

    return admins.includes(userEmail);
}
