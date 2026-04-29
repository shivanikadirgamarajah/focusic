import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { searchHistory, listenHistory } = await req.json();

    if ((!searchHistory || searchHistory.length === 0) && (!listenHistory || listenHistory.length === 0)) {
      return NextResponse.json({
        recommendations: "ambient focus music, lofi beats, study music, background music",
      });
    }

    const prompt = `You are a focus music recommender for a productivity app.

User's search history: ${searchHistory?.slice(-5).join(", ") || "None"}
User's listen history (track titles): ${listenHistory?.slice(-5).join(", ") || "None"}

Based on this user's patterns, generate 3-5 specific search queries for focus music recommendations. 

Return ONLY a JSON object with a "recommendations" field containing comma-separated search queries (no line breaks, just plain text).

Example:
{"recommendations": "lo-fi hip hop beats, dark ambient music, jazz piano study music, synthwave background"}

Analyze the user's taste and create queries that match their focus music preferences.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    const text = completion.choices[0]?.message?.content ?? '{"recommendations": "ambient focus music"}';

    // Strip markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7);
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    const parsed = JSON.parse(cleanedText);

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      {
        recommendations: "ambient focus music, lofi beats, study music",
      }
    );
  }
}
