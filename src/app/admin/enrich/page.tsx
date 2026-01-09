"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";

interface Comp {
    id: string;
    title: string;
    officialUrl: string;
    applyUrl: string;
    canonicalTitle?: string;
    urlStatusCode?: number;
    duplicateOfId?: string;
    duplicateOf?: { title: string };
    qualityFlags?: string | null;
    enrichmentState?: string;
    source?: string;
    adminNotes?: string;
    canonicalHost?: string;
    urlFinal?: string;
    // Content fields for manual enrichment
    description?: string;
    deadline?: string;
    format?: string;
    eligibility?: string;
    howToApply?: string;
}

const TABS = ["ALL", "NEW", "NEEDS_REVIEW", "READY_TO_ENRICH", "DUPLICATES", "ENRICHED"];

export default function EnrichPage() {
    const [comps, setComps] = useState<Comp[]>([]);
    const [activeTab, setActiveTab] = useState("ALL");
    const [logs, setLogs] = useState<string[]>([]);
    const [apiKey, setApiKey] = useState("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [workerBusy, setWorkerBusy] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [editingComp, setEditingComp] = useState<Comp | null>(null);

    useEffect(() => {
        const stored = localStorage.getItem("serp_api_key");
        if (stored) setApiKey(stored);
        fetchComps();
    }, []);

    const fetchComps = async () => {
        try {
            const res = await fetch("/api/admin/comps?status=ALL");
            if (res.ok) {
                const data = await res.json();
                setComps(data);
            }
        } catch (e) {
            log("Failed to load comps");
        }
    };

    const saveKey = (key: string) => {
        setApiKey(key);
        localStorage.setItem("serp_api_key", key);
    };

    const log = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
    };

    // --- Hygiene Worker ---
    const runWorker = async (task: "dedupe" | "urlcheck") => {
        if (workerBusy) return;
        setWorkerBusy(true);
        log(`Create Job: ${task.toUpperCase()}...`);

        try {
            const res = await fetch("/api/admin/worker/run", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ task, limit: 25 })
            });

            // Handle non-JSON response (e.g. 504 Timeout or 500 html page)
            const contentType = res.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await res.text();
                throw new Error(`Server returned non-JSON response (${res.status}): ${text.substring(0, 50)}...`);
            }

            const data = await res.json();

            if (res.ok) {
                log(`✅ Success: ${data.details}`);
                // Refresh data
                await fetchComps();
            } else {
                log(`❌ Error: ${data.error}`);
            }
        } catch (e: any) {
            log(`❌ Error calling worker: ${e.message}`);
        } finally {
            setWorkerBusy(false);
        }
    };

    // --- AI Enricher (Client Side Loop) ---
    // (Preserve existing logic roughly)
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const processComp = async (comp: Comp) => {
        log(`Enriching: ${comp.title}...`);
        // ... (Call legacy/existing endpoint)
        // For brevity in this update, assume we use the same endpoint as before or a placeholder
        // Re-implementing existing calls:
        try {
            const res = await fetch("/api/admin/enrich", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: comp.id,
                    title: comp.title,
                    currentUrl: comp.officialUrl,
                    apiKey
                })
            });
            const data = await res.json();
            if (data.updated) {
                log(`Updated URL: ${data.newUrl}`);
                setComps(prev => prev.map(c => c.id === comp.id ? { ...c, officialUrl: data.newUrl, enrichmentState: "ENRICHED" } : c));
            } else {
                log(`Skipped/No result.`);
            }
        } catch (e) { log("Error enriching"); }
    };

    const runSelected = async () => {
        if (!apiKey) return alert("Enter Key");
        setIsProcessing(true);
        const toProcess = comps.filter(c => selectedIds.has(c.id));
        for (const c of toProcess) {
            await processComp(c);
            await new Promise(r => setTimeout(r, 500));
        }
        setIsProcessing(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this competition?")) return;
        try {
            const res = await fetch(`/api/admin/comps/${id}`, { method: "DELETE" });
            if (res.ok) {
                setComps(prev => prev.filter(c => c.id !== id));
                log(`Deleted comp ${id}`);
            } else {
                alert("Failed to delete");
            }
        } catch (e) { log("Error deleting"); }
    };

    const handleAccept = async (id: string) => {
        try {
            const res = await fetch(`/api/admin/comps/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    enrichmentState: "READY_TO_ENRICH",
                    duplicateOfId: null, // Clear dupe if accepting
                    status: "PENDING" // Reset status if it was REJECTED
                })
            });
            if (res.ok) {
                setComps(prev => prev.map(c =>
                    c.id === id ? { ...c, enrichmentState: "READY_TO_ENRICH", duplicateOfId: undefined, duplicateOf: undefined } : c
                ));
                log(`Accepted comp ${id}`);
            } else {
                alert("Failed to accept");
            }
        } catch (e) { log("Error accepting"); }
    };

    const handleSaveManualEnrich = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingComp) return;

        try {
            const res = await fetch(`/api/admin/comps/${editingComp.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    // Content
                    description: editingComp.description,
                    format: editingComp.format,
                    eligibility: editingComp.eligibility,
                    howToApply: editingComp.howToApply,
                    deadline: editingComp.deadline,
                    officialUrl: editingComp.officialUrl,
                    applyUrl: editingComp.applyUrl,
                    // State
                    enrichmentState: "ENRICHED",
                    status: "PENDING" // Or APPROVED? Keeping PENDING allows final review, but Enriched usually implies ready.
                }),
            });

            if (res.ok) {
                setComps(prev => prev.map(c =>
                    c.id === editingComp.id ? {
                        ...c,
                        ...editingComp,
                        enrichmentState: "ENRICHED"
                    } : c
                ));
                setEditingComp(null);
                log(`Manually enriched ${editingComp.id}`);
            } else {
                alert("Failed to save enrichment");
            }
        } catch {
            alert("Error saving manual enrichment");
        }
    };

    const handleUpdateUrls = async (id: string, officialUrl: string, applyUrl: string) => {
        try {
            const res = await fetch(`/api/admin/comps/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ officialUrl, applyUrl })
            });

            if (res.ok) {
                setComps(prev => prev.map(c =>
                    c.id === id ? { ...c, officialUrl, applyUrl } : c
                ));
                log(`Updated URLs for ${id}`);
            } else {
                log(`Failed to update URLs for ${id}`);
            }
        } catch (e) { log("Error updating URLs"); }
    };

    // --- Filtering ---
    const filteredComps = useMemo(() => {
        return comps.filter(c => {
            if (activeTab === "ALL") return true;
            if (activeTab === "DUPLICATES") return c.duplicateOfId || (c.qualityFlags?.includes("DUPLICATE"));

            // State match
            const state = c.enrichmentState || "NEW";
            return state === activeTab;
        });
    }, [comps, activeTab]);

    return (
        <main className="mx-auto max-w-7xl px-6 py-10 bg-white min-h-screen text-gray-900">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Data Hygiene & Enrichment</h1>
                    <p className="text-gray-500">Milestone 1: Clean, Dedupe, and Verify URLs.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => runWorker("dedupe")}
                        disabled={workerBusy}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                        {workerBusy ? "Running..." : "Run Dedupe"}
                    </button>
                    <button
                        onClick={() => runWorker("urlcheck")}
                        disabled={workerBusy}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                    >
                        {workerBusy ? "Running..." : "Run URL Check"}
                    </button>
                    <Link href="/admin/competitions" className="px-4 py-2 border rounded hover:bg-gray-50">
                        Back
                    </Link>
                </div>
            </div>

            {/* Stats / API Key Area */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="md:col-span-2 bg-white p-6 rounded-xl border">
                    <div className="flex gap-4 border-b mb-4">
                        {TABS.map(t => (
                            <button
                                key={t}
                                onClick={() => setActiveTab(t)}
                                className={`pb-2 px-1 text-sm font-bold ${activeTab === t ? "border-b-2 border-purple-600 text-purple-600" : "text-gray-400 hover:text-gray-600"}`}
                            >
                                {t} ({comps.filter(c => {
                                    if (t === "ALL") return true;
                                    if (t === "DUPLICATES") return c.duplicateOfId;
                                    return (c.enrichmentState || "NEW") === t;
                                }).length})
                            </button>
                        ))}
                    </div>

                    {/* Table / List */}
                    <div className="h-[500px] overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                    <th className="p-2">Select</th>
                                    <th className="p-2">Title / ID</th>
                                    <th className="p-2">URL Status</th>
                                    <th className="p-2">Flags</th>
                                    <th className="p-2">State</th>
                                    <th className="p-2">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredComps.map(c => {
                                    const isExpanded = expandedId === c.id;
                                    return (
                                        <React.Fragment key={c.id}>
                                            <tr className={`border-b hover:bg-gray-50 ${c.duplicateOfId ? "opacity-50 bg-gray-100" : ""}`}>
                                                <td className="p-2">
                                                    <input type="checkbox" checked={selectedIds.has(c.id)} onChange={() => toggleSelection(c.id)} />
                                                </td>
                                                <td className="p-2 max-w-xs overflow-hidden">
                                                    <div className="font-bold truncate cursor-pointer text-blue-600 hover:underline" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                                                        {c.title}
                                                    </div>
                                                    <div className="text-xs text-gray-400 font-mono">{c.id}</div>
                                                    {c.duplicateOf && (
                                                        <div className="text-xs text-red-500 mt-1">
                                                            ↳ Duplicate of: <span className="font-semibold">{c.duplicateOf.title}</span>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    {c.urlStatusCode ? (
                                                        <span className={`px-2 py-1 rounded text-xs font-mono text-white ${c.urlStatusCode >= 400 ? "bg-red-500" : "bg-green-500"}`}>
                                                            {c.urlStatusCode}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-300">-</span>
                                                    )}
                                                </td>
                                                <td className="p-2">
                                                    {c.qualityFlags && JSON.parse(c.qualityFlags).map((f: string) => (
                                                        <span key={f} className="inline-block px-1.5 py-0.5 bg-yellow-100 text-yellow-800 text-[10px] rounded mr-1 mb-1">
                                                            {f}
                                                        </span>
                                                    ))}
                                                </td>
                                                <td className="p-2">
                                                    <span className={`px-2 py-1 rounded text-xs ${c.enrichmentState === "NEEDS_REVIEW" ? "bg-red-100 text-red-800" : "bg-gray-100"}`}>
                                                        {c.enrichmentState || "NEW"}
                                                    </span>
                                                </td>
                                                <td className="p-2 flex gap-1">
                                                    <button onClick={() => setExpandedId(isExpanded ? null : c.id)} className="px-2 py-1 text-xs border rounded hover:bg-gray-100">
                                                        {isExpanded ? "Collapse" : "View"}
                                                    </button>
                                                </td>
                                            </tr>
                                            {isExpanded && (
                                                <tr className="bg-gray-50/50">
                                                    <td colSpan={6} className="p-4 border-b">
                                                        <div className="grid grid-cols-2 gap-4 text-xs">
                                                            <div>
                                                                <div className="font-bold text-gray-500 mb-1">Links (Editable)</div>
                                                                <div className="mb-1 flex gap-2 items-center">
                                                                    <span className="w-12 text-gray-400">Official:</span>
                                                                    <input
                                                                        className="border rounded px-1 flex-1"
                                                                        defaultValue={c.officialUrl}
                                                                        onBlur={(e) => handleUpdateUrls(c.id, e.target.value, c.applyUrl)}
                                                                    />
                                                                    <a href={c.officialUrl} target="_blank" className="text-blue-500">↗</a>
                                                                </div>
                                                                <div className="mb-1 flex gap-2 items-center">
                                                                    <span className="w-12 text-gray-400">Apply:</span>
                                                                    <input
                                                                        className="border rounded px-1 flex-1"
                                                                        defaultValue={c.applyUrl}
                                                                        onBlur={(e) => handleUpdateUrls(c.id, c.officialUrl, e.target.value)}
                                                                    />
                                                                    <a href={c.applyUrl} target="_blank" className="text-blue-500">↗</a>
                                                                </div>
                                                                <div className="mb-1 text-gray-400">Redirect: {c.urlFinal}</div>
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-gray-500 mb-1">Metadata</div>
                                                                <p className="mb-1"><strong>Source:</strong> {c.source}</p>
                                                                <p className="mb-1"><strong>Canonical Host:</strong> {c.canonicalHost}</p>
                                                                <p className="mb-1"><strong>Admin Notes:</strong> {c.adminNotes}</p>
                                                            </div>
                                                            <div className="col-span-2 mt-2 pt-2 border-t flex justify-end gap-2">
                                                                <button
                                                                    onClick={() => handleDelete(c.id)}
                                                                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 border border-red-200"
                                                                >
                                                                    Delete Comp
                                                                </button>
                                                                <button
                                                                    onClick={() => handleAccept(c.id)}
                                                                    className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 shadow-sm"
                                                                >
                                                                    Mark Ready (Accept)
                                                                </button>
                                                                <button
                                                                    onClick={() => setEditingComp(c)}
                                                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm"
                                                                >
                                                                    Manual Enrich
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Sidebar: Logs & Action */}
                <div className="space-y-6">
                    <div className="bg-gray-900 text-green-400 font-mono text-xs p-4 rounded-xl h-[300px] overflow-y-auto">
                        <div className="font-bold text-white mb-2 border-b border-white/20 pb-1">Worker Logs</div>
                        {logs.map((L, i) => (
                            <div key={i} className="mb-1">{L}</div>
                        ))}
                    </div>

                    <div className="bg-white p-4 rounded-xl border">
                        <h3 className="font-bold text-sm mb-2">Manual Enrichment</h3>
                        <input
                            type="password"
                            placeholder="SerpApi Key"
                            value={apiKey}
                            onChange={e => saveKey(e.target.value)}
                            className="w-full border p-2 rounded text-sm mb-2"
                        />
                        <button
                            onClick={runSelected}
                            disabled={isProcessing || selectedIds.size === 0}
                            className="w-full px-4 py-2 bg-purple-600 text-white font-bold rounded text-sm hover:bg-purple-700 disabled:opacity-50"
                        >
                            {isProcessing ? "Processing..." : `Enrich Selected (${selectedIds.size})`}
                        </button>
                    </div>
                </div>
            </div>

            {/* Manual Enrich Modal */}
            {editingComp && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">Manual Enrichment (Override)</h2>
                            <button onClick={() => setEditingComp(null)} className="text-gray-500 hover:text-black">✕</button>
                        </div>
                        <p className="text-sm text-gray-500 mb-6">
                            Manually fill in the details below. Saving will mark this competition as <strong>ENRICHED</strong>, skipping the AI enricher step.
                        </p>

                        <form onSubmit={handleSaveManualEnrich} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Title</label>
                                    <input
                                        className="w-full border rounded p-2 mt-1"
                                        value={editingComp.title}
                                        onChange={e => setEditingComp({ ...editingComp!, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Deadline (e.g. 2026-05-20)</label>
                                    <input
                                        className="w-full border rounded p-2 mt-1"
                                        value={editingComp.deadline || ""}
                                        onChange={e => setEditingComp({ ...editingComp!, deadline: e.target.value })}
                                        placeholder="YYYY-MM-DD or Text"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Official URL</label>
                                    <div className="flex gap-2">
                                        <input
                                            className="w-full border rounded p-2 mt-1"
                                            value={editingComp.officialUrl || ""}
                                            onChange={e => setEditingComp({ ...editingComp!, officialUrl: e.target.value })}
                                        />
                                        <a href={editingComp.officialUrl} target="_blank" className="mt-2 text-blue-500">↗</a>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Apply URL</label>
                                    <div className="flex gap-2">
                                        <input
                                            className="w-full border rounded p-2 mt-1"
                                            value={editingComp.applyUrl || ""}
                                            onChange={e => setEditingComp({ ...editingComp!, applyUrl: e.target.value })}
                                        />
                                        <a href={editingComp.applyUrl} target="_blank" className="mt-2 text-blue-500">↗</a>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">Description</label>
                                <textarea
                                    className="w-full border rounded p-2 mt-1 h-32 font-mono text-sm"
                                    value={editingComp.description || ""}
                                    onChange={e => setEditingComp({ ...editingComp!, description: e.target.value })}
                                    placeholder="Full markdown/text description..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Format</label>
                                    <textarea
                                        className="w-full border rounded p-2 mt-1 h-24 text-sm"
                                        value={editingComp.format || ""}
                                        onChange={e => setEditingComp({ ...editingComp!, format: e.target.value })}
                                        placeholder="- Round 1...&#10;- Round 2..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase">Eligibility</label>
                                    <textarea
                                        className="w-full border rounded p-2 mt-1 h-24 text-sm"
                                        value={editingComp.eligibility || ""}
                                        onChange={e => setEditingComp({ ...editingComp!, eligibility: e.target.value })}
                                        placeholder="High school students..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase">How to Apply (Steps)</label>
                                <textarea
                                    className="w-full border rounded p-2 mt-1 h-20 text-sm"
                                    value={editingComp.howToApply || ""}
                                    onChange={e => setEditingComp({ ...editingComp!, howToApply: e.target.value })}
                                    placeholder="1. Create account..."
                                />
                            </div>

                            <div className="bg-gray-50 p-4 rounded flex justify-end gap-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setEditingComp(null)}
                                    className="px-4 py-2 rounded-lg border hover:bg-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg"
                                >
                                    Save & Mark Enriched
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
