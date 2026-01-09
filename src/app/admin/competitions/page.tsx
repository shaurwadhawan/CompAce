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
    submittedBy?: {
        email: string | null;
        name: string | null;
    };
    rejectionReason?: string;
    verifiedSource?: boolean;
    isFeatured?: boolean;
    adminNotes?: string;
    // content fields
    deadline?: string;
    officialUrl?: string;
    applyUrl?: string;
    description?: string;
    format?: string;
    eligibility?: string;
    howToApply?: string;
}

export default function AdminCompsPage() {
    const [comps, setComps] = useState<Comp[]>([]);
    const [statusFilter, setStatusFilter] = useState("PENDING");
    const [loading, setLoading] = useState(true);

    const fetchComps = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/comps?status=${statusFilter}`);
            if (res.ok) {
                const data = await res.json();
                setComps(data);
            } else {
                setComps([]);
            }
        } catch {
            setComps([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComps();
    }, [statusFilter]);

    const handleUpdate = async (id: string, newStatus: string) => {
        let reason = "";
        if (newStatus === "REJECTED") {
            reason = prompt("Optional rejection reason:") || "";
        } else {
            if (!confirm(`Mark as ${newStatus}?`)) return;
        }

        try {
            await fetch(`/api/admin/comps/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    status: newStatus,
                    rejectionReason: reason || null
                }),
            });
            fetchComps();
        } catch {
            alert("Error updating");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Delete permanently?")) return;
        try {
            await fetch(`/api/admin/comps/${id}`, { method: "DELETE" });
            fetchComps();
        } catch {
            alert("Error deleting");
        }
    };

    const [editingComp, setEditingComp] = useState<Comp | null>(null);

    const handleSaveEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingComp) return;

        try {
            await fetch(`/api/admin/comps/${editingComp.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editingComp.title,
                    description: editingComp.description,
                    format: editingComp.format,
                    eligibility: editingComp.eligibility,
                    howToApply: editingComp.howToApply,
                    deadline: editingComp.deadline,
                    officialUrl: editingComp.officialUrl,
                    applyUrl: editingComp.applyUrl
                }),
            });
            setEditingComp(null);
            fetchComps();
        } catch {
            alert("Error saving edits");
        }
    };

    return (
        <main className="mx-auto max-w-5xl px-6 py-10 relative">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Admin: Competitions</h1>
                <div className="flex gap-2">
                    <button
                        onClick={async () => {
                            const confirmText = prompt("Type 'DELETE ALL' to confirm wiping ALL competition data (cannot be undone):");
                            if (confirmText !== "DELETE ALL") return;

                            try {
                                const res = await fetch("/api/admin/comps/delete-all", { method: "DELETE" });
                                const data = await res.json();
                                alert(`Deleted ${data.count} competitions.`);
                                window.location.reload();
                            } catch {
                                alert("Error deleting all data");
                            }
                        }}
                        className="px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700"
                    >
                        Delete ALL Data
                    </button>
                    {statusFilter === "PENDING" && comps.length > 0 && (
                        <button
                            onClick={async () => {
                                if (!confirm(`Approve all ${comps.length} pending competitions?`)) return;
                                try {
                                    const res = await fetch("/api/admin/comps/approve-all", { method: "POST" });
                                    const data = await res.json();
                                    alert(`Approved ${data.count} competitions.`);
                                    fetchComps();
                                } catch (e) {
                                    alert("Error approving all");
                                }
                            }}
                            className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700"
                        >
                            Approve All ({comps.length})
                        </button>
                    )}
                    <Link
                        href="/admin/import"
                        className="px-4 py-2 rounded-lg bg-black text-white text-sm font-semibold hover:bg-gray-800"
                    >
                        + Bulk Import (CSV)
                    </Link>
                    <Link
                        href="/admin/enrich"
                        className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700"
                    >
                        ✨ AI Enricher
                    </Link>
                </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
                {["PENDING", "APPROVED", "REJECTED", "ALL"].map(s => (
                    <button
                        key={s}
                        onClick={() => setStatusFilter(s)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border ${statusFilter === s ? "bg-black text-white" : "hover:bg-gray-50"
                            }`}
                    >
                        {s}
                    </button>
                ))}
            </div>

            <div className="mt-6 space-y-4">
                {loading && <div className="text-sm text-gray-500">Loading...</div>}

                {!loading && comps.length === 0 && (
                    <div className="text-sm text-gray-600">No competitions found.</div>
                )}

                {comps.map(c => (
                    <div key={c.id} className="p-4 rounded-xl border bg-white flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{c.title}</h3>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${c.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                                    c.status === "APPROVED" ? "bg-green-100 text-green-800" :
                                        "bg-red-100 text-red-800"
                                    }`}>
                                    {c.status}
                                </span>
                                {c.verifiedSource && (
                                    <span className="ml-2 text-xs text-blue-600 font-bold">Verified</span>
                                )}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                {c.track} · {c.mode} · {c.region} · {new Date(c.createdAt).toLocaleDateString()}
                            </p>
                            {c.submittedBy && (
                                <p className="text-xs text-blue-600 mt-1 font-medium">
                                    Submitted by: {c.submittedBy.email || "Unknown"}
                                </p>
                            )}
                            {c.rejectionReason && (
                                <p className="text-xs text-red-600 mt-1">
                                    Reason: {c.rejectionReason}
                                </p>
                            )}

                            {/* Actions Row */}
                            <div className="mt-3 flex items-center gap-4">
                                <button
                                    onClick={() => setEditingComp(c)}
                                    className="text-xs font-semibold underline text-gray-600 hover:text-black"
                                >
                                    Edit Details
                                </button>

                                {/* Featured Toggle */}
                                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                                    <input
                                        type="checkbox"
                                        checked={c.isFeatured || false}
                                        onChange={async (e) => {
                                            const val = e.target.checked;
                                            try {
                                                await fetch(`/api/admin/comps/${c.id}`, {
                                                    method: "PATCH",
                                                    headers: { "Content-Type": "application/json" },
                                                    body: JSON.stringify({ isFeatured: val })
                                                });
                                                setComps(prev => prev.map(p => p.id === c.id ? { ...p, isFeatured: val } : p));
                                            } catch {
                                                alert("Failed to toggle feature");
                                            }
                                        }}
                                    />
                                    Featured
                                </label>
                            </div>

                            {/* Notes */}
                            <div className="mt-2 text-xs">
                                <textarea
                                    className="w-full text-[10px] border p-1 rounded resize-y h-8 focus:h-20 transition-all"
                                    placeholder="Admin notes (private)..."
                                    value={c.adminNotes || ""}
                                    onChange={(e) => {
                                        setComps(prev => prev.map(p => p.id === c.id ? { ...p, adminNotes: e.target.value } : p));
                                    }}
                                    onBlur={async (e) => {
                                        try {
                                            await fetch(`/api/admin/comps/${c.id}`, {
                                                method: "PATCH",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ adminNotes: e.target.value })
                                            });
                                        } catch {
                                            alert("Failed to save notes");
                                        }
                                    }}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 shrink-0">
                            {c.status === "PENDING" && (
                                <>
                                    <button
                                        onClick={() => handleUpdate(c.id, "APPROVED")}
                                        className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 w-full"
                                    >
                                        Approve
                                    </button>
                                    <button
                                        onClick={() => handleUpdate(c.id, "REJECTED")}
                                        className="px-3 py-1.5 rounded-lg border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-50 w-full"
                                    >
                                        Reject
                                    </button>
                                </>
                            )}
                            {(c.status === "APPROVED" || c.status === "REJECTED") && (
                                <button
                                    onClick={() => handleUpdate(c.id, "PENDING")}
                                    className="px-3 py-1.5 rounded-lg border text-gray-600 text-xs font-semibold hover:bg-gray-50 w-full"
                                >
                                    Reset
                                </button>
                            )}

                            <button
                                onClick={() => handleDelete(c.id)}
                                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-red-500 w-full"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Edit Modal */}
            {editingComp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Edit Competition</h2>
                        <form onSubmit={handleSaveEdit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">Title</label>
                                <input
                                    className="w-full border rounded p-2 mt-1"
                                    value={editingComp.title}
                                    onChange={e => setEditingComp({ ...editingComp, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Deadline</label>
                                    <input
                                        className="w-full border rounded p-2 mt-1"
                                        value={editingComp.deadline || ""}
                                        onChange={e => setEditingComp({ ...editingComp, deadline: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Official URL</label>
                                    <input
                                        className="w-full border rounded p-2 mt-1"
                                        value={editingComp.officialUrl || ""}
                                        onChange={e => setEditingComp({ ...editingComp, officialUrl: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">Description</label>
                                <textarea
                                    className="w-full border rounded p-2 mt-1 h-24"
                                    value={editingComp.description || ""}
                                    onChange={e => setEditingComp({ ...editingComp, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Format</label>
                                    <textarea
                                        className="w-full border rounded p-2 mt-1 h-20"
                                        value={editingComp.format || ""}
                                        onChange={e => setEditingComp({ ...editingComp, format: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Eligibility</label>
                                    <textarea
                                        className="w-full border rounded p-2 mt-1 h-20"
                                        value={editingComp.eligibility || ""}
                                        onChange={e => setEditingComp({ ...editingComp, eligibility: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">How to Apply (Steps)</label>
                                <textarea
                                    className="w-full border rounded p-2 mt-1 h-20"
                                    value={editingComp.howToApply || ""}
                                    onChange={e => setEditingComp({ ...editingComp, howToApply: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setEditingComp(null)}
                                    className="px-4 py-2 rounded-lg border hover:bg-gray-100"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 rounded-lg bg-black text-white hover:bg-gray-800"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
