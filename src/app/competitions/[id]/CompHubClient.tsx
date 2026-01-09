"use client";

import { useState } from "react";
import CompDetailsClient from "./CompDetailsClient";
import RecommendedPrepClient from "./RecommendedPrepClient";
import type { Comp } from "@/lib/comps";

export default function CompHubClient({ comp }: { comp: Comp }) {
    const [activeTab, setActiveTab] = useState<"overview" | "plan" | "resources" | "sim">("overview");

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* 1. Hero Header */}
            <div className="bg-white border-b">
                <div className="mx-auto max-w-5xl px-6 py-10">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2 uppercase font-bold tracking-wider">
                                <span>{comp.track}</span>
                                <span>•</span>
                                <span>{comp.level}</span>
                                <span>•</span>
                                <span className={comp.region === "International" ? "text-purple-600" : ""}>{comp.region}</span>
                            </div>
                            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
                                {comp.title}
                            </h1>

                            <div className="mt-4 flex flex-wrap gap-2">
                                {/* Status Pill */}
                                <div className="flex items-center gap-2 bg-black/5 px-3 py-1.5 rounded-full border border-black/5">
                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                    <span className="text-xs font-semibold text-gray-700">Open for Prep</span>
                                </div>
                                <div className="px-3 py-1.5 rounded-full border border-black/10 bg-white text-xs font-medium text-gray-600">
                                    Deadline: {comp.deadline}
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col items-end gap-3 min-w-[140px]">
                            <CompDetailsClient compId={comp.id} />
                            <a
                                href={comp.officialUrl}
                                target="_blank"
                                className="text-xs text-gray-500 hover:text-black underline"
                            >
                                Official Website ↗
                            </a>
                        </div>
                    </div>
                </div>

                {/* 2. Tabs Navigation */}
                <div className="mx-auto max-w-5xl px-6 flex gap-8 border-t">
                    {[
                        { id: "overview", label: "Overview" },
                        { id: "plan", label: "AI Personal Plan" },
                        { id: "resources", label: "Resources" },
                        { id: "sim", label: "Simulator" }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`py-4 text-sm font-semibold border-b-2 transition-all ${activeTab === tab.id
                                    ? "border-black text-black"
                                    : "border-transparent text-gray-400 hover:text-gray-600"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. Main Content Area */}
            <div className="mx-auto max-w-5xl px-6 py-8">

                {/* OVERVIEW TAB */}
                {activeTab === "overview" && (
                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="md:col-span-2 space-y-8">
                            <section className="bg-white p-6 rounded-2xl border shadow-sm">
                                <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                                    📖 About the Competition
                                </h3>
                                <p className="text-gray-600 leading-relaxed text-sm md:text-base">
                                    {comp.description}
                                </p>
                            </section>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <section className="bg-white p-6 rounded-2xl border shadow-sm">
                                    <h3 className="text-sm font-bold uppercase text-gray-400 mb-3">Format & Rules</h3>
                                    <p className="text-gray-700 text-sm">{comp.format}</p>
                                </section>

                                <section className="bg-white p-6 rounded-2xl border shadow-sm">
                                    <h3 className="text-sm font-bold uppercase text-gray-400 mb-3">Eligibility</h3>
                                    <p className="text-gray-700 text-sm">{comp.eligibility}</p>
                                </section>
                            </div>

                            <section className="bg-white p-6 rounded-2xl border shadow-sm">
                                <h3 className="text-lg font-bold mb-3">How to Apply</h3>
                                <div className="prose prose-sm text-gray-600">
                                    {comp.howToApply}
                                </div>
                                <div className="mt-6">
                                    <a
                                        href={comp.applyUrl}
                                        target="_blank"
                                        className="inline-flex items-center justify-center w-full md:w-auto px-6 py-3 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                                    >
                                        Start Application ↗
                                    </a>
                                </div>
                            </section>
                        </div>

                        {/* Sidebar */}
                        <div className="space-y-6">
                            {/* Mini AI Prep Widget (Teaser) */}
                            <div className="bg-gradient-to-br from-purple-50 to-white border border-purple-100 p-5 rounded-2xl">
                                <h3 className="font-bold text-purple-900 text-sm mb-2">✨ AI Quick Prep</h3>
                                <p className="text-xs text-purple-700 mb-3">
                                    Get a personalized study plan generated instantly for {comp.title}.
                                </p>
                                <button
                                    onClick={() => setActiveTab("plan")}
                                    className="w-full py-2 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700"
                                >
                                    Generate full plan →
                                </button>
                            </div>

                            {/* Tags */}
                            <div className="bg-white p-5 rounded-2xl border shadow-sm">
                                <h3 className="text-sm font-bold text-gray-400 uppercase mb-3">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {comp.tags.map(t => (
                                        <span key={t} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* PLAN TAB */}
                {activeTab === "plan" && (
                    <div className="animate-in fade-in zoom-in-95 duration-300">
                        <RecommendedPrepClient compId={comp.id} compTitle={comp.title} compTrack={comp.track} />
                    </div>
                )}

                {/* RESOURCES TAB (Placeholder) */}
                {activeTab === "resources" && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
                        <div className="text-4xl mb-4">📚</div>
                        <h3 className="text-xl font-bold">Resource Library</h3>
                        <p className="text-gray-500 max-w-md mx-auto mt-2">
                            Coming Soon: Past papers, video tutorials, and winning project examples for {comp.title}.
                        </p>
                    </div>
                )}

                {/* SIM TAB (Placeholder) */}
                {activeTab === "sim" && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed">
                        <div className="text-4xl mb-4">🧩</div>
                        <h3 className="text-xl font-bold">Competition Simulator</h3>
                        <p className="text-gray-500 max-w-md mx-auto mt-2">
                            Coming Soon: Take a timed mock test or simulate the judging process related to {comp.title}.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
