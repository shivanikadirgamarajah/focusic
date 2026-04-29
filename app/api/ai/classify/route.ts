import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { tracks, mood } = await req.json();

    const prompt = `
You are an AI music recommender for a focus timer app.

User mood/task: ${mood}

Classify these tracks:
${JSON.stringify(tracks, null, 2)}

Return ONLY valid JSON. No markdown. PRESERVE the videoId and thumbnail fields!

Format - include ALL original fields plus new ones:
[
  {
    "videoId": "string",
    "title": "string",
    "thumbnail": "string (keep the original thumbnail URL)",
    "channel": "string",
    "genre": "ambient | lofi | piano | synthwave | nature | drone | jazz | other",
    "focusScore": 8,
    "reason": "Good for focus because...",
    "bestFor": "coding | studying | reading | deep work | break"
  }
]
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    const text = completion.choices[0]?.message?.content ?? "[]";

    return NextResponse.json({
      result: text,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Failed to classify tracks" },
      { status: 500 }
    );
  }
}
