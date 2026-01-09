"use client";

import { useState, useRef, useEffect } from "react";
import DataMigration from "./DataMigration";

type User = {
    id?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
};

export default function UserDropdown({
    user,
    isAdmin,
    signOutAction,
}: {
    user: User;
    isAdmin: boolean;
    signOutAction: () => Promise<void>;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <DataMigration user={user} />

            {/* Avatar Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                style={{ width: "36px", height: "36px", minWidth: "36px" }}
                className="rounded-full overflow-hidden flex items-center justify-center border border-gray-200 transition-opacity hover:opacity-80 active:scale-95 bg-white p-0 m-0"
            >
                {user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={user.image}
                        alt="Avatar"
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                ) : (
                    <div
                        style={{ width: "100%", height: "100%" }}
                        className="rounded-full bg-gray-100 text-gray-600 text-sm font-bold flex items-center justify-center"
                    >
                        {user.email?.[0]?.toUpperCase() || "U"}
                    </div>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 z-50 origin-top-right rounded-xl border border-gray-100 bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="p-4 pb-2">
                        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            Account
                        </p>
                        <p className="mt-1 truncate text-sm font-medium text-gray-900" title={user.email || ""}>
                            {user.email}
                        </p>
                    </div>

                    <div className="h-px w-full bg-gray-100" />

                    <div className="p-2">
                        <a
                            href="/my-submissions"
                            className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                        >
                            My Submissions
                        </a>
                    </div>

                    <div className="h-px w-full bg-gray-100" />

                    {isAdmin && (
                        <div className="p-2">
                            <a
                                href="/admin/competitions"
                                className="block w-full rounded-lg px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors font-semibold"
                            >
                                Admin Dashboard
                            </a>
                        </div>
                    )}

                    {isAdmin && <div className="h-px w-full bg-gray-100" />}

                    <div className="p-2">
                        <form action={signOutAction}>
                            <button
                                type="submit"
                                className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                Sign out
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
