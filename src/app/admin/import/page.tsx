"use client";

import { useState } from "react";
import Papa from "papaparse";

type CompRow = {
    title: string;
    track: string;
    mode: string;
    region: string;
    level: string;
    deadline: string;
    description: string;
    format: string;
    eligibility: string;
    howToApply: string;
    tags: string; // "tag1, tag2"
    applyUrl: string;
    officialUrl: string;
    status?: string; // Optional override
};

type ImportStats = {
    total: number;
    inserted: number;
    skipped: number;
    errors: number;
    details: string[];
};

export default function AdminImportPage() {
    const [csvText, setCsvText] = useState("");
    const [parsedRows, setParsedRows] = useState<CompRow[]>([]);
    const [errors, setErrors] = useState<string[]>([]);
    const [stats, setStats] = useState<ImportStats | null>(null);
    const [loading, setLoading] = useState(false);

    const handleParse = () => {
        setErrors([]);
        setStats(null);
        setParsedRows([]);

        if (!csvText.trim()) return;

        Papa.parse<CompRow>(csvText, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length > 0) {
                    setErrors(results.errors.map(e => `Row ${e.row}: ${e.message}`));
                    return;
                }

                // Strict Validation
                const validRows: CompRow[] = [];
                const validationErrs: string[] = [];

                // Relaxed Validation
                const VALID_TRACKS = ["Coding", "Econ", "MUN", "Olympiad", "Math", "Science"];
                // We'll normalize modes to Title Case for storage, but accept various inputs.
                // Or just allow any non-empty string for flexibility? 
                // Let's keep Mode somewhat standard but Region completely open.

                // Date regex: YYYY-MM-DD or "Rolling" or "TBA"
                const DATE_REGEX = /^(\d{4}-\d{2}-\d{2}|Rolling|TBA)$/;
                // Simple URL regex
                const URL_REGEX = /^(https?:\/\/.+|)$/; // Allow empty or http/https

                results.data.forEach((row, idx) => {
                    const rowNum = idx + 2;

                    if (!row.title) {
                        validationErrs.push(`Row ${rowNum}: Missing title`);
                        return;
                    }
                    if (!VALID_TRACKS.includes(row.track)) {
                        validationErrs.push(`Row ${rowNum}: Invalid track "${row.track}". Allowed: ${VALID_TRACKS.join(", ")}`);
                        return;
                    }

                    // Allow any Region (just ensure it's not empty if that's a requirement, or optional)
                    // if (!row.region) ... (optional)

                    // Allow any Mode for now to fix capitalized "In-Person" etc, or normalize it?
                    // Let's just warn if it's missing.
                    if (!row.mode) {
                        // validationErrs.push(...) 
                        // Optional
                    }
                    if (row.deadline && !DATE_REGEX.test(row.deadline)) {
                        validationErrs.push(`Row ${rowNum}: Invalid deadline "${row.deadline}". Use YYYY-MM-DD or "Rolling" or "TBA"`);
                        return;
                    }
                    if (row.officialUrl && !URL_REGEX.test(row.officialUrl)) {
                        validationErrs.push(`Row ${rowNum}: Invalid Official URL format`);
                        return;
                    }
                    if (row.applyUrl && !URL_REGEX.test(row.applyUrl)) {
                        validationErrs.push(`Row ${rowNum}: Invalid Apply URL format`);
                        return;
                    }

                    validRows.push(row);
                });

                if (validationErrs.length > 0) {
                    setErrors(validationErrs);
                } else {
                    setParsedRows(validRows);
                }
            },
        });
    };

    const handleImport = async () => {
        if (parsedRows.length === 0) return;
        if (!confirm(`Ready to import ${parsedRows.length} competitions?`)) return;

        setLoading(true);
        try {
            const res = await fetch("/api/admin/comps/import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rows: parsedRows }),
            });

            if (res.ok) {
                const data = await res.json();
                setStats(data);
                setParsedRows([]);
                setCsvText("");
            } else {
                alert("Import failed on server.");
            }
        } catch (e) {
            console.error(e);
            alert("Network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="mx-auto max-w-5xl px-6 py-10">
            <h1 className="text-3xl font-bold">Admin: Import Competitions</h1>
            <p className="mt-2 text-gray-600">Bulk import via CSV.</p>

            <div className="mt-6 space-y-4">
                <div>
                    <label className="block text-sm font-semibold">Paste CSV Content</label>
                    <div className="text-xs text-gray-500 mb-2">
                        Header required: title, track, mode, region, level, deadline, description, format, eligibility, howToApply, tags, applyUrl, officialUrl
                    </div>
                    <textarea
                        className="w-full h-48 rounded-xl border p-4 text-xs font-mono"
                        value={csvText}
                        onChange={(e) => setCsvText(e.target.value)}
                        placeholder="title,track,mode,region,level,deadline,description,format,eligibility,howToApply,tags,applyUrl,officialUrl&#10;My Comp,Coding,Online,International,High School,2025-01-01,Desc...,Format...,Eligible...,How...,tag1|tag2,http...,http..."
                    />
                </div>

                <button
                    onClick={handleParse}
                    className="rounded-xl bg-gray-800 px-6 py-2 text-sm font-semibold text-white hover:bg-black"
                >
                    Preview & Validate
                </button>
            </div>

            {errors.length > 0 && (
                <div className="mt-6 rounded-xl bg-red-50 p-4 border border-red-100">
                    <h3 className="text-red-800 font-bold mb-2">Validation Errors</h3>
                    <ul className="list-disc list-inside text-xs text-red-700 space-y-1">
                        {errors.slice(0, 50).map((e, i) => <li key={i}>{e}</li>)}
                        {errors.length > 50 && <li>...and {errors.length - 50} more</li>}
                    </ul>
                </div>
            )}

            {parsedRows.length > 0 && (
                <div className="mt-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg">Preview ({parsedRows.length} rows)</h3>
                        <button
                            onClick={handleImport}
                            disabled={loading}
                            className="rounded-xl bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? "Importing..." : "Run Import"}
                        </button>
                    </div>

                    <div className="mt-4 overflow-x-auto rounded-xl border">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="p-3 font-semibold">Title</th>
                                    <th className="p-3 font-semibold">Track</th>
                                    <th className="p-3 font-semibold">Official URL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {parsedRows.slice(0, 10).map((r, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="p-3 truncate max-w-[200px]">{r.title}</td>
                                        <td className="p-3">{r.track}</td>
                                        <td className="p-3 truncate max-w-[200px]">{r.officialUrl}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {parsedRows.length > 10 && (
                            <div className="p-3 text-center text-xs text-gray-400 bg-gray-50">
                                + {parsedRows.length - 10} more rows
                            </div>
                        )}
                    </div>
                </div>
            )}

            {stats && (
                <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-6">
                    <h3 className="text-green-800 font-bold text-lg">Import Complete</h3>
                    <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                        <div className="rounded-lg bg-white p-3 shadow-sm">
                            <div className="text-2xl font-bold text-gray-900">{stats.inserted}</div>
                            <div className="text-xs text-gray-500 uppercase">Inserted</div>
                        </div>
                        <div className="rounded-lg bg-white p-3 shadow-sm">
                            <div className="text-2xl font-bold text-gray-900">{stats.skipped}</div>
                            <div className="text-xs text-gray-500 uppercase">Skipped (Dupes)</div>
                        </div>
                        <div className="rounded-lg bg-white p-3 shadow-sm">
                            <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                            <div className="text-xs text-gray-500 uppercase">Errors</div>
                        </div>
                    </div>
                    {stats.details.length > 0 && (
                        <div className="mt-4 max-h-48 overflow-y-auto rounded bg-white p-3 text-xs text-gray-600 border">
                            {stats.details.map((d, i) => <div key={i}>{d}</div>)}
                        </div>
                    )}
                </div>
            )}
        </main>
    );
}
