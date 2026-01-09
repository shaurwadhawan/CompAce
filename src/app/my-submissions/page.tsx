"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Comp {
    id: string;
    title: string;
    status: string;
    track: string;
    mode: string;
    region: string;
    createdAt: string;
    rejectionReason?: string;
}

export default function MySubmissionsPage() {
    const [comps, setComps] = useState<Comp[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchSubmissions() {
            try {
                const res = await fetch("/api/comps/mine");
                if (res.ok) {
                    const data = await res.json();
                    setComps(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        fetchSubmissions();
    }, []);

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading submissions...</div>;
    }

    return (
        <main className="mx-auto max-w-4xl px-6 py-10">
            <h1 className="text-3xl font-bold">My Submissions</h1>
            <p className="mt-2 text-gray-600">Track the status of competitions you have contributed.</p>

            <div className="mt-8 space-y-4">
                {comps.length === 0 ? (
                    <div className="rounded-xl border border-dashed p-8 text-center">
                        <p className="text-gray-500">You haven't submitted any competitions yet.</p>
                        <Link
                            href="/submit"
                            className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white"
                        >
                            Submit a Competition
                        </Link>
                    </div>
                ) : (
                    comps.map(c => (
                        <div key={c.id} className="rounded-xl border bg-white p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-lg">{c.title}</h3>
                                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${c.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                            c.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                                "bg-red-100 text-red-800"
                                        }`}>
                                        {c.status}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    {c.track} · {c.mode} · {c.region}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Submitted on {new Date(c.createdAt).toLocaleDateString()}
                                </p>

                                {c.status === "REJECTED" && c.rejectionReason && (
                                    <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                                        <strong>Reason:</strong> {c.rejectionReason}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
