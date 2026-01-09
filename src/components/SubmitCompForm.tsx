"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SubmitCompForm() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        track: "Coding",
        mode: "Online",
        region: "International",
        level: "All levels",
        deadline: "",
        description: "",
        format: "",
        eligibility: "",
        howToApply: "",
        applyUrl: "",
        officialUrl: "",
        tagsStr: "", // comma separated
    });

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
    ) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const tags = formData.tagsStr
                .split(",")
                .map((s) => s.trim())
                .filter((s) => s);

            const res = await fetch("/api/comps", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...formData,
                    tags,
                }),
            });

            if (res.ok) {
                alert("✅ Submitted — pending approval.\n\nYour competition will appear once validated by an admin.");
                router.push("/competitions");
                router.refresh();
            } else {
                const errorData = await res.json().catch(() => ({}));
                alert(`Failed: ${errorData.error || "Unknown error"}`);
            }
        } catch (err: any) {
            alert(`Error submitting: ${err.message || "Unknown"}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mx-auto max-w-2xl px-6 py-10">
            <h1 className="text-3xl font-bold">Submit a Competition</h1>
            <p className="mt-2 text-gray-600">
                Add a new competition to the database.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Title</label>
                        <input
                            name="title"
                            required
                            value={formData.title}
                            onChange={handleChange}
                            className="w-full rounded-xl border px-4 py-2 text-sm"
                            placeholder="e.g. Global Math Challenge"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Track</label>
                        <select
                            name="track"
                            value={formData.track}
                            onChange={handleChange}
                            className="w-full rounded-xl border px-4 py-2 text-sm"
                        >
                            <option value="Coding">Coding</option>
                            <option value="Econ">Econ</option>
                            <option value="MUN">MUN</option>
                            <option value="Olympiad">Olympiad</option>
                            <option value="Math">Math</option>
                            <option value="Science">Science</option>
                        </select>
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Mode</label>
                        <select
                            name="mode"
                            value={formData.mode}
                            onChange={handleChange}
                            className="w-full rounded-xl border px-4 py-2 text-sm"
                        >
                            <option value="Online">Online</option>
                            <option value="In-person">In-person</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Region</label>
                        <select
                            name="region"
                            value={formData.region}
                            onChange={handleChange}
                            className="w-full rounded-xl border px-4 py-2 text-sm"
                        >
                            <option value="International">International</option>
                            <option value="Local">Local</option>
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">Description</label>
                    <textarea
                        name="description"
                        required
                        rows={3}
                        value={formData.description}
                        onChange={handleChange}
                        className="w-full rounded-xl border px-4 py-2 text-sm"
                        placeholder="Brief overview..."
                    />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Level</label>
                        <input
                            name="level"
                            value={formData.level}
                            onChange={handleChange}
                            className="w-full rounded-xl border px-4 py-2 text-sm"
                            placeholder="e.g. High School"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Deadline</label>
                        <input
                            name="deadline"
                            value={formData.deadline}
                            onChange={handleChange}
                            className="w-full rounded-xl border px-4 py-2 text-sm"
                            placeholder="e.g. Rolling or 2024-12-31"
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label className="block text-sm font-semibold mb-2">Apply URL</label>
                        <input
                            name="applyUrl"
                            value={formData.applyUrl}
                            onChange={handleChange}
                            className="w-full rounded-xl border px-4 py-2 text-sm"
                            placeholder="https://..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-2">Official URL</label>
                        <input
                            name="officialUrl"
                            value={formData.officialUrl}
                            onChange={handleChange}
                            className="w-full rounded-xl border px-4 py-2 text-sm"
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold mb-2">Tags (comma separated)</label>
                    <input
                        name="tagsStr"
                        value={formData.tagsStr}
                        onChange={handleChange}
                        className="w-full rounded-xl border px-4 py-2 text-sm"
                        placeholder="math, beginner, prize..."
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-black py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    {loading ? "Submitting..." : "Submit Competition"}
                </button>
            </form>
        </div>
    );
}
