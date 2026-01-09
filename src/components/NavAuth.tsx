// src/components/NavAuth.tsx
import { auth, signIn, signOut } from "@/auth";
import UserDropdown from "./UserDropdown";

import { checkAdmin } from "@/lib/checkAdmin";

export default async function NavAuth() {
    const session = await auth();
    const user = session?.user;

    if (!user || !user.email) {
        return (
            <form
                action={async () => {
                    "use server";
                    await signIn("google");
                }}
            >
                <button
                    type="submit"
                    className="rounded-xl border border-black/10 px-4 py-2 text-sm font-semibold hover:bg-black/5 transition-colors"
                >
                    Sign in
                </button>
            </form>
        );
    }

    const isAdmin = await checkAdmin();

    // Server action wrapper to pass to client component
    async function handleSignOut() {
        "use server";
        await signOut();
    }

    return (
        <div className="flex items-center gap-4">
            <a href="/submit" className="text-sm font-semibold text-gray-600 hover:text-black transition-colors">
                Submit
            </a>
            <UserDropdown user={user} isAdmin={isAdmin} signOutAction={handleSignOut} />
        </div>
    );
}
