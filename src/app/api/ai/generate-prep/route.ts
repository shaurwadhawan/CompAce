
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import OpenAI from "openai";

export async function POST(req: Request) {
    try {
        const { compId } = await req.json();

        if (!compId) {
            return NextResponse.json({ error: "Missing compId" }, { status: 400 });
        }

        const comp = await prisma.competition.findUnique({
            where: { id: compId },
        });

        if (!comp) {
            return NextResponse.json({ error: "Competition not found" }, { status: 404 });
        }

        const apiKey = process.env.OPENAI_API_KEY;

        if (!apiKey) {
            // Mock response for demo purposes if no key is present
            // This prevents the app from breaking for the user immediately
            return NextResponse.json({
                mock: true,
                items: [
                    { id: "ai-1", text: `[DEMO] Analyze past winning projects for ${comp.title}` },
                    { id: "ai-2", text: `[DEMO] Draft a timeline based on the ${comp.deadline} deadline` },
                    { id: "ai-3", text: `[DEMO] Read the official rules on ${new URL(comp.officialUrl || "https://google.com").hostname}` },
                ]
            });
        }

        const openai = new OpenAI({ apiKey });

        const prompt = `
      You are an elite competition coach. Generate 3 specific, actionable preparation constraints/missions for a student entering: "${comp.title}".
      
      Details:
      - Description: ${comp.description.slice(0, 300)}...
      - Track: ${comp.track}
      - Deadline: ${comp.deadline}

      Return ONLY a raw JSON array of strings, e.g. ["Action 1", "Action 2", "Action 3"].
      Keep them short (under 10 words).
      Do not include markdown formatting.
    `;

        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7,
        });

        const content = completion.choices[0].message.content || "[]";

        // Clean up potential markdown code blocks
        const cleaned = content.replace(/```json/g, "").replace(/```/g, "").trim();

        let items: string[] = [];
        try {
            items = JSON.parse(cleaned);
        } catch (e) {
            items = ["Review official rules", "Practice past papers", "Draft project outline"];
        }

        return NextResponse.json({
            items: items.slice(0, 3).map((text, i) => ({
                id: `ai-${Date.now()}-${i}`,
                text
            }))
        });

    } catch (error: any) {
        console.error("AI Error:", error);
        return NextResponse.json({ error: "Failed to generate plan" }, { status: 500 });
    }
}
