import Groq from "groq-sdk";
import { NextResponse } from "next/server";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: Request) {
  try {
    const { tracks, mood } = await req.json();

    if (!tracks || !Array.isArray(tracks) || tracks.length === 0) {
      console.error("Invalid tracks input:", tracks);
      return NextResponse.json(
        { error: "Invalid tracks input", details: "No tracks provided" },
        { status: 400 }
      );
    }

    if (!process.env.GROQ_API_KEY) {
      console.error("GROQ_API_KEY not configured");
      return NextResponse.json(
        { error: "API configuration error", details: "GROQ_API_KEY not set" },
        { status: 500 }
      );
    }

    console.log("Classifying tracks for mood:", mood, "Track count:", tracks.length);

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

    // Strip markdown code blocks if present
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7); // Remove ```json
    } else if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.slice(3); // Remove ```
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3); // Remove trailing ```
    }
    cleanedText = cleanedText.trim();

    // Validate JSON
    try {
      JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError, "Raw text:", cleanedText);
      return NextResponse.json(
        { error: "Invalid JSON from AI", details: cleanedText.slice(0, 200) },
        { status: 500 }
      );
    }

    return NextResponse.json({
      result: cleanedText,
    });
  } catch (error) {
    console.error("Classify API error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorDetails = error instanceof Error ? error.stack : "";
    
    // Log detailed error for debugging
    console.error("Full error object:", {
      message: errorMessage,
      stack: errorDetails,
      type: error instanceof Error ? error.constructor.name : typeof error,
      error: error,
    });

    return NextResponse.json(
      { 
        error: "Failed to classify tracks", 
        details: errorMessage,
        stack: process.env.NODE_ENV === "development" ? errorDetails : undefined
      },
      { status: 500 }
    );
  }
}
