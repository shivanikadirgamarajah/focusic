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
        { error: "Invalid tracks input" },
        { status: 400 }
      );
    }

    const prompt = `
You are an AI music recommender for a focus timer app.

User mood/task: ${mood}

Classify these tracks:
${JSON.stringify(tracks, null, 2)}

Return a JSON object with a "tracks" array. Do not include markdown or extra text.
PRESERVE each track's videoId, title, thumbnail, and channel exactly.
Keep each reason concise (one short sentence) so the response is not unnecessarily long.

Format:
{
  "tracks": [
    {
      "videoId": "string",
      "title": "string",
      "thumbnail": "string",
      "channel": "string",
      "genre": "ambient | lofi | piano | synthwave | nature | drone | jazz | other",
      "focusScore": 8,
      "reason": "Good for focus because...",
      "bestFor": "coding | studying | reading | deep work | break"
    }
  ]
}
`;

    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-20b",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    });

    if (!completion.choices?.[0]?.message?.content) {
      console.error("Groq API returned empty response:", completion);
      return NextResponse.json(
        { error: "AI returned empty response", details: "Groq API did not return any content" },
        { status: 500 }
      );
    }

    const text = completion.choices[0].message.content;

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

    // Parse and validate the structured response before returning the array
    // string expected by existing client callers.
    try {
      const parsed: unknown = JSON.parse(cleanedText);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        !Array.isArray((parsed as { tracks?: unknown }).tracks)
      ) {
        throw new Error('AI JSON did not contain a "tracks" array');
      }

      return NextResponse.json({
        result: JSON.stringify((parsed as { tracks: unknown[] }).tracks),
      });
    } catch (parseError) {
      console.error("Invalid JSON from AI:", parseError, {
        finishReason: completion.choices[0]?.finish_reason,
        responsePreview: cleanedText.slice(0, 200),
      });
      return NextResponse.json(
        {
          error: "Invalid JSON from AI",
          details: parseError instanceof Error ? parseError.message : "Could not parse AI response",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Classify API error:", error);
    
    let errorMessage = "Unknown error";
    let errorDetails = "";
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || "";
    } else if (typeof error === "object" && error !== null) {
      errorMessage = JSON.stringify(error);
    }

    console.error("Full error details:", {
      message: errorMessage,
      details: errorDetails,
      type: typeof error,
    });

    return NextResponse.json(
      { 
        error: "Failed to classify tracks", 
        details: errorMessage,
        type: errorMessage.includes("401") ? "auth_error" : errorMessage.includes("429") ? "rate_limit" : "unknown",
      },
      { status: 500 }
    );
  }
}
